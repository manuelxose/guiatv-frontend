/**
 * Persistent content identity (Phase 2C §C–§F, implemented in 2D-1): the pure rules shared by
 * the `content_entities`, `content_slugs` and `content_title_keys` adapters. No I/O here, so the
 * identity, path and matching policies are unit-testable without a database.
 */
import { randomBytes } from 'node:crypto';
import { buildProgramBrandKey, isGenericMovieTitle } from '@/shared/utils/tvMetadata';

export const CONTENT_KINDS = ['show', 'series', 'movie', 'event', 'unknown'] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const CONTENT_STATUSES = ['candidate', 'active', 'merged', 'removed'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const SLUG_ROLES = ['canonical', 'redirect', 'gone'] as const;
export type SlugRole = (typeof SLUG_ROLES)[number];

/** verified: manual or exact TMDB id; candidate: provisional binding; ambiguous / manual_review: no binding. */
export const TITLE_KEY_STATES = ['verified', 'candidate', 'ambiguous', 'manual_review'] as const;
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

const EPISODE_MARKER = /_(capitulo|cap|episodio|ep|chapter|parte)_\d+$/;
const GENERIC_TITLE_KEYS = new Set([...RESERVED_SLUGS].map((slug) => slug.replace(/-/g, '_')));

/** `buildProgramBrandKey` (unchanged, so stored brand keys stay reusable) minus a trailing
 * "capítulo N" style episode marker. Null when the title has no usable Latin identity. */
export function titleIdentityKey(title: string | null | undefined): string | null {
  const brandKey = buildProgramBrandKey(title);
  if (brandKey === 'unknown_brand') return null;
  const key = brandKey.replace(EPISODE_MARKER, '');
  // Non-Latin titles normalise to digits or nothing ("捕风追影2" -> "2"); that key would merge
  // unrelated works, so it is not a key at all.
  if (/\p{L}/u.test(String(title)) && !/[a-z]/.test(key)) return null;
  return key || null;
}

export function isGenericContentTitle(title: string | null | undefined): boolean {
  if (isGenericMovieTitle(title)) return true;
  const key = titleIdentityKey(title);
  return key !== null && GENERIC_TITLE_KEYS.has(key);
}

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

  if (input.tmdb) {
    const strong = input.method === 'manual' || confidence >= VERIFIED_CONFIDENCE;
    const state: TitleKeyState = strong ? 'verified' : 'candidate';
    if (!tmdbEntity) return { decision: 'create', row: { ...base, state, confidence } };
    if (input.kind !== 'unknown' && tmdbEntity.kind !== input.kind) {
      return {
        decision: 'review',
        row: { ...base, state: 'manual_review', confidence, candidates: [tmdbEntity.entityId], reason: 'kind_conflict' },
      };
    }
    return { decision: 'bind', row: { ...base, state, confidence, entityId: tmdbEntity.entityId } };
  }

  // Without a TMDB id, only bound rows of the same kind (any kind when ours is unknown) and a
  // compatible year (±1, §E.2) can be the same work.
  const compatible = rows.filter(
    (row) =>
      row.entityId &&
      (row.state === 'verified' || row.state === 'candidate') &&
      (input.kind === 'unknown' || row.kind === input.kind) &&
      !(input.year && row.year && Math.abs(row.year - input.year) > 1)
  );
  const entityIds = [...new Set(compatible.map((row) => row.entityId as string))];
  const titleOnly = Math.min(confidence, TITLE_ONLY_CONFIDENCE);
  if (entityIds.length === 0) {
    return { decision: 'create', row: { ...base, state: 'candidate', confidence: titleOnly } };
  }
  if (entityIds.length === 1) {
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
  return {
    decision: 'review',
    row: { ...base, state: 'ambiguous', confidence: titleOnly, candidates: entityIds, reason: 'several_entities' },
  };
}
