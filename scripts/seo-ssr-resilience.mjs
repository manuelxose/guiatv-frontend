#!/usr/bin/env node
// Regression check: when the API is down, data routes must answer 503 + no-store + noindex,
// never a cacheable, indexable 200 (or a 404) that shows an error state.
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
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    const exited = once(child, 'exit');
    child.kill();
    const timer = setTimeout(() => child.kill('SIGKILL'), 12000);
    await exited;
    clearTimeout(timer);
  }
}
