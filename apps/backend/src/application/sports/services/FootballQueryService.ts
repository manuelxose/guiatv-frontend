/**
 * Football query service — the BFF for the football vertical.
 *
 * Aggregates provider data, broadcast reconciliation and editorial news into
 * the surfaces the frontend needs, without overfetching (no lineups/events/
 * full bodies on the home surface).
 */

import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { BlogPostModel } from '@/infrastructure/database/models/BlogPost.model';
import { NotFoundError } from '@/shared/errors';
import {
  FootballCompetition,
  FootballDataProvider,
  FootballMatch,
  FootballMatchQuery,
  FootballNewsItem,
  FootballTeam,
} from '@/domain/sports/football/types';
import { BroadcastReconciliationService } from './BroadcastReconciliationService';
import {
  FootballCompetitionDetailDTO,
  FootballCompetitionsResponseDTO,
  FootballHomeDTO,
  FootballMatchDetailDTO,
  FootballMatchesResponseDTO,
  FootballSearchResponseDTO,
  FootballTeamDetailDTO,
} from '../dto/FootballDTO';

const HOME_CACHE_KEY = 'football:home';
const HOME_CACHE_TTL_SECONDS = 45;

export class FootballQueryService {
  constructor(
    private readonly provider: FootballDataProvider,
    private readonly reconciliation: BroadcastReconciliationService,
    private readonly cacheRepository?: ICacheRepository
  ) {}

  async getHome(): Promise<FootballHomeDTO> {
    const cached = await this.readCache<FootballHomeDTO>(HOME_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const todayKey = 'today';
    const tomorrowKey = 'tomorrow';

    const [liveMatches, todayMatches, upcomingMatches] = await Promise.all([
      this.provider.getLiveMatches(),
      this.provider.getMatches({ date: todayKey }),
      this.provider.getMatches({ date: tomorrowKey }),
    ]);

    const reconciled = await this.reconciliation.reconcile([
      ...liveMatches,
      ...todayMatches,
      ...upcomingMatches,
    ]);

    const byId = new Map(reconciled.map((match) => [match.id, match]));
    const reconciledLive = liveMatches.map((match) => byId.get(match.id) ?? match);
    const reconciledToday = todayMatches.map((match) => byId.get(match.id) ?? match);
    const reconciledUpcoming = upcomingMatches.map((match) => byId.get(match.id) ?? match);

    const competitions = await this.provider.getCompetitions();
    const latestNews = await this.getNews({ limit: 6 });

    const home: FootballHomeDTO = {
      liveMatches: reconciledLive,
      todayMatches: reconciledToday,
      featuredMatches: this.pickFeatured(reconciledToday, reconciledUpcoming),
      upcomingMatches: reconciledUpcoming,
      featuredCompetitions: competitions.slice(0, 6),
      latestNews,
      generatedAt: now.toISOString(),
    };

    await this.writeCache(HOME_CACHE_KEY, home, HOME_CACHE_TTL_SECONDS);
    return home;
  }

  async getMatches(query: FootballMatchQuery): Promise<FootballMatchesResponseDTO> {
    const matches = await this.provider.getMatches(query);
    const reconciled = await this.reconciliation.reconcile(matches);
    return {
      matches: reconciled,
      meta: {
        total: reconciled.length,
        date: query.date,
        status: query.status,
        competitionSlug: query.competitionSlug,
        teamSlug: query.teamSlug,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async getLiveMatches(): Promise<FootballMatchesResponseDTO> {
    const matches = await this.provider.getLiveMatches();
    const reconciled = await this.reconciliation.reconcile(matches);
    return {
      matches: reconciled,
      meta: { total: reconciled.length, status: 'live', generatedAt: new Date().toISOString() },
    };
  }

  async getMatch(idOrSlug: string): Promise<FootballMatchDetailDTO> {
    const match = await this.provider.getMatch(idOrSlug);
    if (!match) {
      throw new NotFoundError('Football match', idOrSlug);
    }
    const [reconciled] = await this.reconciliation.reconcile([match]);
    const relatedNews = await this.getNews({ matchId: match.id, limit: 8 });
    return {
      match: reconciled,
      relatedNews,
      meta: { generatedAt: new Date().toISOString() },
    };
  }

  async getCompetitions(): Promise<FootballCompetitionsResponseDTO> {
    const competitions = await this.provider.getCompetitions();
    return {
      competitions,
      meta: { total: competitions.length, generatedAt: new Date().toISOString() },
    };
  }

  async getCompetition(slug: string): Promise<FootballCompetitionDetailDTO> {
    const competition = await this.provider.getCompetition(slug);
    if (!competition) {
      throw new NotFoundError('Football competition', slug);
    }
    const [matches, standings, news] = await Promise.all([
      this.provider.getMatches({ competitionSlug: slug, limit: 40 }),
      this.provider.getStandings(slug),
      this.getNews({ competitionId: `catalog:${slug}`, limit: 8 }),
    ]);
    const reconciled = await this.reconciliation.reconcile(matches);
    return {
      competition,
      matches: reconciled,
      standings,
      news,
      meta: { generatedAt: new Date().toISOString() },
    };
  }

  async getTeam(slug: string): Promise<FootballTeamDetailDTO> {
    const team = await this.provider.getTeam(slug);
    if (!team) {
      throw new NotFoundError('Football team', slug);
    }
    const matches = await this.provider.getMatches({ teamSlug: slug, limit: 40 });
    const reconciled = await this.reconciliation.reconcile(matches);
    const now = Date.now();
    const upcoming = reconciled
      .filter((match) => new Date(match.kickoffAt).getTime() >= now)
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    const finished = reconciled
      .filter((match) => new Date(match.kickoffAt).getTime() < now)
      .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());
    const news = await this.getNews({ teamId: team.id, limit: 8 });

    return {
      team,
      nextMatch: upcoming[0] ?? null,
      lastResult: finished[0] ?? null,
      matches: reconciled,
      news,
      meta: { generatedAt: new Date().toISOString() },
    };
  }

  async search(q: string): Promise<FootballSearchResponseDTO> {
    const query = String(q || '').trim();
    if (!query) {
      return { query: '', matches: [], teams: [], competitions: [], news: [], meta: { generatedAt: new Date().toISOString() } };
    }

    const [matches, teams, competitions, news] = await Promise.all([
      this.provider.getMatches({ q: query, limit: 12 }),
      this.provider.getTeams(),
      this.provider.getCompetitions(),
      this.getNews({ q: query, limit: 8 }),
    ]);

    const normalizedQuery = normalizeQuery(query);
    const filteredTeams = teams
      .filter((team) => teamMatches(team, normalizedQuery))
      .slice(0, 8);
    const filteredCompetitions = competitions
      .filter((competition) => competitionMatches(competition, normalizedQuery))
      .slice(0, 8);

    return {
      query,
      matches: await this.reconciliation.reconcile(matches),
      teams: filteredTeams,
      competitions: filteredCompetitions,
      news,
      meta: { generatedAt: new Date().toISOString() },
    };
  }

  async getNews(
    filters: { teamId?: string; competitionId?: string; matchId?: string; q?: string; limit?: number } = {}
  ): Promise<FootballNewsItem[]> {
    const query: Record<string, any> = { status: 'publish' };

    if (filters.teamId) query['sportsRelations.teamIds'] = filters.teamId;
    if (filters.competitionId) query['sportsRelations.competitionIds'] = filters.competitionId;
    if (filters.matchId) query['sportsRelations.matchIds'] = filters.matchId;
    if (filters.q) {
      query.$or = [
        { title: { $regex: escapeRegex(filters.q), $options: 'i' } },
        { excerpt: { $regex: escapeRegex(filters.q), $options: 'i' } },
      ];
    }

    const posts = await BlogPostModel.find(query)
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .limit(Math.min(filters.limit || 12, 30))
      .lean()
      .exec();

    return posts.map((post: any) => this.mapNewsItem(post));
  }

  private mapNewsItem(post: any): FootballNewsItem {
    const publishedAt = post.publishedAt || post.createdAt || new Date();
    return {
      id: String(post._id || post.id),
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      contentType: post.contentType || 'news',
      author: post.author,
      coverImage: post.featuredImage?.sourceUrl || post.seo?.ogImage || null,
      publishedAt: new Date(publishedAt).toISOString(),
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      sportsRelations: post.sportsRelations || { teamIds: [], competitionIds: [], matchIds: [] },
    };
  }

  private pickFeatured(today: FootballMatch[], upcoming: FootballMatch[]): FootballMatch[] {
    // Featured = the next few high-profile matches (live first, then today).
    const pool = [...today, ...upcoming]
      .filter((match) => match.status === 'live' || match.status === 'scheduled')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    return pool.slice(0, 4);
  }

  private async readCache<T>(key: string): Promise<T | null> {
    if (!this.cacheRepository || typeof this.cacheRepository.get !== 'function') {
      return null;
    }
    try {
      return (await this.cacheRepository.get(key)) as T | null;
    } catch {
      return null;
    }
  }

  private async writeCache<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (!this.cacheRepository || typeof this.cacheRepository.set !== 'function') {
      return;
    }
    try {
      await this.cacheRepository.set(key, value, ttlMs);
    } catch {
      // Cache writes are best-effort.
    }
  }
}

function normalizeQuery(q: string): string {
  return q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function teamMatches(team: FootballTeam, normalizedQuery: string): boolean {
  return [team.name, team.shortName, ...team.aliases]
    .filter(Boolean)
    .some((value) =>
      String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(normalizedQuery)
    );
}

function competitionMatches(competition: FootballCompetition, normalizedQuery: string): boolean {
  return [competition.name, competition.shortName]
    .filter(Boolean)
    .some((value) =>
      String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(normalizedQuery)
    );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
