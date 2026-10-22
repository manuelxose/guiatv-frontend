import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCanary } from './entity-canary-verify.mjs';

const ORIGIN = 'https://guia.test';
const page = (path, over = {}) => ({
  status: 200,
  headers: { 'x-entity-public-read': '1', 'x-robots-tag': 'noindex, follow', 'cache-control': 'no-store' },
  body: `<meta name="robots" content="noindex, follow"><link rel="canonical" href="${ORIGIN}${path}">`,
  ...over,
});
function fakeFetch(routes) {
  return async (url) => {
    const path = new URL(url).pathname;
    const r = routes[path] ?? { status: 404, headers: {}, body: '' };
    return { status: r.status, headers: { get: (n) => r.headers[n.toLowerCase()] ?? null }, text: async () => r.body };
  };
}
const entries = [{ canonicalPath: '/peliculas/alpha' }, { canonicalPath: '/series/beta' }];
const clean = {
  '/peliculas/alpha': page('/peliculas/alpha'), '/series/beta': page('/series/beta'),
  '/sitemap.xml': { status: 200, headers: {}, body: `<loc>${ORIGIN}/sitemap-programs.xml</loc>` },
  '/sitemap-programs.xml': { status: 200, headers: {}, body: `<loc>${ORIGIN}/programas/other</loc>` },
};
const failing = async (routes, opts = {}) => (await verifyCanary({ fetch: fakeFetch(routes), origin: ORIGIN, entries, ...opts })).checks.filter((c) => !c.ok).map((c) => c.check);

test('a healthy canary passes every check', async () => {
  const result = await verifyCanary({ fetch: fakeFetch(clean), origin: ORIGIN, entries });
  assert.equal(result.ok, true);
  assert.deepEqual(result.checks.filter((c) => !c.ok), []);
});

test('each failure mode is reported: status, robots, caching, canonical, leakage, sitemap', async () => {
  assert.deepEqual(await failing({ ...clean, '/peliculas/alpha': page('/peliculas/alpha', { status: 503 }) }), ['status_200']);
  assert.deepEqual(await failing({ ...clean, '/peliculas/alpha': page('/peliculas/alpha', { headers: { 'x-entity-public-read': '1', 'x-robots-tag': 'index, follow', 'cache-control': 'public, max-age=60' } }) }), ['noindex_header', 'no_store']);
  assert.deepEqual(await failing({ ...clean, '/peliculas/alpha': page('/peliculas/alpha', { body: '<link rel="canonical" href="https://guia.test/peliculas/other"><link rel="canonical" href="https://guia.test/peliculas/alpha">' }) }), ['noindex_meta', 'single_self_canonical']);
  assert.deepEqual(await failing({ ...clean, '/peliculas/canary-control-not-an-entity': page('/x') }), ['control_not_entity']);
  assert.deepEqual(await failing({ ...clean, '/sitemap-programs.xml': { status: 200, headers: {}, body: `<loc>${ORIGIN}/series/beta</loc>` } }), ['sitemap_excludes_canary']);
  assert.deepEqual(await failing({ ...clean, '/series/beta': { status: 404, headers: {}, body: '' } }), ['status_200', 'entity_marker', 'noindex_header', 'noindex_meta', 'no_store', 'single_self_canonical']);
});

test('--expect-off passes only when no allowlisted path is an entity page any more', async () => {
  const legacy = { ...clean, '/peliculas/alpha': { status: 200, headers: {}, body: 'legacy' }, '/series/beta': { status: 404, headers: {}, body: '' } };
  assert.deepEqual(await failing(legacy, { expectOff: true }), []);
  assert.deepEqual(await failing(clean, { expectOff: true }), ['not_served_as_entity', 'not_served_as_entity']);
});

test('3D: an indexable legacy page at an allowlisted path is the guard working; a noindex non-entity page is still a failure', async () => {
  const legacyIndexable = { status: 200, headers: { 'x-robots-tag': 'index, follow, max-image-preview:large', 'cache-control': 'public' }, body: `<meta name="robots" content="index, follow"><link rel="canonical" href="${ORIGIN}/peliculas/alpha">` };
  const result = await verifyCanary({ fetch: fakeFetch({ ...clean, '/peliculas/alpha': legacyIndexable }), origin: ORIGIN, entries });
  assert.equal(result.ok, true);
  assert.ok(result.checks.some((c) => c.check === 'legacy_guard_fallback' && c.path === '/peliculas/alpha'));
  const notEntityButNoindex = { status: 200, headers: { 'x-robots-tag': 'noindex, follow' }, body: '<meta name="robots" content="noindex, follow">' };
  assert.ok((await failing({ ...clean, '/peliculas/alpha': notEntityButNoindex })).includes('entity_marker'));
  assert.ok((await failing({ ...clean, '/peliculas/alpha': { status: 503, headers: {}, body: '' } })).includes('status_200'));
});
