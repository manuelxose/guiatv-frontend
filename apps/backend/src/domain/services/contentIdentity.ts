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
const EPISODE_MARKER = /_(capitulo|cap|episodio|ep|chapter|parte)_\d+$/;
/** Bare slot words only. Named programmes built on them ("Cine de barrio") are real entities. */
const GENERIC_TITLE_KEYS = new Set([
  ...[...RESERVED_SLUGS].map((slug) => slug.replace(/-/g, '_')),
  'movie', 'film', 'cinema', 'estreno', 'blockbuster', 'taquillazo', 'peliculon',
]);

/** `buildProgramBrandKey` (unchanged, so stored brand keys stay reusable) minus a trailing
 * "capítulo N" style episode marker. Null when the title has no usable Latin identity. */
export function titleIdentityKey(title: string | null | undefined): string | null {
  const brandKey = buildProgramBrandKey(title);
  if (brandKey === 'unknown_brand') return null;
  const key = brandKey.replace(EPISODE_MARKER, '');
  // Non-Latin titles normalise to digits or nothing ("捕风追影2" -> "2"); that key would merge
  // unrelated works, so it is not a key at all.
  if (/\p{L}/u.test(String(title)) && !/[a-z]/.test(key)) return null;
  // EPG feeds sometimes glue the synopsis onto the title (seen in real data, 400+ characters):
  // that is not a title, and its row id would exceed the 400-character limit.
  if (key.length > MAX_TITLE_KEY_LENGTH) return null;
  return key || null;
}

/**
 * Not `isGenericMovieTitle`: its "cine + up to 4 words" rule suppresses movie slots in the grid but
 * would reject named programmes such as "Cine de barrio". A container that carries a film
 * ("Cine: Matrix") is still rejected: the film is the identity, matched by its own title.
 */
export function isGenericContentTitle(title: string | null | undefined): boolean {
  if (resolveProgramDisplayTitle(title) !== String(title || '').trim()) return true;
  // A rating line in the title field ("★6.8/10", seen in the 2D-2 replay) is not a work.
  if (RATING_LINE.test(String(title || '').trim())) return true;
  const key = titleIdentityKey(title);
  return key !== null && GENERIC_TITLE_KEYS.has(key);
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
  tmdbEntity?: { entityId: string; kind: ContentKind } | null
): TitleMatchDecision {
  const decision = decideTitleMatch(input, rows, tmdbEntity);
  if (decision.decision !== 'create' && decision.decision !== 'bind') return decision;
  const { entityId, ...row } = decision.row;
  const toReview = (reason: string) =>
    ({ decision: 'review', row: { ...row, state: 'manual_review', reason, candidates: entityId ? [entityId] : [] } }) as const;
  if (input.kind === 'unknown') return toReview('unknown_kind');
  // A reviewer rejected this title for this kind without a discriminator ("any work called X"): a
  // later sighting with a year or a TMDB id goes back to review instead of silently recreating it.
  if (rows.some((r) => r.state === 'rejected' && r.kind === input.kind && r.discriminator === '*')) return toReview('rejected_title');
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
