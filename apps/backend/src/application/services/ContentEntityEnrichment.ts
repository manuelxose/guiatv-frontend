/**
 * Phase 3D: copies the existing media catalogue's TMDB metadata onto an entity after proving it is the
 * same work (`entityEnrichment.ts`). There is no second metadata system: the source is the catalogue
 * row `MediaCatalogService` already maintains, and the only network call, optional and off by default,
 * is that service's own refresh.
 *
 * Writes go through `replaceMetadata` (optimistic on `version`, identity and certification untouched), so
 * enriching a certified entity never invalidates its attestation and a lost race simply retries.
 */
import type { IContentEntityRepository, ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import type { IMediaCatalogRepository } from '@/domain/repositories/IMediaCatalogRepository';
import type { MediaCatalogEntry } from '@/domain/entities/MediaCatalogEntry';
import type { TmdbRef } from '@/domain/services/contentIdentity';
import {
  applyPlanToMetadata, clearEnrichedMetadata, planEnrichment, type EnrichmentPlan, type EnrichmentSource,
} from '@/domain/services/entityEnrichment';

export interface IEnrichmentSource {
  /** The catalogue row for a TMDB work, or null. Must not invent or merge rows. */
  load(ref: TmdbRef): Promise<EnrichmentSource | null>;
}

const yearOf = (value: string | undefined) => {
  const year = Number.parseInt(String(value ?? '').slice(0, 4), 10);
  return Number.isInteger(year) && year >= 1888 && year <= 2100 ? year : undefined;
};

/** The catalogue row as an enrichment source; null when it has no TMDB identity at all. */
export function enrichmentSourceFromCatalog(entry: MediaCatalogEntry): EnrichmentSource | null {
  if (!entry.tmdbId || !entry.tmdbType) return null;
  const tmdbGenres = entry.tmdbGenres.map((g) => g.name);
  return {
    mediaId: entry.id,
    tmdb: { type: entry.tmdbType, id: entry.tmdbId },
    metadataSource: entry.metadataSource,
    lastEnrichedAt: entry.lastEnrichedAt,
    title: entry.title,
    originalTitle: entry.originalTitle,
    year: yearOf(entry.year),
    synopsis: entry.synopsis,
    // TMDB's own genre names first; the canonical tags are the same genres mapped through our taxonomy.
    genres: tmdbGenres.length ? tmdbGenres : entry.canonicalGenres,
    runtimeMinutes: entry.runtimeMinutes,
    posterPath: entry.posterPath,
    backdropPath: entry.backdropPath,
    directors: entry.directors,
    cast: entry.castSummary.map((c) => ({ name: c.name, character: c.character })),
  };
}

/**
 * Catalogue-only by default: a read. With `refresher` (the existing `MediaCatalogService`) a row that was
 * never filled from a full TMDB detail is refreshed first, which calls TMDB and upserts the catalogue,
 * exactly what a legacy detail page view already does. Callers opt in (the CLI's `--refresh-catalogue`).
 */
export class MediaCatalogEnrichmentSource implements IEnrichmentSource {
  constructor(
    private readonly catalog: Pick<IMediaCatalogRepository, 'findByTmdbId'>,
    private readonly refresher?: { getDetail(tmdbId: number, type: 'movie' | 'tv'): Promise<unknown> }
  ) {}

  async load(ref: TmdbRef): Promise<EnrichmentSource | null> {
    let entry = await this.catalog.findByTmdbId(ref.type, ref.id);
    if ((!entry || !entry.lastEnrichedAt) && this.refresher) {
      await this.refresher.getDetail(ref.id, ref.type);
      entry = await this.catalog.findByTmdbId(ref.type, ref.id);
    }
    return entry ? enrichmentSourceFromCatalog(entry) : null;
  }
}

export type EnrichmentResult =
  | { entityId: string; outcome: 'written'; plan: Extract<EnrichmentPlan, { fields: unknown }> }
  | { entityId: string; outcome: 'would_write'; plan: Extract<EnrichmentPlan, { fields: unknown }> }
  | { entityId: string; outcome: 'unchanged'; plan: Extract<EnrichmentPlan, { outcome: 'unchanged' }> }
  | { entityId: string; outcome: 'refused'; plan: Extract<EnrichmentPlan, { outcome: 'refused' }> }
  | { entityId: string; outcome: 'concurrent_modification' | 'not_found' };

export class ContentEntityEnrichment {
  constructor(
    private readonly entities: Pick<IContentEntityRepository, 'findById' | 'replaceMetadata'>,
    private readonly source: IEnrichmentSource,
    private readonly opts: { maxAgeDays?: number } = {}
  ) {}

  /** Reads only: what `enrich` would do for this entity. */
  async plan(entity: ContentEntityRecord, now: Date, force = false): Promise<EnrichmentPlan> {
    const ref = entity.externalIds?.tmdb;
    const source = ref && entity.kind === 'movie' ? await this.source.load(ref) : null;
    return planEnrichment(entity, source, now, { maxAgeDays: this.opts.maxAgeDays, force });
  }

  /** Enriches one entity. `apply: false` is a dry run: the same plan, no write. Safe to repeat. */
  async enrich(entityId: string, now: Date, o: { apply: boolean; force?: boolean }): Promise<EnrichmentResult> {
    const entity = await this.entities.findById(entityId);
    if (!entity) return { entityId, outcome: 'not_found' };
    const plan = await this.plan(entity, now, o.force);
    if (plan.outcome === 'refused') return { entityId, outcome: 'refused', plan };
    if (plan.outcome === 'unchanged') return { entityId, outcome: 'unchanged', plan };
    if (!o.apply) return { entityId, outcome: 'would_write', plan };
    const updated = await this.entities.replaceMetadata(entityId, {
      expectedVersion: entity.version,
      metadata: applyPlanToMetadata(entity.metadata, plan),
      originalTitle: plan.fields.originalTitle,
    });
    return updated ? { entityId, outcome: 'written', plan } : { entityId, outcome: 'concurrent_modification' };
  }

  /** Withdraws the TMDB-sourced copy (manual values stay). Identity is untouched, so a page falls back to title and year. */
  async invalidate(entityId: string): Promise<'cleared' | 'nothing_to_clear' | 'concurrent_modification' | 'not_found'> {
    const entity = await this.entities.findById(entityId);
    if (!entity) return 'not_found';
    if (!entity.metadata?.enrichment) return 'nothing_to_clear';
    const updated = await this.entities.replaceMetadata(entityId, { expectedVersion: entity.version, metadata: clearEnrichedMetadata(entity.metadata) });
    return updated ? 'cleared' : 'concurrent_modification';
  }
}
