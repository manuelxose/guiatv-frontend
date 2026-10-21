import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import { createEntityRoutes } from './entities.routes';
import { PublicContentEntityService } from '@/application/services/PublicContentEntityService';
import type { PublicContentEntity } from '@/application/services/PublicContentEntityService';
import { ContentIdentityService } from '@/application/services/ContentIdentityService';
import { EntityPublicReadPolicy } from '@/application/services/EntityPublicReadPolicy';
import { MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository } from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { ContentEntityModel } from '@/infrastructure/database/models/ContentEntity.model';
import { isWriteCommand } from '@/scripts/readOnlyGuard';
import type { ApiResponse } from '@/shared/types/ApiResponse';

test('3B canary: allowlist, ceiling, read-time revalidation, kill switch, breaker; no writes, no reads for refused paths', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const dbName = `guiatv_test_3b_${process.pid}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-'));
  const file = path.join(dir, 'canary.json');
  const kill = path.join(dir, 'KILL');
  const previous = process.env.CONTENT_ENTITIES_ENABLED;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName, monitorCommands: true });
  const identity = new ContentIdentityService(new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository());
  const env: Record<string, string> = {
    CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true', CONTENT_ENTITY_PUBLIC_READ_SCOPE: 'canary',
    CONTENT_ENTITY_CANARY_FILE: file, CONTENT_ENTITY_CANARY_MAX: '2', CONTENT_ENTITY_KILL_FILE: kill,
  };
  let clock = 1_000_000;
  const policy = new EntityPublicReadPolicy({ env: env as NodeJS.ProcessEnv, now: () => clock });
  const app = express();
  app.use('/v2/entities', createEntityRoutes(new PublicContentEntityService(identity), policy));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v2/entities/resolve`;
  const read = (p: string, query = '') => fetch(`${base}?path=${encodeURIComponent(p)}${query}`, { redirect: 'manual' });
  const code = async (r: Response) => ((await r.json()) as ApiResponse<PublicContentEntity>).error?.code;
  const commands: string[] = [];
  const writes: string[] = [];
  let watching = false;
  mongoose.connection.getClient().on('commandStarted', (event) => {
    if (!watching) return;
    commands.push(event.commandName);
    if (isWriteCommand(event.commandName, event.command)) writes.push(event.commandName);
  });
  /** Fixture changes are writes by the test, not by the HTTP reads under watch. */
  const mutate = async (change: () => Promise<unknown>) => { watching = false; await change(); watching = true; };
  const allow = (...ids: Array<[string, string]>) => {
    fs.writeFileSync(file, JSON.stringify({ version: 1, entities: ids.map(([entityId, canonicalPath]) => ({ entityId, canonicalPath, approvedBy: 'Ana García', approvedAt: '2026-10-22T08:00:00Z' })) }));
    clock += 6_000;
    fs.utimesSync(file, new Date(clock), new Date(clock));
  };
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
    const [a, b, c] = [await seed('alpha'), await seed('beta'), await seed('gamma')];
    await seed('delta', false);
    allow([a, '/peliculas/alpha'], [b, '/peliculas/beta']);
    watching = true;

    // Allowlisted + verified: served, noindex, never cached.
    for (const slug of ['alpha', 'beta']) {
      const ok = await read(`/peliculas/${slug}`);
      assert.equal(ok.status, 200, slug);
      assert.equal(ok.headers.get('x-robots-tag'), 'noindex, follow');
      assert.equal(ok.headers.get('cache-control'), 'no-store');
    }
    // Verified but not allowlisted, candidate, unknown, alias form: legacy signal, and no Mongo command at all.
    commands.length = 0;
    for (const p of ['/peliculas/gamma', '/peliculas/delta', '/peliculas/zzz', '/series/alpha', '/peliculas/ALPHA']) {
      const r = await read(p);
      assert.equal(r.status, 404, p);
      assert.equal(await code(r), 'ENTITY_PUBLIC_READ_DISABLED', p);
    }
    assert.deepEqual(commands, [], 'refused paths never reach the database');
    assert.equal((await fetch(base)).status, 404, 'a missing path cannot enumerate anything either');

    // Ceiling: a list above the maximum disables the canary entirely; shrinking it restores it.
    allow([a, '/peliculas/alpha'], [b, '/peliculas/beta'], [c, '/peliculas/gamma']);
    assert.equal(await code(await read('/peliculas/alpha')), 'ENTITY_PUBLIC_READ_DISABLED');
    assert.equal(policy.stats().configError?.includes('ceiling'), true);
    allow([a, '/peliculas/alpha'], [b, '/peliculas/beta']);
    assert.equal((await read('/peliculas/alpha')).status, 200);

    // Read-time revalidation: an approved pin that no longer matches the registry is not served.
    allow([a, '/peliculas/beta']);
    assert.equal(await code(await read('/peliculas/beta')), 'ENTITY_PUBLIC_READ_DISABLED', 'pin says alpha owns beta');
    allow([a, '/peliculas/alpha'], [b, '/peliculas/beta']);
    // Eligibility revoked in the registry: legacy at once, no allowlist edit needed.
    await mutate(() => identity.transition(b, 'removed', { reason: 'Rejected after review' }));
    assert.equal(await code(await read('/peliculas/beta')), 'ENTITY_PUBLIC_READ_DISABLED');
    assert.equal((await read('/peliculas/alpha')).status, 200, 'the rest of the canary is unaffected');
    const stats = policy.stats();
    assert.ok(stats.routes['/peliculas/beta'].revalidation_failed >= 2);
    assert.ok(stats.routes['/peliculas/alpha'].served >= 2);
    assert.ok(stats.routes['(other)'].not_allowlisted >= 5);

    // The cron monitor (canary-check CLI, read-only guard) agrees with what the route does.
    const cli = () => spawnSync(process.execPath, [path.resolve(__dirname, '../../scripts/content-identity.js'), 'canary-check', file], {
      env: { ...process.env, MONGODB_URI: process.env.TEST_MONGO_URI, MONGODB_DB_NAME: dbName, CONTENT_ENTITY_CANARY_MAX: '2', NODE_PATH: '' }, encoding: 'utf8',
    });
    allow([a, '/peliculas/alpha']);
    const check = cli();
    assert.equal(check.status, 0, check.stdout + check.stderr);
    assert.match(check.stdout, /"checked": 1/);
    allow([a, '/peliculas/alpha'], [b, '/peliculas/beta']);
    const broken = cli();
    assert.equal(broken.status, 2, 'beta was removed above');
    assert.match(broken.stdout, /resolves as gone/);

    // Kill switch: a file, no restart; removing it restores the canary.
    fs.writeFileSync(kill, '');
    assert.equal(await code(await read('/peliculas/alpha')), 'ENTITY_PUBLIC_READ_DISABLED');
    assert.equal(policy.stats().reason, 'killed');
    fs.unlinkSync(kill);
    assert.equal((await read('/peliculas/alpha')).status, 200);

    // Canonical inconsistency: five integrity errors in a minute open the breaker for every entity.
    await mutate(() => ContentEntityModel.updateOne({ entityId: a }, { $set: { canonicalPath: '/peliculas/other' } }));
    for (let i = 0; i < 5; i++) assert.equal(await code(await read('/peliculas/alpha')), 'ENTITY_PUBLIC_READ_DISABLED');
    assert.equal(policy.stats().breakerOpen, true);
    await mutate(() => ContentEntityModel.updateOne({ entityId: a }, { $set: { canonicalPath: '/peliculas/alpha' } }));
    assert.equal(await code(await read('/peliculas/alpha')), 'ENTITY_PUBLIC_READ_DISABLED', 'open until restart, even after the data is repaired');

    // Master flag off: everything legacy again, rate limiter untouched.
    env.CONTENT_ENTITY_PUBLIC_READ_ENABLED = 'false';
    const off = await read('/peliculas/alpha');
    assert.equal(off.status, 404);
    assert.equal(off.headers.get('ratelimit-limit'), null);
    assert.deepEqual(writes, [], 'no Mongo write in any scenario');
  } finally {
    watching = false;
    if (previous === undefined) delete process.env.CONTENT_ENTITIES_ENABLED; else process.env.CONTENT_ENTITIES_ENABLED = previous;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
