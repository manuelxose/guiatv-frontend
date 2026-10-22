#!/usr/bin/env node
/**
 * Phase 3F: reproducible before / after check of legacy pages around a legacy-enrichment rollout. Public GETs only, paced.
 *   node scripts/legacy-rollout-snapshot.mjs snapshot --origin https://guiaprogramaciontv.com --paths /peliculas/a,/peliculas/b --out before.json [--delay 1500]
 *   node scripts/legacy-rollout-snapshot.mjs compare before.json after.json [--expect-enriched]
 * A snapshot keeps the SEO surface and the content inventory of the rendered HTML and of the API payload (labels and
 * numbers, never page text). `compare` exits 1 on any regression: robots, canonical, title, description, status, the
 * Movie JSON-LD (a superset is fine, a lost or duplicated entity is not), internal links, the synopsis, a legacy airing.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const UA = 'GuiaTV-rollout-check/1.0 (owner-run, public pages only)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

export function jsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const docs = [];
  let valid = true;
  for (const m of blocks) { try { docs.push(...[JSON.parse(m[1])].flat()); } catch { valid = false; } }
  return { docs, valid, blocks: blocks.length };
}

/** Pure: the comparable facts of one rendered page and its API payload. */
export function summarise({ status, headers, html, api }) {
  const { docs, valid } = jsonLd(html);
  const movies = docs.filter((d) => d['@type'] === 'Movie');
  const links = [...new Set([...html.matchAll(/<a [^>]*href="(\/[^"#?]*)"/g)].map((m) => m[1]))].sort();
  return {
    status,
    xRobots: headers['x-robots-tag'] ?? null,
    metaRobots: /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? null,
    canonical: [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]),
    title: /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? null,
    description: /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? null,
    h1: (html.match(/<h1[\s>]/g) || []).length,
    jsonLdValid: valid,
    jsonLdTypes: docs.map((d) => d['@type']).sort(),
    movie: movies[0] ?? null,
    moviesCount: movies.length,
    links,
    scriptBreakout: /<\/script><(?!\/)/.test(html) || /<img src=x/.test(html),
    api: api && {
      synopsisHash: sha(api.synopsis ?? ''), synopsisChars: (api.synopsis ?? '').length, tmdbId: api.tmdbId ?? null, slug: api.slug ?? null, detailPath: api.detailPath ?? null,
      airings: (api.airings ?? []).map((a) => `${a.channelId}|${Date.parse(a.start)}`).sort(), genres: (api.genres ?? []).length, durationMinutes: api.durationMinutes ?? null,
      cast: (api.cast ?? []).length, enrichment: api.enrichment ? { metadata: Object.keys(api.enrichment.metadata ?? {}), broadcasts: api.enrichment.broadcasts?.status ?? null, items: api.enrichment.broadcasts?.items?.length ?? 0 } : null,
    },
  };
}

/** Pure: regressions of `after` against `before` (empty = the page only gained). */
export function compare(before, after, { expectEnriched = false } = {}) {
  const bad = [];
  const eq = (name, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${name}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`); };
  eq('status', before.status, after.status);
  eq('sitemap membership', before.inSitemap, after.inSitemap);
  if (after.status !== 200) bad.push('not HTTP 200');
  for (const k of ['xRobots', 'metaRobots', 'canonical', 'title', 'description']) eq(k, before[k], after[k]);
  if (after.canonical.length !== 1) bad.push(`canonical count ${after.canonical.length}`);
  if (after.h1 !== 1) bad.push(`h1 count ${after.h1}`);
  if (!after.jsonLdValid) bad.push('JSON-LD does not parse');
  if (after.scriptBreakout) bad.push('markup breakout in the HTML');
  eq('movie entities', before.moviesCount, after.moviesCount);
  if (after.moviesCount > 1) bad.push('duplicate Movie entities');
  for (const [k, v] of Object.entries(before.movie ?? {})) if (JSON.stringify(after.movie?.[k]) !== JSON.stringify(v)) bad.push(`Movie.${k} changed`);
  const lostLinks = before.links.filter((l) => !after.links.includes(l));
  if (lostLinks.length) bad.push(`internal links lost: ${lostLinks.slice(0, 5).join(', ')}`);
  if (before.api && after.api) {
    eq('synopsis', before.api.synopsisHash, after.api.synopsisHash);
    for (const k of ['tmdbId', 'slug', 'detailPath', 'cast']) eq(`api.${k}`, before.api[k], after.api[k]);
    eq('legacy airings (API)', before.api.airings, after.api.airings);
  }
  if (expectEnriched && !after.api?.enrichment) bad.push('expected an enrichment, none present');
  if (!expectEnriched && after.api?.enrichment) bad.push('enrichment present where none was expected');
  return bad;
}

/** Every `<loc>` of the sitemap index and its children (a handful of GETs), as a Set of paths. */
async function sitemapPaths(origin, delay) {
  const get = async (url) => (await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30_000) })).text();
  const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = new Set();
  for (const child of locs(await get(`${origin}/sitemap.xml`))) {
    await sleep(delay);
    for (const loc of locs(await get(child))) paths.add(new URL(loc).pathname);
  }
  return paths;
}

async function snapshotOne(origin, path, delay, sitemap) {
  const get = (url) => fetch(url, { redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30_000) });
  const page = await get(origin + path);
  const html = page.status === 200 ? await page.text() : '';
  await sleep(delay);
  const slug = path.split('/').pop();
  const type = path.startsWith('/series') ? 'series' : path.startsWith('/programas') ? 'program' : 'movie';
  const res = await get(`${origin}/v2/catalog/slug/${type}/${slug}`);
  const api = res.status === 200 ? (await res.json()).data : null;
  return { path, measuredAt: new Date().toISOString(), inSitemap: sitemap.has(path), ...summarise({ status: page.status, headers: Object.fromEntries(page.headers), html, api }) };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const arg = (n, d) => (rest.includes(n) ? rest[rest.indexOf(n) + 1] : d);
  if (cmd === 'snapshot') {
    const origin = String(arg('--origin', '')).replace(/\/$/, '');
    const paths = String(arg('--paths', '')).split(',').filter(Boolean);
    if (!/^https:\/\/[a-z0-9.-]+$/.test(origin) || !paths.length || !paths.every((p) => /^\/(peliculas|series|programas)\/[a-z0-9-]+$/.test(p)) || !arg('--out')) { console.error('usage: snapshot --origin https://host --paths /peliculas/a,... --out file.json [--delay ms]'); process.exit(2); }
    const out = [];
    const sitemap = await sitemapPaths(origin, Number(arg('--delay', 1500)));
    for (const p of paths) { out.push(await snapshotOne(origin, p, Number(arg('--delay', 1500)), sitemap)); await sleep(Number(arg('--delay', 1500))); }
    fs.writeFileSync(arg('--out'), `${JSON.stringify(out, null, 2)}\n`);
    console.log(JSON.stringify({ pages: out.length, ok200: out.filter((o) => o.status === 200).length }));
  } else if (cmd === 'compare') {
    const [bf, af] = rest.filter((a) => !a.startsWith('--'));
    const before = JSON.parse(fs.readFileSync(bf, 'utf8'));
    const after = JSON.parse(fs.readFileSync(af, 'utf8'));
    let failed = 0;
    for (const b of before) {
      const a = after.find((x) => x.path === b.path);
      const bad = a ? compare(b, a, { expectEnriched: rest.includes('--expect-enriched') }) : ['missing from the after snapshot'];
      failed += bad.length ? 1 : 0;
      console.log(`${bad.length ? 'FAIL' : 'ok  '} ${b.path}${bad.length ? `\n     ${bad.join('\n     ')}` : ''}`);
    }
    process.exit(failed ? 1 : 0);
  } else { console.error('usage: snapshot|compare'); process.exit(2); }
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
