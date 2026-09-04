import { ICacheRepository } from '@/domain/repositories/ICacheRepository';

/**
 * One namespace prefix for every Affiliate Engine cache entry, so a single
 * pattern clear (`cache.clear(`${AFFILIATE_CACHE_PREFIX}:*`)`) invalidates
 * everything the resolver/catalog service cached, without touching unrelated
 * caches (TMDB, TV surfaces, ...) that share the same `ICacheRepository`.
 */
export const AFFILIATE_CACHE_PREFIX = 'affiliate:v1';

export const AffiliateCacheKeys = {
  merchantById: (id: string) => `${AFFILIATE_CACHE_PREFIX}:merchant:id:${id}`,
  merchantByAlias: (normalizedText: string) => `${AFFILIATE_CACHE_PREFIX}:merchant:alias:${normalizedText}`,
  programById: (id: string) => `${AFFILIATE_CACHE_PREFIX}:program:id:${id}`,
  placementByKey: (key: string) => `${AFFILIATE_CACHE_PREFIX}:placement:key:${key}`,
  candidates: (market: string, category: string, intents: string, merchantIds: string) =>
    `${AFFILIATE_CACHE_PREFIX}:candidates:${market}:${category}:${intents}:${merchantIds}`,
};

/** Minutes, not hours, for anything offer/program shaped — offers can be paused by an admin at any time. */
export const AFFILIATE_CACHE_TTL_SECONDS = {
  merchant: 6 * 60 * 60,
  program: 5 * 60,
  placement: 6 * 60 * 60,
  candidates: 3 * 60,
};

/** Bust every Affiliate Engine cache entry — call after any admin write to networks/merchants/programs/offers/placements. */
export async function invalidateAffiliateCache(cache?: ICacheRepository): Promise<void> {
  if (!cache) return;
  await cache.clear(`${AFFILIATE_CACHE_PREFIX}:*`);
}

/** Reads through cache, falling back to `load()` on a miss or a cache error — a broken cache must never break resolution. */
export async function cached<T>(
  cache: ICacheRepository | undefined,
  key: string,
  ttlSeconds: number,
  load: () => Promise<T | null>
): Promise<T | null> {
  if (cache) {
    try {
      const hit = await cache.get<T>(key);
      if (hit !== null && hit !== undefined) return hit;
    } catch {
      // Cache read failure — fall through to a live load.
    }
  }

  const value = await load();

  if (cache && value !== null && value !== undefined) {
    try {
      await cache.set(key, value, ttlSeconds);
    } catch {
      // Cache write failure — the resolved value is still returned.
    }
  }

  return value;
}
