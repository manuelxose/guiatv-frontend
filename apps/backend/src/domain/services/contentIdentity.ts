/**
 * Persistent content identity (Phase 2C §C–§F, implemented in 2D-1): the pure rules shared by
 * the `content_entities`, `content_slugs` and `content_title_keys` adapters. No I/O here, so the
 * identity, path and matching policies are unit-testable without a database.
 */
import { randomBytes } from 'node:crypto';
import { buildProgramBrandKey, resolveProgramDisplayTitle } from '@/shared/utils/tvMetadata';

export const CONTENT_KINDS = ['show', 'series', 'movie', 'event', 'unknown'] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const CONTENT_STATUSES = ['candidate', 'active', 'merged', 'removed'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const SLUG_ROLES = ['canonical', 'redirect', 'gone'] as const;
export type SlugRole = (typeof SLUG_ROLES)[number];

/** verified: manual or exact TMDB id; candidate: provisional binding; ambiguous / manual_review: no
 * binding, waiting for review; rejected: reviewed, not an entity (stays unbound, leaves the queue). */
export const TITLE_KEY_STATES = ['verified', 'candidate', 'ambiguous', 'manual_review', 'rejected'] as const;
export type TitleKeyState = (typeof TITLE_KEY_STATES)[number];

export const MATCH_METHODS = ['manual', 'tmdb_id', 'tmdb_exact', 'title_year', 'title_kind', 'title'] as const;
export type MatchMethod = (typeof MATCH_METHODS)[number];

export const PROVENANCE_SOURCES = ['manual', 'tmdb', 'epg', 'backfill'] as const;
export type ProvenanceSource = (typeof PROVENANCE_SOURCES)[number];

export interface TmdbRef {
  type: 'movie' | 'tv';
  id: number;
}

// ---------------------------------------------------------------------------------------------
// Entity id: "ce_" + ULID (48-bit ms timestamp + 80 random bits, Crockford base32). Never reused.

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ENTITY_ID_PATTERN = /^ce_[0-9A-HJKMNP-TV-Z]{26}$/;

export function newEntityId(now: number = Date.now(), random: Uint8Array = randomBytes(10)): string {
  let time = '';
  for (let t = now, i = 0; i < 10; i++, t = Math.floor(t / 32)) time = CROCKFORD[t % 32] + time;
  let bits = 0n;
  for (const byte of random) bits = (bits << 8n) | BigInt(byte);
  let rand = '';
  for (let i = 0; i < 16; i++, bits >>= 5n) rand = CROCKFORD[Number(bits & 31n)] + rand;
  return `ce_${time}${rand}`;
}

// ---------------------------------------------------------------------------------------------
// Lifecycle. Published identities are never hard-deleted: `removed` is a soft state that can be
// restored, `merged` is terminal and always points at an active entity (one redirect hop).

const TRANSITIONS: Record<ContentStatus, readonly ContentStatus[]> = {
  candidate: ['active', 'merged', 'removed'],
  active: ['merged', 'removed'],
  removed: ['active'],
  merged: [],
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------------------------
// Public paths (§F.1, §F.5). A registry key has exactly one spelling, so ambiguous encodings are
// rejected instead of decoded.

export const KIND_PATH_PREFIX: Record<ContentKind, string> = {
  movie: '/peliculas',
  series: '/series',
  show: '/programas',
  event: '/programas',
  unknown: '/programas',
};
const PATH_PREFIXES = new Set(Object.values(KIND_PATH_PREFIX));
const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_SLUG_LENGTH = 80;

/** Generic EPG slot names (§F.5): never an entity, never an allocated slug. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'cine', 'pelicula', 'peliculas', 'serie', 'series', 'programa', 'programacion', 'noticias',
  'informativos', 'deportes', 'teletienda', 'televenta', 'cierre', 'fin-de-emision', 'sin-titulo',
  'por-determinar',
]);

export type PathRejection =
  | 'not_a_string'
  | 'too_long'
  | 'unsafe_characters'
  | 'bad_shape'
  | 'unknown_prefix'
  | 'bad_slug'
  | 'reserved_slug';

export type PathCheck = { ok: true; path: string } | { ok: false; reason: PathRejection };

export function normalizeContentPath(input: unknown): PathCheck {
  if (typeof input !== 'string') return { ok: false, reason: 'not_a_string' };
  const raw = input.trim();
  if (raw.length > 200) return { ok: false, reason: 'too_long' };
  if (!/^[\x21-\x7e]+$/.test(raw) || /[%\\?#]|\/\/|\.\./.test(raw)) {
    return { ok: false, reason: 'unsafe_characters' };
  }
  const path = raw.toLowerCase().replace(/\/$/, '');
  const parts = path.split('/');
  if (parts.length !== 3 || parts[0] !== '') return { ok: false, reason: 'bad_shape' };
  const slug = parts[2];
  if (!PATH_PREFIXES.has(`/${parts[1]}`)) return { ok: false, reason: 'unknown_prefix' };
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_SEGMENT.test(slug)) return { ok: false, reason: 'bad_slug' };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: 'reserved_slug' };
  return { ok: true, path };
}

// ---------------------------------------------------------------------------------------------
// Title identity (§D.3, §E). The bare brand key is NOT unique: production has 213 brand keys
// carrying more than one TMDB id in 90 days (docs/seo/phase-2d1). A title key row is therefore
// `key|kind|discriminator`, and several rows may share a key.

export const MAX_TITLE_KEY_LENGTH = 120;
/** Bare slot words only. Named programmes built on them ("Cine de barrio") are real entities. */
const GENERIC_TITLE_KEYS = new Set([
  ...[...RESERVED_SLUGS].map((slug) => slug.replace(/-/g, '_')),
  'movie', 'film', 'cinema', 'estreno', 'blockbuster', 'taquillazo', 'peliculon',
  // Schedule fillers: descriptive slots, not works (2D-2D §7 slot flags; 2D-2E §4).
  'repeticion_de_programas', 'programacion_local', 'informacion_de_programacion', 'proximamente',
  'espacio_promocional', 'programacion_especial', 'avance_informativo',
  // Bare genre labels used as titles (2D-2E full-day replay): "DOC", "DOCUMENTAL".
  'doc', 'documental',
  'entrevista', 'redifusion', 'pelicula_clasica', 'dibujos_animados', 'que_cine',
]);
/** "Avance <programme>": a trailer for another programme, never a work of its own (2D-2E full-day replay). */
const PROMO_PREFIX = /^avance_/;

// ---------------------------------------------------------------------------------------------
// EPG title parsing (2D-2E). An airing title may carry the episode it shows ("9-1-1 T4 E3 · El
// futuro"); the work is "9-1-1". The original title is never changed, only read.

export type TitleResolution =
  /** The title is the work's title. */
  | 'work'
  /** An installment of a work: explicit season/episode marker, the feed's " · " separator, or a parenthesised episode number. */
  | 'episode'
  /** A " - " / " : " separator that may be part of the work's title ("Misión imposible - Fallout") or an episode subtitle. */
  | 'uncertain'
  /** Schedule slot or container, never a work (`GENERIC_TITLE_KEYS`, "Cine: Matrix", rating lines). */
  | 'generic'
  /** Episode markers with no work title ("Episodio 770", "T11 - Episodio 6"). */
  | 'no_work'
  /** No usable Latin identity, or a synopsis glued onto the title. */
  | 'unkeyable';

export interface ParsedEpgTitle {
  originalTitle: string;
  proposedWorkTitle: string | null;
  normalizedWorkKey: string | null;
  episodeTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  evidenceSource: 'title' | 'title_marker' | 'title_separator' | 'xmltv_subtitle';
  confidence: 'high' | 'medium' | 'low';
  resolutionState: TitleResolution;
  /** `uncertain` only: the work and episode the separator would give, if other evidence confirms the split. */
  uncertainSplit?: { workTitle: string; workKey: string; episodeTitle: string };
}

// A marker stands alone: preceded by the start, a space or punctuation, followed by the end, a space or punctuation.
const MARKER_SOURCE =
  String.raw`(?<=^|[\s·•:,.\-–—(])(?:` +
  String.raw`[ST](?<s1>\d{1,2}|(?:19|20)\d{2}) ?(?:E|Ep\.? ?)(?<e1>\d{1,4})` + // T4 E3, T4E3, S04E03, T22 Ep09, T2026 E4804
  String.raw`|(?<s2>\d{1,2})x(?<e2>\d{2,3})` + // 4x03 (two-digit episode, so "4x4" stays a title)
  String.raw`|temporada\s+(?<s3>\d{1,2})(?:[\s,.\-–—]+(?:episodio|cap[ií]tulo|cap\.?|ep\.?)\s*(?<e3>\d{1,4}))?` +
  String.raw`|T(?<s4>\d{1,2}|(?:19|20)\d{2})` + // season only: "Aire Lliure T1", "… T2020"
  String.raw`|E(?<e5>\d{1,4})(?=\s*$)` + // trailing episode number only: "Countryside Escape E13" ("E3 Noticies" keeps its E3)
  String.raw`|(?:episodios?|episodi|[eé]pisodes?|cap[ií]tulos?|cap\.?|ep\.?|chapter)\s*(?<e4>\d{1,4})(?:\s*[-–/y&]\s*\d{1,4})?` + // Capítulo 12, Ep. 12, Ep09, Episodio 770, Episode 1923 (fr), Episodi 30 (ca), Episodios 8-9
  String.raw`)(?=$|[\s·•:,.\-–—)/])`;
const MARKERS = new RegExp(MARKER_SOURCE, 'giu');
/** Trailing parenthesised episode number, optionally followed by another number: "Rosario (76) 12". Four digits are a year. */
const PAREN_EPISODE = /\s*\((\d{1,3})\)(?:\s+\d{1,3})?$/u;
const FEED_SEPARATOR = /\s+[·•]\s+/u;
const WEAK_SEPARATOR = /\s+[-–—:]\s+/u;
const TRAILING_PUNCTUATION = /[\s·•:,;\-–—(/]+$/u;
/** Rerun / live / format tags inside a title ("NOTÍCIES Vespre (R)", "News Generation [l] E1", "Dexter (Teleserie)"). */
const BROADCAST_TAG = /\s*[(\[](?:r|l|rep|teleserie)[)\]]/giu;
/** A sub-title that is a metadata line ("2013 | TP | ★6.0/10", seen in production), not an episode name. */
const METADATA_LINE = /\||★|^\d{4}$/u;
const contentWords = (text: string) => new Set((workKey(text) ?? '').split('_').filter((w) => w.length > 3));
/** The colon tail repeats the episode name in other words: at least two shared words, half of the tail's. */
function paraphrases(tail: string, episodeName: string): boolean {
  const a = contentWords(tail);
  const b = contentWords(episodeName);
  const shared = [...a].filter((w) => b.has(w)).length;
  return shared >= 2 && shared / a.size >= 0.5;
}
const LEADING_PUNCTUATION = /^[\s·•:,;\-–—)/]+/u;

/** `buildProgramBrandKey` (unchanged, so stored brand keys stay reusable), or null when it is not a usable key. */
function workKey(title: string): string | null {
  let key = buildProgramBrandKey(title);
  if (key === 'unknown_brand') return null;
  // The brand key drops "T2"/"E3" anywhere; at the start of a work title it is a title word ("T2
  // Trainspotting" is not "Trainspotting"). Trailing markers were already parsed out.
  const lead = /^[te]\d{1,2}(?=\s)/i.exec(title)?.[0].toLowerCase();
  if (lead && key !== lead && !key.startsWith(`${lead}_`)) key = `${lead}_${key}`;
  // Non-Latin titles normalise to digits or nothing ("捕风追影2" -> "2"); that key would merge
  // unrelated works, so it is not a key at all.
  if (/\p{L}/u.test(title) && !/[a-z]/.test(key)) return null;
  // EPG feeds sometimes glue the synopsis onto the title (seen in real data, 400+ characters):
  // that is not a title, and its row id would exceed the 400-character limit.
  if (key.length > MAX_TITLE_KEY_LENGTH) return null;
  return key || null;
}

const numberOf = (value?: string) => (value === undefined ? undefined : Number.parseInt(value, 10));

/**
 * Splits an EPG title into the work and the installment it shows. Only explicit evidence splits:
 * a season/episode marker, the feed's " · " separator, a parenthesised episode number, or the XMLTV
 * `sub-title` repeated at the end of the title. A bare " - " or " : " is `uncertain`: the caller
 * decides with evidence from outside the title (`uncertainSplit`). A colon without a space before
 * it ("Agatha Christie: Poirot", "Peter Rabbit 2: A la fuga") is part of the title.
 */
export function parseEpgTitle(title: string | null | undefined, subtitle?: string | null): ParsedEpgTitle {
  const originalTitle = String(title ?? '').trim();
  let work = originalTitle.replace(BROADCAST_TAG, '');
  let episodeTitle: string | undefined;
  let seasonNumber: number | undefined;
  let episodeNumber: number | undefined;
  let evidenceSource: ParsedEpgTitle['evidenceSource'] = 'title';
  let confidence: ParsedEpgTitle['confidence'] = 'high';
  let episode = false;

  let titleEpisode: string | undefined;
  const sub = String(subtitle ?? '').trim();
  if (sub && !METADATA_LINE.test(sub) && sub.toLowerCase() !== work.toLowerCase()) {
    const before = work.slice(0, work.length - sub.length);
    if (work.toLowerCase().endsWith(sub.toLowerCase()) && /[\p{L}\p{N}]/u.test(before) && TRAILING_PUNCTUATION.test(before)) {
      work = before;
      evidenceSource = 'xmltv_subtitle';
      episode = true;
    }
    episodeTitle = sub;
  }

  // The feed doubles the title before an episode number: "Amanda y Alan: reformas a la italiana:
  // Amanda y Alan: reformas a la italiana 1". Only an exact repetition counts.
  const doubled = work.match(/^(.{3,}?):\s+\1(?:\s+(\d{1,4}))?$/iu);
  if (doubled) {
    work = doubled[1];
    episodeNumber = numberOf(doubled[2]);
    [evidenceSource, confidence, episode] = ['title_separator', 'medium', true];
  }

  const dot = work.match(FEED_SEPARATOR);
  if (dot?.index) {
    const rest = work.slice(dot.index + dot[0].length).trim();
    work = work.slice(0, dot.index);
    // "Criaturas indefensas · (The dog lover)": an original title, not an episode name.
    if (!/^\(.*\)$/.test(rest)) {
      titleEpisode = rest;
      episodeTitle ??= rest;
    }
    if (!episode) [evidenceSource, confidence] = ['title_separator', 'medium'];
    episode = true;
  }

  // The first marker with some title before it; a title that is nothing but markers has no work.
  const markers = [...work.matchAll(MARKERS)];
  const marker = markers.find((m) => /[\p{L}\p{N}]/u.test(work.slice(0, m.index).replace(MARKERS, '')));
  if (marker) {
    const g = marker.groups ?? {};
    seasonNumber = numberOf(g.s1 ?? g.s2 ?? g.s3 ?? g.s4);
    episodeNumber = numberOf(g.e1 ?? g.e2 ?? g.e3 ?? g.e4 ?? g.e5);
    const after = work.slice(marker.index! + marker[0].length).replace(MARKERS, ' ').replace(LEADING_PUNCTUATION, '').trim();
    if (/\p{L}/u.test(after)) {
      titleEpisode ??= after;
      episodeTitle ??= after;
    }
    work = work.slice(0, marker.index);
    if (evidenceSource !== 'xmltv_subtitle') [evidenceSource, confidence] = ['title_marker', 'high'];
    episode = true;
  } else if (!/[\p{L}\p{N}]/u.test(work.replace(MARKERS, '').replace(/[\s·•:,;\-–—()/]+/gu, ''))) {
    return { originalTitle, proposedWorkTitle: null, normalizedWorkKey: null, seasonNumber, episodeNumber, evidenceSource, confidence, resolutionState: markers.length ? 'no_work' : 'unkeyable' };
  } else {
    const paren = work.match(PAREN_EPISODE);
    if (paren?.index) {
      episodeNumber = numberOf(paren[1]);
      work = work.slice(0, paren.index);
      if (!episode) [evidenceSource, confidence] = ['title_marker', 'medium'];
      episode = true;
    }
  }
  work = work.replace(TRAILING_PUNCTUATION, '').trim();
  // Feeds repeat the episode name in the title: "UFO Witness: Órbitas e insectoides T2 E2 · Órbitas
  // e insectoides", "¿Cómo lo hacen?: Ensalada… · ¿Cómo lo hacen?: Ensalada…". Only that repetition
  // drops a colon segment; a colon on its own stays part of the title.
  const segments = work.split(/:\s+/u);
  const named = titleEpisode ?? episodeTitle;
  if (episode && named && segments.length > 1) {
    const tail = segments[segments.length - 1];
    const last = workKey(tail);
    const ep = workKey(named);
    if (last && ep && (ep === last || ep.endsWith(`_${last}`) || paraphrases(tail, named))) work = segments.slice(0, -1).join(': ');
    else if (segments[0] && workKey(named.split(/:\s+/u)[0]) === workKey(segments[0])) work = segments[0];
  }

  const normalizedWorkKey = workKey(work);
  const parsed: ParsedEpgTitle = {
    originalTitle,
    proposedWorkTitle: normalizedWorkKey ? work : null,
    normalizedWorkKey,
    ...(episodeTitle ? { episodeTitle } : {}),
    ...(seasonNumber !== undefined ? { seasonNumber } : {}),
    ...(episodeNumber !== undefined ? { episodeNumber } : {}),
    evidenceSource,
    confidence,
    resolutionState: !normalizedWorkKey ? 'unkeyable' : episode ? 'episode' : 'work',
  };
  if (!normalizedWorkKey) return parsed;
  // Not `isGenericMovieTitle`: its "cine + up to 4 words" rule suppresses movie slots in the grid but
  // would reject named programmes such as "Cine de barrio". A container that carries a film
  // ("Cine: Matrix") is still rejected: the film is the identity, matched by its own title.
  if (
    resolveProgramDisplayTitle(originalTitle) !== originalTitle ||
    // A rating line in the title field ("★6.8/10", seen in the 2D-2 replay) is not a work.
    RATING_LINE.test(originalTitle) ||
    GENERIC_TITLE_KEYS.has(normalizedWorkKey) ||
    PROMO_PREFIX.test(normalizedWorkKey)
  ) {
    return { ...parsed, resolutionState: 'generic' };
  }
  const weak = episode ? null : work.match(WEAK_SEPARATOR);
  // The work the separator would give is parsed like any title, so its key is the one matching will
  // compute from it ("Rosario (76) - X" -> "Rosario"), and a slot word on the left ("Cine - X") is no work.
  const left = weak?.index ? parseEpgTitle(work.slice(0, weak.index)) : null;
  if (weak && left?.normalizedWorkKey && (left.resolutionState === 'work' || left.resolutionState === 'episode') && left.normalizedWorkKey !== normalizedWorkKey) {
    const right = work.slice(weak.index! + weak[0].length).trim();
    const uncertainSplit = { workTitle: left.proposedWorkTitle as string, workKey: left.normalizedWorkKey, episodeTitle: right };
    return { ...parsed, confidence: 'low', resolutionState: 'uncertain', uncertainSplit };
  }
  return parsed;
}

/** The identity key of a title: its work's key. An `uncertain` title keeps its whole text; slots keep theirs (rejected by `isGenericContentTitle`). */
export function titleIdentityKey(title: string | null | undefined): string | null {
  return parseEpgTitle(title).normalizedWorkKey;
}

export function isGenericContentTitle(title: string | null | undefined): boolean {
  return parseEpgTitle(title).resolutionState === 'generic';
}

const RATING_LINE = /^[^\p{L}\d]*\d+(?:[.,]\d+)?\s*\/\s*10$/u;

/** Most specific reliable context available: TMDB work, then release year, else none (`*`). */
export function titleDiscriminator(input: { tmdb?: TmdbRef; year?: number }): string {
  if (input.tmdb) return `tmdb:${input.tmdb.type}:${input.tmdb.id}`;
  if (input.year) return `year:${input.year}`;
  return '*';
}

export function titleKeyId(key: string, kind: ContentKind, discriminator: string): string {
  return `${key}|${kind}|${discriminator}`;
}

export interface TitleKeyRow {
  id: string;
  key: string;
  kind: ContentKind;
  discriminator: string;
  year?: number;
  entityId?: string;
  state: TitleKeyState;
  method: MatchMethod;
  confidence: number;
  candidates?: string[];
  reason?: string;
}

export interface TitleMatchInput {
  title: string;
  kind: ContentKind;
  tmdb?: TmdbRef;
  year?: number;
  method: MatchMethod;
  confidence: number;
}

export type TitleMatchDecision =
  | { decision: 'rejected'; reason: 'unkeyable_title' | 'generic_title' }
  /** An existing bound row: sticky, never re-pointed by ingestion. */
  | { decision: 'matched'; row: TitleKeyRow }
  /** An existing ambiguous / manual_review row: stays unbound until a person reviews it. */
  | { decision: 'held'; row: TitleKeyRow }
  /** A new row bound to an existing entity. */
  | { decision: 'bind'; row: TitleKeyRow }
  /** A new row for a new entity; the caller creates the entity and fills `row.entityId`. */
  | { decision: 'create'; row: TitleKeyRow }
  /** A new unbound row for the review queue. */
  | { decision: 'review'; row: TitleKeyRow };

/** Minimum confidence for a TMDB-id link to count as verified (§E.2 exact-title rule). */
export const VERIFIED_CONFIDENCE = 0.95;
/** Ceiling for a title-only binding: provisional, upgradeable only by review. */
export const TITLE_ONLY_CONFIDENCE = 0.8;

/**
 * Decide what an ingestion-time title means, given every stored row with the same key and the
 * live entity that already owns the input's TMDB id (if any). Never mutates a stored row: a
 * verified mapping can only change through `review`, so a later low-confidence match can't
 * overwrite it.
 */
export function decideTitleMatch(
  input: TitleMatchInput,
  rows: readonly TitleKeyRow[],
  tmdbEntity?: { entityId: string; kind: ContentKind } | null
): TitleMatchDecision {
  const key = titleIdentityKey(input.title);
  if (!key) return { decision: 'rejected', reason: 'unkeyable_title' };
  if (isGenericContentTitle(input.title)) return { decision: 'rejected', reason: 'generic_title' };

  const discriminator = titleDiscriminator(input);
  const id = titleKeyId(key, input.kind, discriminator);
  const exact = rows.find((row) => row.id === id);
  if (exact) {
    const bound = exact.entityId && (exact.state === 'verified' || exact.state === 'candidate');
    return bound ? { decision: 'matched', row: exact } : { decision: 'held', row: exact };
  }

  const base = { id, key, kind: input.kind, discriminator, year: input.year, method: input.method };
  const confidence = Math.max(0, Math.min(1, input.confidence));

  const review = (state: 'ambiguous' | 'manual_review', reason: string, candidates: string[], conf = confidence) =>
    ({ decision: 'review', row: { ...base, state, confidence: conf, candidates, reason } }) as const;
  // Bound rows that could be the same work: same kind (any when ours is unknown).
  const sameKind = rows.filter(
    (row) =>
      row.entityId &&
      (row.state === 'verified' || row.state === 'candidate') &&
      (input.kind === 'unknown' || row.kind === input.kind)
  );
  // Year is evidence, not authority: only years more than one apart tell two works apart.
  const yearsApart = (row: TitleKeyRow) => Boolean(input.year && row.year && Math.abs(row.year - input.year) > 1);
  const entityIdsOf = (list: TitleKeyRow[]) => [...new Set(list.map((row) => row.entityId as string))];

  if (input.tmdb) {
    if (TMDB_TYPE_BY_KIND[input.kind] && TMDB_TYPE_BY_KIND[input.kind] !== input.tmdb.type) {
      return review('manual_review', 'tmdb_type_mismatch', tmdbEntity ? [tmdbEntity.entityId] : []);
    }
    const strong = input.method === 'manual' || confidence >= VERIFIED_CONFIDENCE;
    const state: TitleKeyState = strong ? 'verified' : 'candidate';
    if (tmdbEntity) {
      if (input.kind !== 'unknown' && tmdbEntity.kind !== input.kind) {
        return review('manual_review', 'kind_conflict', [tmdbEntity.entityId]);
      }
      return { decision: 'bind', row: { ...base, state, confidence, entityId: tmdbEntity.entityId } };
    }
    // The same title and kind already bound to another TMDB work, with no year to separate them.
    const rivals = sameKind.filter((row) => row.discriminator.startsWith('tmdb:') && !yearsApart(row));
    if (rivals.length) return review('manual_review', 'tmdb_conflict', entityIdsOf(rivals));
    return { decision: 'create', row: { ...base, state, confidence } };
  }

  // Without a TMDB id: a provisional candidate at most. Only a same-year (or yearless) row binds;
  // an adjacent year (±1, §E.2) only nominates for review.
  const titleOnly = Math.min(confidence, TITLE_ONLY_CONFIDENCE);
  const entityIds = entityIdsOf(sameKind.filter((row) => !(input.year && row.year && row.year !== input.year)));
  const adjacent = entityIdsOf(sameKind.filter((row) => !yearsApart(row))).filter((id) => !entityIds.includes(id));
  if (entityIds.length === 0 && adjacent.length === 0) {
    return { decision: 'create', row: { ...base, state: 'candidate', confidence: titleOnly } };
  }
  if (entityIds.length === 0) return review('ambiguous', 'year_adjacent', adjacent, titleOnly);
  if (entityIds.length === 1 && adjacent.length === 0) {
    return {
      decision: 'bind',
      row: {
        ...base,
        method: input.year ? 'title_year' : 'title_kind',
        state: 'candidate',
        confidence: titleOnly,
        entityId: entityIds[0],
      },
    };
  }
  return review('ambiguous', 'several_entities', [...entityIds, ...adjacent], titleOnly);
}

/** A TMDB ref must be typed for the kind it identifies; `event` and `unknown` take either. */
const TMDB_TYPE_BY_KIND: Partial<Record<ContentKind, TmdbRef['type']>> = { movie: 'movie', series: 'tv', show: 'tv' };

/**
 * Indexing needs an active entity whose identity is manual or a reliable TMDB link. Title-only
 * and low-confidence matches stay `noindex` until a person verifies them.
 */
export function mayBeIndexable(entity: { status: ContentStatus; matching?: { method: MatchMethod; confidence: number } }): boolean {
  const m = entity.matching;
  if (entity.status !== 'active' || !m) return false;
  return m.method === 'manual' || ((m.method === 'tmdb_id' || m.method === 'tmdb_exact') && m.confidence >= VERIFIED_CONFIDENCE);
}

// ---------------------------------------------------------------------------------------------
// Ingestion (2D-2): kind classification and slug allocation for new entities.

/**
 * Kind from the strongest evidence available (2C §E.4). A confirmed TMDB link decides film vs TV;
 * without one only the EPG category speaks, and categories that mix films, series and shows
 * (kids, documentaries, "Otros") stay `unknown`, which ingestion never turns into an entity.
 * `editorialCategory` comes from `inferEditorialCategory`, which also reads the title, so a named
 * film slot ("Cine de barrio", "Historia de nuestro cine") lands in `Cine`: the title decides.
 */
export function classifyContentKind(input: {
  title: string;
  editorialCategory?: string | null;
  sportFacet?: string | null;
  tmdbType?: TmdbRef['type'];
}): ContentKind | 'sport' {
  if (input.sportFacet) return 'sport';
  const category = String(input.editorialCategory || '').trim().toLowerCase();
  if (input.tmdbType === 'movie') return 'movie';
  if (input.tmdbType === 'tv') return category === 'series' || category === 'infantil' ? 'series' : 'show';
  if (category === 'series') return 'series';
  if (category === 'cine') return /(^|_)cine(_|$)/.test(titleIdentityKey(input.title) || '') ? 'show' : 'movie';
  if (SHOW_CATEGORIES.has(category)) return 'show';
  return 'unknown';
}

/** EPG categories that only hold programmes (studio, music, culture, worship), never films or fiction. */
const SHOW_CATEGORIES = new Set([
  'noticias', 'entretenimiento', 'deportes', 'música', 'musica', 'culture', 'cultural/educativo', 'religión', 'religion',
  'decoración', 'decoracion',
]);

const EXTRA_LETTERS: Record<string, string> = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd', þ: 'th', ð: 'd' };

/**
 * New-allocation slug (2C §F.2/§F.3): accents folded, apostrophes and dots joined ("Grey's" ->
 * greys, "C.S.I. Miami" -> csi-miami),
 * season / episode / edition markers dropped through the same rules as the title key. Null when
 * the title has no Latin identity, is only digits, or is a reserved slot word.
 */
export function slugifyEntityTitle(title: string | null | undefined): string | null {
  const prepared = String(title || '')
    .toLowerCase()
    .replace(/['’`´.]/g, '')
    .replace(/[øæœßłđþð]/g, (c) => EXTRA_LETTERS[c]);
  const key = titleIdentityKey(prepared);
  if (!key) return null;
  let slug = key.replace(/_/g, '-');
  if (slug.length > MAX_SLUG_LENGTH) {
    const cut = slug.slice(0, MAX_SLUG_LENGTH + 1);
    slug = cut.includes('-') ? cut.replace(/-[^-]*$/, '') : slug.slice(0, MAX_SLUG_LENGTH);
  }
  if (!slug || /^[\d-]+$/.test(slug) || RESERVED_SLUGS.has(slug)) return null;
  return slug;
}

/**
 * Canonical path candidates, most preferred first. The only disambiguator is the release year,
 * and only when the caller has one from real evidence (TMDB or the EPG year of a film). There is
 * no counter fallback: when every candidate is taken the entity stays pathless for review.
 */
export function entityCandidatePaths(kind: ContentKind, title: string, year?: number): string[] {
  const slug = slugifyEntityTitle(title);
  if (!slug || kind === 'unknown') return [];
  const prefix = KIND_PATH_PREFIX[kind];
  return [`${prefix}/${slug}`, ...(year ? [`${prefix}/${slug}-${year}`] : [])].filter(
    (path) => normalizeContentPath(path).ok
  );
}

/**
 * The slugs the legacy catalogue pages answered for a title: `CatalogService.slugify` (programmes,
 * drops accented letters) and `slugifyTitle` (films/series, folds them). Used only to recognise
 * historic URLs, never to allocate. Kept in step with CatalogService by a parity test.
 */
export function legacyCatalogSlugs(title: string | null | undefined): string[] {
  const legacy = (text: string) =>
    text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '') ||
    'sin-titulo';
  const raw = String(title || '');
  if (!raw.trim()) return ['sin-titulo'];
  return [...new Set([legacy(raw), legacy(raw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))])];
}

/**
 * `decideTitleMatch` for ingestion: an `unknown` kind never creates or binds an entity. The result
 * is a `manual_review` decision (`unknown_kind`) carrying the same-key entities as evidence; the
 * ingestion reports it but does not store it (about half of a day's titles, 2D-2 §F), so the title
 * stays unresolved until stronger evidence arrives under a known kind.
 */
export function decideIngestionMatch(
  input: TitleMatchInput,
  rows: readonly TitleKeyRow[],
  tmdbEntity?: { entityId: string; kind: ContentKind } | null,
  /** `crossKind`: the same run saw this work under another known kind (ingestion's set-based check). */
  context: { crossKind?: boolean } = {}
): TitleMatchDecision {
  const decision = decideTitleMatch(input, rows, tmdbEntity);
  if (decision.decision !== 'create' && decision.decision !== 'bind') return decision;
  const { entityId, ...row } = decision.row;
  const toReview = (reason: string, candidates = entityId ? [entityId] : []) =>
    ({ decision: 'review', row: { ...row, state: 'manual_review', reason, candidates } }) as const;
  if (input.kind === 'unknown') return toReview('unknown_kind');
  // A reviewer rejected this title for this kind without a discriminator ("any work called X"): a
  // later sighting with a year or a TMDB id goes back to review instead of silently recreating it.
  if (rows.some((r) => r.state === 'rejected' && r.kind === input.kind && r.discriminator === '*')) return toReview('rejected_title');
  if (decision.decision !== 'create') return decision;
  // Cross-kind (2D-2E §5): a stored entity of another known kind with this title is the same work
  // unless both sides name different TMDB works. A matching title is never enough to merge, nor to
  // create a twin with a second path: a person decides, and the stored identity stays as it is.
  const own = input.tmdb ? `tmdb:${input.tmdb.type}:${input.tmdb.id}` : null;
  const rivals = rows.filter(
    (r) =>
      r.entityId &&
      (r.state === 'verified' || r.state === 'candidate') &&
      r.kind !== 'unknown' &&
      r.kind !== input.kind &&
      !(own && r.discriminator.startsWith('tmdb:') && r.discriminator !== own)
  );
  if (context.crossKind || rivals.length) return toReview('cross_kind_conflict', [...new Set(rivals.map((r) => r.entityId as string))]);
  return decision;
}

// ---------------------------------------------------------------------------------------------
// Canonical path ownership (2D-2 hardening). A path is offered to an entity only when no other
// work can claim it on the evidence: legacy titles (brands, catalogue) and the 2C URL inventory.
// The decision depends on the entity and that evidence only, never on which entity came first, so
// reordered batches and parallel jobs allocate the same paths.

/** A work that a legacy page could answer a slug with: its title keys, and its TMDB identity if any. */
export interface HistoricWork {
  keys: ReadonlySet<string>;
  tmdb?: TmdbRef;
  year?: number;
}

export type PathBlock =
  /** No valid slug: non-Latin, digits only ("300", "9-1-1"), empty. */
  | 'unsupported_slug'
  | 'reserved_slug'
  /** The 2C plan leaves this legacy URL's prefix to review. */
  | 'inventory_review'
  /** A legacy title with another key answers this slug ("No" vs "Noé"). */
  | 'historic_conflict'
  /** Several TMDB works answer this slug (remakes, homonyms). */
  | 'historic_ambiguous'
  /** Ownership can't be proven: a title-only film's bare slug, or a TMDB work the evidence doesn't name. */
  | 'historic_unverified';

/**
 * 2C §G.3 rule 4 (docs/seo/phase-2c/legacy-url-mapping.csv, "KEEP or 301"): the same slug answered
 * 200 under two prefixes, and which one stays depends on the open series-prefix decision (2C §P.2).
 * The probe's other actions need no entry: 2D-2 slugs never produce its 410 or season/episode
 * paths, and where a 2D-2 slug equals an "accent-damaged" path (rizzoli-isles) it is that work's URL.
 */
const LEGACY_REVIEW_PATHS: ReadonlySet<string> = new Set([
  '/programas/la-promesa', '/series/la-promesa', '/programas/modern-family', '/series/modern-family',
]);

/** TMDB type a legacy page under each prefix resolved (CatalogService: films, and TV for series and programmes). */
const TMDB_TYPE_BY_PREFIX: Record<string, TmdbRef['type']> = { '/peliculas': 'movie', '/series': 'tv', '/programas': 'tv' };

/**
 * Candidate paths an entity may take, most preferred first, with the reason for each one refused
 * and the allowed ones a legacy title already answered (`historic`: verified historical owner).
 * The bare slug needs: no other key among its legacy titles; for a TMDB work, that it is the only
 * TMDB work of its type answering the slug; for a title-only work, that no TMDB work answers it,
 * and never for a title-only film (a remake can't be ruled out). The year path applies the same
 * test to the works of that year. `ownersOf` must cover every slug of `entityCandidatePaths`.
 */
export function planCanonicalPaths(
  entity: { kind: ContentKind; title: string; year?: number; externalIds?: { tmdb?: TmdbRef } },
  ownersOf: (slug: string) => readonly HistoricWork[]
): { paths: string[]; blocked: PathBlock[]; historic: string[] } {
  const key = titleIdentityKey(entity.title);
  const candidates = entityCandidatePaths(entity.kind, entity.title, entity.year);
  if (!candidates.length) {
    const reserved = entity.kind !== 'unknown' && key !== null && RESERVED_SLUGS.has(key.replace(/_/g, '-'));
    return { paths: [], blocked: [reserved ? 'reserved_slug' : 'unsupported_slug'], historic: [] };
  }
  const own = entity.externalIds?.tmdb;
  const prefix = KIND_PATH_PREFIX[entity.kind];
  const bareSlug = candidates[0].slice(prefix.length + 1);
  const out = { paths: [] as string[], blocked: [] as PathBlock[], historic: [] as string[] };
  for (const path of candidates) {
    const bare = path === candidates[0];
    const legacy = ownersOf(path.slice(prefix.length + 1));
    const works = new Set(
      ownersOf(bareSlug)
        .filter((w) => w.tmdb?.type === TMDB_TYPE_BY_PREFIX[prefix] && (bare || w.year === entity.year))
        .map((w) => w.tmdb?.id)
    );
    const unverified = own ? !(works.size === 1 && works.has(own.id)) : works.size > 0 || (bare && entity.kind === 'movie');
    const reason: PathBlock | null = LEGACY_REVIEW_PATHS.has(path)
        ? 'inventory_review'
        : legacy.some((w) => !key || !w.keys.has(key))
          ? 'historic_conflict'
          : works.size > 1
            ? 'historic_ambiguous'
            : unverified
              ? 'historic_unverified'
              : null;
    if (reason) out.blocked.push(reason);
    else {
      out.paths.push(path);
      if (legacy.length) out.historic.push(path);
    }
  }
  return out;
}

/** Every slug `planCanonicalPaths` reads for an entity. */
export function plannedSlugs(entity: { kind: ContentKind; title: string; year?: number }): string[] {
  return entityCandidatePaths(entity.kind, entity.title, entity.year).map((path) => path.slice(path.lastIndexOf('/') + 1));
}
