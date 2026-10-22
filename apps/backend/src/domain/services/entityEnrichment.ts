/**
 * Phase 3D: source-backed metadata for an entity. Pure and deterministic; the I/O lives in
 * `ContentEntityEnrichment`. Admission stores identity only (title, year, TMDB id, path); this copies
 * what the existing media catalogue already holds from TMDB, after proving the catalogue row is the
 * same work the entity is bound to.
 *
 * Nothing is invented: a field the source does not hold stays absent, a value a person wrote
 * (`manual` provenance) is never overwritten, and an ambiguous match is refused, not guessed.
 */
import { canonicalJson, sha256 } from './contentCertification';
import { titleIdentityKey, type TmdbRef } from './contentIdentity';
import type { ContentEntityRecord, ProvenancedValue } from '@/domain/repositories/IContentIdentityRepository';

/** Bump when the copied fields or their meaning change: every enrichment is then planned as a refresh. */
export const ENRICHMENT_VERSION = 1;
/** A copy older than this is re-checked (and its `checkedAt` renewed) even if the source did not change. */
export const ENRICHMENT_MAX_AGE_DAYS = 30;
/** TMDB-relative image path as the catalogue stores it ("/abc123.jpg"); anything else is not a TMDB image. */
export const TMDB_IMAGE_PATH = /^\/[A-Za-z0-9_-]{5,64}\.(?:jpg|jpeg|png|webp)$/;
export const TMDB_ATTRIBUTION = 'Datos e imágenes de TMDB. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.';

/** What a TMDB-sourced catalogue row says about a work (the shape the enrichment needs, not the whole row). */
export interface EnrichmentSource {
  mediaId: string;
  tmdb: TmdbRef;
  /** Informational: the catalogue's last writer, not the provenance of the values (see `enrichmentRefusals`). */
  metadataSource: 'tmdb' | 'epg' | 'manual' | 'backfill';
  /** When the row was last filled from a full TMDB detail fetch; absent = lightweight EPG/search data. */
  lastEnrichedAt?: Date;
  title: string;
  originalTitle?: string;
  year?: number;
  synopsis?: string;
  genres: string[];
  runtimeMinutes?: number;
  posterPath?: string;
  backdropPath?: string;
  directors: string[];
  cast: Array<{ name: string; character?: string }>;
}

export interface EntityCredits { directors: string[]; cast: Array<{ name: string; character?: string }> }
export interface EntityImages { posterPath?: string; backdropPath?: string }

/** The fields this module manages; everything else on the entity is untouched. */
export interface EnrichedFields {
  originalTitle?: string;
  synopsis?: string;
  genres?: string[];
  runtimeMinutes?: number;
  images?: EntityImages;
  credits?: EntityCredits;
}

export interface EnrichmentStamp {
  version: number;
  mediaId: string;
  tmdb: TmdbRef;
  /** Digest of the copied fields: equal digest + current version = nothing to write. */
  hash: string;
  /** When this copy was validated against the catalogue. */
  checkedAt: Date;
  /** When the source itself last came from TMDB (the freshness a reader can trust). */
  sourceUpdatedAt?: Date;
}

export const REFUSALS = [
  'unsupported_kind', 'no_tmdb_ref', 'source_missing', 'source_not_enriched', 'tmdb_type_mismatch', 'tmdb_id_mismatch',
  'title_mismatch', 'year_unverifiable', 'year_mismatch', 'entity_not_live',
] as const;
export type EnrichmentRefusal = (typeof REFUSALS)[number];

export type EnrichmentPlan =
  | { outcome: 'refused'; reasons: EnrichmentRefusal[] }
  | { outcome: 'unchanged'; hash: string }
  | { outcome: 'enrich' | 'refresh'; hash: string; fields: EnrichedFields; stamp: EnrichmentStamp; warnings: string[]; kept: string[] };

const clean = (text: string | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

/** The title keys a catalogue row answers to: its localised and its original title. */
const sourceKeys = (s: EnrichmentSource) => new Set([titleIdentityKey(s.title), titleIdentityKey(s.originalTitle)].filter((k): k is string => Boolean(k)));

/** Why this catalogue row is not provably the entity's work; empty = it is. Never decides from title similarity alone. */
export function enrichmentRefusals(entity: ContentEntityRecord, source: EnrichmentSource | null): EnrichmentRefusal[] {
  const out: EnrichmentRefusal[] = [];
  if (entity.status !== 'candidate' && entity.status !== 'active') out.push('entity_not_live');
  if (entity.kind !== 'movie') out.push('unsupported_kind');
  const ref = entity.externalIds?.tmdb;
  if (!ref) out.push('no_tmdb_ref');
  if (!source) out.push('source_missing');
  if (out.length || !source || !ref) return out;

  // `metadataSource` is the catalogue's *last writer* (an EPG search match flips it to `epg` over rich TMDB data), so it
  // proves nothing. `lastEnrichedAt` is set only by a full TMDB detail fetch: the row has genres, runtime and credits.
  if (!source.lastEnrichedAt) out.push('source_not_enriched');
  if (source.tmdb.type !== ref.type) out.push('tmdb_type_mismatch');
  if (source.tmdb.id !== ref.id) out.push('tmdb_id_mismatch');
  const key = titleIdentityKey(entity.title);
  if (!key || !sourceKeys(source).has(key)) out.push('title_mismatch');
  // A film's year tells it from a remake: both years must exist and agree within the feed's ±1 tolerance.
  if (entity.year === undefined || source.year === undefined) out.push('year_unverifiable');
  else if (Math.abs(entity.year - source.year) > 1) out.push('year_mismatch');
  return out;
}

const uniq = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];

/** The copyable fields of a source that passed `enrichmentRefusals`. Absent stays absent. */
export function fieldsFromSource(source: EnrichmentSource): EnrichedFields {
  const fields: EnrichedFields = {};
  const original = clean(source.originalTitle);
  if (original) fields.originalTitle = original.slice(0, 300);
  const synopsis = clean(source.synopsis);
  if (synopsis) fields.synopsis = source.synopsis!.replace(/\r\n?/g, '\n').trim();
  const genres = uniq(source.genres ?? []);
  if (genres.length) fields.genres = genres;
  if (Number.isInteger(source.runtimeMinutes) && source.runtimeMinutes! > 0 && source.runtimeMinutes! < 1000) fields.runtimeMinutes = source.runtimeMinutes;
  const images: EntityImages = {};
  if (source.posterPath && TMDB_IMAGE_PATH.test(source.posterPath)) images.posterPath = source.posterPath;
  if (source.backdropPath && TMDB_IMAGE_PATH.test(source.backdropPath)) images.backdropPath = source.backdropPath;
  if (images.posterPath || images.backdropPath) fields.images = images;
  const directors = uniq(source.directors ?? []).slice(0, 5);
  const cast = (source.cast ?? []).map((c) => ({ name: clean(c.name), ...(clean(c.character) ? { character: clean(c.character) } : {}) })).filter((c) => c.name).slice(0, 10);
  if (directors.length || cast.length) fields.credits = { directors, cast };
  return fields;
}

export const enrichmentHash = (fields: EnrichedFields, mediaId: string) => sha256(canonicalJson({ v: ENRICHMENT_VERSION, mediaId, fields }));

const isManual = (value: ProvenancedValue | undefined) => value?.source === 'manual';

/**
 * What to do for one entity. `unchanged` writes nothing (same digest, current version, checked within
 * the max age); `refresh` re-writes a copy whose source or age moved; `enrich` is the first copy.
 * Fields a person wrote (`manual`) are kept and listed in `kept`.
 */
export function planEnrichment(entity: ContentEntityRecord, source: EnrichmentSource | null, now: Date, opts: { maxAgeDays?: number; force?: boolean } = {}): EnrichmentPlan {
  const reasons = enrichmentRefusals(entity, source);
  if (reasons.length || !source) return { outcome: 'refused', reasons };
  const fields = fieldsFromSource(source);
  const hash = enrichmentHash(fields, source.mediaId);
  const stamp = entity.metadata?.enrichment;
  const maxAgeMs = (opts.maxAgeDays ?? ENRICHMENT_MAX_AGE_DAYS) * 86_400_000;
  const current = stamp && stamp.version === ENRICHMENT_VERSION && stamp.hash === hash;
  if (current && !opts.force && now.getTime() - new Date(stamp.checkedAt).getTime() < maxAgeMs) return { outcome: 'unchanged', hash };

  const kept: string[] = [];
  const m = entity.metadata ?? {};
  if (isManual(m.synopsis)) kept.push('synopsis');
  if (isManual(m.genres)) kept.push('genres');
  if (isManual(m.images)) kept.push('images');
  if (isManual(m.runtimeMinutes)) kept.push('runtimeMinutes');
  if (isManual(m.credits)) kept.push('credits');

  const warnings: string[] = [];
  if (!fields.synopsis) warnings.push('source_has_no_synopsis');
  if (!fields.genres) warnings.push('source_has_no_genres');
  if (fields.runtimeMinutes === undefined) warnings.push('source_has_no_runtime');
  if (!fields.images?.posterPath) warnings.push('source_has_no_poster');
  if (entity.originalTitle && fields.originalTitle && entity.originalTitle !== fields.originalTitle) warnings.push('original_title_differs_from_entity');
  const age = source.lastEnrichedAt ? now.getTime() - source.lastEnrichedAt.getTime() : Infinity;
  if (age > maxAgeMs) warnings.push(`source_older_than_${opts.maxAgeDays ?? ENRICHMENT_MAX_AGE_DAYS}_days`);

  return {
    outcome: stamp ? 'refresh' : 'enrich', hash, fields, kept, warnings,
    stamp: { version: ENRICHMENT_VERSION, mediaId: source.mediaId, tmdb: source.tmdb, hash, checkedAt: now, sourceUpdatedAt: source.lastEnrichedAt },
  };
}

/** The entity's `metadata` after applying a plan: managed fields replaced unless `manual`, everything else kept. */
export function applyPlanToMetadata(current: ContentEntityRecord['metadata'] | undefined, plan: Extract<EnrichmentPlan, { fields: EnrichedFields }>): ContentEntityRecord['metadata'] {
  const at = plan.stamp.sourceUpdatedAt ?? plan.stamp.checkedAt;
  const next: ContentEntityRecord['metadata'] = { ...(current ?? {}) };
  const put = <K extends 'synopsis' | 'genres' | 'images' | 'runtimeMinutes' | 'credits'>(key: K, value: unknown) => {
    if (isManual(next[key] as ProvenancedValue | undefined)) return;
    if (value === undefined) delete next[key];
    else (next as Record<string, unknown>)[key] = { value, source: 'tmdb', updatedAt: at };
  };
  put('synopsis', plan.fields.synopsis);
  put('genres', plan.fields.genres);
  put('runtimeMinutes', plan.fields.runtimeMinutes);
  put('images', plan.fields.images);
  put('credits', plan.fields.credits);
  next.enrichment = plan.stamp;
  return next;
}

/** Withdraws every TMDB-sourced copy (invalidation): manual values stay, the stamp goes. */
export function clearEnrichedMetadata(current: ContentEntityRecord['metadata'] | undefined): ContentEntityRecord['metadata'] {
  const next: ContentEntityRecord['metadata'] = { ...(current ?? {}) };
  for (const key of ['synopsis', 'genres', 'images', 'runtimeMinutes', 'credits'] as const) {
    if (!isManual(next[key] as ProvenancedValue | undefined)) delete next[key];
  }
  delete next.enrichment;
  return next;
}
