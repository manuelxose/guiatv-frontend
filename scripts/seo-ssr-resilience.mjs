#!/usr/bin/env node
// Regression check: when the API is down, data routes must answer 503 + no-store + noindex,
// never a cacheable, indexable 200 (or a 404) that shows an error state. Also checks what the SSR server answers
// on its own: permanent redirects, the iframe widget's status and framing headers, and empty-page indexability.
// Needs a built frontend (npm run build:frontend). Usage: node scripts/seo-ssr-resilience.mjs
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { once } from 'node:events';

const port = 3190;
const routes = ['/canales', '/canales/la_sexta', '/guias', '/guias/categoria/series', '/guias/mejores-series-netflix', '/programas/un-lugar-llamado-milagro', '/peliculas/el-caballero-oscuro', '/pelicula-details/155', '/detalles/test-program', '/program-full-details/test-program', '/contenido/tmdb%3Amovie%3A155'];
const child = spawn('node', ['apps/frontend/scripts/ssr-server.mjs'], {
  env: { ...process.env, PORT: String(port), API_ORIGIN: 'http://127.0.0.1:9' }, // port 9 = discard, connection refused
  stdio: ['ignore', 'pipe', 'ignore'],
});
try {
  await new Promise((ok, fail) => {
    const timer = setTimeout(() => fail(new Error('ssr-server start timeout')), 30000).unref();
    child.stdout.on('data', (d) => {
      if (String(d).includes('listening')) {
        clearTimeout(timer);
        ok();
      }
    });
    child.on('error', fail);
    child.on('exit', () => fail(new Error('ssr-server exited early')));
  });
  for (const route of routes) {
    const res = await fetch(`http://127.0.0.1:${port}${route}`, { signal: AbortSignal.timeout(30000) });
    const html = await res.text();
    assert.equal(res.status, 503, `${route}: status ${res.status}, expected 503`);
    assert.equal(res.headers.get('cache-control'), 'no-store', `${route}: cache-control`);
    assert.equal(res.headers.get('retry-after'), '120', `${route}: retry-after`);
    assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow', `${route}: x-robots-tag`);
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/, `${route}: robots meta`);
    console.log(`ok ${route} -> 503 no-store noindex`);
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
  assert.match(await widget.text(), /<app-root/, '/embed/programacion: app shell');
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
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    const exited = once(child, 'exit');
    child.kill();
    const timer = setTimeout(() => child.kill('SIGKILL'), 12000);
    await exited;
    clearTimeout(timer);
  }
}
