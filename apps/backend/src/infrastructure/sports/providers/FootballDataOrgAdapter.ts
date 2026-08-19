/**
 * football-data.org (v2) provider adapter.
 *
 * Dormant by default: activates when `FOOTBALL_DATA_API_KEY` is configured.
 * Maps the documented v2 payloads (Match, Competition, Team, Standings) into
 * the internal football domain. The product never sees these provider shapes.
 *
 * Reference: https://www.football-data.org/documentation/api
 */

import axios from 'axios';
import {
  FootballCompetition,
  FootballCompetitionType,
  FootballDataProvider,
  FootballMatch,
  FootballMatchQuery,
  FootballStandingRow,
  FootballTeam,
  normalizeMatchStatus,
} from '../../../domain/sports/football/types';
import { buildMatchSlug, slugify } from '../../../application/sports/services/FootballNormalizer';

const BASE_URL = 'https://api.football-data.org/v4';

export class FootballDataOrgAdapter implements FootballDataProvider {
  readonly key = 'football-data-org';
  readonly name = 'football-data.org';

  constructor(private readonly apiKey: string) {}

  private headers(): Record<string, string> {
    return { 'X-Auth-Token': this.apiKey };
  }

  async getMatches(query: FootballMatchQuery = {}): Promise<FootballMatch[]> {
    const params: Record<string, string> = {};
    if (query.dateFrom) params.dateFrom = query.dateFrom;
    if (query.dateTo) params.dateTo = query.dateTo;
    if (query.status && query.status !== 'live') params.status = query.status.toUpperCase();

    const { data } = await axios.get(`${BASE_URL}/matches`, { headers: this.headers(), params });
    return (data.matches || []).map((raw: any) => this.mapMatch(raw)).filter(Boolean);
  }

  async getLiveMatches(): Promise<FootballMatch[]> {
    return this.getMatches({ status: 'live' });
  }

  async getMatch(idOrSlug: string): Promise<FootballMatch | null> {
    try {
      const { data } = await axios.get(`${BASE_URL}/matches/${idOrSlug}`, {
        headers: this.headers(),
      });
      return this.mapMatch(data);
    } catch {
      return null;
    }
  }

  async getCompetitions(): Promise<FootballCompetition[]> {
    const { data } = await axios.get(`${BASE_URL}/competitions`, { headers: this.headers() });
    return (data.competitions || []).map((raw: any) => this.mapCompetition(raw));
  }

  async getCompetition(slug: string): Promise<FootballCompetition | null> {
    const competitions = await this.getCompetitions();
    return competitions.find((competition) => competition.slug === slug) ?? null;
  }

  async getStandings(competitionSlug: string): Promise<FootballStandingRow[]> {
    const { data } = await axios.get(
      `${BASE_URL}/competitions/${competitionSlug}/standings`,
      { headers: this.headers() }
    );
    const standings = data.standings || [];
    const total = standings.find((entry: any) => entry.type === 'TOTAL');
    const table = total?.table || standings[0]?.table || [];
    return table.map((row: any) => this.mapStandingRow(row));
  }

  async getTeams(): Promise<FootballTeam[]> {
    const { data } = await axios.get(`${BASE_URL}/teams`, { headers: this.headers() });
    return (data.teams || []).map((raw: any) => this.mapTeam(raw));
  }

  async getTeam(slug: string): Promise<FootballTeam | null> {
    try {
      const { data } = await axios.get(`${BASE_URL}/teams/${slug}`, { headers: this.headers() });
      return this.mapTeam(data);
    } catch {
      return null;
    }
  }

  supportsLiveScores(): boolean {
    return true;
  }

  private mapMatch(raw: any): FootballMatch | null {
    if (!raw?.id) return null;

    const homeTeam = raw.homeTeam ? this.mapTeam(raw.homeTeam) : undefined;
    const awayTeam = raw.awayTeam ? this.mapTeam(raw.awayTeam) : undefined;
    if (!homeTeam || !awayTeam) return null;

    const competition = raw.competition ? this.mapCompetition(raw.competition) : undefined;
    const score = raw.score?.fullTime || {};
    const kickoff = raw.utcDate;

    return {
      id: String(raw.id),
      slug: buildMatchSlug(homeTeam.name, awayTeam.name, kickoff),
      providerIds: { 'football-data-org': String(raw.id) },
      competition: competition ?? {
        id: 'unknown',
        slug: 'unknown',
        name: 'Competición',
      },
      season: raw.season?.id ? String(raw.season.id) : undefined,
      round: raw.matchday ? `Jornada ${raw.matchday}` : undefined,
      kickoffAt: kickoff,
      status: normalizeMatchStatus(raw.status),
      homeTeam,
      awayTeam,
      score: {
        home: score.homeTeam ?? null,
        away: score.awayTeam ?? null,
      },
      minute: raw.minute ?? null,
      venue: raw.venue ?? undefined,
      broadcasts: [],
      sourceProvenance: {
        source: 'football-data-org',
        externalId: String(raw.id),
        confidence: 'high',
      },
      lastUpdatedAt: raw.lastUpdated ?? new Date().toISOString(),
    };
  }

  private mapTeam(raw: any): FootballTeam {
    const name = raw.name || raw.shortName || 'Equipo';
    return {
      id: String(raw.id),
      slug: slugify(name),
      name,
      shortName: raw.shortName,
      country: raw.area?.name,
      crest: raw.crest ?? null,
      aliases: [name, raw.shortName, raw.tla].filter(Boolean),
      providerIds: { 'football-data-org': String(raw.id) },
      lastUpdatedAt: raw.lastUpdated ?? new Date().toISOString(),
    };
  }

  private mapCompetition(raw: any): FootballCompetition {
    const name = raw.name || 'Competición';
    return {
      id: String(raw.id),
      slug: slugify(name),
      name,
      shortName: raw.code,
      country: raw.area?.name,
      logo: raw.emblem ?? null,
      type: this.mapCompetitionType(raw),
      currentSeason: raw.currentSeason?.id ? String(raw.currentSeason.id) : undefined,
      providerIds: { 'football-data-org': String(raw.id) },
      lastUpdatedAt: raw.lastUpdated ?? new Date().toISOString(),
    };
  }

  private mapCompetitionType(raw: any): FootballCompetitionType {
    const code = String(raw.code || '').toUpperCase();
    if (['CL', 'EL', 'EC', 'WC'].includes(code)) return 'international';
    if (['CDR', 'FAC', 'DFB'].includes(code)) return 'cup';
    return 'league';
  }

  private mapStandingRow(raw: any): FootballStandingRow {
    const team = raw.team ? this.mapTeam(raw.team) : undefined;
    return {
      position: Number(raw.position) || 0,
      team: team ?? { id: 'unknown', slug: 'unknown', name: raw.team?.name || 'Equipo', aliases: [], providerIds: {}, lastUpdatedAt: new Date().toISOString() },
      played: Number(raw.playedGames) || 0,
      won: Number(raw.won) || 0,
      drawn: Number(raw.draw) || 0,
      lost: Number(raw.lost) || 0,
      goalsFor: Number(raw.goalsFor) || 0,
      goalsAgainst: Number(raw.goalsAgainst) || 0,
      goalDifference: Number(raw.goalDifference) || 0,
      points: Number(raw.points) || 0,
      form: raw.form,
    };
  }
}
