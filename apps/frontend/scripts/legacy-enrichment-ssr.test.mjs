// Phase 3E. Build first: npm run build:ssr; then node --test scripts/legacy-enrichment-ssr.test.mjs.
// The compiled SSR bundle renders one legacy film page from a fake catalogue API three ways (no enrichment, verified
// enrichment, unreadable schedule). The SEO surface (status, robots header and meta, canonical, title, description) must be
// identical in all three; only the body gains content, and a hostile title cannot break out of the JSON-LD.
import test from 'node:test';
import assert from 'node:assert/strict';
import { launchSsr, startBackend } from './entity-ssr-harness.mjs';

const SLUG = 'la-cura-del-bienestar';
const hours = (n) => new Date(Date.now() + n * 3_600_000).toISOString();
const airing = (channelId, at) => ({ channelId, channelName: channelId.toUpperCase(), start: hours(at), end: hours(at + 2), title: 'La cura del bienestar', catalogId: `program:${channelId}`, detailPath: `/peliculas/${SLUG}` });
const broadcast = (channelId, at, title = 'La cura del bienestar') => ({
  airingId: `b-${channelId}`, channel: { id: channelId, name: channelId.toUpperCase(), path: `/canales/${channelId}` }, programmeTitle: title,
  start: hours(at), end: hours(at + 2), startLocal: hours(at).replace('Z', '+00:00'), localDate: hours(at).slice(0, 10), localTime: '21:30', durationMinutes: 120,
});
const legacy = (enrichment) => ({
  catalogId: 'tmdb:movie:340837', source: 'tmdb', contentType: 'movie', title: 'La cura del bienestar', slug: SLUG, detailPath: `/peliculas/${SLUG}`,
  synopsis: 'Texto editorial propio de la ficha.', genres: [], tmdbId: 340837, releaseYear: 2016, primaryPlatforms: [],
  airings: [airing('amc', 30), airing('tcm', 50)], ...(enrichment ? { enrichment } : {}),
});
const verified = (extra = {}) => ({
  version: 1,
  metadata: { originalTitle: 'A Cure for Wellness', runtimeMinutes: 147, genres: ['Terror'] },
  broadcasts: { status: 'ok', windowDays: 7, generatedAt: new Date().toISOString(), timeZone: 'Europe/Madrid', items: [broadcast('amc', 30), broadcast('la_1', 80)] },
  attribution: { notice: 'Datos e imágenes de TMDB. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.', updatedAt: '2026-10-01T00:00:00.000Z' },
  ...extra,
});

async function render(payload) {
  const backend = await startBackend(
    { [`/peliculas/${SLUG}`]: { status: 404, code: 'ENTITY_PUBLIC_READ_DISABLED' } },
    { [`/v2/catalog/slug/movie/${SLUG}`]: payload }
  );
  const ssr = await launchSsr(backend.origin);
  try {
    const response = await fetch(`${ssr.origin}/peliculas/${SLUG}`);
    const html = await response.text();
    return { response, html, logs: ssr.logs() };
  } finally {
    await ssr.stop();
    await backend.stop();
  }
}

const surface = ({ response, html }) => ({
  status: response.status,
  xRobots: response.headers.get('x-robots-tag'),
  robots: html.match(/<meta name="robots" content="([^"]*)"/)?.[1],
  canonical: [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]),
  title: html.match(/<title>([^<]*)<\/title>/)?.[1],
  description: html.match(/<meta name="description" content="([^"]*)"/)?.[1],
});
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => [JSON.parse(m[1])].flat());

test('verified enrichment adds content to the legacy page and changes nothing SEO-relevant', { timeout: 120000 }, async () => {
  const plain = await render(legacy());
  const enriched = await render(legacy(verified()));
  const unreadable = await render(legacy(verified({ broadcasts: { status: 'unavailable', windowDays: 7, generatedAt: new Date().toISOString(), timeZone: 'Europe/Madrid', items: [] } })));

  assert.equal(plain.response.status, 200, plain.logs);
  assert.match(plain.html, /index, follow/, 'the legacy page with airings is indexable');
  assert.deepEqual(surface(enriched), surface(plain));
  assert.deepEqual(surface(unreadable), surface(plain));
  assert.equal(surface(enriched).canonical.length, 1);

  // Plain: untouched legacy schedule. Enriched: shared broadcast list, original title, attribution, legacy-only airing kept.
  assert.doesNotMatch(plain.html, /app-entity-broadcast-list/);
  assert.match(enriched.html, /<app-entity-broadcast-list/);
  assert.match(enriched.html, /href="\/canales\/amc"/);
  assert.match(enriched.html, /href="\/canales\/la_1"|href="\/canales\/la-1"/);
  assert.match(enriched.html, /Título original: <\/span><i[^>]*>A Cure for Wellness/);
  assert.match(enriched.html, /Texto editorial propio de la ficha\./);
  assert.match(enriched.html, /themoviedb\.org/);
  assert.match(enriched.html, /TCM/, 'a legacy airing the verification did not confirm is still listed');
  assert.match(enriched.html, /<time[^>]*datetime=/);
  assert.doesNotMatch(unreadable.html, /app-entity-broadcast-list/);

  const movies = jsonLd(enriched.html).filter((d) => d['@type'] === 'Movie');
  assert.equal(movies.length, 1, 'one Movie entity per page');
  assert.equal(movies[0].alternateName, 'A Cure for Wellness');
  assert.equal(movies[0].publication.length, 2);
  assert.equal(jsonLd(plain.html).filter((d) => d['@type'] === 'Movie').length, 1);
});

test('a hostile title cannot break out of the structured data or the markup', { timeout: 60000 }, async () => {
  const hostile = '</script><img src=x onerror=alert(1)>';
  const { html, response } = await render(legacy(verified({ metadata: { originalTitle: hostile }, broadcasts: { status: 'ok', windowDays: 7, generatedAt: new Date().toISOString(), timeZone: 'Europe/Madrid', items: [broadcast('amc', 30, hostile)] } })));
  assert.equal(response.status, 200);
  assert.doesNotMatch(html, /<img src=x onerror/);
  assert.doesNotMatch(html, /<\/script><img/);
  assert.doesNotThrow(() => jsonLd(html));
});
