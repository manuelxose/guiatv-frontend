export interface CatalogIndexabilityInput {
  source?: 'program' | 'tmdb';
  contentType?: 'movie' | 'series' | 'program';
  airings?: unknown[];
}

const INDEXABLE = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

/** Provider metadata alone is not indexable inventory. */
export function catalogRobotsPolicy(item: CatalogIndexabilityInput): string {
  if (item.source === 'program' || item.contentType === 'program') return INDEXABLE;
  return Array.isArray(item.airings) && item.airings.length > 0 ? INDEXABLE : 'noindex, follow';
}
