/**
 * Phase 2D finalisation on a throwaway MongoDB database (`guiatv_test_2d3_<pid>`, dropped after):
 * the evidence admission gate, the assurance marker, named-reviewer verification and the rollback
 * of provisional entities.   TEST_MONGO_URI=mongodb://127.0.0.1:27118 npm test
 */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
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
import { ContentIdentityService } from './ContentIdentityService';
import { mayBeIndexable } from '@/domain/services/contentIdentity';
import * as ingestionModule from './ContentIdentityIngestion';
import { admissionFromEnv, ContentIdentityIngestion, IdentityObservation, IdentityTrace, observationsFromAirings, runContentIdentity } from './ContentIdentityIngestion';
import { rollbackProvisional } from './ContentIdentityRollback';
import { TvReadModelBuilder } from './TvReadModelBuilder';
import { PRIMARY_EPG_SOURCE_URL } from '@/shared/config/epgSources';

const mongoUri = process.env.TEST_MONGO_URI;

function ingestion(mode: 'shadow' | 'write', admit?: ReadonlySet<string> | 'all') {
  const ports = {
    entities: new MongoContentEntityRepository(),
    slugs: new MongoContentSlugRepository(),
    titleKeys: new MongoContentTitleKeyRepository(),
    evidence: new MongoIdentityEvidenceSource(),
    airingRefs: new MongoAiringEntityRefWriter(),
  };
  return new ContentIdentityIngestion(ports, new ContentIdentityService(ports.entities, ports.slugs, ports.titleKeys, 'test'), {
    mode,
    airingRefs: false,
    maxCreates: 1000,
    actor: 'test',
    admit,
  });
}

let seq = 0;
const obs = (title: string, over: Partial<IdentityObservation> = {}): IdentityObservation => ({
  airingId: `a${++seq}`,
  title,
  editorialCategory: 'Entretenimiento',
  ...over,
});
const day = () => [obs('Espejo Público'), obs('Informe Semanal'), obs('Cine de barrio', { editorialCategory: 'Cine' }), obs('Gran Hermano'), obs('Pasapalabra')];

const counts = async () => ({
  entities: await ContentEntityModel.countDocuments(),
  slugs: await ContentSlugModel.countDocuments(),
  titleKeys: await ContentTitleKeyModel.countDocuments(),
});

test('admission file: only AUTO_ACCEPT of independently supported identities admits; anything else admits nothing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'admit-'));
  const write = (name: string, text: string) => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, text);
    return { CONTENT_IDENTITY_ADMIT_FILE: file } as NodeJS.ProcessEnv;
  };
  const line = (candidateId: string, decision: string, assurance: string) => JSON.stringify({ candidateId, decision, assurance });
  try {
    const env = write(
      'verdicts.jsonl',
      [
        line('a|movie|tmdb:movie:1|2001', 'AUTO_ACCEPT', 'independently_supported'),
        line('b|series', 'AUTO_ACCEPT', 'machine_supported'),
        line('c|show', 'QUARANTINE', 'independently_supported'),
        line('d|show', 'AUTO_REJECT', 'rejected_slot'),
        'logger line that is not json',
        '',
      ].join('\n')
    );
    assert.deepEqual([...admissionFromEnv(env)], ['a|movie|tmdb:movie:1|2001']);
    assert.equal(admissionFromEnv({}).size, 0, 'no file: nothing admitted');
    assert.equal(admissionFromEnv({ CONTENT_IDENTITY_ADMIT_FILE: path.join(dir, 'missing.jsonl') }).size, 0, 'missing file: nothing admitted');
    assert.equal(admissionFromEnv(write('broken.jsonl', `${line('a', 'AUTO_ACCEPT', 'independently_supported')}\n{"candidateId": `)).size, 0, 'a broken file admits nothing, not the lines before the break');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('observations carry the feed year when the sync kept it', () => {
  const airings = [{ id: 'x', program: { title: 'Heat' } }, { id: 'y', program: { title: 'Heat' } }];
  const [x, y] = observationsFromAirings(airings, new Map([['x', 1995]]), new Map([['x', '1996']]));
  assert.deepEqual([x.year, x.rawYear, y.rawYear], [1995, 1996, undefined]);
});

test('2D finalisation on MongoDB', { skip: mongoUri ? false : 'TEST_MONGO_URI not set' }, async (t) => {
  const dbName = `guiatv_test_2d3_${process.pid}`;
  await mongoose.connect(mongoUri as string, { dbName });
  assert.match(mongoose.connection.db!.databaseName, /^guiatv_test_2d3_/);
  const saved = { ...process.env };
  const clearEnv = () => {
    for (const k of Object.keys(process.env)) if (k.startsWith('CONTENT_')) delete process.env[k];
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'admit-'));
  try {
    await mongoose.connection.db!.dropDatabase();
    clearEnv();
    process.env.CONTENT_ENTITIES_ENABLED = 'true';
    await ensureMongoCollectionsAndIndexes();

    const plan: IdentityTrace[] = [];
    const shadow = await ingestion('shadow').run('20261020', day(), plan);
    const creates = plan.filter((p) => p.decision === 'create').map((p) => p.candidateId);
    assert.equal(creates.length, 5, 'the fixture proposes five entities');

    await t.test('closed gate: a write run binds and creates nothing; the proposals stay unresolved', async () => {
      const report = await ingestion('write').run('20261020', day());
      assert.deepEqual(await counts(), { entities: 0, slugs: 0, titleKeys: 0 });
      assert.deepEqual([report.decisions.unresolved, report.reasons.not_admitted, report.decisions.create ?? 0], [5, 5, 0]);
      assert.equal(shadow.decisions.create, 5, 'shadow still reports what an open gate would do');
    });

    await t.test('admitted candidates only; each stored provisional with the assurance marker', async () => {
      const admit = new Set(creates.slice(0, 2));
      const report = await ingestion('write', admit).run('20261020', day());
      assert.deepEqual([report.writes.entities, report.reasons.not_admitted], [2, 3]);
      const stored = await ContentEntityModel.find().lean();
      assert.equal(stored.length, 2);
      for (const e of stored) {
        assert.equal(e.status, 'candidate', 'machine admission is provisional, never active');
        assert.equal(e.matching.assurance, 'independently_supported');
        assert.equal(e.indexability.state, 'noindex');
      }
      const again = await ingestion('write', admit).run('20261021', day());
      assert.deepEqual(await counts(), { entities: 2, slugs: 2, titleKeys: 2 });
      assert.equal(again.writes.entities, 0, 'idempotent replay');
      // A later, wider admission adds only what is new.
      await ingestion('write', new Set(creates)).run('20261022', day());
      assert.deepEqual(await counts(), { entities: 5, slugs: 5, titleKeys: 5 });
    });

    await t.test('provisional entities are not public; a person verifies one, and nothing else changes', async () => {
      const service = new ContentIdentityService(new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository(), 'test');
      const [a, b] = await ContentEntityModel.find().sort({ entityId: 1 }).lean();
      assert.ok(a.canonicalPath);
      assert.equal((await service.resolvePath(a.canonicalPath as string)).status, 'not_found');
      await assert.rejects(service.verifyEntity(a.entityId, 'System', 'ok'), /reviewer_required/);
      await assert.rejects(service.verifyEntity(a.entityId, 'ci-bot', 'ok'), /reviewer_required/);
      const verified = await service.verifyEntity(a.entityId, 'Ana García', 'checked against the broadcaster page');
      assert.deepEqual([verified.status, verified.lifecycle?.changedBy, verified.indexability.state], ['active', 'Ana García', 'noindex']);
      assert.deepEqual([verified.matching.method, verified.matching.decidedBy, verified.matching.assurance], ['manual', 'Ana García', undefined], 'a person\'s decision replaces the machine marker');
      assert.equal(mayBeIndexable(verified), true, 'eligible for indexing, not indexed');
      assert.equal(mayBeIndexable(b), false, 'a machine-admitted candidate is never eligible');
      assert.equal((await service.resolvePath(a.canonicalPath as string)).status, 'canonical');
      await assert.rejects(service.verifyEntity(a.entityId, 'Ana García', 'again'), /invalid_transition/);
      assert.equal((await ContentEntityModel.findOne({ entityId: b.entityId }).lean())?.status, 'candidate');
    });

    await t.test('rollback: provisional only; verified, reviewed and airing-referenced entities survive; dry run changes nothing', async () => {
      const service = new ContentIdentityService(new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository(), 'test');
      const [active, ...rest] = await ContentEntityModel.find().sort({ entityId: 1 }).lean();
      const [reviewedEntity, referenced, plain1, plain2] = rest.filter((e) => e.status === 'candidate');
      assert.equal(active.status, 'active');
      const row = await ContentTitleKeyModel.findOne({ entityId: reviewedEntity.entityId }).lean();
      assert.ok(await service.reviewTitleKey(row!._id, reviewedEntity.entityId, 'Ana García', 'same work'));
      await TVReadAiringModel.collection.insertOne({ id: 'ref1', date: '20261020', program: { entityId: referenced.entityId } } as any);

      const before = await counts();
      const dry = await rollbackProvisional({ apply: false });
      assert.deepEqual(dry, { dryRun: true, provisional: 4, keptReviewed: 1, keptAiringRefs: 1, removed: { entities: 2, slugs: 0, titleKeys: 0 } });
      assert.deepEqual(await counts(), before);

      // A crash after the title keys went: the next run finishes the entity.
      await ContentTitleKeyModel.deleteMany({ entityId: plain1.entityId });
      const done = await rollbackProvisional({ apply: true });
      assert.deepEqual([done.removed.entities, done.removed.slugs, done.removed.titleKeys], [2, 2, 1]);
      assert.deepEqual(await counts(), { entities: 3, slugs: 3, titleKeys: 3 });
      const left = (await ContentEntityModel.find().lean()).map((e) => e.entityId).sort();
      assert.deepEqual(left, [active.entityId, reviewedEntity.entityId, referenced.entityId].sort());
      assert.equal(await ContentEntityModel.countDocuments({ entityId: { $in: [plain1.entityId, plain2.entityId] } }), 0);
      assert.equal((await ContentTitleKeyModel.findOne({ entityId: reviewedEntity.entityId }).lean())?.state, 'verified');
      assert.equal((await rollbackProvisional({ apply: true })).removed.entities, 0, 'idempotent');
      assert.equal(await ContentSlugModel.countDocuments({ entityId: { $nin: left } }), 0, 'no orphan slug');
      // Removed identities can be proposed again: the next admitted run recreates them.
      await ingestion('write', new Set(creates)).run('20261023', day());
      assert.equal(await ContentEntityModel.countDocuments(), 5);
    });

    await t.test('rebuild hook: a write flag alone creates nothing; an admission file creates only what it lists; raw years reach the run', async () => {
      await ContentEntityModel.deleteMany({});
      await ContentSlugModel.deleteMany({});
      await ContentTitleKeyModel.deleteMany({});
      process.env.CONTENT_IDENTITY_WRITES = dbName;
      const programs = ['Espejo Público', 'Pasapalabra'].map((title, h) => ({
        id: `p${h}`, title, channelId: 'la_1', canonicalChannelId: 'la_1', sourceFeed: PRIMARY_EPG_SOURCE_URL,
        startTime: new Date(`2026-10-28T${String(8 + h).padStart(2, '0')}:00:00.000Z`), endTime: new Date(`2026-10-28T${String(9 + h).padStart(2, '0')}:00:00.000Z`),
        duration: 60, titleAliases: [], genreTags: [], genre: 'Magazine', trustFlags: {},
        year: 2001, sourceProvenance: h ? { yearProvenance: { rawXmltvYear: '1999', resolvedWorkYear: 2001, resolvedYearSource: 'tmdb' } } : {},
      }));
      const builder = new TvReadModelBuilder({ findByDate: async () => programs } as any, { clear: async () => undefined } as any);
      const spy = mock.method(ingestionModule, 'runContentIdentity');
      await builder.rebuildDate('2026-10-28');
      assert.deepEqual(await counts(), { entities: 0, slugs: 0, titleKeys: 0 });
      const [, , years, rawYears] = spy.mock.calls[0].arguments as [string, any[], Map<string, unknown>, Map<string, unknown>];
      assert.equal(years.size, 2);
      assert.deepEqual([...rawYears.values()], ['1999'], 'only the programme with provenance has a raw year');
      spy.mock.restore();

      const traces: IdentityTrace[] = [];
      await ingestion('shadow').run('20261028', observationsFromAirings(await TVReadAiringModel.find({ date: '20261028' }).lean(), new Map()), traces);
      const espejo = traces.find((x) => x.key === 'espejo_publico')!;
      const file = path.join(dir, 'verdicts.jsonl');
      fs.writeFileSync(file, JSON.stringify({ candidateId: espejo.candidateId, decision: 'AUTO_ACCEPT', assurance: 'independently_supported' }) + '\n');
      process.env.CONTENT_IDENTITY_ADMIT_FILE = file;
      await builder.rebuildDate('2026-10-28');
      assert.deepEqual((await ContentEntityModel.find().lean()).map((e) => [e.normalizedTitle, e.status, e.matching.assurance]), [['espejo_publico', 'candidate', 'independently_supported']]);
      assert.ok(await runContentIdentity('20261028', [], new Map()), 'hook still reports on an empty day');
    });
  } finally {
    clearEnv();
    Object.assign(process.env, Object.fromEntries(Object.entries(saved).filter(([k]) => k.startsWith('CONTENT_'))));
    fs.rmSync(dir, { recursive: true, force: true });
    await mongoose.connection.db!.dropDatabase().catch(() => undefined);
    await mongoose.disconnect();
  }
});
