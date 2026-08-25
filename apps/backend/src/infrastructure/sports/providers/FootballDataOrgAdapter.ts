/**
 * football-data.org (v4) provider adapter.
 *
 * Dormant by default: activates when `FOOTBALL_DATA_API_KEY` is configured.
 * Maps the documented v4 payloads (Match, Competition, Team, Standings) into
 * the internal football domain. The product never sees these provider shapes.
 *
 * The mapping functions are exported standalone (not private class methods)
 * specifically so they're unit-testable against synthetic raw payloads
 * without an HTTP-mocking library — same pattern as FootballNormalizer.ts.
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

export function mapFootballDataOrgTeam(raw: any): FootballTeam {
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

function mapCompetitionType(raw: any): FootballCompetitionType {
  const code = String(raw.code || '').toUpperCase();
  if (['CL', 'EL', 'EC', 'WC'].includes(code)) return 'international';
  if (['CDR', 'FAC', 'DFB'].includes(code)) return 'cup';
  return 'league';
}

export function mapFootballDataOrgCompetition(raw: any): FootballCompetition {
  const name = raw.name || 'Competición';
  return {
    id: String(raw.id),
    slug: slugify(name),
    name,
    shortName: raw.code,
    country: raw.area?.name,
    logo: raw.emblem ?? null,
    type: mapCompetitionType(raw),
    currentSeason: raw.currentSeason?.id ? String(raw.currentSeason.id) : undefined,
    providerIds: { 'football-data-org': String(raw.id) },
    lastUpdatedAt: raw.lastUpdated ?? new Date().toISOString(),
  };
}

export function mapFootballDataOrgMatch(raw: any): FootballMatch | null {
  if (!raw?.id) return null;

  const homeTeam = raw.homeTeam ? mapFootballDataOrgTeam(raw.homeTeam) : undefined;
  const awayTeam = raw.awayTeam ? mapFootballDataOrgTeam(raw.awayTeam) : undefined;
  if (!homeTeam || !awayTeam) return null;

  const competition = raw.competition ? mapFootballDataOrgCompetition(raw.competition) : undefined;
  // v4 nests `score.fullTime: { home, away }` — NOT `{ homeTeam, awayTeam }`
  // (that flatter/renamed shape belongs to the deprecated v2 API). Getting
  // this wrong doesn't throw — it silently nulls every finished/live score,
  // which is why it's covered by a regression test below.
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
      home: score.home ?? null,
      away: score.away ?? null,
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

export function mapFootballDataOrgStandingRow(raw: any): FootballStandingRow {
  const team = raw.team ? mapFootballDataOrgTeam(raw.team) : undefined;
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

/** Pulls the trailing `YYYY-MM-DD` that `buildMatchSlug` always appends. */
export function extractSlugDate(slug: string): string | null {
  const match = /-(\d{4}-\d{2}-\d{2})$/.exec(slug);
  return match ? match[1] : null;
}

/** Finds a team by our own generated slug among a list of matches' teams. */
export function findTeamBySlugInMatches(matches: FootballMatch[], slug: string): FootballTeam | null {
  for (const match of matches) {
    if (match.homeTeam.slug === slug) return match.homeTeam;
    if (match.awayTeam.slug === slug) return match.awayTeam;
  }
  return null;
}

/** Unique teams (by slug) across a list of matches' home/away sides. */
export function dedupeTeamsFromMatches(matches: FootballMatch[]): FootballTeam[] {
  const teams = new Map<string, FootballTeam>();
  for (const match of matches) {
    teams.set(match.homeTeam.slug, match.homeTeam);
    teams.set(match.awayTeam.slug, match.awayTeam);
  }
  return Array.from(teams.values());
}

// Found via real E2E testing against production: football-data.org's free
// tier rate-limits around 10 req/min, and two calls had zero caching at the
// actual HTTP level — the bare, unfiltered `/matches` fetch (reused by
// getMatchBySlug, getTeam, getTeams, search — the single biggest driver of
// call volume) and `getCompetitions()` (which getCompetition()/getStandings()
// call internally, bypassing FootballQueryService's own service-level
// competitions cache entirely since that lives one layer up). A real 429
// from the upstream API propagated straight to an unhandled 500, confirmed
// in production logs. These are short-lived, in-memory, adapter-instance-
// scoped caches — the adapter itself is a DI singleton for the process
// lifetime, so this is sufficient without wiring in the Redis-backed
// ICacheRepository (matching how SitemapController's own cache works).
const GENERAL_MATCHES_CACHE_TTL_MS = 20_000;
const COMPETITIONS_LIST_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
// Per-competition fixtures/standings — same rate-limit reasoning, found the
// same way (both hit real 429s in production during E2E verification of
// the two caches above). Shorter than the competitions list itself since
// scores/tables update through the day; still long enough to absorb a
// realistic burst of page views for the same competition.
const COMPETITION_SUBRESOURCE_CACHE_TTL_MS = 5 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = Number(process.env.FOOTBALL_PROVIDER_TIMEOUT_MS || 4_000);
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 30_000;

export interface FootballDataOrgThrottleState {
  remaining: number | null;
  blockedUntil: number;
}

function readHeader(headers: any, name: string): string | undefined {
  const value = typeof headers?.get === 'function'
    ? headers.get(name)
    : headers?.[name] ?? headers?.[name.toLowerCase()];
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

/** Converts the provider's response headers into a local request gate. */
export function parseFootballDataOrgThrottleHeaders(
  headers: any,
  now = Date.now(),
  status?: number
): FootballDataOrgThrottleState {
  const remainingValue = Number(readHeader(headers, 'x-requests-available-minute'));
  const resetSeconds = Number(readHeader(headers, 'x-requestcounter-reset'));
  const retryAfterSeconds = Number(readHeader(headers, 'retry-after'));
  const remaining = Number.isFinite(remainingValue) ? remainingValue : null;
  const shouldBlock = status === 429 || remaining === 0;
  const waitSeconds = Number.isFinite(retryAfterSeconds)
    ? retryAfterSeconds
    : Number.isFinite(resetSeconds) ? resetSeconds : 60;
  return {
    remaining,
    blockedUntil: shouldBlock ? now + Math.max(1, waitSeconds) * 1_000 : 0,
  };
}

export class FootballDataOrgAdapter implements FootballDataProvider {
  readonly key = 'football-data-org';
  readonly name = 'football-data.org';

  private generalMatchesCache: { value: FootballMatch[]; expiresAt: number } | null = null;
  private competitionsListCache: { value: FootballCompetition[]; expiresAt: number } | null = null;
  private readonly competitionMatchesCache = new Map<string, { value: FootballMatch[]; expiresAt: number }>();
  private readonly standingsCache = new Map<string, { value: FootballStandingRow[]; expiresAt: number }>();
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;
  private throttleBlockedUntil = 0;

  constructor(private readonly apiKey: string) {}

  private headers(): Record<string, string> {
    return { 'X-Auth-Token': this.apiKey };
  }

  private async fetch<T = any>(url: string, config: Record<string, unknown> = {}): Promise<{ data: T }> {
    const now = Date.now();
    if (this.throttleBlockedUntil > now) {
      throw new Error('football-data.org request deferred by response-header throttle');
    }
    if (this.circuitOpenUntil > now) {
      throw new Error('football-data.org circuit is temporarily open');
    }
    try {
      const response = await axios.get<T>(url, { ...config, timeout: PROVIDER_TIMEOUT_MS });
      const throttle = parseFootballDataOrgThrottleHeaders(response.headers, Date.now(), response.status);
      this.throttleBlockedUntil = throttle.blockedUntil;
      this.consecutiveFailures = 0;
      this.circuitOpenUntil = 0;
      return { data: response.data };
    } catch (error: any) {
      const status = Number(error?.response?.status) || undefined;
      const throttle = parseFootballDataOrgThrottleHeaders(error?.response?.headers, Date.now(), status);
      this.throttleBlockedUntil = Math.max(this.throttleBlockedUntil, throttle.blockedUntil);
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
        this.circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
      }
      // Never propagate Axios' request config: it contains X-Auth-Token and
      // can leak the secret when generic error serializers log the object.
      throw new Error(`football-data.org request failed${status ? ` (status ${status})` : ''}`);
    }
  }

  /** The one real HTTP call behind every "bare" matches query — cached. */
  private async fetchGeneralMatches(): Promise<FootballMatch[]> {
    const now = Date.now();
    if (this.generalMatchesCache && this.generalMatchesCache.expiresAt > now) {
      return this.generalMatchesCache.value;
    }
    const { data } = await this.fetch<any>(`${BASE_URL}/matches`, { headers: this.headers() });
    const matches = (data.matches || []).map((raw: any) => mapFootballDataOrgMatch(raw)).filter(Boolean) as FootballMatch[];
    this.generalMatchesCache = { value: matches, expiresAt: now + GENERAL_MATCHES_CACHE_TTL_MS };
    return matches;
  }

  async getMatches(query: FootballMatchQuery = {}): Promise<FootballMatch[]> {
    // Competition-scoped queries use the provider's own filtered endpoint —
    // correct AND cheaper than pulling the global list and filtering it
    // ourselves. Previously `competitionSlug`/`teamSlug`/`q`/`limit` were
    // all silently ignored here, so e.g. a competition page's "matches"
    // section actually showed every match from every competition mixed
    // together.
    if (query.competitionSlug) {
      return this.getCompetitionMatches(query.competitionSlug, query);
    }

    let matches: FootballMatch[];
    if (query.dateFrom || query.dateTo || (query.status && query.status !== 'live')) {
      // A precise, time/status-scoped request — these should stay live, not
      // reuse the cached general snapshot.
      const params: Record<string, string> = {};
      if (query.dateFrom) params.dateFrom = query.dateFrom;
      if (query.dateTo) params.dateTo = query.dateTo;
      if (query.status && query.status !== 'live') params.status = query.status.toUpperCase();
      const { data } = await this.fetch<any>(`${BASE_URL}/matches`, { headers: this.headers(), params });
      matches = (data.matches || []).map((raw: any) => mapFootballDataOrgMatch(raw)).filter(Boolean) as FootballMatch[];
    } else {
      // `date`/`status: 'live'` are both effectively no-ops on this
      // endpoint already (date was never wired in; live is handled by the
      // service-level LIVE_CACHE_KEY layer, not here) — safe to serve from
      // the shared cached snapshot.
      matches = await this.fetchGeneralMatches();
    }

    if (query.teamSlug) {
      matches = matches.filter((m) => m.homeTeam.slug === query.teamSlug || m.awayTeam.slug === query.teamSlug);
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      matches = matches.filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(q) ||
          m.awayTeam.name.toLowerCase().includes(q) ||
          m.competition.name.toLowerCase().includes(q)
      );
    }
    if (query.limit) {
      matches = matches.slice(0, query.limit);
    }
    return matches;
  }

  private async getCompetitionMatches(competitionSlug: string, query: FootballMatchQuery): Promise<FootballMatch[]> {
    const competition = await this.getCompetition(competitionSlug);
    const providerId = competition?.providerIds['football-data-org'];
    if (!providerId) return [];

    // Same rate-limit reasoning as fetchGeneralMatches()/getCompetitions()
    // above — this endpoint had zero caching, confirmed hitting real 429s
    // in production during E2E verification. Only the bare (no date/status
    // filter) shape is cached, for the same reason as getMatches().
    const isBareQuery = !query.dateFrom && !query.dateTo && !(query.status && query.status !== 'live');
    if (isBareQuery) {
      const now = Date.now();
      const cached = this.competitionMatchesCache.get(providerId);
      if (cached && cached.expiresAt > now) {
        return query.limit ? cached.value.slice(0, query.limit) : cached.value;
      }
    }

    const params: Record<string, string> = {};
    if (query.dateFrom) params.dateFrom = query.dateFrom;
    if (query.dateTo) params.dateTo = query.dateTo;
    if (query.status && query.status !== 'live') params.status = query.status.toUpperCase();

    const { data } = await this.fetch<any>(`${BASE_URL}/competitions/${providerId}/matches`, {
      headers: this.headers(),
      params,
    });
    let matches = (data.matches || []).map((raw: any) => mapFootballDataOrgMatch(raw)).filter(Boolean) as FootballMatch[];

    if (isBareQuery) {
      this.competitionMatchesCache.set(providerId, { value: matches, expiresAt: Date.now() + COMPETITION_SUBRESOURCE_CACHE_TTL_MS });
    }
    if (query.limit) {
      matches = matches.slice(0, query.limit);
    }
    return matches;
  }

  async getLiveMatches(): Promise<FootballMatch[]> {
    return this.getMatches({ status: 'live' });
  }

  async getMatch(idOrSlug: string): Promise<FootballMatch | null> {
    // The provider's REST path only accepts football-data.org's own numeric
    // match id — never our generated slug (`buildMatchSlug` embeds team
    // names + kickoff date, which this API doesn't understand). Every match
    // link on the site is by slug, so without this branch every match
    // detail page 404s. Numeric ids still take the direct fast path.
    if (/^\d+$/.test(idOrSlug)) {
      try {
        const { data } = await this.fetch<any>(`${BASE_URL}/matches/${idOrSlug}`, { headers: this.headers() });
        return mapFootballDataOrgMatch(data);
      } catch {
        return null;
      }
    }
    return this.getMatchBySlug(idOrSlug);
  }

  private async getMatchBySlug(slug: string): Promise<FootballMatch | null> {
    if (!extractSlugDate(slug)) return null;
    // Deliberately unfiltered: an empirical check showed `dateFrom`/`dateTo`
    // on this tier returns zero matches for a date that unquestionably has
    // one (confirmed both via the raw single-match id lookup and via the
    // unfiltered list this call reuses — the same shape `getHome()` already
    // depends on for `todayMatches`/`liveMatches`). Filtering client-side by
    // slug is safe here: a slug collision would require two different real
    // matches sharing home+away+kickoff-date, which can't happen.
    const matches = await this.getMatches({});
    return matches.find((match) => match.slug === slug) ?? null;
  }

  async getCompetitions(): Promise<FootballCompetition[]> {
    const now = Date.now();
    if (this.competitionsListCache && this.competitionsListCache.expiresAt > now) {
      return this.competitionsListCache.value;
    }
    const { data } = await this.fetch<any>(`${BASE_URL}/competitions`, { headers: this.headers() });
    const competitions = (data.competitions || []).map((raw: any) => mapFootballDataOrgCompetition(raw));
    this.competitionsListCache = { value: competitions, expiresAt: now + COMPETITIONS_LIST_CACHE_TTL_MS };
    return competitions;
  }

  async getCompetition(slug: string): Promise<FootballCompetition | null> {
    const competitions = await this.getCompetitions();
    return competitions.find((competition) => competition.slug === slug) ?? null;
  }

  async getStandings(competitionSlug: string): Promise<FootballStandingRow[]> {
    // Same class of bug as getMatch(): the standings endpoint wants
    // football-data.org's own competition id/code (e.g. "PL", or a numeric
    // id), not our slugified name. Resolve it via the same competition
    // listing getCompetition() already uses, same as getMatch() resolves a
    // slug against a match listing rather than guessing a provider id.
    const competition = await this.getCompetition(competitionSlug);
    const providerId = competition?.providerIds['football-data-org'];
    if (!providerId) return [];

    const now = Date.now();
    const cached = this.standingsCache.get(providerId);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const { data } = await this.fetch<any>(
      `${BASE_URL}/competitions/${providerId}/standings`,
      { headers: this.headers() }
    );
    const standings = data.standings || [];
    const total = standings.find((entry: any) => entry.type === 'TOTAL');
    const table = total?.table || standings[0]?.table || [];
    const result = table.map((row: any) => mapFootballDataOrgStandingRow(row));
    this.standingsCache.set(providerId, { value: result, expiresAt: now + COMPETITION_SUBRESOURCE_CACHE_TTL_MS });
    return result;
  }

  async getTeams(): Promise<FootballTeam[]> {
    // The unscoped `/teams` listing is unreliable on this tier — confirmed
    // empirically: searching "Real" found matches for Real Betis/Real
    // Sociedad via getMatches(), but this endpoint returned zero teams for
    // the same query window. Derive the team pool from the general match
    // list instead (same source getTeam()/getMatchBySlug already trust).
    const matches = await this.getMatches({});
    return dedupeTeamsFromMatches(matches);
  }

  async getTeam(slug: string): Promise<FootballTeam | null> {
    // Same class of bug as getMatch()/getStandings(): `/teams/{id}` wants
    // football-data.org's own numeric id, not our slugified name — a direct
    // hit 404s for every real team-detail page. Numeric ids still take the
    // direct fast path; a slug is resolved from the general match list
    // (already known-working — see getMatchBySlug) rather than the
    // unscoped `/teams` listing, which this tier may not support at all
    // without a competition filter and hasn't been verified to.
    if (/^\d+$/.test(slug)) {
      try {
        const { data } = await this.fetch<any>(`${BASE_URL}/teams/${slug}`, { headers: this.headers() });
        return mapFootballDataOrgTeam(data);
      } catch {
        return null;
      }
    }

    const generalMatches = await this.getMatches({});
    const fromGeneral = findTeamBySlugInMatches(generalMatches, slug);
    if (fromGeneral) return fromGeneral;

    // Found via real E2E testing: the general matches list is inherently a
    // narrow "matches around now" window — a team ranked #1 in a full
    // standings table can easily have no fixture in that window, and would
    // otherwise 404 despite being unambiguously real. Standings and per-
    // competition fixtures both carry every team in a league; check
    // whatever's already warm in those caches (zero extra API calls, no
    // new rate-limit pressure) before giving up.
    for (const cached of this.standingsCache.values()) {
      const row = cached.value.find((r) => r.team.slug === slug);
      if (row) return row.team;
    }
    for (const cached of this.competitionMatchesCache.values()) {
      const found = findTeamBySlugInMatches(cached.value, slug);
      if (found) return found;
    }
    return null;
  }

  supportsLiveScores(): boolean {
    return true;
  }
}
