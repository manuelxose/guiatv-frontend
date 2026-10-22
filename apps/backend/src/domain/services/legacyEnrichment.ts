/**
 * Phase 3E: what a legacy catalogue page (`/peliculas|series|programas/:slug`) may gain from the media catalogue and
 * the EPG read model, decided without any entity record. Pure and deterministic; the I/O lives in `LegacyEnrichmentService`.
 *
 * The page is only ever *added to*: a field the legacy payload already carries is never replaced, and identity-specific
 * sections (metadata, broadcasts) are attached only when the catalogue row is provably the page's work. A page that
 * fails any check is served exactly as before.
 */
import { titleIdentityKey } from './contentIdentity';
import { sourceKeys, type EnrichmentSource } from './entityEnrichment';

/** What the legacy payload says about itself (a projection of `CatalogDetailDTO`). */
export interface LegacyPage {
  source: 'tmdb' | 'program';
  tmdbId: number;
  tmdbType: 'movie' | 'tv';
  title: string;
  releaseYear?: number;
  /** The path slug that resolved to this page equals the page's own slug (false = TMDB "first result" fallback); undefined = requested by id. */
  slugBound?: boolean;
  genres: string[];
  durationMinutes?: number;
}

export const LEGACY_REFUSALS = [
  'source_missing', 'source_not_enriched', 'tmdb_type_mismatch', 'tmdb_id_mismatch', 'title_mismatch', 'year_mismatch', 'slug_unbound',
] as const;
export type LegacyRefusal = (typeof LEGACY_REFUSALS)[number];

/**
 * Why the catalogue row is not provably the page's work; empty = it is. Title similarity alone never decides: the TMDB
 * type and id must be equal, the row must come from a full TMDB fetch, and, where both years are known, agree within ±1.
 * A page the slug did not name (TMDB "first result" fallback) is refused: nothing but the search ranking tied it to the row.
 */
export function legacyBindingRefusals(page: LegacyPage, row: EnrichmentSource | null): LegacyRefusal[] {
  if (!row) return ['source_missing'];
  const out: LegacyRefusal[] = [];
  if (!row.lastEnrichedAt) out.push('source_not_enriched');
  if (row.tmdb.type !== page.tmdbType) out.push('tmdb_type_mismatch');
  if (row.tmdb.id !== page.tmdbId) out.push('tmdb_id_mismatch');
  const key = titleIdentityKey(page.title);
  if (!key || !sourceKeys(row).has(key)) out.push('title_mismatch');
  const pageYear = page.releaseYear;
  if (pageYear !== undefined && row.year !== undefined && Math.abs(pageYear - row.year) > 1) out.push('year_mismatch');
  if (page.slugBound === false) out.push('slug_unbound');
  return out;
}

export interface LegacyMetadataGaps {
  originalTitle?: string;
  runtimeMinutes?: number;
  genres?: string[];
}

/** The verified fields the legacy payload lacks. Synopsis, cast, artwork and anything already present stay the page's own. */
export function legacyMetadataGaps(page: LegacyPage, row: EnrichmentSource): LegacyMetadataGaps {
  const gaps: LegacyMetadataGaps = {};
  const original = (row.originalTitle ?? '').replace(/\s+/g, ' ').trim();
  if (original && titleIdentityKey(original) !== titleIdentityKey(page.title)) gaps.originalTitle = original.slice(0, 300);
  // The legacy `durationMinutes` of a programme page is the airing's length; a film's runtime is a different fact and is only given where none exists.
  if (page.durationMinutes === undefined && Number.isInteger(row.runtimeMinutes) && row.runtimeMinutes! > 0 && row.runtimeMinutes! < 1000) gaps.runtimeMinutes = row.runtimeMinutes;
  if (!page.genres.length) {
    const genres = [...new Set((row.genres ?? []).map((g) => g.replace(/\s+/g, ' ').trim()).filter(Boolean))];
    if (genres.length) gaps.genres = genres;
  }
  return gaps;
}
