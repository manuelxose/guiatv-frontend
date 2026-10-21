// Build first: npm run build:ssr; then node --test scripts/entity-read-ssr.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

test('entity SSR renders safe HTML, status, canonical, robots and disabled legacy fallback', { timeout: 90000 }, async () => {
  const canonicalPath = '/peliculas/phase3a-fixture';
  const requests = [];
  const backend = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.push(url.pathname);
    res.setHeader('Content-Type', 'application/json');
    let status = 404;
    let body = { success: false, error: { code: 'ENTITY_NOT_FOUND' } };
    if (url.pathname === '/v2/entities/resolve') {
      const path = url.searchParams.get('path');
      if (path === canonicalPath || path === '/peliculas/phase3a-alias') {
        status = 200;
        body = { success: true, data: { entityId: 'verified-fixture', kind: 'movie', title: 'Phase3A verified fixture', canonicalPath, synopsis: 'Verified fixture synopsis.', year: 2024 } };
      } else if (path === '/peliculas/phase3a-disabled') {
        body.error.code = 'ENTITY_PUBLIC_READ_DISABLED';
      } else if (path === '/peliculas/phase3a-gone') status = 410;
      else if (path === '/peliculas/phase3a-failure') status = 503;
    }
    res.writeHead(status);
    res.end(JSON.stringify(body));
  });
  backend.listen(0, '127.0.0.1');
  await once(backend, 'listening');
  const backendOrigin = `http://127.0.0.1:${backend.address().port}`;
  // Obtain a free loopback port before starting the existing production SSR entrypoint.
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, ['scripts/ssr-server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(port), API_ORIGIN: backendOrigin, SSR_API_BASE_URL: backendOrigin },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', chunk => { logs = (logs + chunk).slice(-8000); });
  child.stderr.on('data', chunk => { logs = (logs + chunk).slice(-8000); });
  const origin = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (child.exitCode !== null) throw new Error(`SSR exited ${child.exitCode}: ${logs}`);
      try { ready = (await fetch(`${origin}/healthz`)).ok; } catch { /* Startup only. */ }
      if (ready) break;
      await delay(100);
    }
    assert.ok(ready, `SSR did not start: ${logs}`);
    for (const [path, status] of [[canonicalPath, 200], ['/peliculas/phase3a-missing', 404], ['/peliculas/phase3a-gone', 410], ['/peliculas/phase3a-failure', 503]]) {
      const response = await fetch(`${origin}${path}`);
      const html = await response.text();
      assert.equal(response.status, status, `${path}: ${logs}`);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow', `${path}: ${html.slice(0, 1800)} ${logs}`);
      assert.match(html, /<meta name="robots" content="noindex, follow"/);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      if (status === 200) {
        assert.match(html, /Phase3A verified fixture/);
        assert.match(html, /Verified fixture synopsis\./);
        assert.match(html, /<link rel="canonical" href="https:\/\/guiaprogramaciontv.com\/peliculas\/phase3a-fixture"/);
        assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
      } else assert.doesNotMatch(html, /rel="canonical"/);
    }
    const redirect = await fetch(`${origin}/peliculas/phase3a-alias`, { redirect: 'manual' });
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get('location'), canonicalPath);
    const disabled = await fetch(`${origin}/peliculas/phase3a-disabled`);
    assert.equal(disabled.status, 404);
    assert.ok(requests.includes('/v2/catalog/slug/movie/phase3a-disabled'), 'disabled flag must retain the legacy resolver');
    for (const slug of ['phase3a-missing', 'phase3a-gone', 'phase3a-failure']) {
      assert.ok(!requests.includes(`/v2/catalog/slug/movie/${slug}`), 'entity failure must never guess through legacy catalog');
    }
  } finally {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
    backend.closeAllConnections();
    await new Promise(resolve => backend.close(resolve));
  }
});
