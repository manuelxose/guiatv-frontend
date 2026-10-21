/**
 * Phase 2D-2 ingestion on a throwaway MongoDB database (`guiatv_test_2d2_<pid>`, dropped after).
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27118 npm test
 * CONTENT_IDENTITY_BENCH=1 also prints the high-volume measurements as JSON.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { TV_READ_AIRING_ENTITY_INDEX, TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { ContentEntityModel } from '@/infrastructure/database/models/ContentEntity.model';
import { ContentSlugModel } from '@/infrastructure/database/models/ContentSlug.model';
import { ContentTitleKeyModel } from '@/infrastructure/database/models/ContentTitleKey.model';
import {
  MongoAiringEntityRefWriter,
  MongoContentEntityRepository,
  MongoContentSlugRepository,
  MongoContentTitleKeyRepository,
  MongoIdentityEvidenceSource,
} from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { newEntityId, titleKeyId } from '@/domain/services/contentIdentity';
import { PRIMARY_EPG_SOURCE_URL } from '@/shared/config/epgSources';
import { ContentIdentityService } from './ContentIdentityService';
import { ContentIdentityIngestion, IdentityObservation, runContentIdentity } from './ContentIdentityIngestion';
import { TvReadModelBuilder } from './TvReadModelBuilder';

const mongoUri = process.env.TEST_MONGO_URI;
// Read before the suite resets CONTENT_* variables.
const BENCH = Boolean(process.env.CONTENT_IDENTITY_BENCH);
const BENCH_TITLES = Number(process.env.CONTENT_IDENTITY_BENCH_TITLES) || 3000;

function ingestion(
  mode: 'shadow' | 'write',
  opts: { airingRefs?: boolean; maxCreates?: number; titleKeys?: MongoContentTitleKeyRepository } = {}
) {
  const ports = {
    entities: new MongoContentEntityRepository(),
    slugs: new MongoContentSlugRepository(),
    titleKeys: opts.titleKeys ?? new MongoContentTitleKeyRepository(),
    evidence: new MongoIdentityEvidenceSource(),
    airingRefs: new MongoAiringEntityRefWriter(),
  };
  return new ContentIdentityIngestion(ports, new ContentIdentityService(ports.entities, ports.slugs, ports.titleKeys, 'test'), {
    mode,
    airingRefs: opts.airingRefs ?? false,
    maxCreates: opts.maxCreates ?? 10_000,
    actor: 'test',
  });
}

let seq = 0;
const obs = (title: string, over: Partial<IdentityObservation> = {}): IdentityObservation => ({
  airingId: `a${++seq}`,
  title,
  editorialCategory: 'Entretenimiento',
  ...over,
});

const MEDIA = {
  cenicienta1950: '64a000000000000000000001',
  cenicienta2015: '64a000000000000000000002',
  csi: '64a000000000000000000003',
  novia1: '64a000000000000000000004',
  novia2: '64a000000000000000000005',
  other: '64a000000000000000000006',
};

/** Real-world shapes from the 2C/2D-1 audits: accents, episode markers, remakes, aliases, slots, non-Latin titles. */
const dayFixture = (): IdentityObservation[] => [
  obs('Espejo Público'),
  obs('Espejo Publico'),
  obs('La Promesa T1 E929', { editorialCategory: 'Series' }),
  obs('La Promesa T1 E930', { editorialCategory: 'Series' }),
  obs('Cine de barrio', { editorialCategory: 'Cine' }),
  obs('Cenicienta', { editorialCategory: 'Cine', tmdbId: 11224, mediaId: MEDIA.cenicienta1950, year: 1950 }),
  obs('Cenicienta', { editorialCategory: 'Cine', tmdbId: 150689, mediaId: MEDIA.cenicienta2015 }),
  obs('C.S.I. Miami', { editorialCategory: 'Series', tmdbId: 1620 }),
  obs('CSI: Miami', { editorialCategory: 'Series', tmdbId: 1620 }),
  obs('La novia', { editorialCategory: 'Cine', tmdbId: 501, mediaId: MEDIA.novia1 }),
  obs('La novia', { editorialCategory: 'Cine', tmdbId: 502, mediaId: MEDIA.novia2 }),
  obs('Mi casa', { editorialCategory: 'Cine', tmdbId: 777, mediaId: MEDIA.other }),
  obs('No'),
  obs('Bluey', { editorialCategory: 'Infantil' }),
  obs('Cine'),
  obs('Película'),
  obs('捕风追影2', { editorialCategory: 'Cine' }),
  obs('Real Madrid - Barcelona', { editorialCategory: 'Deportes', sportFacet: 'futbol' }),
];

async function seedEvidence(db: NonNullable<typeof mongoose.connection.db>) {
  const catalog = (id: string, tmdbId: number, tmdbType: string, title: string, year?: string, originalTitle?: string) => ({
    _id: new mongoose.Types.ObjectId(id),
    tmdbId,
    tmdbType,
    title,
    originalTitle,
    year,
    contentType: tmdbType === 'movie' ? 'movie' : 'series',
    normalizedTitle: title.toLowerCase(),
    normalizedIdentity: title.toLowerCase(),
    metadataSource: 'tmdb',
  });
  await db.collection('media_catalog').insertMany([
    catalog(MEDIA.cenicienta1950, 11224, 'movie', 'La Cenicienta', '1950', 'Cenicienta'),
    catalog(MEDIA.cenicienta2015, 150689, 'movie', 'Cenicienta', '2015'),
    catalog(MEDIA.csi, 1620, 'tv', 'CSI: Miami', '2002', 'C.S.I. Miami'),
    catalog(MEDIA.novia1, 501, 'movie', 'La novia', '2015'),
    catalog(MEDIA.novia2, 502, 'movie', 'La novia', '2015'),
    catalog(MEDIA.other, 777, 'movie', 'Una casa distinta', '2001'),
  ]);
  // A legacy page for "Noé" answered /programas/no (the legacy slugify drops "é").
  await db.collection('tv_program_brands').insertMany([
    { brandKey: 'noe', title: 'Noé', normalizedTitle: 'noe' },
    { brandKey: 'espejo_publico', title: 'Espejo Público', normalizedTitle: 'espejo publico' },
  ]);
}

const counts = async () => ({
  entities: await ContentEntityModel.countDocuments(),
  slugs: await ContentSlugModel.countDocuments(),
  titleKeys: await ContentTitleKeyModel.countDocuments(),
});

const legacyAiring = (id: string, date: string, title: string) => ({
  id,
  date,
  viewDate: date,
  channel: { id: 'la_1' },
  program: { brandKey: 'x', title, editorialCategory: 'Entretenimiento', titleAliases: [] },
  airing: { start: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T13:00:00.000Z` },
  assets: {},
  availability: { live: true },
  sourceProvenance: {},
  timingContext: {},
  relevance: {},
});

test('content identity ingestion on MongoDB', { skip: mongoUri ? false : 'TEST_MONGO_URI not set' }, async (t) => {
  const dbName = `guiatv_test_2d2_${process.pid}`;
  await mongoose.connect(mongoUri as string, { dbName, monitorCommands: true });
  const db = mongoose.connection.db!;
  assert.match(db.databaseName, /^guiatv_test_2d2_/);
  let commands = 0;
  mongoose.connection.getClient().on('commandStarted', (e) => {
    if (!['hello', 'isMaster', 'ping', 'endSessions'].includes(e.commandName)) commands++;
  });
  const saved = { ...process.env };
  const restoreEnv = () => {
    for (const k of Object.keys(process.env)) if (k.startsWith('CONTENT_')) delete process.env[k];
    Object.assign(process.env, Object.fromEntries(Object.entries(saved).filter(([k]) => k.startsWith('CONTENT_'))));
  };
  const clearIdentityEnv = () => {
    for (const k of Object.keys(process.env)) if (k.startsWith('CONTENT_IDENTITY')) delete process.env[k];
  };
  const start = (h: number) => new Date(`2026-10-28T${String(h).padStart(2, '0')}:00:00.000Z`);
  const programs = ['Espejo Público', 'La Promesa T1 E931', 'Cine de barrio', 'Película'].map((title, h) => ({
    id: `p${h}`,
    title,
    channelId: 'la_1',
    canonicalChannelId: 'la_1',
    sourceFeed: PRIMARY_EPG_SOURCE_URL,
    startTime: start(8 + h),
    endTime: start(9 + h),
    duration: 60,
    titleAliases: [],
    genreTags: [],
    genre: ['Magazine', 'Series', undefined, undefined][h],
    sourceProvenance: {},
    trustFlags: {},
  }));
  const builder = new TvReadModelBuilder({ findByDate: async () => programs } as any, { clear: async () => undefined } as any);
  const snapshot = async () =>
    (await TVReadAiringModel.find({ date: '20261028' }).sort({ id: 1 }).lean()).map(({ _id, createdAt, updatedAt, __v, ...rest }: any) => {
      const { entityId, canonicalPath, ...program } = rest.program;
      return { ...rest, program };
    });
  let baseline: unknown[] = [];
  const contentCollections = async () =>
    (await db.listCollections().toArray()).map((c) => c.name).filter((n) => n.startsWith('content_'));

  try {
    await db.dropDatabase();
    restoreEnv();
    for (const k of Object.keys(process.env)) if (k.startsWith('CONTENT_')) delete process.env[k];
    await ensureMongoCollectionsAndIndexes();
    await seedEvidence(db);

    await t.test('shadow: reads only; reports what write mode would do', async () => {
      const report = await ingestion('shadow').run('20261020', dayFixture());
      assert.deepEqual(await contentCollections(), [], 'shadow creates no collection, index or document');
      assert.equal(report.airings, 18);
      assert.deepEqual(report.excluded, { generic_title: 2, unkeyable_title: 1, sport_event: 1 });
      assert.deepEqual(report.tmdb, { confirmed: 6, unconfirmed: 1 });
      assert.deepEqual(report.kinds, { show: 3, series: 3, movie: 5, unknown: 1 });
      assert.equal(report.decisions.create, 9);
      assert.equal(report.decisions.bind, 1, 'C.S.I. Miami binds to the CSI: Miami entity (same TMDB id)');
      assert.equal(report.decisions.review, 1);
      assert.equal(report.decisions.unresolved, 1, 'unknown kind: reported, not stored');
      assert.deepEqual(report.reasons, { tmdb_conflict: 1, unknown_kind: 1 });
      assert.equal(report.estimate.newEntities, 9);
      assert.deepEqual(report.slugs, { allocated: 8, collisions: 0, historicConflicts: 1, pathless: 1 });
      assert.equal(report.airingRefs.skipped, 'shadow');
    });

    await t.test('write flags before the store is ready: the identity step fails, the day does not', async () => {
      process.env.CONTENT_ENTITIES_ENABLED = 'true';
      process.env.CONTENT_IDENTITY_WRITES = dbName;
      process.env.CONTENT_IDENTITY_AIRING_REFS = 'true';
      assert.equal(await runContentIdentity('20261028', [legacyAiring('n1', '20261028', 'Espejo Público')], new Map()), null);
      const result = await builder.rebuildDate('2026-10-28');
      assert.equal(result.airingsUpserted, 4);
      assert.deepEqual(await contentCollections(), [], 'a refused write never creates a collection implicitly');
      clearIdentityEnv();
      baseline = await snapshot();
    });

    process.env.CONTENT_ENTITIES_ENABLED = 'true';
    await ensureMongoCollectionsAndIndexes();

    await t.test('write: entities, paths and review rows match the shadow plan', async () => {
      const report = await ingestion('write').run('20261020', dayFixture());
      assert.equal(report.writes.entities, 9);
      assert.equal(report.writes.titleKeys, 11);
      assert.deepEqual(report.slugs, { allocated: 8, collisions: 0, historicConflicts: 1, pathless: 1 });
      assert.deepEqual(await counts(), { entities: 9, slugs: 8, titleKeys: 11 });

      const paths = (await ContentSlugModel.find().lean()).map((s) => s._id).sort();
      assert.deepEqual(paths, [
        '/peliculas/cenicienta',
        '/peliculas/cenicienta-2015',
        '/peliculas/la-novia',
        '/peliculas/mi-casa',
        '/programas/cine-de-barrio',
        '/programas/espejo-publico',
        '/series/csi-miami',
        '/series/la-promesa',
      ]);
      const cenicienta = await ContentEntityModel.find({ normalizedTitle: 'cenicienta' }).sort({ year: 1 }).lean();
      assert.deepEqual(cenicienta.map((e) => [e.year, e.externalIds?.tmdb?.id, e.canonicalPath]), [
        [1950, 11224, '/peliculas/cenicienta'],
        [2015, 150689, '/peliculas/cenicienta-2015'],
      ]);
      // "Mi casa": the airing's TMDB id names another title, so it's a title-only film.
      const miCasa = await ContentEntityModel.findOne({ normalizedTitle: 'mi_casa' }).lean();
      assert.equal(miCasa?.externalIds?.tmdb, undefined);
      // "No": /programas/no is the historic URL of "Noé" too, so it isn't taken.
      const no = await ContentEntityModel.findOne({ normalizedTitle: 'no' }).lean();
      assert.equal(no?.canonicalPath, undefined);
      // Every entity is a noindex candidate; nothing is verified by ingestion.
      assert.equal(await ContentEntityModel.countDocuments({ $or: [{ status: { $ne: 'candidate' } }, { 'indexability.state': 'index' }] }), 0);
      assert.equal(await ContentTitleKeyModel.countDocuments({ state: 'verified' }), 0);
      const csi = await ContentTitleKeyModel.find({ discriminator: 'tmdb:tv:1620' }).lean();
      assert.equal(new Set(csi.map((r) => r.entityId)).size, 1);
      assert.equal(csi.length, 2);
      const queue = await new MongoContentTitleKeyRepository().listReviewQueue(10);
      assert.deepEqual(queue.map((r) => [r.id, r.reason, r.candidates?.length]), [['la_novia|movie|tmdb:movie:502', 'tmdb_conflict', 1]]);
      assert.equal(await ContentTitleKeyModel.countDocuments({ kind: 'unknown' }), 0);
    });

    await t.test('rerun is idempotent: no new entity, slug or row; seen rows touched', async () => {
      const before = await counts();
      const lastSeen = (await ContentTitleKeyModel.findById('la_novia|movie|tmdb:movie:502').lean())?.lastSeenAt;
      const report = await ingestion('write').run('20261021', dayFixture());
      assert.deepEqual(await counts(), before);
      assert.deepEqual(report.writes, { entities: 0, titleKeys: 0, slugs: 0, duplicateKeyConflicts: 0, claimConflicts: 0 });
      assert.equal(report.decisions.create ?? 0, 0);
      assert.ok(((await ContentTitleKeyModel.findById('la_novia|movie|tmdb:movie:502').lean())?.lastSeenAt as Date) > (lastSeen as Date));
      // The pathless "No" is retried and still refused; it never falls back to another path.
      assert.deepEqual(report.slugs, { allocated: 0, collisions: 0, historicConflicts: 1, pathless: 1 });
    });

    await t.test('simultaneous rebuilds of different dates: one entity per identity', async () => {
      const titles = Array.from({ length: 60 }, (_, i) => `Programa concurrente ${i}`);
      const day = () => titles.map((title) => obs(title));
      const reports = await Promise.all([ingestion('write').run('20261022', day()), ingestion('write').run('20261023', day())]);
      const entities = await ContentEntityModel.find({ normalizedTitle: /^programa_concurrente_/ }).lean();
      assert.equal(entities.length, 60);
      assert.equal(new Set(entities.map((e) => e.normalizedTitle)).size, 60);
      assert.equal(await ContentSlugModel.countDocuments({ _id: /^\/programas\/programa-concurrente-/ }), 60);
      assert.equal(await ContentEntityModel.countDocuments({ normalizedTitle: /^programa_concurrente_/, canonicalPath: { $exists: false } }), 0);
      const created = reports.reduce((n, r) => n + r.writes.entities, 0);
      assert.equal(created, 60);
    });

    await t.test('partial failure recovery: a claimed row without entity, an entity without path', async () => {
      const claimedId = newEntityId();
      await new MongoContentTitleKeyRepository().insert({
        id: titleKeyId('el_hormiguero', 'show', '*'),
        key: 'el_hormiguero',
        kind: 'show',
        discriminator: '*',
        entityId: claimedId,
        state: 'candidate',
        method: 'title',
        confidence: 0.8,
        decidedBy: 'test',
      });
      const service = new ContentIdentityService(new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository(), 'test');
      const pathless = await service.ensureEntity({
        kind: 'show',
        title: 'Saber y ganar',
        normalizedTitle: 'saber_y_ganar',
        externalIds: {},
        matching: { method: 'title', confidence: 0.8, decidedAt: new Date(), decidedBy: 'test' },
      });
      await new MongoContentTitleKeyRepository().insert({
        id: titleKeyId('saber_y_ganar', 'show', '*'),
        key: 'saber_y_ganar',
        kind: 'show',
        discriminator: '*',
        entityId: pathless.entityId,
        state: 'candidate',
        method: 'title',
        confidence: 0.8,
        decidedBy: 'test',
      });
      const report = await ingestion('write').run('20261024', [obs('El hormiguero'), obs('Saber y ganar')]);
      assert.equal(report.decisions.matched, 2);
      assert.equal((await ContentEntityModel.findOne({ entityId: claimedId }).lean())?.canonicalPath, '/programas/el-hormiguero');
      assert.equal((await ContentEntityModel.findOne({ entityId: pathless.entityId }).lean())?.canonicalPath, '/programas/saber-y-ganar');
    });

    await t.test('one failing candidate is skipped and counted; the rest of the day resolves', async () => {
      class FlakyTitleKeys extends MongoContentTitleKeyRepository {
        override async insert(row: Parameters<MongoContentTitleKeyRepository['insert']>[0]) {
          if (row.key === 'fallo_puntual') throw new Error('simulated write failure');
          return super.insert(row);
        }
      }
      const day = () => [obs('Fallo puntual'), obs('Sigue adelante')];
      const report = await ingestion('write', { titleKeys: new FlakyTitleKeys() }).run('20261025', day());
      assert.equal(report.failed, 1);
      assert.equal(report.writes.entities, 1);
      assert.equal(await ContentEntityModel.countDocuments({ normalizedTitle: 'fallo_puntual' }), 0);
      const retry = await ingestion('write').run('20261025', day());
      assert.equal(retry.failed, 0);
      assert.equal(retry.writes.entities, 1, 'the next run picks the skipped candidate up');
    });

    await t.test('creation is bounded per run; the rest is deferred to the next run', async () => {
      const day = () => ['Uno limitado', 'Dos limitado', 'Tres limitado'].map((title) => obs(title));
      const first = await ingestion('write', { maxCreates: 1 }).run('20261025', day());
      assert.equal(first.writes.entities, 1);
      assert.equal(first.deferred, 2);
      const second = await ingestion('write', { maxCreates: 5 }).run('20261025', day());
      assert.equal(second.writes.entities, 2);
      assert.equal(second.decisions.matched, 1);
    });

    await t.test('airing references: refused until the hand-built index exists, then applied', async () => {
      const date = '20261026';
      await TVReadAiringModel.insertMany([legacyAiring('r1', date, 'Espejo Público'), legacyAiring('r2', date, 'Telecinco noticias fijas')]);
      const run = () =>
        ingestion('write', { airingRefs: true }).run(date, [
          obs('Espejo Público', { airingId: 'r1' }),
          obs('Telecinco noticias fijas', { airingId: 'r2', editorialCategory: 'Infantil' }),
        ]);
      const refused = await run();
      assert.equal(refused.airingRefs.skipped, 'index_missing');
      assert.equal(await TVReadAiringModel.countDocuments({ 'program.entityId': { $exists: true } }), 0);

      await TVReadAiringModel.collection.createIndex(TV_READ_AIRING_ENTITY_INDEX.key, TV_READ_AIRING_ENTITY_INDEX.options);
      const applied = await run();
      assert.equal(applied.airingRefs.applied, 1, 'only the bound title; the unknown-kind one stays unlinked');
      const r1 = await TVReadAiringModel.findOne({ id: 'r1' }).lean();
      assert.equal(r1?.program.canonicalPath, '/programas/espejo-publico');
      assert.match(String(r1?.program.entityId), /^ce_/);
      const plan = await TVReadAiringModel.collection
        .find({ 'program.entityId': r1?.program.entityId })
        .sort({ 'airing.start': 1 })
        .explain('queryPlanner');
      assert.match(JSON.stringify(plan.queryPlanner.winningPlan), /idx_tvread_entity_start/);
    });

    await t.test('review: approve and reject need a named reviewer; rejected rows stay unbound', async () => {
      const service = new ContentIdentityService(new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository(), 'test');
      const target = await ContentEntityModel.findOne({ normalizedTitle: 'la_novia' }).lean();
      await assert.rejects(service.reviewTitleKey('la_novia|movie|tmdb:movie:502', target!.entityId, ''), /reviewer_required/);
      await assert.rejects(service.rejectTitleKey('mi_casa|movie|*', 'system'), /reviewer_required/);
      // Rejecting a provisional title-only binding unbinds it; ingestion then holds the title.
      assert.equal(await service.rejectTitleKey('mi_casa|movie|*', 'owner', 'container slot, not a film'), true);
      assert.equal((await ContentTitleKeyModel.findById('mi_casa|movie|*').lean())?.entityId, undefined);
      const report = await ingestion('write').run('20261027', [obs('Mi casa', { editorialCategory: 'Cine' })]);
      assert.equal(report.decisions.held, 1);
      const queue = async () => (await service.reviewQueue()).rows.map((r) => r.id);
      assert.deepEqual(await queue(), ['la_novia|movie|tmdb:movie:502']);
      assert.equal(await service.reviewTitleKey('la_novia|movie|tmdb:movie:502', target!.entityId, 'owner'), true);
      assert.deepEqual(await queue(), []);
      const counts = (await service.reviewQueue()).counts;
      assert.equal(counts.rejected, 1);
      assert.equal(counts.verified, 1);
    });

    await t.test('EPG output parity: flags off, shadow and writes store the same airings apart from refs', async () => {
      clearIdentityEnv();
      await builder.rebuildDate('2026-10-28');
      assert.deepEqual(await snapshot(), baseline);
      process.env.CONTENT_IDENTITY_SHADOW = 'true';
      await builder.rebuildDate('2026-10-28');
      assert.deepEqual(await snapshot(), baseline);
      process.env.CONTENT_IDENTITY_WRITES = dbName;
      process.env.CONTENT_IDENTITY_AIRING_REFS = 'true';
      await builder.rebuildDate('2026-10-28');
      assert.deepEqual(await snapshot(), baseline);
      // Espejo Público, La Promesa and Cine de barrio; the generic "Película" slot stays unlinked.
      assert.equal(await TVReadAiringModel.countDocuments({ date: '20261028', 'program.entityId': { $exists: true } }), 3);
      clearIdentityEnv();
    });

    await t.test('high volume: one bounded batch per day, idempotent rerun', async () => {
      await ContentEntityModel.deleteMany({});
      await ContentSlugModel.deleteMany({});
      await ContentTitleKeyModel.deleteMany({});
      const distinct = BENCH_TITLES;
      const perTitle = 3;
      const categories = ['Entretenimiento', 'Series', 'Cine', 'Noticias', 'Infantil', 'Otros'];
      const day = () =>
        Array.from({ length: distinct * perTitle }, (_, i) => {
          const n = i % distinct;
          const category = categories[n % categories.length];
          return obs(`Título de prueba ${n}${i % 2 ? ` T1 E${i}` : ''}`, {
            editorialCategory: category,
            year: category === 'Cine' ? 1990 + (n % 30) : undefined,
          });
        });
      const measure = async (label: string, mode: 'shadow' | 'write') => {
        global.gc?.();
        const heap = process.memoryUsage().heapUsed;
        commands = 0;
        const report = await ingestion(mode).run('20261029', day());
        return { label, ms: report.durationMs, commands, heapDeltaMb: Math.round((process.memoryUsage().heapUsed - heap) / 1e5) / 10, report };
      };
      const shadow = await measure('shadow', 'shadow');
      const first = await measure('write (first run)', 'write');
      const rerun = await measure('write (rerun)', 'write');
      if (BENCH) {
        console.log(JSON.stringify([shadow, first, rerun].map(({ report, ...m }) => ({ ...m, airings: report.airings, candidates: report.candidates, decisions: report.decisions, writes: report.writes, slugs: report.slugs }))));
      }
      assert.equal(shadow.report.candidates, distinct);
      // Reads are `$in` batches of 1000: a handful of commands per thousand candidates, not one per airing.
      const bound = 5 + 4 * Math.ceil(distinct / 1000);
      assert.ok(shadow.commands <= bound, `shadow reads are batched (${shadow.commands} commands)`);
      assert.equal(first.report.writes.entities, shadow.report.estimate.newEntities);
      assert.equal(rerun.report.writes.entities + rerun.report.writes.titleKeys + rerun.report.writes.slugs, 0);
      assert.ok(rerun.commands <= bound, `rerun is batched (${rerun.commands} commands)`);
    });
  } finally {
    restoreEnv();
    await db.dropDatabase().catch(() => undefined);
    await mongoose.disconnect();
  }
});
