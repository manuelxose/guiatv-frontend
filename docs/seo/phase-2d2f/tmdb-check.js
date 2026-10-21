// 2D-2F/2D-2G, read-only: TMDB evidence for every TMDB-backed candidate of a trace dump, for the
// evidence step (`ContentIdentityEvidence`). GET requests to api.themoviedb.org only; no database.
//   TMDB_API_KEY=… node <path>/tmdb-check.js traces-20261020.jsonl [cache.json] > tmdb-checks.json
// Per bound work (2D-2G format, `v: 2`):
//  - search by the work title (es-ES, up to 3 pages): id, title, original title, year, genre ids;
//  - the bound work's details: runtime or episode runtime, number of seasons, genres, alternative titles;
//  - alternative titles of up to 5 other results of the same type, so a homonym whose display
//    title differs (a Spanish release title) is still seen.
// 4 requests at a time, 3 retries with backoff on 429/5xx/network errors; a lookup that still fails
// is recorded with `error` (the evidence step quarantines it). The cache file (same format) skips
// lookups already answered with the same query.
const fs = require('node:fs');
const path = require('node:path');
const { tmdbAuth } = require(path.resolve('dist/infrastructure/external/tmdbAuth'));

const VERSION = 3; // 3: + episodeCounts / episodes (3B)
const OTHER_ALTERNATIVES = 5;
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
const cached = cacheFile && fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : [];
const cache = new Map(cached.filter((c) => !c.error && c.v === VERSION).map((c) => [`${c.type}:${c.id}`, c]));
const stats = { lookups: wanted.size, cached: 0, requests: 0, retries: 0, failed: 0 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(pathname, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${pathname}`);
  Object.entries({ ...auth.params, language: 'es-ES', ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
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

const altTitles = (data) => [...new Set((data?.titles ?? data?.results ?? []).map((t) => t.title ?? t.name).filter(Boolean))].sort();

async function check({ type, id, query }) {
  const results = [];
  for (let n = 1; n <= 3; n++) {
    const data = await get(`/search/${type}`, { query, include_adult: 'false', page: String(n) });
    for (const r of data.results ?? []) {
      const date = r.release_date || r.first_air_date || '';
      results.push({ id: r.id, title: r.title ?? r.name, originalTitle: r.original_title ?? r.original_name, year: Number(date.slice(0, 4)) || undefined, genreIds: r.genre_ids ?? [] });
    }
    if (n >= (data.total_pages ?? 1)) break;
  }
  const d = await get(`/${type}/${id}`, { append_to_response: 'alternative_titles' });
  const date = d.release_date || d.first_air_date || '';
  const details = {
    year: Number(date.slice(0, 4)) || undefined,
    runtime: type === 'movie' ? d.runtime || undefined : Math.max(0, ...(d.episode_run_time ?? [])) || undefined,
    seasons: type === 'tv' ? d.number_of_seasons ?? undefined : undefined,
    episodes: type === 'tv' ? d.number_of_episodes || undefined : undefined,
    episodeCounts: type === 'tv' ? Object.fromEntries((d.seasons ?? []).filter((x) => x.season_number > 0 && x.episode_count > 0).map((x) => [x.season_number, x.episode_count])) : undefined,
    genreIds: (d.genres ?? []).map((g) => g.id).sort((a, b) => a - b),
    alternativeTitles: altTitles(d.alternative_titles),
  };
  const alternatives = {};
  for (const other of [...new Set(results.map((r) => r.id))].filter((rid) => rid !== id).slice(0, OTHER_ALTERNATIVES)) {
    alternatives[other] = altTitles(await get(`/${type}/${other}/alternative_titles`, {}));
  }
  return { v: VERSION, type, id, query, results, details, alternatives };
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
          out[i] = { v: VERSION, ...todo[i], error: String(error.message).slice(0, 120) };
        }
      }
    })
  );
  process.stdout.write(JSON.stringify(out) + '\n');
  console.error('tmdb-check', JSON.stringify(stats));
})();
