/**
 * Global setup: warms the real backend's response caches for the read-only
 * endpoints this suite depends on.
 *
 * Discovered while stabilizing this suite: the first call to
 * `/v2/tv/read?view=now` after a cache miss took ~39s (subsequent calls:
 * ~150-200ms) — a real characteristic of the shared dev backend's caching
 * layer, not a bug this suite should paper over silently. Rather than
 * inflating every test's timeout to tolerate a rare cold-cache hit, this
 * warms the cache once, up front, with a generous timeout reserved for
 * exactly that scenario.
 */
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:4000';

const WARMUP_ENDPOINTS = [
  '/v2/tv/read?view=now',
  '/v2/discovery/home',
  '/v2/catalog/platforms',
  '/v2/blog',
];

export default async function globalSetup(): Promise<void> {
  for (const path of WARMUP_ENDPOINTS) {
    const url = `${BACKEND_URL}${path}`;
    try {
      const started = Date.now();
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      const elapsedMs = Date.now() - started;
      // eslint-disable-next-line no-console
      console.log(`[global-setup] warmed ${path} -> ${res.status} in ${elapsedMs}ms`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[global-setup] failed to warm ${path}:`, (err as Error).message);
    }
  }
}
