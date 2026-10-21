import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import type { AddressInfo } from 'node:net';
import { createEntityRoutes } from './entities.routes';
import { PublicContentEntityService } from '@/application/services/PublicContentEntityService';
import { ContentIdentityService } from '@/application/services/ContentIdentityService';
import { MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository } from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { ContentEntityModel } from '@/infrastructure/database/models/ContentEntity.model';
import { isWriteCommand } from '@/scripts/readOnlyGuard';
import type { ApiResponse } from '@/shared/types/ApiResponse';
import type { PublicContentEntity } from '@/application/services/PublicContentEntityService';

test('public HTTP reads use lifecycle fixtures, fail closed and issue no Mongo writes', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const previous = { entities: process.env.CONTENT_ENTITIES_ENABLED, public: process.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED };
  const dbName = `guiatv_test_3a_${process.pid}`;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName, monitorCommands: true });
  const identity = new ContentIdentityService(new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository());
  const app = express();
  app.use('/v2/entities', createEntityRoutes(new PublicContentEntityService(identity)));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v2/entities/resolve`;
  const read = (path: string, query = '') => fetch(`${base}?path=${encodeURIComponent(path)}${query}`, { redirect: 'manual' });
  const writes: string[] = [];
  let checking = false;
  mongoose.connection.getClient().on('commandStarted', (event) => {
    if (checking && isWriteCommand(event.commandName, event.command)) writes.push(event.commandName);
  });
  try {
    assert.ok(dbName.startsWith('guiatv_test_'));
    process.env.CONTENT_ENTITIES_ENABLED = 'true';
    await mongoose.connection.dropDatabase();
    await ensureMongoCollectionsAndIndexes();
    const seed = async (slug: string, verify = true) => {
      const { entity } = await identity.createEntity({ title: slug, normalizedTitle: slug, kind: 'movie', externalIds: {},
        matching: { method: 'manual', confidence: 1, decidedAt: new Date(), decidedBy: 'ingest' } }, [`/peliculas/${slug}`]);
      if (verify) await identity.verifyEntity(entity.entityId, 'Ana García', 'Fixture checked');
      return entity.entityId;
    };
    const active = await seed('verified');
    await seed('candidate', false);
    const removed = await seed('removed');
    await identity.transition(removed, 'removed', { reason: 'Rejected after review' });
    const missing = await seed('missing-path');
    await ContentEntityModel.updateOne({ entityId: missing }, { $unset: { canonicalPath: 1 } });
    const conflicting = await seed('conflicting');
    await ContentEntityModel.updateOne({ entityId: conflicting }, { $set: { canonicalPath: '/peliculas/verified' } });
    assert.ok(conflicting);
    await identity.addRedirect('/peliculas/old', active, 'Old spelling');
    const merged = await seed('merged');
    await identity.transition(merged, 'merged', { reason: 'Duplicate', mergedInto: active });
    process.env.CONTENT_ENTITIES_ENABLED = 'false';
    process.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED = 'false';
    checking = true;
    const disabled = await read('/peliculas/verified');
    assert.equal(disabled.status, 404);
    assert.equal(disabled.headers.get('ratelimit-limit'), null, 'disabled probes never consume a rate limit');
    assert.equal((await disabled.json() as ApiResponse<PublicContentEntity>).error?.code, 'ENTITY_PUBLIC_READ_DISABLED');
    process.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED = 'true';
    const response = await read('/peliculas/verified');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual((await response.json() as ApiResponse<PublicContentEntity>).data, { entityId: active, kind: 'movie', title: 'verified', canonicalPath: '/peliculas/verified' });
    for (const [path, status] of [['candidate', 404], ['removed', 410], ['missing-path', 503], ['conflicting', 503], ['unknown', 404]] as const) {
      assert.equal((await read(`/peliculas/${path}`)).status, status, path);
    }
    for (const path of ['../../etc/passwd', '/peliculas/a?x=1', '//evil.test/movie']) assert.equal((await read(path)).status, 400);
    assert.equal((await fetch(base)).status, 400);
    assert.equal((await read('/peliculas/verified', '&redirect=yes')).status, 400);
    for (const slug of ['old', 'merged', 'VERIFIED/']) {
      const redirect = await read(`/peliculas/${slug}`);
      assert.equal(redirect.status, 301);
      assert.equal(redirect.headers.get('location'), '/peliculas/verified');
      const resolved = await read(`/peliculas/${slug}`, '&redirect=false');
      assert.equal(resolved.status, 200);
      assert.equal((await resolved.json() as ApiResponse<PublicContentEntity>).data?.entityId, active);
    }
    assert.deepEqual(writes, []);
  } finally {
    checking = false;
    if (previous.entities === undefined) delete process.env.CONTENT_ENTITIES_ENABLED; else process.env.CONTENT_ENTITIES_ENABLED = previous.entities;
    if (previous.public === undefined) delete process.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED; else process.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED = previous.public;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
