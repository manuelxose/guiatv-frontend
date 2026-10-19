#!/usr/bin/env node
// Dependency-free SEO regression crawl. Fetches the sitemap index, then every URL (raw HTML, no JS),
// and fails (exit 1) on sitemap URLs that are not a canonical, indexable 200 with title/description/one h1.
// Usage: node scripts/seo-crawl.mjs [baseUrl] [--out file.json] [--limit N] [--probe /path /path ...]
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:/.test(a)) ?? 'https://guiaprogramaciontv.com').replace(/\/$/, '');
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const out = opt('--out');
const limit = Number(opt('--limit') ?? Infinity);
const probes = args.includes('--probe') ? args.slice(args.indexOf('--probe') + 1).filter((a) => a.startsWith('/')) : [];
const MIN_WORDS = 150; // discovery signal only, not a quality verdict

const get = async (url) => {
  const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (compatible; guiatv-seo-crawl/1.0)' }, signal: AbortSignal.timeout(30000) });
  return { r, body: await r.text() };
};
const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
// Angular escapes attribute values; measure the text Google reads, not the entity spelling.
const entities = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&#x27;': "'", '&lt;': '<', '&gt;': '>' };
const attr = (html, re) => html.match(re)?.[1]?.trim()
  .replace(/&(?:amp|quot|apos|#39|#x27|lt|gt);/gi, (entity) => entities[entity.toLowerCase()]);
if (args.includes('--self-check')) {
  assert.equal(attr('<meta content="Cine &amp; TV &quot;hoy&quot;">', /content="([^"]*)"/), 'Cine & TV "hoy"');
  assert.equal(attr('<title>Series &amp; cine</title>', /<title>([^<]*)<\/title>/), 'Series & cine');
  assert.equal(attr('', /<title>([^<]*)<\/title>/), undefined);
  console.log('self-check ok');
  process.exit(0);
}

const analyse = (url, r, body, fromSitemap) => {
  const robotsMeta = attr(body, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)/i) ?? attr(body, /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']robots["']/i);
  const xrobots = r.headers.get('x-robots-tag');
  const canonical = attr(body, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)/i);
  const title = attr(body, /<title[^>]*>([^<]*)<\/title>/i);
  const description = attr(body, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i);
  const h1s = (body.match(/<h1[\s>]/gi) ?? []).length;
  const main = (body.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? body).replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  const words = main.replace(/<[^>]+>/g, ' ').split(/\s+/).filter((w) => w.length > 1).length;
  const ld = [...body.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try { const j = JSON.parse(m[1]); return (Array.isArray(j) ? j : j['@graph'] ?? [j]).map((x) => x['@type']).flat(); } catch { return ['INVALID_JSON']; }
  });
  const noindex = /noindex/i.test(`${robotsMeta ?? ''} ${xrobots ?? ''}`);
  const issues = [];
  if (r.status !== 200) issues.push(`status ${r.status}`);
  if (fromSitemap && noindex) issues.push('noindex in sitemap');
  if (fromSitemap && canonical && canonical.replace(/\/$/, '') !== url.replace(/\/$/, '')) issues.push(`canonical mismatch -> ${canonical}`);
  if (!canonical) issues.push('no canonical');
  if (!title) issues.push('no title'); else if (title.length > 70) issues.push(`title ${title.length}ch`);
  if (!description) issues.push('no description'); else if (description.length > 170) issues.push(`description ${description.length}ch`);
  if (h1s !== 1) issues.push(`h1 count ${h1s}`);
  if (fromSitemap && words < MIN_WORDS) issues.push(`thin: ${words} words`);
  if (ld.includes('INVALID_JSON')) issues.push('invalid JSON-LD');
  if (/>\s*(undefined|null|NaN)\s*</.test(main)) issues.push('undefined/null/NaN in content');
  return { url, status: r.status, canonical, robotsMeta, xrobots, title, titleLen: title?.length, descLen: description?.length, h1s, words, ld, issues };
};

const idx = await get(`${base}/sitemap.xml`);
const urls = [];
for (const c of locs(idx.body)) urls.push(...locs((await get(c)).body).map((u) => ({ u, sitemap: c.split('/').pop() })));
const seen = new Set();
const uniq = urls.filter((x) => (seen.has(x.u) ? false : seen.add(x.u))).slice(0, limit);

const results = [];
const queue = [...uniq.map((x) => ({ ...x, fromSitemap: true })), ...probes.map((p) => ({ u: base + p, sitemap: 'probe', fromSitemap: false }))];
await Promise.all(Array.from({ length: 6 }, async () => {
  for (let x; (x = queue.shift()); ) {
    try { const { r, body } = await get(x.u); results.push({ sitemap: x.sitemap, ...analyse(x.u, r, body, x.fromSitemap), location: r.headers.get('location') }); }
    catch (e) { results.push({ sitemap: x.sitemap, url: x.u, issues: [`fetch error ${e.message}`] }); }
  }
}));

const bad = results.filter((x) => x.sitemap !== 'probe' && x.issues.length);
const byIssue = {};
for (const x of bad) for (const i of x.issues) { const k = i.replace(/\d+/g, 'N').replace(/->.*/, ''); (byIssue[`${x.sitemap}: ${k}`] ??= []).push(x.url); }
console.log(`sitemap URLs: ${urls.length} (duplicates: ${urls.length - seen.size}), crawled: ${results.length}, with issues: ${bad.length}`);
for (const [k, v] of Object.entries(byIssue).sort()) console.log(`  ${v.length}\t${k}\te.g. ${v[0]}`);
for (const p of results.filter((x) => x.sitemap === 'probe')) console.log(`probe ${p.url} -> ${p.status} ${p.location ?? ''} robots=${p.robotsMeta ?? '-'} x-robots=${p.xrobots ?? '-'}`);
if (out) writeFileSync(out, JSON.stringify({ base, at: new Date().toISOString(), results }, null, 1));
process.exit(bad.length ? 1 : 0);
