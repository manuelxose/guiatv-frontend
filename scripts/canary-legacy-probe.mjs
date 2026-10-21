#!/usr/bin/env node
/**
 * Phase 3C: what a crawler sees today at the legacy URL of each canary candidate. Public GETs only,
 * one at a time with a pause, stops after 3 consecutive failures (a struggling server is not
 * hammered). Keeps numbers and labels, never page text.
 *
 *   node scripts/canary-legacy-probe.mjs --pool pool.json --origin https://guiaprogramaciontv.com --out probes.json [--delay 1500] [--max 120]
 *
 * pool.json: [{ candidateId, path }] from `content-certify manifest --pool-out`.
 */
import fs from 'node:fs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const pool = JSON.parse(fs.readFileSync(arg('--pool'), 'utf8'));
const origin = String(arg('--origin', '')).replace(/\/$/, '');
const out = arg('--out');
const delay = Number(arg('--delay', 1500));
const max = Number(arg('--max', 120));
if (!pool.length || !/^https:\/\/[a-z0-9.-]+$/.test(origin) || !out) {
  console.error('usage: canary-legacy-probe.mjs --pool pool.json --origin https://host --out probes.json [--delay ms] [--max n]');
  process.exit(1);
}

const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap((m) => { try { const d = JSON.parse(m[1]); return Array.isArray(d) ? d : [d]; } catch { return []; } });

const probes = [];
let consecutiveFailures = 0;
for (const item of pool.slice(0, max)) {
  try {
    const res = await fetch(origin + item.path, { redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: { 'user-agent': 'GuiaTV-canary-probe/1.0 (owner-run, public pages only)' } });
    const html = res.status === 200 ? await res.text() : '';
    const movie = jsonLd(html).find((d) => ['Movie', 'TVSeries'].includes(d['@type']));
    probes.push({
      candidateId: item.candidateId, url: origin + item.path, status: res.status,
      robots: res.headers.get('x-robots-tag') ?? (/<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? null),
      descriptionChars: typeof movie?.description === 'string' ? movie.description.trim().length : 0,
      ...(movie?.datePublished && /^\d{4}/.test(String(movie.datePublished)) ? { year: Number(String(movie.datePublished).slice(0, 4)) } : {}),
      measuredAt: new Date().toISOString(),
    });
    consecutiveFailures = res.status >= 500 ? consecutiveFailures + 1 : 0;
  } catch (error) {
    consecutiveFailures++;
    console.error(`${item.path}: ${error.name}`);
  }
  if (consecutiveFailures >= 3) { console.error('3 consecutive failures: stopping, the server is not hammered'); break; }
  await new Promise((r) => setTimeout(r, delay));
}
fs.writeFileSync(out, JSON.stringify(probes, null, 2) + '\n');
console.log(JSON.stringify({ requested: Math.min(pool.length, max), measured: probes.length, ok200: probes.filter((p) => p.status === 200).length }));
