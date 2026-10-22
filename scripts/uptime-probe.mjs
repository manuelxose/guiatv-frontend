#!/usr/bin/env node
/**
 * External uptime probe for production. Runs OFF the host (GitHub Actions, see .github/workflows/uptime.yml),
 * because the in-host watchdog (scripts/health-watchdog.mjs) dies with the machine: both 2026-10-20/21 outages
 * left it silent. Public GETs only, a handful per run, each retried after a pause before it counts as down.
 *
 *   node scripts/uptime-probe.mjs --origin https://guiaprogramaciontv.com [--attempts 3] [--pause 20000] [--timeout 30000]
 *
 * Checks: plain HTTP redirects to HTTPS, the TLS certificate has at least 14 days left, home (SSR), API health, robots.txt, sitemap index, a hub page, and the entity read invariant:
 * with ENTITY_EXPECTATION=off (default) `/v2/entities/resolve` must answer ENTITY_PUBLIC_READ_DISABLED, so an
 * accidental activation of the public entity read is an alert, not a surprise. Exit 1 on any failure;
 * UPTIME_WEBHOOK_URL (optional) also receives a JSON message. Webhook-independent visibility: when GITHUB_STEP_SUMMARY is set
 * (GitHub Actions) every run writes its result table there, and uptime.yml opens, updates and closes an issue from the outcome.
 */
import fs from 'node:fs';
import https from 'node:https';
import tls from 'node:tls';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};

export const CHECKS = (entityExpectation = 'off') => [
  { name: 'home (SSR)', path: '/', status: 200, contains: '<app-root' },
  { name: 'API health', path: '/v2/health', status: 200, contains: '"status":"healthy"' },
  { name: 'robots.txt', path: '/robots.txt', status: 200, contains: 'User-agent' },
  { name: 'sitemap index', path: '/sitemap.xml', status: 200, contains: '<sitemapindex' },
  { name: 'hub page', path: '/programacion-tv/peliculas', status: 200 },
  ...(entityExpectation === 'off'
    ? [{ name: 'entity reads stay off', path: '/v2/entities/resolve?path=/peliculas/uptime-probe', status: 404, contains: 'ENTITY_PUBLIC_READ_DISABLED' }]
    : []),
];

export const CERT_MIN_DAYS = 14;

/** Days until a certificate's `valid_to` (e.g. "Jan  1 00:00:00 2027 GMT"); NaN when unreadable. */
export const certDaysLeft = (validTo, now = Date.now()) => (Date.parse(validTo) - now) / 86_400_000;

/** Port 80 must send visitors to HTTPS (301/308 with an https Location). */
export const redirectsToHttps = (status, location) => [301, 308].includes(status) && /^https:\/\//.test(location ?? '');

const peerCertificate = (host, timeoutMs) => new Promise((resolve) => {
  const socket = tls.connect({ host, port: 443, servername: host, timeout: timeoutMs }, () => {
    const cert = socket.getPeerCertificate();
    socket.end();
    resolve(cert?.valid_to ?? null);
  });
  socket.on('error', () => resolve(null));
  socket.on('timeout', () => { socket.destroy(); resolve(null); });
});

/** The two transport checks, for an https origin only. */
export async function transportChecks(origin, timeout, fetchImpl = fetch, certProbe = peerCertificate) {
  const host = new URL(origin).hostname;
  const out = [];
  const http = await fetchOnce(`http://${host}/`, timeout, async (url, init) => {
    const res = await fetchImpl(url, init);
    return { status: res.status, text: async () => res.headers.get('location') ?? '' };
  });
  out.push({ name: 'http -> https redirect', path: `http://${host}/`, expected: 301, status: http.status, ms: http.ms, ok: redirectsToHttps(http.status, http.body), slow: false, error: http.error });
  const validTo = await certProbe(host, timeout);
  const days = validTo ? certDaysLeft(validTo) : NaN;
  out.push({ name: `TLS certificate (${Number.isFinite(days) ? Math.floor(days) : '?'} days left)`, path: `tls://${host}:443`, expected: 200, status: Number.isFinite(days) ? 200 : 0, ms: 0, ok: days >= CERT_MIN_DAYS, slow: false });
  return out;
}

/** One fetch with a hard timeout; never throws. */
export async function fetchOnce(url, timeoutMs, fetchImpl = fetch) {
  const started = Date.now();
  try {
    const res = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'GuiaTV-uptime-probe/1.0' } });
    const body = await res.text();
    return { status: res.status, body, ms: Date.now() - started };
  } catch (error) {
    return { status: 0, body: '', ms: Date.now() - started, error: error?.name || 'error' };
  }
}

/** Runs every check, retrying a failed one `attempts` times; returns the failures and every measured latency. */
export async function probe({ origin, attempts = 3, pause = 20_000, timeout = 30_000, entityExpectation = 'off', fetchImpl = fetch, certProbe, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const results = origin.startsWith('https://') ? await transportChecks(origin, timeout, fetchImpl, certProbe) : [];
  for (const check of CHECKS(entityExpectation)) {
    let last;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      last = await fetchOnce(origin + check.path, timeout, fetchImpl);
      const ok = last.status === check.status && (!check.contains || last.body.includes(check.contains));
      if (ok) { last.ok = true; break; }
      if (attempt < attempts) await sleep(pause);
    }
    results.push({ name: check.name, path: check.path, expected: check.status, status: last.status, ms: last.ms, ok: Boolean(last.ok), error: last.error, slow: last.ms > 10_000 });
  }
  return { failures: results.filter((r) => !r.ok), results };
}

function postWebhook(url, text) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: 5000 }, () => resolve());
      req.on('error', () => resolve());
      req.end(JSON.stringify({ text }));
    } catch { resolve(); }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const origin = String(arg('--origin', '')).replace(/\/$/, '');
  if (!/^https:\/\/[a-z0-9.-]+$/.test(origin)) {
    console.error('usage: uptime-probe.mjs --origin https://host [--attempts 3] [--pause 20000] [--timeout 30000]');
    process.exit(2);
  }
  const { failures, results } = await probe({
    origin, attempts: Number(arg('--attempts', 3)), pause: Number(arg('--pause', 20_000)), timeout: Number(arg('--timeout', 30_000)),
    entityExpectation: process.env.ENTITY_EXPECTATION || 'off',
  });
  for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name.padEnd(24)} ${String(r.status).padStart(3)} ${String(r.ms).padStart(6)} ms${r.slow ? ' (slow)' : ''}${r.error ? ` ${r.error}` : ''}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const rows = results.map((r) => `| ${r.ok ? 'ok' : '**FAIL**'} | ${r.name} | ${r.status || r.error || ''} | ${r.ms} ms${r.slow ? ' (slow)' : ''} |`);
    const summary = `### External probe of ${origin}\n\n${failures.length ? `**${failures.length} check(s) failing**` : 'All checks passing'} at ${new Date().toISOString()}\n\n| | Check | Status | Time |\n|---|---|---|---|\n${rows.join('\n')}\n`;
    try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary); } catch { /* the summary is a convenience, never a reason to fail */ }
  }
  if (failures.length) {
    const text = `GuiaTV external probe: ${failures.map((f) => `${f.name} -> ${f.status || f.error} (expected ${f.expected})`).join('; ')}`;
    console.error(text);
    if (process.env.UPTIME_WEBHOOK_URL) await postWebhook(process.env.UPTIME_WEBHOOK_URL, text);
    process.exitCode = 1;
  }
}
