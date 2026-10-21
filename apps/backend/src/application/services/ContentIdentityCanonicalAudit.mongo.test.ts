import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { auditRegistry } from './ContentIdentityCanonicalAudit';
import { ContentIdentityService } from './ContentIdentityService';
import { MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository, readRegistryRows } from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { ContentEntityModel } from '@/infrastructure/database/models/ContentEntity.model';
import { ContentSlugModel } from '@/infrastructure/database/models/ContentSlug.model';
import { isWriteCommand } from '@/scripts/readOnlyGuard';

test('registry audit over scratch MongoDB: lifecycle fixtures pass, planted corruption is found, the read is write-free', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const previous = process.env.CONTENT_ENTITIES_ENABLED;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName: `guiatv_test_3b_audit_${process.pid}`, monitorCommands: true });
  const writes: string[] = [];
  let watching = false;
  mongoose.connection.getClient().on('commandStarted', (e) => { if (watching && isWriteCommand(e.commandName, e.command)) writes.push(e.commandName); });
  const identity = new ContentIdentityService(new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository());
  const audit = async () => { watching = true; const { entities, slugs } = await readRegistryRows(); watching = false; return auditRegistry(entities, slugs); };
  try {
    process.env.CONTENT_ENTITIES_ENABLED = 'true';
    await mongoose.connection.dropDatabase();
    await ensureMongoCollectionsAndIndexes();
    assert.deepEqual((await audit()).summary.entities, 0, 'an empty registry (production today) passes');
    const seed = async (slug: string, verify = true) => {
      const { entity } = await identity.createEntity({ title: slug, normalizedTitle: slug, kind: 'movie', externalIds: {}, matching: { method: 'manual', confidence: 1, decidedAt: new Date(), decidedBy: 'ingest' } }, [`/peliculas/${slug}`]);
      if (verify) await identity.verifyEntity(entity.entityId, 'Ana García', 'Fixture checked');
      return entity.entityId;
    };
    const a = await seed('alpha');
    await seed('candidate', false);
    const b = await seed('beta');
    await identity.transition(b, 'merged', { reason: 'Duplicate', mergedInto: a });
    await identity.transition(await seed('gamma'), 'removed', { reason: 'Rejected after review' });
    await identity.addRedirect('/peliculas/old', a, 'Old spelling');
    const clean = await audit();
    assert.deepEqual(clean.findings, []);
    assert.equal(clean.summary.entities, 4);
    assert.deepEqual(writes, []);

    await ContentEntityModel.updateOne({ entityId: a }, { $set: { canonicalPath: '/peliculas/elsewhere' } });
    await ContentSlugModel.create({ _id: '/peliculas/orphan', entityId: 'ce_01ARZ3NDEKTSV4RRFFQ69G5FAV', role: 'canonical', reason: 'fixture', createdBy: 'test', history: [] });
    const broken = await audit();
    assert.equal(broken.pass, false);
    assert.deepEqual(broken.findings.map((f) => f.code).sort(), ['canonical_cache_mismatch', 'slug_owner_missing']);
  } finally {
    if (previous === undefined) delete process.env.CONTENT_ENTITIES_ENABLED; else process.env.CONTENT_ENTITIES_ENABLED = previous;
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
