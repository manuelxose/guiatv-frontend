/**
 * Phase 3D on a throwaway database (`guiatv_test_3d_<pid>`, dropped after): the catalogue enrichment of a
 * certified entity, its upcoming broadcasts from the real read model and indexes, and the per-URL guard that
 * keeps the legacy page while it is indexable. Public reads write nothing and read the EPG once.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import type { AddressInfo } from 'node:net';
import { createEntityRoutes } from './entities.routes';
import { PublicContentEntityService } from '@/application/services/PublicContentEntityService';
import { ContentIdentityService } from '@/application/services/ContentIdentityService';
import { ContentCertificationService, createCertificationReader } from '@/application/services/ContentCertification';
import { ContentEntityEnrichment, MediaCatalogEnrichmentSource } from '@/application/services/ContentEntityEnrichment';
import { EntityBroadcastService, MongoBroadcastReader } from '@/application/services/EntityBroadcastService';
import { grant, NOW, ownerKeys, reviewFor, verdictFor } from '@/application/services/ContentCertification.fixtures';
import { EntityPublicReadPolicy } from '@/application/services/EntityPublicReadPolicy';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { MongoMediaCatalogRepository } from '@/infrastructure/repositories/MongoMediaCatalogRepository';
import { MongoContentAttestationRepository, MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository } from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { isWriteCommand } from '@/scripts/readOnlyGuard';

const airing = (id: string, date: string, start: string, end: string, program: Record<string, unknown>, channel = { id: 'amc', name: 'AMC', normalizedName: 'amc', icon: '/storage/channel_icons/amc.webp' }) => ({
  id, date, viewDate: date, channel, program: { title: 'La cura del bienestar', tmdbId: 340837, ...program }, airing: { id, date, start, end, durationMinutes: 120 },
  assets: {}, availability: {}, sourceProvenance: {}, timingContext: {}, relevance: {}, searchTokens: [],
});

test('3D: enrichment, broadcasts and the legacy guard on scratch MongoDB', { skip: !process.env.TEST_MONGO_URI }, async (t) => {
  const dbName = `guiatv_test_3d_${process.pid}`;
  const previous = process.env.CONTENT_ENTITIES_ENABLED;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName, monitorCommands: true });
  const keys = ownerKeys();
  const entities = new MongoContentEntityRepository();
  const slugs = new MongoContentSlugRepository();
  const attestations = new MongoContentAttestationRepository();
  const catalog = new MongoMediaCatalogRepository();
  const identity = new ContentIdentityService(entities, slugs, new MongoContentTitleKeyRepository());
  let clock = NOW;
  const certify = new ContentCertificationService(entities, slugs, attestations, { ownerPublicKeyPem: keys.publicPem, now: () => clock });
  const enrichment = new ContentEntityEnrichment(entities, new MediaCatalogEnrichmentSource(catalog));
  const env = { CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true', CONTENT_ENTITY_PUBLIC_READ_SCOPE: 'all' } as unknown as NodeJS.ProcessEnv;
  const policy = new EntityPublicReadPolicy({ env });
  const writes: string[] = [];
  const finds: string[] = [];
  let watching = false;
  mongoose.connection.getClient().on('commandStarted', (e) => {
    if (!watching) return;
    if (isWriteCommand(e.commandName, e.command)) writes.push(e.commandName);
    if (e.commandName === 'find' && e.command.find === 'tv_read_airings') finds.push(JSON.stringify(e.command.filter));
  });
  const serve = async (broadcasts: EntityBroadcastService) => {
    const app = express();
    app.use('/v2/entities', createEntityRoutes(new PublicContentEntityService(identity, createCertificationReader(attestations, () => keys.publicPem, () => clock), broadcasts), policy));
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    return { server, read: (p: string) => fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/v2/entities/resolve?path=${encodeURIComponent(p)}`, { redirect: 'manual' }) };
  };
  const live = new EntityBroadcastService(new MongoBroadcastReader(), () => clock);
  const { server, read } = await serve(live);
  const code = async (r: Response) => ((await r.json()) as { error?: { code: string } }).error?.code;
  try {
    assert.ok(dbName.startsWith('guiatv_test_'));
    process.env.CONTENT_ENTITIES_ENABLED = 'true';
    await mongoose.connection.dropDatabase();
    await ensureMongoCollectionsAndIndexes();
    await TVReadAiringModel.createIndexes();

    // A certified candidate for the title the catalogue knows (title as the EPG writes it, year as TMDB's release year ±1).
    const v = verdictFor('la_cura_del_bienestar', 340837, {}, 2017);
    const { entity } = await identity.createEntity({
      title: 'La cura del bienestar', normalizedTitle: 'la_cura_del_bienestar', kind: 'movie', year: 2017, externalIds: { tmdb: { type: 'movie', id: 340837 } },
      matching: { method: 'tmdb_exact', confidence: 0.9, decidedAt: NOW, decidedBy: 'ingest', assurance: 'independently_supported' },
    }, [v.path!]);
    await certify.certify({ entityId: entity.entityId, verdict: v, review: reviewFor([v.candidateId]), authorization: grant(keys, [v], {}, 'oa_0000000000000001') });
    const before = (await entities.findById(entity.entityId))!;
    assert.deepEqual(before.metadata ?? {}, {}, 'admission stores identity only');

    await t.test('refuses while the catalogue has no full TMDB detail for the work', async () => {
      const r = await enrichment.enrich(entity.entityId, NOW, { apply: true });
      assert.equal(r.outcome, 'refused');
      assert.deepEqual(r.outcome === 'refused' && r.plan.reasons, ['source_missing']);
      // Only an EPG search match so far: no lastEnrichedAt.
      await catalog.upsert({ tmdbId: 340837, tmdbType: 'movie', contentType: 'movie', title: 'La cura del bienestar', year: '2016', synopsis: 'x', metadataSource: 'epg' });
      const light = await enrichment.enrich(entity.entityId, NOW, { apply: true });
      assert.deepEqual(light.outcome === 'refused' && light.plan.reasons, ['source_not_enriched']);
      assert.equal((await entities.findById(entity.entityId))!.version, before.version, 'a refusal writes nothing');
    });

    await t.test('copies the TMDB facts, with provenance and freshness, and the attestation stays valid', async () => {
      await catalog.upsert({
        tmdbId: 340837, tmdbType: 'movie', contentType: 'movie', title: 'La cura del bienestar', originalTitle: 'A Cure for Wellness', year: '2016',
        synopsis: 'A un joven y ambicioso ejecutivo le encargan una misión en los Alpes suizos.', tmdbGenres: [{ id: 9648, name: 'Misterio' }, { id: 27, name: 'Terror' }],
        runtimeMinutes: 146, posterPath: '/k4XZ47wFZF1aUv7bjLM4Pae2TYm.jpg', backdropPath: '/uXx9wjfJEzLlfqB8GW67SYBrhVT.jpg',
        castSummary: [{ name: 'Dane DeHaan', character: 'Lockhart' }], directors: ['Gore Verbinski'], metadataSource: 'tmdb', markEnrichedNow: true,
      });
      // A later EPG search match flips the catalogue's last writer to `epg` over the rich values: it must not matter.
      await catalog.upsert({ tmdbId: 340837, tmdbType: 'movie', contentType: 'movie', title: 'La cura del bienestar', year: '2016', metadataSource: 'epg' });

      const dry = await enrichment.enrich(entity.entityId, new Date(), { apply: false });
      assert.equal(dry.outcome, 'would_write');
      assert.equal((await entities.findById(entity.entityId))!.version, before.version, 'a dry run writes nothing');

      const done = await enrichment.enrich(entity.entityId, new Date(), { apply: true });
      assert.equal(done.outcome, 'written');
      const after = (await entities.findById(entity.entityId))!;
      assert.equal(after.version, before.version + 1);
      assert.equal(after.status, 'active');
      assert.equal(after.matching.method, 'ai_attested');
      assert.equal(after.canonicalPath, before.canonicalPath);
      assert.equal(after.originalTitle, 'A Cure for Wellness');
      assert.equal(after.metadata.synopsis?.source, 'tmdb');
      assert.deepEqual(after.metadata.genres?.value, ['Misterio', 'Terror']);
      assert.equal(after.metadata.runtimeMinutes?.value, 146);
      assert.ok(after.metadata.enrichment?.mediaId);
      assert.ok(after.contentChangedAt);
      assert.equal((await certify.stateOf(after)).state, 'certified', 'enriching does not touch what the owner approved');
      assert.equal((await read(before.canonicalPath!)).status, 200);
    });

    await t.test('repeating it writes nothing; a changed catalogue is a deterministic refresh', async () => {
      const v1 = (await entities.findById(entity.entityId))!.version;
      assert.equal((await enrichment.enrich(entity.entityId, new Date(), { apply: true })).outcome, 'unchanged');
      assert.equal((await entities.findById(entity.entityId))!.version, v1);
      await catalog.upsert({ tmdbId: 340837, tmdbType: 'movie', contentType: 'movie', title: 'La cura del bienestar', runtimeMinutes: 147, metadataSource: 'tmdb', markEnrichedNow: true });
      assert.equal((await enrichment.enrich(entity.entityId, new Date(), { apply: true })).outcome, 'written');
      assert.equal((await entities.findById(entity.entityId))!.metadata.runtimeMinutes?.value, 147);
    });

    await t.test('a stale writer loses: the copy is applied on the version it read', async () => {
      const e = (await entities.findById(entity.entityId))!;
      assert.equal(await entities.replaceMetadata(entity.entityId, { expectedVersion: e.version - 1, metadata: {} }), null);
      assert.deepEqual((await entities.findById(entity.entityId))!.metadata.runtimeMinutes?.value, 147);
    });

    await t.test('the read model query is one indexed lookup however large the day is', async () => {
      const noise = Array.from({ length: 3000 }, (_, i) => airing(`noise_${i}`, ['20261022', '20261023', '20261024'][i % 3], '2026-10-23T15:00:00.000Z', '2026-10-23T17:00:00.000Z', { title: `Otra ${i}`, tmdbId: 100000 + i }));
      await TVReadAiringModel.insertMany(noise);
      const plan = await TVReadAiringModel.find({ 'program.tmdbId': 340837, date: { $in: ['20261021', '20261022', '20261023', '20261024', '20261025', '20261026', '20261027', '20261028', '20261029'] } })
        .sort({ 'airing.start': 1 }).limit(40).explain('executionStats') as unknown as { executionStats: { totalDocsExamined: number; totalKeysExamined: number } };
      assert.ok(plan.executionStats.totalDocsExamined <= 40, `examined ${plan.executionStats.totalDocsExamined} documents`);
      assert.ok(JSON.stringify(plan).includes('idx_tvread_tmdbid_date'), 'uses the existing (program.tmdbId, date) index');
    });

    await t.test('legacy guard: while the legacy page would be indexable (aired today or tomorrow) the entity page is not served', async () => {
      await TVReadAiringModel.insertMany([airing('a1', '20261023', '2026-10-23T15:29:00.000Z', '2026-10-23T17:53:00.000Z', { mediaId: (await entities.findById(entity.entityId))!.metadata.enrichment!.mediaId })]);
      watching = true;
      assert.equal(await code(await read('/peliculas/la-cura-del-bienestar')), 'ENTITY_PUBLIC_READ_DISABLED');
      assert.equal(policy.stats().totals.legacy_indexable, 1);
      assert.equal(finds.length, 1, 'one EPG read for the whole answer');
      watching = false;
    });

    await t.test('served noindex once no broadcast is in the legacy window: broadcasts, facts and attribution, no writes, one EPG read', async () => {
      await TVReadAiringModel.deleteMany({ id: 'a1' });
      const mediaId = (await entities.findById(entity.entityId))!.metadata.enrichment!.mediaId;
      await TVReadAiringModel.insertMany([
        airing('b_late', '20261026', '2026-10-26T20:00:00.000Z', '2026-10-26T22:00:00.000Z', { mediaId }),
        airing('b_dst', '20261025', '2026-10-25T01:30:00.000Z', '2026-10-25T03:30:00.000Z', { mediaId }, { id: 'la_1', name: 'La 1', normalizedName: 'la-1', icon: '' }),
        airing('b_other_row', '20261025', '2026-10-25T18:00:00.000Z', '2026-10-25T20:00:00.000Z', { mediaId: 'some_tv_row' }),
        airing('b_other_title', '20261025', '2026-10-25T19:00:00.000Z', '2026-10-25T21:00:00.000Z', { title: 'Dobles vidas', mediaId }),
        airing('b_ended', '20261021', '2026-10-21T20:00:00.000Z', '2026-10-21T22:00:00.000Z', { mediaId }),
      ]);
      finds.length = 0;
      watching = true;
      const res = await read('/peliculas/la-cura-del-bienestar');
      watching = false;
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('x-robots-tag'), 'noindex, follow');
      assert.equal(res.headers.get('cache-control'), 'no-store');
      const { data } = (await res.json()) as { data: Record<string, any> };
      assert.deepEqual(data.broadcasts.items.map((b: any) => b.airingId), ['b_dst', 'b_late']);
      assert.deepEqual([data.broadcasts.items[0].localTime, data.broadcasts.items[0].startLocal, data.broadcasts.items[0].channel.path], ['02:30', '2026-10-25T02:30:00+01:00', '/canales/la-1']);
      assert.equal(data.broadcasts.status, 'ok');
      assert.deepEqual(data.images, { poster: 'https://image.tmdb.org/t/p/w500/k4XZ47wFZF1aUv7bjLM4Pae2TYm.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/uXx9wjfJEzLlfqB8GW67SYBrhVT.jpg' });
      assert.equal(data.runtimeMinutes, 147);
      assert.equal(data.tmdbId, 340837);
      assert.equal(data.originalTitle, 'A Cure for Wellness');
      assert.equal(data.attribution.source, 'tmdb');
      assert.ok(data.attribution.updatedAt && data.attribution.notice);
      for (const leaked of ['matching', 'certification', 'lifecycle', 'externalIds', 'metadata', 'enrichment', 'mediaId', 'hash']) assert.ok(!(leaked in data), `${leaked} must not be public`);
      assert.ok(!JSON.stringify(data).includes('some_tv_row'));
      assert.deepEqual(writes, [], 'a public read writes nothing');
      assert.equal(finds.length, 1, 'one query reads the EPG');
    });

    await t.test('an EPG failure is never a claim: the page falls back to legacy', async () => {
      const down = await serve(new EntityBroadcastService({ findByTmdbId: async () => { throw new Error('read model down'); } }, () => clock));
      try { assert.equal(await code(await down.read('/peliculas/la-cura-del-bienestar')), 'ENTITY_PUBLIC_READ_DISABLED'); } finally { down.server.close(); }
    });

    await t.test('invalidation withdraws the copy; the page degrades to identity, not to nothing', async () => {
      assert.equal(await enrichment.invalidate(entity.entityId), 'cleared');
      assert.equal(await enrichment.invalidate(entity.entityId), 'nothing_to_clear');
      const { data } = (await (await read('/peliculas/la-cura-del-bienestar')).json()) as { data: Record<string, any> };
      assert.equal(data.synopsis, undefined);
      assert.equal(data.attribution, undefined);
      assert.equal(data.tmdbId, undefined, 'no validated binding, no TMDB id on the page');
      assert.equal(data.title, 'La cura del bienestar');
      // Without the validated catalogue row only TMDB id + exact title key stand (the weaker, labelled level), so the
      // other-row airing is no longer excluded: one more reason an entity is enriched before its page is shown.
      assert.equal(data.broadcasts.items.length, 3);
      assert.equal((await certify.stateOf((await entities.findById(entity.entityId))!)).state, 'certified');
    });
  } finally {
    server.close();
    await mongoose.connection.dropDatabase().catch(() => undefined);
    await mongoose.disconnect();
    if (previous === undefined) delete process.env.CONTENT_ENTITIES_ENABLED; else process.env.CONTENT_ENTITIES_ENABLED = previous;
  }
});
