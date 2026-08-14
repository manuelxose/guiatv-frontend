import { TvReadItemDTO } from '../api/models';
import { normalizeToCard } from '../utils/tv-normalizers';

/**
 * Sports vertical domain contracts.
 *
 * The current data source is the EPG (`/v2/tv/read` with category "Deportes"),
 * i.e. *broadcast programs* whose titles describe an event. The backend does
 * not yet expose structured event payloads (teams, score, minute), so these
 * contracts describe what the product needs and the normalizers map what we
 * can honestly infer from an airing — never fabricating scores, minutes or
 * venues that the source does not provide.
 */

export type SportsEventStatus = 'LIVE' | 'UPCOMING' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export type SportsDiscipline = 'Fútbol' | 'Baloncesto' | 'Tenis' | 'Motor' | 'Otros';

export interface SportsEvent {
  /** Stable id derived from the source airing. */
  id: string;
  sport: SportsDiscipline;
  competition: string;
  /** ISO start time of the broadcast window (kickoff when the source marks it). */
  startAt: string;
  status: SportsEventStatus;
  /** Broadcaster channel name — "dónde verlo". */
  channel: string;
  channelId: string;
  /** Streaming availability hint when the source reports it. */
  platform: string;
  /** Routable detail path. */
  detailPath: string;
  /** Raw source title, kept for accessible labels and fallbacks. */
  title: string;
}

export interface FootballEvent extends SportsEvent {
  sport: 'Fútbol';
  homeTeam: string;
  awayTeam: string;
  /** Structured score is only populated when a real source provides it. */
  homeScore: number | null;
  awayScore: number | null;
  /** Live match minute — only when a real source provides it. */
  minute: number | null;
  /** Stage/round text (e.g. "Jornada 1", "Cuartos") when inferable. */
  stage: string;
}

/** Competitions we can recognise from title/signal — no hardcoded events.
 *  Kept football-specific so a shared word like "Mundial" can't misclassify
 *  motor racing ("Mundial F1") or other sports. */
const FOOTBALL_COMPETITION_HINTS = [
  'LaLiga',
  'Liga EA Sports',
  'Hypermotion',
  'Champions League',
  'Champions',
  'Liga de Campeones',
  'Europa League',
  'Conference League',
  'Copa del Rey',
  'Premier League',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Primera División',
  'Segunda División',
  'Mundial de Clubes',
  'Mundial de Fútbol',
  'Eurocopa',
  'Selección española',
] as const;

/** Explicit non-football signals in the discipline facet. */
const NON_FOOTBALL_FACET_HINTS = /baloncesto|basket|\bf1\b|f[óo]rmula\s*1|tenis|motogp|\bmoto\b|\bmotor\b/i;

/**
 * Non-football signals that can appear in the title itself. Backend tagging
 * is not fully reliable (e.g. a Jiu-Jitsu event tagged "Fútbol"), so the
 * title is also checked before anything is classified as football.
 */
const NON_FOOTBALL_TITLE_HINTS =
  /\bf1\b|f[óo]rmula\s*1|motogp|moto\s*gp|\bgp\s+de\b|grand\s+prix|jiu[- ]?jitsu|baloncesto|basket|\bnba\b|\bacb\b|eurobasket|tenis|\batp\b|\bwta\b|\bufc\b|\bmma\b|boxeo|ciclismo|motociclismo|rally|nataci[óo]n|atletismo/i;

/** Separators commonly used between two team names in EPG titles. */
const MATCH_SEPARATORS = [
  / - /,
  / vs /i,
  /–/,
  /—/,
  /\bvs\.?\s/i,
] as const;

export function isFootballSportFacet(value: string | undefined): boolean {
  return /f[úu]tbol|futbol/i.test(String(value || '').trim());
}

export function isFootballItem(item: TvReadItemDTO): boolean {
  const facet = String(item.program.sportFacet || '').trim();
  const title = String(item.program.title || '').trim();

  // Explicit non-football signals (in the facet OR the title) always win:
  // "Mundial F1 - GP de Hungría" or a Jiu-Jitsu event tagged "Fútbol" must
  // never become a football match.
  if (NON_FOOTBALL_FACET_HINTS.test(facet) || NON_FOOTBALL_TITLE_HINTS.test(title)) {
    return false;
  }

  if (isFootballSportFacet(facet)) {
    return true;
  }
  return FOOTBALL_COMPETITION_HINTS.some((hint) =>
    title.toLowerCase().includes(hint.toLowerCase())
  );
}

export function resolveDiscipline(item: TvReadItemDTO): SportsDiscipline {
  const facet = String(item.program.sportFacet || '').trim();
  const title = String(item.program.title || '').trim();
  const combined = `${facet} ${title}`;
  // Title signals win over the facet, which is not always reliable upstream.
  if (/jiu[- ]?jitsu|\bufc\b|\bmma\b|boxeo|lucha\b/i.test(combined)) return 'Otros';
  if (/\bf1\b|f[óo]rmula\s*1|motogp|moto\s*gp|\bgp\s+de\b|motor/i.test(combined)) return 'Motor';
  if (/baloncesto|basket|\bnba\b/i.test(combined)) return 'Baloncesto';
  if (/tenis|\batp\b|\bwta\b/i.test(combined)) return 'Tenis';
  if (isFootballSportFacet(facet) || /f[úu]tbol|futbol/i.test(title)) return 'Fútbol';
  return 'Otros';
}

function inferCompetitionFromTitle(item: TvReadItemDTO): string {
  const title = String(item.program.title || '').trim();
  // ":" and "·" both separate a competition/context lead from the matchup
  // ("Fútbol Conmebol Copa Sudamericana · Vasco da Gama vs. Olimpia").
  const lead = title.split(/[:·]/)[0]?.trim();
  if (lead && lead.length >= 3) {
    // A leading "Fútbol" is a category tag, not part of the competition name.
    return lead.replace(/^(f[úu]tbol|futbol)\s+/i, '').trim();
  }
  return String(item.program.sportFacet || item.program.editorialCategory || '').trim();
}

function resolveCompetition(item: TvReadItemDTO): string {
  const inferred = inferCompetitionFromTitle(item);
  if (inferred) {
    return inferred;
  }
  const title = String(item.program.title || '').toLowerCase();
  const hint = FOOTBALL_COMPETITION_HINTS.find((entry) =>
    title.includes(entry.toLowerCase())
  );
  return hint || 'Competición';
}

/** Splits a matchup string into home/away teams without fabricating data. */
function splitMatchup(value: string): { homeTeam: string; awayTeam: string } {
  const text = value.trim();
  // The EPG packs context into titles using "·" or ":". Try each segment and
  // pick the one that reads as a real two-team matchup.
  const segments = text
    .split(/[:·]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const split = trySplitMatchup(segment);
    if (split && looksLikeTeamName(split.homeTeam) && looksLikeTeamName(split.awayTeam)) {
      return split;
    }
  }

  const whole = trySplitMatchup(text);
  if (whole) {
    return whole;
  }
  // Single label — keep it as the home side and leave the opponent unknown.
  return { homeTeam: text, awayTeam: '' };
}

function trySplitMatchup(value: string): { homeTeam: string; awayTeam: string } | null {
  for (const separator of MATCH_SEPARATORS) {
    const parts = value.split(separator).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { homeTeam: parts[0], awayTeam: parts[1] };
    }
  }
  return null;
}

/**
 * Heuristic to tell a real team name apart from an editorial sentence that
 * happens to contain "vs" (e.g. "PSG busca el bicampeonato vs. los ganadores
 * de la Europa League"). Real club names are short and terse.
 */
function looksLikeTeamName(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  return value.length > 0 && value.length <= 40 && words.length <= 6;
}

function resolveStage(title: string): string {
  const match = /(jornada\s*\d+|fase\s+de\s+grupos|octavos|cuartos|semifinal|final|ida|vuelta)/i.exec(
    title
  );
  return match ? match[1] : '';
}

export function normalizeFootballEvent(item: TvReadItemDTO): FootballEvent | null {
  if (!isFootballItem(item)) {
    return null;
  }

  const rawTitle = String(item.program.title || '').trim();
  const { homeTeam, awayTeam } = splitMatchup(rawTitle);

  // Only two-team matchups become football events. Football talk shows,
  // magazines, channels or editorial programs ("ElDesmarque", "Gracias,
  // Carolina", "Onze") are excluded here.
  if (!awayTeam || !looksLikeTeamName(homeTeam) || !looksLikeTeamName(awayTeam)) {
    return null;
  }

  const liveNow = Boolean(item.airing.liveNow || item.timingContext?.liveNow);
  const detailPath = normalizeToCard(item).detailPath;

  return {
    id: item.id,
    sport: 'Fútbol',
    competition: resolveCompetition(item),
    startAt: item.airing.start,
    status: liveNow ? 'LIVE' : 'UPCOMING',
    channel: String(item.channel.name || '').trim(),
    channelId: String(item.channel.id || '').trim(),
    platform: item.availability.streaming ? 'Streaming' : '',
    detailPath,
    title: rawTitle,
    homeTeam,
    awayTeam,
    homeScore: null,
    awayScore: null,
    minute: null,
    stage: resolveStage(rawTitle),
  };
}

/** Formats an ISO time as HH:mm in Spanish locale (SSR-safe fallback). */
export function formatKickoff(iso?: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
