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

// Exact query variants the app's first paint actually requests (captured by
// tracing real network calls from the home page) — the backend's response
// cache is keyed by full querystring, so warming a bare path does not warm
// these.
const WARMUP_ENDPOINTS = [
  '/v2/tv/read?view=now&date=today&limit=8',
  '/v2/tv/read?view=night&date=today&limit=12',
  '/v2/tv/read?view=now&date=today&category=Deportes&limit=20',
  '/v2/discovery/home',
  '/v2/catalog/platforms',
  '/v2/blog',
  // Football: /home aggregates several provider calls (live/today/upcoming/
  // competitions/news) — the same combineLatest-shaped cold-start cost as
  // the TV home page above. /competitions and /matches back the Competitions
  // hub and Partidos/Calendario views the football.spec.ts suite exercises.
  '/v2/sports/football/home',
  '/v2/sports/football/competitions',
  '/v2/sports/football/matches',
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
