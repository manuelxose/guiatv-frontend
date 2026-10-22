/**
 * Phase 3E: legacy detail pages through the real CatalogService, the real EPG read model and the real media catalogue
 * repository. Runs only with TEST_MONGO_URI (throwaway database, dropped afterwards), e.g.:
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27118 npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { CatalogService } from './CatalogService';
import { LegacyEnrichmentPolicy } from './LegacyEnrichmentPolicy';
import { LegacyEnrichmentService } from './LegacyEnrichmentService';
import { MongoMediaCatalogRepository } from '@/infrastructure/repositories/MongoMediaCatalogRepository';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { MediaCatalogService } from './MediaCatalogService';
import { buildSearchTokens } from '@/shared/utils/tvMetadata';
import { DateUtils } from '@/shared/utils/dateUtils';

const mongoUri = process.env.TEST_MONGO_URI;
const ON = { CONTENT_LEGACY_ENRICHMENT_ENABLED: 'true', CONTENT_LEGACY_ENRICHMENT_SCOPE: 'all' } as NodeJS.ProcessEnv;

const tmdbService = {
  getImageUrl: (path: string | null) => (path ? `https://image.tmdb.org/t/p/w500${path}` : undefined),
  searchMovies: async () => [], searchTV: async () => [], getMovieById: async () => null, getTVById: async () => null,
} as never;

function build(env: NodeJS.ProcessEnv, repo: MongoMediaCatalogRepository, enrichRepo: Pick<MongoMediaCatalogRepository, 'findByTmdbId'> = repo) {
  const media = new MediaCatalogService(repo, tmdbService, null);
  const enrichment = new LegacyEnrichmentService({ catalog: enrichRepo, policy: new LegacyEnrichmentPolicy(env) });
  return new CatalogService({} as never, { get: async () => null, set: async () => undefined } as never, tmdbService, {} as never, {} as never, {} as never, media, enrichment);
}

test('legacy page parity and enrichment through the real read model', { skip: !mongoUri }, async () => {
  await mongoose.connect(mongoUri as string, { dbName: `guiatv_test_3e_${process.pid}` });
  try {
    const repo = new MongoMediaCatalogRepository();
    const row = await repo.upsert({
      tmdbId: 340837, tmdbType: 'movie', contentType: 'movie', title: 'La cura del bienestar', originalTitle: 'A Cure for Wellness', year: '2016',
      synopsis: 'Sinopsis de TMDB', canonicalGenres: ['Terror'], tmdbGenres: [{ id: 27, name: 'Terror' }], runtimeMinutes: 147, directors: ['Gore Verbinski'],
      metadataSource: 'tmdb', markEnrichedNow: true,
    });
    const today = DateUtils.getTodayYYYYMMDD();
    const inDays = (n: number) => { const d = new Date(Date.now() + n * 86_400_000); return { iso: d.toISOString(), date: d.toISOString().slice(0, 10).replace(/-/g, '') }; };
    const slot = (id: string, n: number, over: Record<string, unknown> = {}, program: Record<string, unknown> = {}) => {
      const { iso, date } = inDays(n);
      return {
        id, date: n === 0 ? today : date, assets: { fallbackChain: [] }, searchTokens: buildSearchTokens(['La cura del bienestar']),
        channel: { id: 'amc', name: 'AMC', normalizedName: 'amc' },
        program: { title: 'La cura del bienestar', tmdbId: 340837, mediaId: row.id, ...program },
        airing: { start: iso, end: new Date(Date.parse(iso) + 2 * 3_600_000).toISOString(), date: n === 0 ? today : date, durationMinutes: 120 }, ...over,
      };
    };
    await TVReadAiringModel.collection.insertMany([
      slot('soon', 1), slot('later', 5), slot('beyond-window', 20),
      slot('other-row', 2, {}, { mediaId: 'someone-else' }), slot('other-title', 3, {}, { title: 'Dobles vidas' }),
    ]);

    const countAll = async () => Object.fromEntries(await Promise.all((await mongoose.connection.db!.listCollections().toArray()).map(async (c) => [c.name, await mongoose.connection.db!.collection(c.name).countDocuments()])));
    const before = await countAll();

    const off = await build({}, repo).getBySlug('movie', 'la-cura-del-bienestar');
    const on = await build(ON, repo).getBySlug('movie', 'la-cura-del-bienestar');

    // Parity: the enriched payload is the legacy payload plus one key; nothing the legacy page showed changed.
    assert.equal('enrichment' in off, false);
    const { enrichment, ...rest } = on;
    assert.deepEqual(rest, off);
    assert.deepEqual(on.airings, off.airings, 'robots-relevant airings untouched');
    assert.ok(on.airings!.length >= 1);

    // The verified broadcasts: the legacy window saw only today and tomorrow; the enrichment adds the 7-day view on catalogue evidence.
    assert.deepEqual(enrichment!.broadcasts!.items.map((i) => i.airingId), ['soon', 'later']);
    assert.equal(enrichment!.broadcasts!.windowDays, 7);
    // M03.2: the base TMDB detail now carries genres and runtime itself, so only the original title is a gap.
    assert.deepEqual(off.genres, ['Terror']);
    assert.equal(off.durationMinutes, 147);
    assert.deepEqual(enrichment!.metadata, { originalTitle: 'A Cure for Wellness' });

    // By id, same result.
    const byId = await build(ON, repo).getDetail('tmdb:movie:340837');
    assert.deepEqual({ ...byId.enrichment, broadcasts: { ...byId.enrichment!.broadcasts, generatedAt: '' } }, { ...enrichment, broadcasts: { ...enrichment!.broadcasts, generatedAt: '' } });

    // A catalogue outage degrades to the exact legacy payload.
    const broken = { findByTmdbId: async () => { throw new Error('mongo down'); } };
    assert.deepEqual(await build(ON, repo, broken).getBySlug('movie', 'la-cura-del-bienestar'), off);

    assert.deepEqual(await countAll(), before, 'no collection created, no document written');
  } finally {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  }
});
