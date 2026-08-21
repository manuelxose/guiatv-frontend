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

// No football-tagged category exists in the CMS yet (checked live: the real
// category slugs in use are all general-audience — guias, rankings, series,
// tdt, streaming... nothing football-specific). This list is the expected
// slug editorial will eventually use; until a post actually carries one of
// these (or real sportsRelations tagging), getNews() correctly returns
// empty rather than guessing.
const FOOTBALL_CATEGORY_SLUGS = ['futbol', 'football', 'deportes', 'sports'];

const HOME_CACHE_KEY = 'football:home';
const HOME_CACHE_TTL_SECONDS = 45;

// The frontend polls this endpoint client-side for live matches (every
// ~25s per open tab, spec §49-51). Providers like football-data.org rate
// limit their free tier around 10 req/min, so this cache decouples N
// concurrent pollers from N upstream calls — short enough that scores
// still feel live, long enough to absorb a fleet of open tabs.
const LIVE_CACHE_KEY = 'football:live';
const LIVE_CACHE_TTL_SECONDS = 15;

// Competitions are near-static reference data (13 items, rarely change) —
// a long TTL both survives a provider rate-limit hit gracefully and cuts
// real upstream call volume, which is the actual cause of hitting that
// limit in the first place (every uncached page view was a fresh call).
const COMPETITIONS_CACHE_KEY = 'football:competitions';
const COMPETITIONS_CACHE_TTL_SECONDS = 6 * 60 * 60;

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
    const cached = await this.readCache<FootballMatchesResponseDTO>(LIVE_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const matches = await this.provider.getLiveMatches();
    const reconciled = await this.reconciliation.reconcile(matches);
    const result: FootballMatchesResponseDTO = {
      matches: reconciled,
      meta: { total: reconciled.length, status: 'live', generatedAt: new Date().toISOString() },
    };

    await this.writeCache(LIVE_CACHE_KEY, result, LIVE_CACHE_TTL_SECONDS);
    return result;
  }

  async getMatch(idOrSlug: string): Promise<FootballMatchDetailDTO> {
    const match = await this.provider.getMatch(idOrSlug);
    if (!match) {
      throw new NotFoundError('Football match', idOrSlug);
    }
    // The match itself is already in hand at this point — broadcast
    // reconciliation and related news are both enrichment, and neither
    // should be able to turn a perfectly good match into a 500 (spec: "the
    // core scoreboard must render even if news/broadcast lookup fails").
    const [reconciledList, relatedNews] = await Promise.all([
      settle(this.reconciliation.reconcile([match]), [match]),
      settle(this.getNews({ matchId: match.id, limit: 8 }), []),
    ]);
    const reconciled = reconciledList[0];
    return {
      match: reconciled,
      relatedNews,
      meta: { generatedAt: new Date().toISOString() },
    };
  }

  async getCompetitions(): Promise<FootballCompetitionsResponseDTO> {
    // Found via real E2E testing (not a curl check — those only ever
    // exercised SSR/TransferState, which never re-hits this path client-
    // side): this call had neither a cache nor any error handling at all,
    // unlike every other football endpoint. football-data.org's free tier
    // rate-limits around 10 req/min; enough cumulative testing (or normal
    // traffic — every uncached page view hits this) triggered a real 429
    // that propagated straight to an unhandled 500, confirmed in
    // production logs. Competitions are near-static reference data (13
    // items, rarely change), so a long cache both fixes the crash and
    // meaningfully cuts upstream pressure — the actual root cause.
    const cached = await this.readCache<FootballCompetitionsResponseDTO>(COMPETITIONS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const competitions = await settle(this.provider.getCompetitions(), []);
    const result: FootballCompetitionsResponseDTO = {
      competitions,
      meta: { total: competitions.length, generatedAt: new Date().toISOString() },
    };

    if (competitions.length) {
      await this.writeCache(COMPETITIONS_CACHE_KEY, result, COMPETITIONS_CACHE_TTL_SECONDS);
    }
    return result;
  }

  async getCompetition(slug: string): Promise<FootballCompetitionDetailDTO> {
    const competition = await this.provider.getCompetition(slug);
    if (!competition) {
      throw new NotFoundError('Football competition', slug);
    }
    // A single provider hiccup (standings, in practice — see
    // FootballDataOrgAdapter's getStandings) must not take matches/news
    // down with it. Each surface settles independently.
    const [matches, standings, news] = await Promise.all([
      settle(this.provider.getMatches({ competitionSlug: slug, limit: 40 }), []),
      settle(this.provider.getStandings(slug), []),
      settle(this.getNews({ competitionId: `catalog:${slug}`, limit: 8 }), []),
    ]);
    const reconciled = await settle(this.reconciliation.reconcile(matches), matches);
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
    // Same isolation as getCompetition(): a news lookup failure must not
    // take the whole team page down with it.
    const [matches, news] = await Promise.all([
      settle(this.provider.getMatches({ teamSlug: slug, limit: 40 }), []),
      settle(this.getNews({ teamId: team.id, limit: 8 }), []),
    ]);
    const reconciled = await settle(this.reconciliation.reconcile(matches), matches);
    const now = Date.now();
    const upcoming = reconciled
      .filter((match) => new Date(match.kickoffAt).getTime() >= now)
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    const finished = reconciled
      .filter((match) => new Date(match.kickoffAt).getTime() < now)
      .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());

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

    // Same isolation as getCompetition()/getTeam()/getMatch(): one entity
    // type failing (teams/competitions listings, news) must not blank out
    // the others — a user searching should still see whichever result
    // groups actually resolved.
    const [matches, teams, competitions, news] = await Promise.all([
      settle(this.provider.getMatches({ q: query, limit: 12 }), []),
      settle(this.provider.getTeams(), []),
      settle(this.provider.getCompetitions(), []),
      settle(this.getNews({ q: query, limit: 8 }), []),
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
      matches: await settle(this.reconciliation.reconcile(matches), matches),
      teams: filteredTeams,
      competitions: filteredCompetitions,
      news,
      meta: { generatedAt: new Date().toISOString() },
    };
  }

  async getNews(filters: NewsFilters = {}): Promise<FootballNewsItem[]> {
    const query = buildNewsQuery(filters);

    const posts = await BlogPostModel.find(query)
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .skip(Math.max(filters.offset || 0, 0))
      .limit(Math.min(filters.limit || 12, 30))
      .lean()
      .exec();

    // Full body is only worth the payload for a single-article lookup
    // (news-detail); list surfaces (home, news list) never need it.
    return posts.map((post: any) => this.mapNewsItem(post, !!filters.slug));
  }

  private mapNewsItem(post: any, includeContent = false): FootballNewsItem {
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
      content: includeContent ? post.content : undefined,
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

  private async writeCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.cacheRepository || typeof this.cacheRepository.set !== 'function') {
      return;
    }
    try {
      await this.cacheRepository.set(key, value, ttlSeconds);
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

export interface NewsFilters {
  teamId?: string;
  competitionId?: string;
  matchId?: string;
  slug?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

/**
 * Builds the Mongo query for getNews() — extracted as a pure function so
 * the football-relevance scoping (the actual bug fix) is unit-testable
 * without touching Mongo. A request scoped to a real team/competition/match
 * ID is inherently football-relevant already (that field can only be
 * non-empty if the article was actually tagged). A bare listing or a slug
 * lookup is NOT inherently scoped, though — this was the real bug: the news
 * pages were showing streaming/movie guides with zero football relevance
 * under the "Noticias de fútbol" banner, and a slug lookup with no extra
 * scoping could surface any blog post via a guessed URL. Both cases get
 * scoped to genuine football signals (a real football category, or actual
 * sportsRelations tagging). If editorial hasn't tagged any football content
 * yet, this correctly returns empty — the UI already has a proper "no news
 * yet" empty state for exactly that.
 */
export function buildNewsQuery(filters: NewsFilters): Record<string, any> {
  const query: Record<string, any> = { status: 'publish' };
  const clauses: Record<string, any>[] = [];

  if (filters.slug) query.slug = filters.slug;
  if (filters.teamId) query['sportsRelations.teamIds'] = filters.teamId;
  if (filters.competitionId) query['sportsRelations.competitionIds'] = filters.competitionId;
  if (filters.matchId) query['sportsRelations.matchIds'] = filters.matchId;
  if (filters.q) {
    clauses.push({
      $or: [
        { title: { $regex: escapeRegex(filters.q), $options: 'i' } },
        { excerpt: { $regex: escapeRegex(filters.q), $options: 'i' } },
      ],
    });
  }

  const hasTeamCompetitionOrMatchFilter = filters.teamId || filters.competitionId || filters.matchId;
  if (!hasTeamCompetitionOrMatchFilter) {
    clauses.push({
      $or: [
        { 'categories.slug': { $in: FOOTBALL_CATEGORY_SLUGS } },
        { 'sportsRelations.teamIds.0': { $exists: true } },
        { 'sportsRelations.competitionIds.0': { $exists: true } },
        { 'sportsRelations.matchIds.0': { $exists: true } },
      ],
    });
  }

  if (clauses.length) {
    query.$and = clauses;
  }

  return query;
}

/**
 * Resolves a secondary/enrichment call to its value, or to `fallback` if it
 * rejects — the mechanism behind every degrade-gracefully guarantee in this
 * file (spec: standings/news/reconciliation failures must never take down a
 * page whose primary data already resolved). Exported standalone so it's
 * unit-testable without touching the I/O (Mongo, HTTP) any real caller does.
 */
export async function settle<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}
