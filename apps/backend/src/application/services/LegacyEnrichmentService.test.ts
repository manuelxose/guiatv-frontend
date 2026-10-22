import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogDetailDTO } from '@/application/dto/CatalogDTO';
import type { MediaCatalogEntry } from '@/domain/entities/MediaCatalogEntry';
import { legacyBindingRefusals, legacyMetadataGaps } from '@/domain/services/legacyEnrichment';
import type { EnrichmentSource } from '@/domain/services/entityEnrichment';
import type { AiringRow, IBroadcastReader } from './EntityBroadcastService';
import { LegacyEnrichmentPolicy } from './LegacyEnrichmentPolicy';
import { LegacyEnrichmentService, legacyEnrichmentSnapshot } from './LegacyEnrichmentService';

const NOW = new Date('2026-10-22T10:00:00Z');
const ON = { CONTENT_LEGACY_ENRICHMENT_ENABLED: 'true', CONTENT_LEGACY_ENRICHMENT_SCOPE: 'all' } as NodeJS.ProcessEnv;

const entry = (over: Partial<MediaCatalogEntry> = {}) => ({
  id: 'media_1', tmdbId: 340837, tmdbType: 'movie', contentType: 'movie', title: 'La cura del bienestar', originalTitle: 'A Cure for Wellness',
  year: '2016', synopsis: 'Sinopsis de TMDB', canonicalGenres: ['Terror'], tmdbGenres: [{ id: 27, name: 'Terror' }, { id: 9648, name: 'Misterio' }],
  runtimeMinutes: 147, metadataSource: 'tmdb', lastEnrichedAt: new Date('2026-10-01T00:00:00Z'), castSummary: [], directors: ['Gore Verbinski'], ...over,
}) as unknown as MediaCatalogEntry;

const detail = (over: Partial<CatalogDetailDTO> = {}): CatalogDetailDTO => ({
  catalogId: 'tmdb:movie:340837', source: 'tmdb', contentType: 'movie', title: 'La cura del bienestar', slug: 'la-cura-del-bienestar',
  detailPath: '/peliculas/la-cura-del-bienestar', synopsis: 'Texto editorial propio', genres: [], tmdbId: 340837, releaseYear: 2016, primaryPlatforms: [],
  airings: [], ...over,
}) as CatalogDetailDTO;

const airing = (over: Record<string, unknown> = {}, program: Record<string, unknown> = {}, time: Record<string, unknown> = {}): AiringRow => ({
  id: `a_${Math.random().toString(36).slice(2)}`, date: '20261023', channel: { id: 'amc', name: 'AMC', normalizedName: 'amc' },
  program: { title: 'La cura del bienestar', tmdbId: 340837, mediaId: 'media_1', ...program },
  airing: { start: '2026-10-23T15:29:00.000Z', end: '2026-10-23T17:53:00.000Z', ...time }, ...over,
}) as AiringRow;

function setup(o: { entry?: MediaCatalogEntry | null; rows?: AiringRow[] | Error; env?: NodeJS.ProcessEnv; timeoutMs?: number; catalogDelayMs?: number } = {}) {
  const calls = { catalog: 0, reader: 0 };
  const reader: IBroadcastReader = { findByTmdbId: async () => { calls.reader++; if (o.rows instanceof Error) throw o.rows; return o.rows ?? []; } };
  // Only a read exists: the type admits no write, and a test that reaches for one fails loudly.
  const catalog = new Proxy({ findByTmdbId: async () => { calls.catalog++; if (o.catalogDelayMs) await new Promise((r) => setTimeout(r, o.catalogDelayMs)); return o.entry === undefined ? entry() : o.entry; } }, {
    get(target, prop) { if (prop in target) return (target as never)[prop]; throw new Error(`unexpected catalogue access: ${String(prop)}`); },
  });
  const service = new LegacyEnrichmentService({ catalog: catalog as never, reader, policy: new LegacyEnrichmentPolicy(o.env ?? ON), clock: () => NOW, timeoutMs: o.timeoutMs });
  return { service, calls };
}

test('flag off or out of scope: the very same payload comes back and nothing is read', async () => {
  for (const env of [{}, { CONTENT_LEGACY_ENRICHMENT_ENABLED: 'true' }, { ...ON, CONTENT_LEGACY_ENRICHMENT_KILL: 'true' }, { ...ON, CONTENT_LEGACY_ENRICHMENT_SCOPE: '/peliculas/otra' }] as NodeJS.ProcessEnv[]) {
    const { service, calls } = setup({ env, rows: [airing()] });
    const page = detail();
    assert.equal(await service.apply(page, { tmdbType: 'movie' }), page);
    assert.deepEqual(calls, { catalog: 0, reader: 0 });
  }
});

test('policy: list scope bounds the rollout; a malformed list serves nothing; the kill file works without a restart', () => {
  const list = new LegacyEnrichmentPolicy({ ...ON, CONTENT_LEGACY_ENRICHMENT_SCOPE: '/peliculas/a, /series/b' } as NodeJS.ProcessEnv);
  assert.equal(list.decide('/peliculas/a').enabled, true);
  assert.equal(list.decide('/series/b').enabled, true);
  assert.equal(list.decide('/peliculas/c').enabled, false);
  assert.equal(new LegacyEnrichmentPolicy({ ...ON, CONTENT_LEGACY_ENRICHMENT_SCOPE: '/peliculas/a,not a path' } as NodeJS.ProcessEnv).decide('/peliculas/a').enabled, false);
  let killed = false;
  let at = 0;
  const policy = new LegacyEnrichmentPolicy({ ...ON, CONTENT_LEGACY_ENRICHMENT_KILL_FILE: '/run/kill' } as NodeJS.ProcessEnv, () => at, () => killed);
  assert.equal(policy.decide('/peliculas/a').enabled, true);
  killed = true; at = 6_000;
  assert.deepEqual(policy.decide('/peliculas/a'), { enabled: false, reason: 'killed' });
});

test('epoch moves with every change of who is enriched, so the SSR cache can be dropped', () => {
  const e = (env: Record<string, string>) => new LegacyEnrichmentPolicy(env as NodeJS.ProcessEnv).epoch();
  assert.equal(e({}), 'off');
  assert.equal(e({ CONTENT_LEGACY_ENRICHMENT_ENABLED: 'true' }), 'off');
  assert.equal(e({ ...ON, CONTENT_LEGACY_ENRICHMENT_KILL: 'true' } as never), 'off');
  assert.equal(e(ON as never), 'all');
  assert.equal(e({ ...ON, CONTENT_LEGACY_ENRICHMENT_SCOPE: '/peliculas/b,/peliculas/a' } as never), 'list:/peliculas/a,/peliculas/b');
  assert.equal(e({ ...ON, CONTENT_LEGACY_ENRICHMENT_SCOPE: 'not a path' } as never), 'off');
});

test('a programme page gets verified metadata but no schedule read', async () => {
  const { service, calls } = setup({ rows: [airing()] });
  const out = await service.apply(detail({ contentType: 'program' }), { tmdbType: 'movie', slugBound: true });
  assert.ok(out.enrichment?.metadata);
  assert.equal(out.enrichment?.broadcasts, undefined);
  assert.equal(calls.reader, 0);
});

test('verified additions: gaps are filled, the legacy synopsis and every other field stay exactly as they were', async () => {
  const { service } = setup({ rows: [airing()] });
  const page = detail();
  const out = await service.apply(page, { tmdbType: 'movie', slugBound: true });
  assert.equal(out.synopsis, 'Texto editorial propio');
  assert.deepEqual({ ...out, enrichment: undefined }, { ...page, enrichment: undefined });
  assert.deepEqual(out.enrichment?.metadata, { originalTitle: 'A Cure for Wellness', runtimeMinutes: 147, genres: ['Terror', 'Misterio'] });
  assert.equal(out.enrichment?.attribution?.updatedAt, '2026-10-01T00:00:00.000Z');
  assert.equal(out.enrichment?.broadcasts?.status, 'ok');
  assert.equal(out.enrichment?.broadcasts?.items[0].localTime, '17:29');
  assert.equal(out.enrichment?.broadcasts?.items[0].channel.path, '/canales/amc');
});

test('values the legacy page already has are never offered again', async () => {
  const { service } = setup({ rows: [] });
  const out = await service.apply(detail({ genres: ['Drama'], durationMinutes: 90, title: 'A Cure for Wellness', slug: 'a-cure-for-wellness' }), { tmdbType: 'movie' });
  assert.equal(out.enrichment?.metadata, undefined);
  assert.equal(out.enrichment?.attribution, undefined);
  assert.equal(out.enrichment?.broadcasts?.status, 'none');
});

test('identity binding: every failed check leaves the payload untouched and is counted, never forced', async () => {
  const cases: Array<[string, Parameters<typeof setup>[0], Partial<CatalogDetailDTO>, boolean | undefined, string]> = [
    ['no catalogue row', { entry: null }, {}, true, 'refused:source_missing'],
    ['row never filled from TMDB', { entry: entry({ lastEnrichedAt: undefined }) }, {}, true, 'refused:source_not_enriched'],
    ['another title under the same id', { entry: entry({ title: 'Otra película', originalTitle: 'Other' }) }, {}, true, 'refused:title_mismatch'],
    ['a remake 20 years away', { entry: entry({ year: '1996' }) }, {}, true, 'refused:year_mismatch'],
    ['slug fell back to the first TMDB result', {}, {}, false, 'refused:slug_unbound'],
  ];
  for (const [name, opts, over, slugBound, counter] of cases) {
    const { service } = setup({ rows: [airing()], ...opts });
    const page = detail(over);
    assert.equal(await service.apply(page, { tmdbType: 'movie', slugBound }), page, name);
    assert.ok(service.counters[counter] > 0, `${name}: ${JSON.stringify(service.counters)}`);
  }
  const { service } = setup({});
  const noId = detail({ tmdbId: undefined });
  assert.equal(await service.apply(noId, { tmdbType: 'movie' }), noId);
  assert.equal(await service.apply(detail(), { tmdbType: null }) !== undefined, true);
  assert.equal(service.counters['skipped:no_tmdb_identity'], 2);
});

test('broadcasts need the same catalogue row; a title-only match stays out and similar titles never join', async () => {
  const kept = airing();
  const rows = [
    kept,
    airing({}, { mediaId: undefined }),                                // same id and title, no catalogue row: not verified
    airing({}, { mediaId: 'media_tv' }),                               // same number, a different row
    airing({}, { title: 'Dobles vidas' }),                             // same id, other title
    airing({}, { tmdbId: undefined, title: 'La cura del bienestar' }), // title only
    airing({ id: 'over' }, {}, { start: '2026-10-22T06:00:00.000Z', end: '2026-10-22T08:00:00.000Z' }), // already ended
  ];
  const { service } = setup({ rows });
  const out = await service.apply(detail(), { tmdbType: 'movie', slugBound: true });
  assert.deepEqual(out.enrichment?.broadcasts?.items.map((i) => i.airingId), [kept.id]);
  assert.equal(service.counters['rejected:no_catalogue_row'], 1);
  assert.equal(service.counters['rejected:other_catalogue_row'], 1);
});

test('a programme page with its own TMDB id binds through the same checks', async () => {
  const { service } = setup({ entry: entry({ tmdbType: 'tv', tmdbId: 77, title: 'La Promesa', originalTitle: undefined, year: '2022', contentType: 'series' }), rows: [airing({}, { tmdbId: 77, title: 'La Promesa' })] });
  const page = detail({ source: 'program', contentType: 'series', tmdbId: 77, title: 'La Promesa', slug: 'la-promesa', detailPath: '/series/la-promesa', releaseYear: undefined, durationMinutes: 70 });
  const out = await service.apply(page, { tmdbType: 'tv', slugBound: true });
  assert.equal(out.enrichment?.broadcasts?.items.length, 1);
  assert.equal(out.enrichment?.metadata?.runtimeMinutes, undefined, 'the airing length is not replaced by a runtime');
  const wrongType = setup({ entry: null });
  const unchanged = detail({ source: 'program' });
  assert.equal(await wrongType.service.apply(unchanged, { tmdbType: 'tv' }), unchanged);
});

test('Madrid wall clock across both daylight-saving changes', async () => {
  const rows = [
    airing({ id: 'summer' }, {}, { start: '2026-10-24T19:00:00.000Z', end: '2026-10-24T21:00:00.000Z' }), // CEST (+02:00)
    airing({ id: 'winter' }, {}, { start: '2026-10-25T19:00:00.000Z', end: '2026-10-25T21:00:00.000Z' }), // CET (+01:00) after the change
  ];
  const { service } = setup({ rows });
  const items = (await service.apply(detail(), { tmdbType: 'movie' })).enrichment!.broadcasts!.items;
  assert.deepEqual(items.map((i) => [i.localTime, i.startLocal.slice(-6)]), [['21:00', '+02:00'], ['20:00', '+01:00']]);
});

test('an unreadable schedule claims nothing; metadata is still offered; a schedule outage is not cached as "none"', async () => {
  const { service, calls } = setup({ rows: new Error('mongo down') });
  const out = await service.apply(detail(), { tmdbType: 'movie' });
  assert.equal(out.enrichment?.broadcasts, undefined);
  assert.ok(out.enrichment?.metadata);
  await service.apply(detail(), { tmdbType: 'movie' });
  assert.equal(calls.reader, 2, 'a failed schedule read is retried, not remembered');
});

test('reads are shared: concurrent and repeated requests cost one catalogue read and one schedule read', async () => {
  const { service, calls } = setup({ rows: [airing()] });
  await Promise.all(Array.from({ length: 20 }, () => service.apply(detail(), { tmdbType: 'movie' })));
  await service.apply(detail(), { tmdbType: 'movie' });
  assert.deepEqual(calls, { catalog: 1, reader: 1 });
});

test('a slow read is abandoned at the timeout and the legacy payload is served; repeated failures open the breaker', async () => {
  const { service, calls } = setup({ rows: [airing()], timeoutMs: 20, catalogDelayMs: 200 });
  for (let i = 0; i < 5; i++) {
    const page = detail({ tmdbId: 1000 + i });
    assert.equal(await service.apply(page, { tmdbType: 'movie' }), page);
  }
  assert.equal(service.counters.timeout, 5);
  const before = calls.catalog;
  const page = detail({ tmdbId: 2000 });
  assert.equal(await service.apply(page, { tmdbType: 'movie' }), page);
  assert.equal(calls.catalog, before, 'breaker open: no read attempted');
  assert.equal(service.counters['skipped:breaker_open'], 1);
});

test('pure rules: title similarity alone never binds, and only absent facts are offered', () => {
  const row = { mediaId: 'm', tmdb: { type: 'movie', id: 1 }, metadataSource: 'epg', lastEnrichedAt: new Date(), title: 'Bats', originalTitle: 'Bats', year: 1999, genres: [], directors: [], cast: [] } as EnrichmentSource;
  const page = { source: 'tmdb', tmdbId: 2, tmdbType: 'movie', title: 'Bats', genres: [] } as const;
  assert.deepEqual(legacyBindingRefusals({ ...page, genres: [] }, row), ['tmdb_id_mismatch']);
  assert.deepEqual(legacyMetadataGaps({ ...page, genres: [] }, row), {});
});

test('operators can read the outcome counters of the running service', async () => {
  const { service } = setup({ rows: [airing()] });
  await service.apply(detail(), { tmdbType: 'movie', slugBound: true });
  await service.apply(detail({ tmdbId: 2 }), { tmdbType: 'movie', slugBound: false });
  const snapshot = legacyEnrichmentSnapshot();
  assert.equal(snapshot.counters.attached, 1);
  assert.equal(snapshot.counters['refused:tmdb_id_mismatch'] > 0 || snapshot.counters['refused:slug_unbound'] > 0, true);
  assert.equal(typeof snapshot.epoch, 'string');
});
