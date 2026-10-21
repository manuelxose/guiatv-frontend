#!/usr/bin/env node
// Regression check: when the API is down, data routes must answer 503 + no-store + noindex,
// never a cacheable, indexable 200 (or a 404) that shows an error state. Also checks what the SSR server answers
// on its own: permanent redirects, the iframe widget's status and framing headers, and empty-page indexability.
// Needs a built frontend (npm run build:frontend). Usage: node scripts/seo-ssr-resilience.mjs
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';

const port = 3190;
const canonicals = (html) => [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/g)].map((m) => m[1]);
const routes = ['/canales', '/canales/la_sexta', '/guias', '/guias/categoria/series', '/guias/mejores-series-netflix', '/programas/un-lugar-llamado-milagro', '/peliculas/el-caballero-oscuro', '/pelicula-details/155', '/detalles/test-program', '/program-full-details/test-program', '/contenido/tmdb%3Amovie%3A155'];
async function startSsr(ssrPort, apiOrigin) {
  const proc = spawn('node', ['apps/frontend/scripts/ssr-server.mjs'], {
    env: { ...process.env, PORT: String(ssrPort), API_ORIGIN: apiOrigin },
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  await new Promise((ok, fail) => {
    const timer = setTimeout(() => fail(new Error('ssr-server start timeout')), 30000).unref();
    proc.stdout.on('data', (d) => {
      if (String(d).includes('listening')) {
        clearTimeout(timer);
        ok();
      }
    });
    proc.on('error', fail);
    proc.on('exit', () => fail(new Error('ssr-server exited early')));
  });
  return proc;
}
async function stop(proc) {
  if (proc && proc.exitCode === null && proc.signalCode === null) {
    const exited = once(proc, 'exit');
    proc.kill();
    const timer = setTimeout(() => proc.kill('SIGKILL'), 12000);
    await exited;
    clearTimeout(timer);
  }
}
let child;
try {
  child = await startSsr(port, 'http://127.0.0.1:9'); // port 9 = discard, connection refused
  for (const route of routes) {
    const res = await fetch(`http://127.0.0.1:${port}${route}`, { signal: AbortSignal.timeout(30000) });
    const html = await res.text();
    assert.equal(res.status, 503, `${route}: status ${res.status}, expected 503`);
    assert.equal(res.headers.get('cache-control'), 'no-store', `${route}: cache-control`);
    assert.equal(res.headers.get('retry-after'), '120', `${route}: retry-after`);
    assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow', `${route}: x-robots-tag`);
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/, `${route}: robots meta`);
    assert.equal(canonicals(html).length, 0, `${route}: an error response must not declare a canonical`);
    console.log(`ok ${route} -> 503 no-store noindex, no canonical`);
  }

  // Permanent redirects answered by ssr-server.mjs itself (no API needed): one 301 hop to the final URL, query kept.
  const redirects = {
    '/deportes': '/deportes/futbol',
    '/deportes?utm_source=x': '/deportes/futbol?utm_source=x',
    '/deportes/futbol/noticias/movistar-plus-vs-dazn': '/guias/movistar-plus-vs-dazn',
    '/deportes/futbol/noticias/donde-ver-laliga-en-espana': '/guias/donde-ver-laliga-2026-27-espana', // old slug: still one hop
    '/guias/categoria/rankings': '/guias/rankings',
    '/editorial/categoria/rankings': '/guias/rankings',
    '/blog/categoria/rankings': '/guias/rankings',
    '/editorial/categoria/series': '/guias/categoria/series',
  };
  for (const [from, to] of Object.entries(redirects)) {
    const res = await fetch(`http://127.0.0.1:${port}${from}`, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
    assert.equal(res.status, 301, `${from}: status ${res.status}, expected 301`);
    assert.equal(res.headers.get('location'), to, `${from}: location`);
    console.log(`ok ${from} -> 301 ${to}`);
  }

  // The iframe widget: a client-rendered page, so 200 + noindex (not a 503 outage), frameable from any origin.
  const widget = await fetch(`http://127.0.0.1:${port}/embed/programacion?theme=dark&channels=5`, { signal: AbortSignal.timeout(30000) });
  assert.equal(widget.status, 200, `/embed/programacion: status ${widget.status}`);
  assert.equal(widget.headers.get('x-robots-tag'), 'noindex, follow', '/embed/programacion: x-robots-tag');
  assert.equal(widget.headers.get('content-security-policy'), 'frame-ancestors *', '/embed/programacion: frame-ancestors');
  assert.equal(widget.headers.get('x-frame-options'), null, '/embed/programacion: X-Frame-Options would block other sites');
  const widgetHtml = await widget.text();
  assert.match(widgetHtml, /<app-root/, '/embed/programacion: app shell');
  assert.equal(canonicals(widgetHtml).length, 0, '/embed/programacion: a noindex CSR shell gets no server canonical');
  console.log('ok /embed/programacion -> 200 noindex, frame-ancestors *');
  // ...and only the widget: every other page keeps SAMEORIGIN.
  for (const route of ['/embed', '/canales', '/embed/programacion/x']) {
    const res = await fetch(`http://127.0.0.1:${port}${route}`, { signal: AbortSignal.timeout(30000) });
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN', `${route}: x-frame-options`);
    assert.equal(res.headers.get('content-security-policy'), null, `${route}: content-security-policy`);
  }
  console.log('ok other routes keep X-Frame-Options: SAMEORIGIN');

  // A page with no data must never be indexable (it used to render "Cargando…" as index, follow).
  const trends = await fetch(`http://127.0.0.1:${port}/tendencias`, { signal: AbortSignal.timeout(30000) });
  const trendsHtml = await trends.text();
  assert.match(trends.headers.get('x-robots-tag') || '', /noindex/, `/tendencias without data: x-robots-tag ${trends.headers.get('x-robots-tag')}`);
  assert.doesNotMatch(trendsHtml, /Cargando contenidos populares/, '/tendencias: loading state server-rendered');
  console.log(`ok /tendencias without data -> ${trends.status} ${trends.headers.get('x-robots-tag')}`);

  // Canonical policy (Phase 2D-0, apps/frontend/scripts/ssr-canonical.mjs): the page's own canonical, one tag, no
  // query string; none on errors. Static pages render without the API.
  for (const [route, expected] of [['/avisolegal', '/avisolegal'], ['/avisolegal?utm_source=x&dia=1', '/avisolegal'], ['/sobre-nosotros', '/sobre-nosotros']]) {
    const res = await fetch(`http://127.0.0.1:${port}${route}`, { signal: AbortSignal.timeout(30000) });
    const found = canonicals(await res.text());
    assert.equal(res.status, 200, `${route}: status ${res.status}`);
    assert.deepEqual(found, [`https://guiaprogramaciontv.com${expected}`], `${route}: canonical ${found}`);
    console.log(`ok ${route} -> one canonical ${expected}`);
  }
  const unknown = await fetch(`http://127.0.0.1:${port}/no-existe-2d0`, { signal: AbortSignal.timeout(30000) });
  assert.equal(unknown.status, 404, `/no-existe-2d0: status ${unknown.status}`);
  assert.equal(canonicals(await unknown.text()).length, 0, '/no-existe-2d0: a 404 must not declare a canonical');
  console.log('ok /no-existe-2d0 -> 404, no canonical');
} finally {
  await stop(child);
}

// Phase 2D-0B: SSR sends its API reads straight to API_ORIGIN, whatever Host the visitor sent, and forwards none of
// the visitor's credentials. A fake API records what arrives; an API 429 or 500 must give 503, never a 404.
const seen = [];
let apiStatus = 429;
const api = http.createServer((req, res) => {
  seen.push({ method: req.method, url: req.url, host: req.headers.host, cookie: req.headers.cookie, authorization: req.headers.authorization, xff: req.headers['x-forwarded-for'] });
  res.writeHead(apiStatus, { 'content-type': 'application/json' }).end(JSON.stringify({ success: false, error: { code: 'TEST' } }));
});
api.listen(0, '127.0.0.1');
await once(api, 'listening');
const apiHost = `127.0.0.1:${api.address().port}`;
// fetch() cannot set Host, so the renders that pick one go through node:http.
const render = (path, headers) => new Promise((ok, fail) => {
  http.get({ host: '127.0.0.1', port: port + 1, path, headers, timeout: 30000 }, (res) => {
    let body = '';
    res.on('data', (d) => { body += d; }).on('end', () => ok({ status: res.statusCode, headers: res.headers, body }));
  }).on('error', fail).on('timeout', () => fail(new Error(`${path}: render timeout`)));
});
let routed;
try {
  routed = await startSsr(port + 1, `http://${apiHost}`);
  const visitor = { cookie: 'gtv_session=secret', authorization: 'Bearer secret', 'x-forwarded-proto': 'https' };
  for (const host of ['guiaprogramaciontv.com', 'localhost:9999']) {
    for (const route of ['/canales/la-sexta', '/guias', '/peliculas/el-caballero-oscuro']) {
      const before = seen.length;
      const res = await render(route, { ...visitor, host });
      assert.ok(seen.length > before, `${host}${route}: no API request reached API_ORIGIN`);
      assert.equal(res.status, 503, `${host}${route}: API 429 gave ${res.status}, expected 503`);
      assert.match(res.headers['x-robots-tag'] || '', /noindex/, `${host}${route}: x-robots-tag`);
      console.log(`ok Host ${host} ${route}: ${seen.length - before} API request(s) to API_ORIGIN, 429 -> 503 noindex`);
    }
  }
  for (const r of seen) {
    assert.match(r.url, /^\/v2(\/|\?|$)/, `API request outside /v2: ${r.url}`);
    assert.equal(r.host, apiHost, `API request Host ${r.host}`);
    assert.equal(r.cookie, undefined, `visitor cookie forwarded to the API on ${r.url}`);
    assert.equal(r.authorization, undefined, `visitor Authorization forwarded to the API on ${r.url}`);
    assert.equal(r.xff, undefined, `X-Forwarded-For sent on ${r.url}`);
  }
  console.log(`ok ${seen.length} SSR API requests: all /v2 on API_ORIGIN, no visitor cookie/Authorization, no X-Forwarded-For`);
  apiStatus = 500;
  for (const route of ['/canales/la-sexta', '/guias', '/programas/un-lugar-llamado-milagro']) {
    const res = await render(route, { host: 'guiaprogramaciontv.com', 'x-forwarded-proto': 'https' });
    assert.equal(res.status, 503, `${route}: API 500 gave ${res.status}, expected 503`);
    console.log(`ok ${route}: API 500 -> 503`);
  }
} finally {
  await stop(routed);
  api.close();
}

// Phase 2D-2C.1: legacy catalog URLs. Only a verified destination redirects; a miss is 404 (410 only when the API
// says so); a real API failure stays 503. Never the home page, another host or a loop. Then stale-while-revalidate.
const catalog = {
  'program:live': { status: 200, body: { success: true, data: { detailPath: '/programas/la-promesa' } } },
  'program:expired': { status: 404, body: { success: false, error: { code: 'NOT_FOUND' } } },
  'program:retired': { status: 410, body: { success: false, error: { code: 'GONE' } } },
  'program:dbdown': { status: 500, body: { success: false, error: { code: 'INTERNAL_SERVER_ERROR' } } },
  'program:home': { status: 200, body: { success: true, data: { detailPath: '/' } } },
  'program:offsite': { status: 200, body: { success: true, data: { detailPath: '//evil.example/x' } } },
  'program:nopath': { status: 200, body: { success: true, data: {} } },
  'tmdb:movie:155': { status: 200, body: { success: true, data: { detailPath: '/peliculas/el-caballero-oscuro' } } },
};
const catalogApi = http.createServer((req, res) => {
  const id = decodeURIComponent((req.url.match(/^\/v2\/catalog\/([^/?]+)$/) || [])[1] || '');
  const hit = catalog[id] || { status: 404, body: { success: false } };
  res.writeHead(hit.status, { 'content-type': 'application/json' }).end(JSON.stringify(hit.body));
});
catalogApi.listen(0, '127.0.0.1');
await once(catalogApi, 'listening');
let legacy;
try {
  legacy = await startSsr(port + 2, `http://127.0.0.1:${catalogApi.address().port}`);
  const get = (path, headers = {}) =>
    fetch(`http://127.0.0.1:${port + 2}${path}`, { redirect: 'manual', headers, signal: AbortSignal.timeout(30000) });
  const expectations = [
    ['/contenido/program%3Alive', 301, '/programas/la-promesa'],
    ['/detalles/live', 301, '/programas/la-promesa'],
    ['/pelicula-details/155', 301, '/peliculas/el-caballero-oscuro'],
    ['/contenido/program%3Aexpired', 404],
    ['/program-full-details/expired', 404],
    ['/contenido/program%3Aretired', 410],
    ['/contenido/program%3Adbdown', 503],
    ['/contenido/program%3Ahome', 404],
    ['/contenido/program%3Aoffsite', 404],
    ['/contenido/program%3Anopath', 404],
    ['/contenido/unparseable', 404],
  ];
  for (const [path, status, location] of expectations) {
    const res = await get(path);
    const body = await res.text();
    assert.equal(res.status, status, `${path}: status ${res.status}, expected ${status}`);
    if (location) assert.equal(res.headers.get('location'), location, `${path}: location`);
    else assert.equal(res.headers.get('location'), null, `${path}: must not redirect`);
    if (status === 503) {
      assert.equal(res.headers.get('retry-after'), '120', `${path}: retry-after`);
      assert.match(res.headers.get('x-robots-tag') || '', /noindex/, `${path}: x-robots-tag`);
    } else if (status >= 400) {
      // The body must not contradict the status: no rendered page, no canonical, no success markup.
      assert.equal(canonicals(body).length, 0, `${path}: ${status} declares a canonical`);
      assert.doesNotMatch(body, /<app-root/, `${path}: ${status} serves the app shell`);
    }
    console.log(`ok ${path} -> ${status}${location ? ` ${location}` : ''}`);
  }
} finally {
  await stop(legacy);
  catalogApi.close();
}

// Stale-while-revalidate (ssr-cache.mjs; the replace/evict/keep rules are unit-tested in ssr-cache.test.mjs): past
// the TTL the cached page is served at once (STALE) while exactly one background render replaces it; a refresh
// header sent from outside (through nginx) cannot skip the cache, and the internal token never reaches the logs.
let swr;
try {
  const swrPort = port + 3;
  const ttl = 3000;
  let log = '';
  swr = spawn('node', ['apps/frontend/scripts/ssr-server.mjs'], {
    env: { ...process.env, PORT: String(swrPort), API_ORIGIN: 'http://127.0.0.1:9', SSR_CACHE_TTL_MS: String(ttl) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  swr.stdout.on('data', (d) => (log += d));
  swr.stderr.on('data', (d) => (log += d));
  await new Promise((ok, fail) => {
    const timer = setTimeout(() => fail(new Error('ssr-server start timeout')), 30000).unref();
    const check = () => log.includes('listening') && (clearTimeout(timer), ok());
    swr.stdout.on('data', check);
    swr.on('exit', () => fail(new Error('ssr-server exited early')));
  });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const get = async (path, headers = {}) => {
    const res = await fetch(`http://127.0.0.1:${swrPort}${path}`, { redirect: 'manual', headers, signal: AbortSignal.timeout(30000) });
    await res.text();
    return { status: res.status, cache: res.headers.get('x-ssr-cache') };
  };
  const refreshes = (path) => log.split('\n').filter((l) => l.includes(`stale refresh ${path} -> `)).length;
  const waitFor = async (cond, what) => {
    for (let i = 0; i < 80 && !cond(); i++) await sleep(100);
    assert.ok(cond(), what);
  };

  const first = await get('/avisolegal');
  assert.deepEqual([first.status, first.cache], [200, 'MISS'], 'first render');
  assert.equal((await get('/avisolegal', { 'x-ssr-refresh': 'guess' })).cache, 'HIT', 'spoofed refresh header skipped the cache');
  await sleep(ttl + 200);
  const burst = await Promise.all(Array.from({ length: 10 }, () => get('/avisolegal')));
  assert.ok(burst.every((r) => r.status === 200 && r.cache !== 'MISS'), `stale burst: ${JSON.stringify(burst)}`);
  await waitFor(() => refreshes('/avisolegal') >= 1, 'no background refresh logged');
  await sleep(300);
  assert.equal(refreshes('/avisolegal'), 1, 'ten concurrent stale hits must start exactly one refresh');
  assert.equal((await get('/avisolegal')).cache, 'HIT', 'the refresh did not replace the stale entry');
  assert.doesNotMatch(log, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, 'refresh token logged');
  console.log('ok /avisolegal: MISS -> STALE x10 concurrent -> exactly 1 refresh -> HIT; spoofed header ignored; token not logged');
} finally {
  await stop(swr);
}

// Phase 2D-2C.2: an API that accepts the connection and never answers used to hold a render for the whole 20 s
// SSR timeout. InternalApiBackend now fails each SSR API request after 6 s, so a page whose required data hangs
// answers 503 well inside the budget (optional sections fall back to empty instead).
const hanging = [];
const stalledApi = http.createServer((req) => hanging.push(req));
stalledApi.listen(0, '127.0.0.1');
await once(stalledApi, 'listening');
let stalledSsr;
try {
  stalledSsr = await startSsr(port + 4, `http://127.0.0.1:${stalledApi.address().port}`);
  const started = performance.now();
  const res = await fetch(`http://127.0.0.1:${port + 4}/canales/la-sexta`, { headers: { host: 'guiaprogramaciontv.com' }, signal: AbortSignal.timeout(30000) });
  await res.text();
  const ms = Math.round(performance.now() - started);
  assert.ok(hanging.length > 0, 'the render never reached the stalled API');
  assert.equal(res.status, 503, `/canales/la-sexta with a stalled API: status ${res.status}`);
  assert.match(res.headers.get('x-robots-tag') || '', /noindex/, 'stalled API: x-robots-tag');
  assert.ok(ms < 15000, `stalled API held the render ${ms} ms (the 20 s SSR timeout, not the 6 s per-request cap)`);
  console.log(`ok /canales/la-sexta with a stalled API -> 503 noindex in ${ms} ms (per-request cap, not the 20 s render timeout)`);
} finally {
  await stop(stalledSsr);
  stalledApi.closeAllConnections?.();
  stalledApi.close();
}

// Same budget when the API answers headers and then trickles a body that never ends: the cap is total duration.
const trickling = [];
const tricklingApi = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.write('{"success":true,"data":');
  const drip = setInterval(() => res.write(' '), 500);
  trickling.push(drip);
  req.on('close', () => clearInterval(drip));
});
tricklingApi.listen(0, '127.0.0.1');
await once(tricklingApi, 'listening');
let tricklingSsr;
try {
  tricklingSsr = await startSsr(port + 5, `http://127.0.0.1:${tricklingApi.address().port}`);
  const started = performance.now();
  const res = await fetch(`http://127.0.0.1:${port + 5}/canales/la-sexta`, { headers: { host: 'guiaprogramaciontv.com' }, signal: AbortSignal.timeout(30000) });
  await res.text();
  const ms = Math.round(performance.now() - started);
  assert.ok(trickling.length > 0, 'the render never reached the trickling API');
  assert.equal(res.status, 503, `/canales/la-sexta with a trickling API: status ${res.status}`);
  assert.ok(ms < 15000, `a trickling API body held the render ${ms} ms`);
  console.log(`ok /canales/la-sexta with a never-ending API body -> 503 in ${ms} ms (total-duration cap)`);
} finally {
  await stop(tricklingSsr);
  trickling.forEach(clearInterval);
  tricklingApi.closeAllConnections?.();
  tricklingApi.close();
}
