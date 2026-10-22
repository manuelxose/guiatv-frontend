import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, summarise } from './legacy-rollout-snapshot.mjs';

const movie = { '@context': 'https://schema.org', '@type': 'Movie', name: 'Heat', url: 'https://x/peliculas/heat', description: 'd' };
const html = (ld = [movie], extra = '') => `<head><title>Heat: dónde ver</title><meta name="robots" content="index, follow"><meta name="description" content="d"><link rel="canonical" href="https://x/peliculas/heat"></head><body><h1>Heat</h1><a href="/canales/amc">AMC</a><a href="/programacion-tv/peliculas">P</a>${extra}<script type="application/ld+json">${JSON.stringify(ld)}</script></body>`;
const api = (extra = {}) => ({ synopsis: 'Texto', tmdbId: 949, slug: 'heat', detailPath: '/peliculas/heat', airings: [{ channelId: 'amc', start: '2026-10-23T20:00:00Z' }], genres: [], cast: [{}], ...extra });
const snap = (h, a, headers = {}) => summarise({ status: 200, headers, html: h, api: a });

test('an enriched page that only gained passes', () => {
  const before = snap(html(), api());
  const after = snap(html([{ ...movie, alternateName: 'Heat (orig.)', publication: [{ '@type': 'BroadcastEvent' }] }], '<a href="/canales/la-1">La 1</a>'),
    api({ enrichment: { metadata: { genres: ['x'] }, broadcasts: { status: 'ok', items: [{}] } } }));
  assert.deepEqual(compare(before, after, { expectEnriched: true }), []);
});

test('every kind of regression is caught', () => {
  const before = snap(html(), api());
  const cases = {
    robots: snap(html().replace('index, follow', 'noindex, follow'), api()),
    canonical: snap(html().replace('peliculas/heat"></head>', 'peliculas/other"></head>'), api()),
    duplicate: snap(html([movie, movie]), api()),
    changedMovie: snap(html([{ ...movie, description: 'otra' }]), api()),
    lostLink: snap(html().replace('<a href="/canales/amc">AMC</a>', ''), api()),
    synopsis: snap(html(), api({ synopsis: 'Otro texto' })),
    airing: snap(html(), api({ airings: [] })),
    breakout: snap(html([movie], '</script><img src=x onerror=1>'), api()),
    sitemap: { ...before, inSitemap: !before.inSitemap },
    brokenJson: snap(html().replace('"Movie"', '"Movie'), api()),
  };
  for (const [name, after] of Object.entries(cases)) assert.ok(compare(before, after).length > 0, name);
});

test('enrichment where none is expected, or missing where expected, is flagged', () => {
  const plain = snap(html(), api());
  const enriched = snap(html(), api({ enrichment: { metadata: [], broadcasts: { status: 'none' } } }));
  assert.ok(compare(plain, enriched).some((m) => /enrichment present/.test(m)));
  assert.ok(compare(plain, plain, { expectEnriched: true }).some((m) => /expected an enrichment/.test(m)));
});
