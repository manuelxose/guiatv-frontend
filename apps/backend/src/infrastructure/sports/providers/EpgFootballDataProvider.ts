/**
 * EPG-backed football data provider.
 *
 * This is the REAL, always-available data source: it derives structured
 * football matches from the EPG sports read model (`tv_read_airings`). It
 * honestly reports what the EPG can provide — teams, kickoff, competition and
 * broadcaster — and never fabricates scores or live minutes.
 */

import { TVReadAiringModel } from '../../../infrastructure/database/models/TVReadAiring.model';
import {
  FootballCompetition,
  FootballDataProvider,
  FootballMatch,
  FootballMatchQuery,
  FootballStandingRow,
  FootballTeam,
} from '../../../domain/sports/football/types';
import {
  isFootballAiring,
  normalizeEpgAiringToMatch,
  toNormalizedAiringInput,
} from '../../../application/sports/services/FootballNormalizer';
import {
  getCompetitionCatalog,
  toCompetitionEntity,
} from '../../../application/sports/services/FootballCompetitionCatalog';
import { DateUtils } from '../../../shared/utils/dateUtils';

export class EpgFootballDataProvider implements FootballDataProvider {
  readonly key = 'epg';
  readonly name = 'Guía TV EPG (datos reales de parrilla)';

  async getMatches(query: FootballMatchQuery = {}): Promise<FootballMatch[]> {
    const { start, end } = this.resolveWindow(query);
    const filter: Record<string, any> = {
      date: { $in: this.windowDateKeys(start, end) },
      ...this.buildSportsFilter(),
      'airing.start': { $gte: new Date(start).toISOString() },
      'airing.end': { $lte: new Date(end).toISOString() },
    };

    const docs = await TVReadAiringModel.find(filter)
      .sort({ 'airing.start': 1 })
      .lean()
      .exec();

    const matches = this.docsToMatches(docs as any[]);

    return this.applyQuery(matches, query);
  }

  async getLiveMatches(): Promise<FootballMatch[]> {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const docs = await TVReadAiringModel.find({
      date: { $in: this.windowDateKeys(from, to) },
      ...this.buildSportsFilter(),
      'airing.start': { $lte: now.toISOString() },
      'airing.end': { $gt: now.toISOString() },
    })
      .sort({ 'airing.start': 1 })
      .lean()
      .exec();

    return this.docsToMatches(docs as any[]).filter((match) => match.status === 'live');
  }

  async getMatch(idOrSlug: string): Promise<FootballMatch | null> {
    const byId = await TVReadAiringModel.findOne({ id: idOrSlug }).lean().exec();
    if (byId) {
      const match = this.docsToMatches([byId as any])[0];
      return match ?? null;
    }

    // Slug lookup over a recent window.
    const matches = await this.getMatches({ dateFrom: this.isoDaysAgo(3), dateTo: this.isoDaysAhead(7) });
    return matches.find((match) => match.slug === idOrSlug) ?? null;
  }

  async getCompetitions(): Promise<FootballCompetition[]> {
    // The catalog is the canonical competition registry. When a real provider
    // is attached, it enriches this with provider ids/current season.
    return getCompetitionCatalog().map(toCompetitionEntity);
  }

  async getCompetition(slug: string): Promise<FootballCompetition | null> {
    const entry = getCompetitionCatalog().find((candidate) => candidate.slug === slug);
    return entry ? toCompetitionEntity(entry) : null;
  }

  async getStandings(): Promise<FootballStandingRow[]> {
    // The EPG source does not carry standings. Return empty rather than
    // fabricate a table; the UI hides standings when the source lacks them.
    return [];
  }

  async getTeams(): Promise<FootballTeam[]> {
    const matches = await this.getMatches({ dateFrom: this.isoDaysAgo(3), dateTo: this.isoDaysAhead(7) });
    const teams = new Map<string, FootballTeam>();
    for (const match of matches) {
      teams.set(match.homeTeam.id, match.homeTeam);
      teams.set(match.awayTeam.id, match.awayTeam);
    }
    return Array.from(teams.values());
  }

  async getTeam(slug: string): Promise<FootballTeam | null> {
    const teams = await this.getTeams();
    return teams.find((team) => team.slug === slug) ?? null;
  }

  supportsLiveScores(): boolean {
    return false;
  }

  private docsToMatches(docs: any[]): FootballMatch[] {
    const matches: FootballMatch[] = [];
    for (const doc of docs) {
      const input = toNormalizedAiringInput(doc as any);
      if (!input.title || !isFootballAiring(input)) {
        continue;
      }
      const match = normalizeEpgAiringToMatch(input);
      if (match) {
        matches.push(match);
      }
    }
    return matches;
  }

  private applyQuery(matches: FootballMatch[], query: FootballMatchQuery): FootballMatch[] {
    let result = matches;

    if (query.status && query.status !== 'live') {
      result = result.filter((match) => match.status === query.status);
    }

    if (query.competitionSlug) {
      result = result.filter((match) => match.competition.slug === query.competitionSlug);
    }

    if (query.teamSlug) {
      result = result.filter(
        (match) => match.homeTeam.slug === query.teamSlug || match.awayTeam.slug === query.teamSlug
      );
    }

    if (query.q) {
      const q = String(query.q).toLowerCase();
      result = result.filter((match) =>
        [match.homeTeam.name, match.awayTeam.name, match.competition.name]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    if (query.limit && query.limit > 0) {
      result = result.slice(0, query.limit);
    }

    return result;
  }

  private resolveWindow(query: FootballMatchQuery): { start: Date; end: Date } {
    if (query.dateFrom && query.dateTo) {
      return { start: new Date(query.dateFrom), end: new Date(query.dateTo) };
    }
    if (query.date) {
      return DateUtils.getDayRangeFromAlias(query.date);
    }
    // Default: today ± a day to keep the payload bounded.
    return { start: new Date(this.isoDaysAgo(1)), end: new Date(this.isoDaysAhead(2)) };
  }

  /** Restricts the scan to sports airings before JS-side football detection. */
  private buildSportsFilter(): Record<string, any> {
    return {
      $or: [
        { 'program.sportFacet': 'Fútbol' },
        { 'program.editorialCategory': 'Deportes' },
      ],
    };
  }

  /** YYYYMMDD keys covering the window — leverages the indexed `date` field. */
  private windowDateKeys(start: Date, end: Date): string[] {
    const keys: string[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= end.getTime()) {
      keys.push(DateUtils.formatYYYYMMDD(cursor));
      cursor.setDate(cursor.getDate() + 1);
      if (keys.length > 16) break; // safety cap
    }
    return keys;
  }

  private isoDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  private isoDaysAhead(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }
}
