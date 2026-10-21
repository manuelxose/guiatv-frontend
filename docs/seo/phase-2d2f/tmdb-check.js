// 2D-2F, read-only: one TMDB search per TMDB-backed candidate of a trace dump, so the evidence step
// can check that the bound work is the only one of its type with that title (`exactTmdbWorks`).
// GET requests to api.themoviedb.org only; no database. Run from a build's apps/backend:
//   TMDB_API_KEY=… node <path>/tmdb-check.js traces-20261020.jsonl [cache.json] > tmdb-checks.json
// Up to 3 result pages per query, 4 requests at a time, 3 retries with backoff on 429/5xx/network
// errors; a query that still fails is recorded with `error` (the evidence step quarantines it).
// The cache file (same format as the output) skips queries already answered.
const fs = require('node:fs');
const path = require('node:path');
const { tmdbAuth } = require(path.resolve('dist/infrastructure/external/tmdbAuth'));

const [tracesFile, cacheFile] = process.argv.slice(2);
const auth = tmdbAuth(process.env.TMDB_API_KEY || '');
if (!Object.keys(auth.headers).length && !Object.keys(auth.params).length) throw new Error('TMDB_API_KEY is not set');
const wanted = new Map();
for (const line of fs.readFileSync(tracesFile, 'utf8').split('\n')) {
  if (!line.startsWith('{"candidateId"')) continue;
  const t = JSON.parse(line);
  const ref = t.tmdb?.evidence === 'confirmed' ? t.tmdb.ref : null;
  if (ref && (ref.type === 'movie' || ref.type === 'tv')) wanted.set(`${ref.type}:${ref.id}`, { type: ref.type, id: ref.id, query: t.title });
}
const cache = new Map(cacheFile && fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')).filter((c) => !c.error).map((c) => [`${c.type}:${c.id}`, c]) : []);
const stats = { queries: wanted.size, cached: 0, requests: 0, retries: 0, failed: 0 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(type, query, n) {
  const url = new URL(`https://api.themoviedb.org/3/search/${type}`);
  Object.entries({ ...auth.params, query, language: 'es-ES', include_adult: 'false', page: String(n) }).forEach(([k, v]) => url.searchParams.set(k, v));
  for (let attempt = 0; ; attempt++) {
    stats.requests++;
    try {
      const res = await fetch(url, { headers: { ...auth.headers, Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) });
      if (res.ok) return res.json();
      if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status}`);
      if (attempt >= 3) throw new Error(`HTTP ${res.status} after retries`);
    } catch (error) {
      if (attempt >= 3 || /^HTTP 4/.test(error.message)) throw error;
    }
    stats.retries++;
    await sleep(500 * 2 ** attempt);
  }
}

async function check({ type, id, query }) {
  const results = [];
  for (let n = 1; n <= 3; n++) {
    const data = await page(type, query, n);
    for (const r of data.results ?? []) {
      const date = r.release_date || r.first_air_date || '';
      results.push({ id: r.id, title: r.title ?? r.name, originalTitle: r.original_title ?? r.original_name, year: Number(date.slice(0, 4)) || undefined });
    }
    if (n >= (data.total_pages ?? 1)) break;
  }
  return { type, id, query, results };
}

(async () => {
  const todo = [...wanted.values()].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
  const out = new Array(todo.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < todo.length) {
        const i = next++;
        const hit = cache.get(`${todo[i].type}:${todo[i].id}`);
        if (hit && hit.query === todo[i].query) {
          stats.cached++;
          out[i] = hit;
          continue;
        }
        try {
          out[i] = await check(todo[i]);
        } catch (error) {
          stats.failed++;
          out[i] = { ...todo[i], error: String(error.message).slice(0, 120) };
        }
      }
    })
  );
  process.stdout.write(JSON.stringify(out) + '\n');
  console.error('tmdb-check', JSON.stringify(stats));
})();
