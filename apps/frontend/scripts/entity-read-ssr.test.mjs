// Build first: npm run build:ssr; then node --test scripts/entity-read-ssr.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

test('entity SSR renders safe HTML, status, canonical, robots and disabled legacy fallback', { timeout: 90000 }, async () => {
  const canonicalPath = '/peliculas/phase3a-fixture';
  const flipPath = '/peliculas/phase3b-flip';
  let flipped = false;
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
      } else if (path === flipPath && flipped) {
        status = 200;
        body = { success: true, data: { entityId: 'canary-fixture', kind: 'movie', title: 'Phase3B canary fixture', canonicalPath: flipPath, synopsis: 'Canary fixture synopsis.', year: 2024 } };
      } else if (path === '/peliculas/phase3a-disabled' || path === flipPath) {
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
  const launch = async () => {
    // Obtain a free loopback port before starting the existing production SSR entrypoint.
    const reservation = createServer();
    reservation.listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    const proc = spawn(process.execPath, ['scripts/ssr-server.mjs'], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, PORT: String(port), API_ORIGIN: backendOrigin, SSR_API_BASE_URL: backendOrigin },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    proc.stdout.on('data', chunk => { output = (output + chunk).slice(-8000); });
    proc.stderr.on('data', chunk => { output = (output + chunk).slice(-8000); });
    const where = `http://127.0.0.1:${port}`;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (proc.exitCode !== null) throw new Error(`SSR exited ${proc.exitCode}: ${output}`);
      try { if ((await fetch(`${where}/healthz`)).ok) break; } catch { /* Startup only. */ }
      await delay(100);
    }
    return { origin: where, proc, logs: () => output, stop: async () => { if (proc.exitCode === null) { proc.kill('SIGTERM'); await once(proc, 'exit'); } } };
  };
  const main = await launch();
  const origin = main.origin;
  try {
    for (const [path, status] of [[canonicalPath, 200], ['/peliculas/phase3a-missing', 404], ['/peliculas/phase3a-gone', 410], ['/peliculas/phase3a-failure', 503]]) {
      const response = await fetch(`${origin}${path}`);
      const html = await response.text();
      assert.equal(response.status, status, `${path}: ${main.logs()}`);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow', `${path}: ${html.slice(0, 1800)} ${main.logs()}`);
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
    // 3B cache isolation: an entity page is never stored, so killing or revoking a canary entity takes effect on the
    // next request without an SSR restart, and re-allowing it shows the entity again.
    const flip = async (on) => { flipped = on; return fetch(`${origin}${flipPath}`); };
    const [first, second] = [await flip(true), await flip(true)];
    assert.deepEqual([first.status, second.status], [200, 200]);
    assert.equal(first.headers.get('x-entity-public-read'), '1');
    assert.equal(first.headers.get('cache-control'), 'no-store');
    assert.equal(requests.filter((p) => p === '/v2/entities/resolve').length >= 2, true);
    const killed = await flip(false);
    assert.equal(killed.status, 404, 'a killed canary entity must not be served from an SSR cache');
    assert.doesNotMatch(await killed.text(), /Phase3B canary fixture/);
    // The reverse is not immediate: the legacy response that replaced it is cacheable, so adding (or re-adding) a
    // canary entity needs an SSR restart to drop it. The runbook restarts SSR and then verifies.
    assert.equal((await flip(true)).status, 404, 'cached legacy page still wins until SSR restarts');
    const restarted = await launch();
    try {
      const fresh = await fetch(`${restarted.origin}${flipPath}`);
      assert.equal(fresh.status, 200, 'a restarted SSR serves the canary entity');
      assert.equal(fresh.headers.get('x-robots-tag'), 'noindex, follow');
    } finally {
      await restarted.stop();
    }
    for (const slug of ['phase3a-missing', 'phase3a-gone', 'phase3a-failure']) {
      assert.ok(!requests.includes(`/v2/catalog/slug/movie/${slug}`), 'entity failure must never guess through legacy catalog');
    }
  } finally {
    await main.stop();
    backend.closeAllConnections();
    await new Promise(resolve => backend.close(resolve));
  }
});
