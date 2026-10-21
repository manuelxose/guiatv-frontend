import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { CERT_MIN_DAYS, certDaysLeft, CHECKS, probe, redirectsToHttps, transportChecks } from './uptime-probe.mjs';

function site(overrides = {}) {
  const routes = {
    '/': [200, '<html><app-root></app-root></html>'],
    '/v2/health': [200, '{"success":true,"data":{"status":"healthy"}}'],
    '/robots.txt': [200, 'User-agent: *'],
    '/sitemap.xml': [200, '<sitemapindex></sitemapindex>'],
    '/programacion-tv/peliculas': [200, 'ok'],
    '/v2/entities/resolve': [404, '{"error":{"code":"ENTITY_PUBLIC_READ_DISABLED"}}'],
    ...overrides,
  };
  return http.createServer((req, res) => {
    const hit = routes[req.url.split('?')[0]];
    if (hit === 'hang') return; // never answers
    const [status, body] = hit ?? [404, ''];
    res.writeHead(status).end(body);
  });
}
const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
const fast = { attempts: 2, pause: 1, timeout: 300, sleep: async () => {} };

test('a healthy site passes every check, including the entity-off invariant', async () => {
  const server = site();
  const origin = await listen(server);
  try {
    const { failures, results } = await probe({ origin, ...fast });
    assert.deepEqual(failures, []);
    assert.equal(results.length, CHECKS('off').length);
  } finally { server.close(); }
});

test('an outage (no answer), a wrong body and an error status are failures after the retries', async () => {
  const server = site({ '/': 'hang', '/v2/health': [200, 'not json'], '/robots.txt': [503, ''] });
  const origin = await listen(server);
  try {
    const { failures } = await probe({ origin, ...fast });
    assert.deepEqual(failures.map((f) => f.name).sort(), ['API health', 'home (SSR)', 'robots.txt']);
    assert.equal(failures.find((f) => f.name === 'home (SSR)').status, 0);
  } finally { server.close(); }
});

test('a transient failure that recovers on the retry is not an alert', async () => {
  let calls = 0;
  const flaky = async (url, init) => (new URL(url).pathname === '/' && ++calls === 1 ? { status: 502, text: async () => '' } : fetch(url, init));
  const server = site();
  const origin = await listen(server);
  try {
    assert.deepEqual((await probe({ origin, ...fast, fetchImpl: flaky })).failures, []);
    assert.equal(calls, 2);
  } finally { server.close(); }
});

test('an accidentally active public entity read is an alert; once expected (canary) it is not checked', async () => {
  const server = site({ '/v2/entities/resolve': [200, '{"success":true}'] });
  const origin = await listen(server);
  try {
    assert.deepEqual((await probe({ origin, ...fast })).failures.map((f) => f.name), ['entity reads stay off']);
    assert.deepEqual((await probe({ origin, ...fast, entityExpectation: 'canary' })).failures, []);
  } finally { server.close(); }
});

test('transport: plain HTTP must redirect to HTTPS, and the certificate must have time left', async () => {
  assert.equal(redirectsToHttps(301, 'https://guiaprogramaciontv.com/'), true);
  assert.equal(redirectsToHttps(308, 'https://x/'), true);
  assert.equal(redirectsToHttps(200, ''), false, 'serving plain HTTP is a failure');
  assert.equal(redirectsToHttps(302, 'https://x/'), false);
  assert.equal(redirectsToHttps(301, 'http://x/'), false, 'a redirect to http is no redirect');
  const now = Date.parse('2026-10-21T00:00:00Z');
  assert.ok(certDaysLeft('Dec 31 00:00:00 2026 GMT', now) > CERT_MIN_DAYS);
  assert.ok(certDaysLeft('Nov  1 00:00:00 2026 GMT', now) < CERT_MIN_DAYS);
  assert.ok(Number.isNaN(certDaysLeft('garbage', now)));
  const redirect = async () => ({ status: 301, headers: new Headers({ location: 'https://example.test/' }) });
  const ok = await transportChecks('https://example.test', 100, redirect, async () => new Date(Date.now() + 60 * 86_400_000).toUTCString());
  assert.deepEqual(ok.map((r) => r.ok), [true, true]);
  const bad = await transportChecks('https://example.test', 100, async () => ({ status: 200, headers: new Headers() }), async () => new Date(Date.now() + 3 * 86_400_000).toUTCString());
  assert.deepEqual(bad.map((r) => r.ok), [false, false]);
  const unreachable = await transportChecks('https://example.test', 100, redirect, async () => null);
  assert.equal(unreachable[1].ok, false, 'an unreadable certificate is a failure, not a pass');
});
