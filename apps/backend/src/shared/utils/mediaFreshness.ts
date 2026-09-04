import { MediaContentType } from '@/domain/entities/MediaCatalogEntry';

/**
 * Metadata freshness rules for the local media catalog. Movies rarely change
 * once released, so they stay "fresh" far longer than series, whose season
 * count, status and rating shift while they're still airing.
 */
export const MEDIA_FRESHNESS_DAYS: Record<MediaContentType, number> = {
  movie: Number(process.env.MEDIA_CATALOG_MOVIE_FRESHNESS_DAYS) || 30,
  series: Number(process.env.MEDIA_CATALOG_SERIES_FRESHNESS_DAYS) || 3,
};

export interface FreshnessCheckInput {
  contentType: MediaContentType;
  lastEnrichedAt?: Date | null;
}

/**
 * An entry is stale when it was never fully enriched from a TMDB detail
 * fetch (lightweight EPG/search rows only carry a subset of fields), or when
 * its last enrichment is older than the content type's freshness window.
 */
export function isMediaEntryStale(entry: FreshnessCheckInput, now: Date = new Date()): boolean {
  if (!entry.lastEnrichedAt) return true;
  const freshnessDays = MEDIA_FRESHNESS_DAYS[entry.contentType] ?? 7;
  const ageMs = now.getTime() - entry.lastEnrichedAt.getTime();
  return ageMs > freshnessDays * 24 * 60 * 60 * 1000;
}
