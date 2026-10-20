/**
 * Phase 2D-1 persistent identity foundation.
 * Schema/flag tests always run. Database tests run only when TEST_MONGO_URI is set, against a
 * throwaway database `guiatv_test_2d1_<pid>` that is dropped afterwards, e.g.:
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27118 npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ContentEntityModel } from '../database/models/ContentEntity.model';
import { ContentSlugModel } from '../database/models/ContentSlug.model';
import { ContentTitleKeyModel } from '../database/models/ContentTitleKey.model';
import {
  isValidAiringEntityRef,
  TV_READ_AIRING_ENTITY_INDEX,
  TVReadAiringModel,
} from '../database/models/TVReadAiring.model';
import { CONTENT_IDENTITY_RESOURCES, ensureMongoCollectionsAndIndexes } from '../database/initializeMongoCollections';
import { isContentEntitiesEnabled } from '@/shared/config/contentEntities';
import { ContentIdentityService, createContentIdentityService } from '@/application/services/ContentIdentityService';
import {
  ContentIdentityNotReadyError,
  MongoContentEntityRepository,
  MongoContentSlugRepository,
  MongoContentTitleKeyRepository,
} from './MongoContentIdentityRepositories';
import { newEntityId, titleKeyId } from '@/domain/services/contentIdentity';

const E1 = 'ce_01JBQ7Z4M8V2K5T3N9P6R1W0XA';

const entityDoc = (over: Record<string, unknown> = {}) => ({
  entityId: E1,
  kind: 'series',
  title: 'Friends',
  normalizedTitle: 'friends',
  matching: { method: 'tmdb_id', confidence: 1, decidedAt: new Date(), decidedBy: 'test' },
  ...over,
});

const legacyAiring = (over: Record<string, unknown> = {}) => ({
  id: '20261020_la_1_20261020150000',
  date: '20261020',
  viewDate: '20261020',
  channel: { id: 'la_1' },
  program: { brandKey: 'espejo_publico', title: 'Espejo Público', normalizedTitle: 'espejo publico', titleAliases: [] },
  airing: { start: '2026-10-20T13:00:00.000Z' },
  assets: {},
  availability: { live: true },
  sourceProvenance: {},
  timingContext: {},
  relevance: {},
  ...over,
});

test('feature flag: off unless explicitly enabled; service factory returns null while off', () => {
  for (const value of [undefined, '', 'false', '0', 'off', 'no', 'enabled?']) {
    assert.equal(isContentEntitiesEnabled({ CONTENT_ENTITIES_ENABLED: value }), false, String(value));
    assert.equal(createContentIdentityService({ CONTENT_ENTITIES_ENABLED: value }), null);
  }
  for (const value of ['true', 'TRUE', '1', 'on', ' yes ']) {
    assert.equal(isContentEntitiesEnabled({ CONTENT_ENTITIES_ENABLED: value }), true, value);
  }
  assert.ok(createContentIdentityService({ CONTENT_ENTITIES_ENABLED: 'true' }) instanceof ContentIdentityService);
});

test('new models are inert on import: no auto collection or index creation', () => {
  for (const { model } of CONTENT_IDENTITY_RESOURCES) {
    assert.equal(model.schema.get('autoIndex'), false, model.modelName);
    assert.equal(model.schema.get('autoCreate'), false, model.modelName);
  }
});

test('content_entities schema: strict validation', () => {
  assert.equal(new ContentEntityModel(entityDoc()).validateSync(), undefined);
  assert.throws(() => new ContentEntityModel(entityDoc({ bogus: 1 })), /bogus/);
  const bad = (over: Record<string, unknown>) => new ContentEntityModel(entityDoc(over)).validateSync();
  assert.ok(bad({ entityId: 'friends' })?.errors.entityId);
  assert.ok(bad({ kind: 'film' })?.errors.kind);
  assert.ok(bad({ status: 'deleted' })?.errors.status);
  assert.ok(bad({ status: 'merged' })?.errors.mergedInto, 'merged needs mergedInto');
  assert.ok(bad({ mergedInto: newEntityId() })?.errors.mergedInto, 'only merged has mergedInto');
  assert.ok(bad({ canonicalPath: '/series/Friends' })?.errors.canonicalPath);
  assert.ok(bad({ externalIds: { tmdb: { type: 'tv', id: 1.5 } } })?.errors['externalIds.tmdb.id']);
  assert.ok(bad({ normalizedTitle: '' })?.errors.normalizedTitle);
  assert.ok(bad({ matching: { method: 'tmdb_id', confidence: 2, decidedAt: new Date(), decidedBy: 'x' } })?.errors['matching.confidence']);
  const doc = new ContentEntityModel(entityDoc());
  assert.equal(doc.status, 'candidate');
  assert.equal(doc.version, 0);
  assert.equal(doc.indexability.state, 'noindex');
});

test('content_slugs and content_title_keys schemas: strict validation', () => {
  const slug = (over: Record<string, unknown>) =>
    new ContentSlugModel({ _id: '/series/friends', entityId: E1, role: 'canonical', reason: 'initial', createdBy: 'test', ...over }).validateSync();
  assert.equal(slug({}), undefined);
  assert.ok(slug({ _id: '/series/Friends' })?.errors._id, 'not normalised');
  assert.ok(slug({ _id: '/programas/cine' })?.errors._id, 'reserved');
  assert.ok(slug({ role: 'alias' })?.errors.role);

  const key = (over: Record<string, unknown>) =>
    new ContentTitleKeyModel({
      _id: titleKeyId('friends', 'series', '*'),
      key: 'friends',
      kind: 'series',
      discriminator: '*',
      entityId: E1,
      state: 'candidate',
      method: 'title_kind',
      confidence: 0.8,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      decidedBy: 'test',
      ...over,
    }).validateSync();
  assert.equal(key({}), undefined);
  assert.ok(key({ state: 'ambiguous' })?.errors.entityId, 'ambiguous rows are unbound');
  assert.ok(key({ state: 'verified', entityId: undefined })?.errors.entityId, 'verified rows are bound');
  assert.ok(key({ discriminator: 'imdb:tt1' })?.errors.discriminator);
  assert.ok(key({ key: 'Friends' })?.errors.key);
});

test('tv_read_airings: existing rows validate, entity refs optional and validated, no index change', () => {
  assert.equal(new TVReadAiringModel(legacyAiring()).validateSync(), undefined);
  const withRef = legacyAiring({
    program: { ...legacyAiring().program, entityId: E1, canonicalPath: '/programas/espejo-publico' },
  });
  assert.equal(new TVReadAiringModel(withRef).validateSync(), undefined);
  assert.ok(isValidAiringEntityRef({ entityId: E1 }));
  assert.ok(!isValidAiringEntityRef({ entityId: 'espejo_publico' }));
  assert.ok(!isValidAiringEntityRef({ canonicalPath: '/programas/espejo-publico' }), 'path without entity');
  assert.ok(!isValidAiringEntityRef({ entityId: E1, canonicalPath: '/programas/Espejo' }));
  assert.ok(new TVReadAiringModel(legacyAiring({ program: { title: 'x', entityId: 7 } })).validateSync()?.errors.program);

  const names = TVReadAiringModel.schema.indexes().map(([, options]) => options?.name).filter(Boolean);
  assert.ok(!names.includes(TV_READ_AIRING_ENTITY_INDEX.options.name), 'entity index must not be built at boot in 2D-1');
  for (const existing of [
    'idx_tvread_date_group_timeslot_sort', 'idx_tvread_date_group_sort_start', 'idx_tvread_date_sort_start',
    'idx_tvread_date_partofday_sort_start', 'idx_tvread_date_airing_window', 'idx_tvread_channel_date_start',
    'idx_tvread_brand_date_start', 'idx_tvread_search_tokens', 'idx_tvread_sport_date_start',
    'idx_tvread_category_date_start', 'idx_tvread_tmdbid_date',
  ]) {
    assert.ok(names.includes(existing), existing);
  }
});

const mongoUri = process.env.TEST_MONGO_URI;

test('content identity on MongoDB', { skip: mongoUri ? false : 'TEST_MONGO_URI not set' }, async (t) => {
  const dbName = `guiatv_test_2d1_${process.pid}`;
  await mongoose.connect(mongoUri as string, { dbName });
  const db = mongoose.connection.db!;
  assert.match(db.databaseName, /^guiatv_test_2d1_/);
  const collections = async () => (await db.listCollections().toArray()).map((c) => c.name);
  const previousFlag = process.env.CONTENT_ENTITIES_ENABLED;
  const service = new ContentIdentityService(
    new MongoContentEntityRepository(),
    new MongoContentSlugRepository(),
    new MongoContentTitleKeyRepository(),
    'test'
  );
  const base = { kind: 'series' as const, matching: { method: 'tmdb_id' as const, confidence: 1, decidedAt: new Date(), decidedBy: 'test' }, externalIds: {} };
  const create = (title: string, paths: string[], over: Record<string, unknown> = {}) =>
    service.createEntity({ ...base, title, normalizedTitle: title.toLowerCase(), ...over }, paths);

  try {
    await db.dropDatabase();

    await t.test('flag off: boot creates none of the new collections; reads work, writes refuse', async () => {
      delete process.env.CONTENT_ENTITIES_ENABLED;
      await ensureMongoCollectionsAndIndexes();
      const names = await collections();
      assert.ok(names.includes('tv_read_airings'));
      for (const { name } of CONTENT_IDENTITY_RESOURCES) assert.ok(!names.includes(name), name);

      assert.deepEqual(await service.resolvePath('/series/friends'), { status: 'not_found' });
      assert.deepEqual((await service.reviewQueue()).rows, []);
      await assert.rejects(create('Friends', ['/series/friends']), ContentIdentityNotReadyError);
      for (const { name } of CONTENT_IDENTITY_RESOURCES) assert.ok(!(await collections()).includes(name), `${name} not implicitly created`);
    });

    await t.test('flag on: boot creates the empty collections and exactly the declared indexes', async () => {
      process.env.CONTENT_ENTITIES_ENABLED = 'true';
      await ensureMongoCollectionsAndIndexes();
      for (const { name, model } of CONTENT_IDENTITY_RESOURCES) {
        const actual = (await db.collection(name).indexes()).map((i) => i.name).sort();
        const declared = ['_id_', ...model.schema.indexes().map(([, o]) => o.name as string)].sort();
        assert.deepEqual(actual, declared, name);
      }
      const tmdb = (await db.collection('content_entities').indexes()).find((i) => i.name === 'uniq_entity_tmdb_live');
      assert.deepEqual(tmdb?.partialFilterExpression?.status, { $in: ['candidate', 'active'] });
      const airing = (await db.collection('tv_read_airings').indexes()).map((i) => i.name);
      assert.ok(!airing.includes('idx_tvread_entity_start'));
    });

    await t.test('existing airing ingestion shape still inserts', async () => {
      await TVReadAiringModel.insertMany([legacyAiring()], { ordered: false });
      assert.equal(await TVReadAiringModel.countDocuments({ 'program.entityId': { $exists: true } }), 0);
    });

    await t.test('entity id is immutable', async () => {
      const { entity } = await create('Mutable', ['/series/mutable']);
      const other = newEntityId();
      await ContentEntityModel.updateOne({ entityId: entity.entityId }, { $set: { entityId: other } }).catch(() => undefined);
      assert.ok(await ContentEntityModel.exists({ entityId: entity.entityId }));
      assert.equal(await ContentEntityModel.exists({ entityId: other }), null);
    });

    await t.test('a path is never reassigned automatically; the next candidate is used', async () => {
      const a = await create('Uno', ['/series/uno']);
      const b = await create('Uno', ['/series/uno', '/series/uno-2015']);
      assert.equal(a.path, '/series/uno');
      assert.equal(b.path, '/series/uno-2015');
      const res = await new MongoContentSlugRepository().insert({ path: '/series/uno', entityId: b.entity.entityId, role: 'redirect', reason: 'x', createdBy: 'test' });
      assert.equal(res.inserted, false);
      assert.equal(!res.inserted && res.conflict, 'path_taken');
      assert.equal((await service.resolvePath('/series/uno')).status, 'not_found', 'candidate entities are not public');
      assert.equal((await new MongoContentSlugRepository().findByPath('/series/uno'))?.entityId, a.entity.entityId);
      const none = await create('Uno', ['/series/uno', '/series/uno-2015']);
      assert.equal(none.path, null, 'all candidates taken: entity stays pathless');
    });

    await t.test('concurrent creation of one TMDB work: one entity, one canonical', async () => {
      const results = await Promise.all(
        Array.from({ length: 12 }, () =>
          create('Fargo', ['/series/fargo', '/series/fargo-2014'], { externalIds: { tmdb: { type: 'tv', id: 60622 } } })
        )
      );
      const ids = new Set(results.map((r) => r.entity.entityId));
      assert.equal(ids.size, 1);
      assert.equal(new Set(results.map((r) => r.path)).size, 1);
      assert.equal(await ContentEntityModel.countDocuments({ 'externalIds.tmdb.id': 60622 }), 1);
      assert.equal(await ContentSlugModel.countDocuments({ entityId: [...ids][0] }), 1);
    });

    await t.test('concurrent creation of different works for one path: distinct paths', async () => {
      const results = await Promise.all(
        Array.from({ length: 6 }, (_, i) => create(`Cenicienta ${i}`, ['/peliculas/cenicienta', ...[2, 3, 4, 5, 6, 7].map((n) => `/peliculas/cenicienta-${n}`)]))
      );
      const paths = results.map((r) => r.path);
      assert.equal(new Set(paths).size, 6);
      assert.ok(paths.every(Boolean));
    });

    await t.test('exactly one canonical per entity under concurrent allocation', async () => {
      const entity = (await new MongoContentEntityRepository().insert({ ...base, entityId: newEntityId(), title: 'Race', normalizedTitle: 'race' })) as any;
      const id = entity.record.entityId;
      const paths = await Promise.all(['/series/race-a', '/series/race-b', '/series/race-c'].map((p) => service.allocateCanonicalPath(id, [p])));
      assert.equal(new Set(paths).size, 1);
      assert.equal(await ContentSlugModel.countDocuments({ entityId: id, role: 'canonical' }), 1);
      assert.equal((await ContentEntityModel.findOne({ entityId: id }).lean())?.canonicalPath, paths[0]);
    });

    await t.test('partial write recovery: entity without slug, slug without cached path', async () => {
      const entities = new MongoContentEntityRepository();
      const orphan = (await entities.insert({ ...base, entityId: newEntityId(), title: 'Orphan', normalizedTitle: 'orphan' })) as any;
      const incomplete = await service.findIncomplete(-1_000);
      assert.ok(incomplete.some((e) => e.entityId === orphan.record.entityId));
      assert.equal(await service.allocateCanonicalPath(orphan.record.entityId, ['/series/orphan']), '/series/orphan');

      const halfway = (await entities.insert({ ...base, entityId: newEntityId(), title: 'Halfway', normalizedTitle: 'halfway' })) as any;
      await new MongoContentSlugRepository().insert({ path: '/series/halfway', entityId: halfway.record.entityId, role: 'canonical', reason: 'initial', createdBy: 'test' });
      assert.equal(await service.allocateCanonicalPath(halfway.record.entityId, ['/series/other']), '/series/halfway', 'registry wins');
      assert.equal((await entities.findById(halfway.record.entityId))?.canonicalPath, '/series/halfway');
      assert.equal(await ContentSlugModel.exists({ _id: '/series/other' }), null);
    });

    await t.test('redirects: only to an active canonical entity, never a loop, never overwrite', async () => {
      const { entity } = await create('Friends', ['/series/friends'], { externalIds: { tmdb: { type: 'tv', id: 1668 } } });
      assert.equal(await service.addRedirect('/programas/friends', entity.entityId, 'legacy_prefix'), 'target_not_canonical');
      await service.transition(entity.entityId, 'active', { reason: 'test' });
      assert.equal(await service.addRedirect('/programas/friends', entity.entityId, 'legacy_prefix'), 'created');
      assert.equal(await service.addRedirect('/programas/friends', entity.entityId, 'legacy_prefix'), 'exists');
      assert.equal(await service.addRedirect('/series/friends', entity.entityId, 'x'), 'would_loop');
      assert.equal(await service.addRedirect('/series/uno', entity.entityId, 'x'), 'path_taken');
      assert.deepEqual(await service.resolvePath('/programas/friends'), { status: 'redirect', location: '/series/friends', entityId: entity.entityId });
      assert.equal((await service.resolvePath('/series/friends/')).status, 'canonical');
      assert.equal((await service.resolvePath('/series/fri%65nds')).status, 'invalid');
    });

    await t.test('merge: single hop, chains collapse, merged is terminal', async () => {
      const a = (await create('Mañaneros', ['/programas/mananeros'], { kind: 'show' })).entity;
      const b = (await create('Mañaneros 360', ['/programas/mananeros-360'], { kind: 'show' })).entity;
      const c = (await create('Mañaneros TV', ['/programas/mananeros-tv'], { kind: 'show' })).entity;
      for (const e of [a, b, c]) await service.transition(e.entityId, 'active', { reason: 'test' });
      await service.addRedirect('/programas/mananeros-t3', b.entityId, 'legacy_season_suffix');

      await service.transition(b.entityId, 'merged', { reason: 'same show', mergedInto: a.entityId });
      assert.deepEqual(await service.resolvePath('/programas/mananeros-360'), { status: 'redirect', location: '/programas/mananeros', entityId: a.entityId });
      assert.equal((await new MongoContentSlugRepository().findByPath('/programas/mananeros-360'))?.role, 'redirect');

      await service.transition(a.entityId, 'merged', { reason: 'same show', mergedInto: c.entityId });
      for (const path of ['/programas/mananeros', '/programas/mananeros-360', '/programas/mananeros-t3']) {
        assert.deepEqual(await service.resolvePath(path), { status: 'redirect', location: '/programas/mananeros-tv', entityId: c.entityId }, path);
      }
      // Resuming an already-applied merge only re-runs the follow-ups.
      await service.transition(a.entityId, 'merged', { reason: 'retry', mergedInto: c.entityId });
      await assert.rejects(service.transition(a.entityId, 'active', { reason: 'x' }), /invalid_transition|merged -> active/);
      await assert.rejects(service.transition(c.entityId, 'merged', { reason: 'x', mergedInto: c.entityId }), /bad_merge_target|->/);
      await assert.rejects(service.transition(c.entityId, 'merged', { reason: 'x', mergedInto: a.entityId }), /bad_merge_target|->/);
    });

    await t.test('removal is soft (410) and restorable', async () => {
      const { entity } = await create('Especial Nochevieja', ['/programas/especial-nochevieja'], { kind: 'event' });
      await service.transition(entity.entityId, 'active', { reason: 'test' });
      await service.transition(entity.entityId, 'removed', { reason: 'one-off ended' });
      assert.equal((await service.resolvePath('/programas/especial-nochevieja')).status, 'gone');
      assert.ok(await ContentSlugModel.exists({ _id: '/programas/especial-nochevieja' }), 'slug kept');
      await service.transition(entity.entityId, 'active', { reason: 'restored' });
      assert.equal((await service.resolvePath('/programas/especial-nochevieja')).status, 'canonical');
    });

    await t.test('lifecycle uses optimistic concurrency', async () => {
      const { entity } = await create('Contested', ['/series/contested']);
      await service.transition(entity.entityId, 'active', { reason: 'test' });
      const target = (await create('Target', ['/series/target'])).entity;
      await service.transition(target.entityId, 'active', { reason: 'test' });
      const outcomes = await Promise.allSettled([
        service.transition(entity.entityId, 'removed', { reason: 'r' }),
        service.transition(entity.entityId, 'merged', { reason: 'm', mergedInto: target.entityId }),
      ]);
      assert.equal(outcomes.filter((o) => o.status === 'fulfilled').length, 1);
      // The loser either lost the version race or, if it read after the winner wrote, saw the new status.
      assert.match(
        String((outcomes.find((o) => o.status === 'rejected') as PromiseRejectedResult).reason),
        /concurrent_modification|invalid_transition|bad_merge_target/
      );
    });

    await t.test('title keys: create, sticky match, concurrent insert, verified never overwritten', async () => {
      const input = { title: 'Espejo Público', kind: 'show' as const, method: 'title' as const, confidence: 1 };
      const first = await service.matchTitle(input);
      assert.equal(first.decision, 'create');
      const { entity } = await create('Espejo Público', ['/programas/espejo-publico'], { kind: 'show' });
      const stored = await Promise.all([service.recordTitleDecision(first, entity.entityId), service.recordTitleDecision(first, newEntityId())]);
      assert.equal(stored[0]?.entityId, stored[1]?.entityId, 'one winner, both callers see it');
      assert.equal(await ContentTitleKeyModel.countDocuments({ key: 'espejo_publico' }), 1);
      const again = await service.matchTitle({ ...input, title: 'ESPEJO PUBLICO', confidence: 0.1 });
      assert.equal(again.decision, 'matched');
      assert.equal(again.decision === 'matched' && again.row.entityId, stored[0]?.entityId);

      const titleKeys = new MongoContentTitleKeyRepository();
      const verifiedId = titleKeyId('rebeca', 'movie', 'tmdb:movie:223');
      await titleKeys.insert({ id: verifiedId, key: 'rebeca', kind: 'movie', discriminator: 'tmdb:movie:223', entityId: E1, state: 'verified', method: 'tmdb_id', confidence: 1, decidedBy: 'test' });
      const clash = await titleKeys.insert({ id: verifiedId, key: 'rebeca', kind: 'movie', discriminator: 'tmdb:movie:223', entityId: newEntityId(), state: 'candidate', method: 'title', confidence: 0.3, decidedBy: 'test' });
      assert.equal(!clash.inserted && clash.existing?.entityId, E1);
      assert.equal(!clash.inserted && clash.existing?.state, 'verified');
    });

    await t.test('ambiguity reporting and manual review', async () => {
      const a = (await create('Cara a cara', ['/programas/cara-a-cara'], { kind: 'show' })).entity;
      const b = (await create('Cara a cara', ['/programas/cara-a-cara-2'], { kind: 'show' })).entity;
      const titleKeys = new MongoContentTitleKeyRepository();
      for (const [entity, disc] of [[a, 'year:1990'], [b, 'year:2010']] as const) {
        await titleKeys.insert({ id: titleKeyId('cara_a_cara', 'show', disc), key: 'cara_a_cara', kind: 'show', discriminator: disc, year: Number(disc.slice(5)), entityId: entity.entityId, state: 'candidate', method: 'title_year', confidence: 0.8, decidedBy: 'test' });
      }
      const d = await service.matchTitle({ title: 'Cara a cara', kind: 'show', method: 'title', confidence: 1 });
      assert.equal(d.decision, 'review');
      const row = await service.recordTitleDecision(d);
      assert.equal(row?.state, 'ambiguous');
      assert.equal(row?.entityId, undefined);
      const queue = await service.reviewQueue();
      assert.ok(queue.counts.ambiguous >= 1);
      assert.ok(queue.rows.some((r) => r.id === 'cara_a_cara|show|*'));
      assert.equal((await service.matchTitle({ title: 'Cara a cara', kind: 'show', method: 'title', confidence: 1 })).decision, 'held');

      assert.ok(await service.reviewTitleKey('cara_a_cara|show|*', b.entityId, 'owner', 'current programme'));
      const resolved = await service.matchTitle({ title: 'Cara a cara', kind: 'show', method: 'title', confidence: 1 });
      assert.equal(resolved.decision === 'matched' && resolved.row.entityId, b.entityId);
      assert.equal(resolved.decision === 'matched' && resolved.row.state, 'verified');
    });

    await t.test('slug role changes and reassignment are audited; canonical cannot be reassigned', async () => {
      const slugs = new MongoContentSlugRepository();
      const entity = (await service.resolvePath('/series/friends')) as { entity: { entityId: string } };
      const other = (await create('Friends (2)', ['/series/friends-2'])).entity;
      assert.equal(await slugs.reassign('/series/friends', { fromEntityId: entity.entity.entityId, toEntityId: other.entityId, reviewedBy: 'owner', note: 'x' }), false);
      assert.ok(await slugs.reassign('/programas/friends', { fromEntityId: entity.entity.entityId, toEntityId: other.entityId, reviewedBy: 'owner', note: 'split' }));
      const history = (await slugs.findByPath('/programas/friends'))?.history.map((h) => h.action);
      assert.deepEqual(history, ['create', 'reassign']);
    });

    await t.test('airing entity index: partial, starts empty, used for entity lookups', async () => {
      const airings = db.collection('tv_read_airings');
      await airings.createIndex(TV_READ_AIRING_ENTITY_INDEX.key, TV_READ_AIRING_ENTITY_INDEX.options);
      await TVReadAiringModel.insertMany([
        legacyAiring({ id: 'a2', program: { ...legacyAiring().program, entityId: E1 }, airing: { start: '2026-10-21T13:00:00.000Z' } }),
        legacyAiring({ id: 'a3', airing: { start: '2026-10-22T13:00:00.000Z' } }),
      ]);
      assert.equal(await airings.countDocuments({}, { hint: 'idx_tvread_entity_start' }), 1, 'only rows with an entityId are indexed');
      const plan = await airings.find({ 'program.entityId': E1 }).sort({ 'airing.start': 1 }).explain('queryPlanner');
      assert.match(JSON.stringify(plan.queryPlanner.winningPlan), /idx_tvread_entity_start/);
      await assert.rejects(
        TVReadAiringModel.insertMany([legacyAiring({ id: 'a4', program: { title: 'x', entityId: 'nope' } })]),
        /entityId/
      );
    });
  } finally {
    if (previousFlag === undefined) delete process.env.CONTENT_ENTITIES_ENABLED;
    else process.env.CONTENT_ENTITIES_ENABLED = previousFlag;
    await db.dropDatabase().catch(() => undefined);
    await mongoose.disconnect();
  }
});
