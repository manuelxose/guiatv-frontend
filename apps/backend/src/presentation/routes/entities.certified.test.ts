/**
 * Phase 3C public reads of AI-certified entities, through the real route and policy on a throwaway
 * database: served noindex only inside the allowlist, revalidated at every read, gone the moment the
 * certification is revoked, expired or its key goes missing; no Mongo write during reads.
 */
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
import { ContentIdentityService } from '@/application/services/ContentIdentityService';
import { ContentCertificationService, createCertificationReader } from '@/application/services/ContentCertification';
import { grant, NOW, ownerKeys, reviewFor, verdictFor } from '@/application/services/ContentCertification.fixtures';
import { EntityPublicReadPolicy } from '@/application/services/EntityPublicReadPolicy';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { MongoContentAttestationRepository, MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository } from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { isWriteCommand } from '@/scripts/readOnlyGuard';

test('3C: AI-certified entities in the canary — noindex, allowlisted, revalidated per read, revocable, no writes', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const dbName = `guiatv_test_3cread_${process.pid}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'certified-'));
  const file = path.join(dir, 'canary.json');
  const keyFile = path.join(dir, 'owner-public.pem');
  const kill = path.join(dir, 'KILL');
  const previous = process.env.CONTENT_ENTITIES_ENABLED;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName, monitorCommands: true });
  const keys = ownerKeys();
  fs.writeFileSync(keyFile, keys.publicPem);
  const entities = new MongoContentEntityRepository();
  const slugs = new MongoContentSlugRepository();
  const attestations = new MongoContentAttestationRepository();
  const identity = new ContentIdentityService(entities, slugs, new MongoContentTitleKeyRepository());
  let clock = NOW;
  const certify = new ContentCertificationService(entities, slugs, attestations, { ownerPublicKeyPem: keys.publicPem, now: () => clock });
  const env: Record<string, string> = {
    CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true', CONTENT_ENTITY_PUBLIC_READ_SCOPE: 'canary', CONTENT_ENTITY_CANARY_FILE: file,
    CONTENT_ENTITY_CANARY_MAX: '2', CONTENT_ENTITY_KILL_FILE: kill, CONTENT_OWNER_PUBLIC_KEY_FILE: keyFile,
  };
  let tick = 1_000_000;
  const policy = new EntityPublicReadPolicy({ env: env as NodeJS.ProcessEnv, now: () => tick });
  let publicKey: string | undefined = keys.publicPem;
  const service = new PublicContentEntityService(identity, createCertificationReader(attestations, () => publicKey, () => clock));
  const app = express();
  app.use('/v2/entities', createEntityRoutes(service, policy));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v2/entities/resolve`;
  const read = (p: string) => fetch(`${base}?path=${encodeURIComponent(p)}`, { redirect: 'manual' });
  const code = async (r: Response) => ((await r.json()) as { error?: { code: string } }).error?.code;
  const writes: string[] = [];
  let watching = false;
  mongoose.connection.getClient().on('commandStarted', (e) => { if (watching && isWriteCommand(e.commandName, e.command)) writes.push(e.commandName); });
  const mutate = async (change: () => Promise<unknown>) => { watching = false; await change(); watching = true; };
  const allow = (...list: Array<[string, string]>) => {
    fs.writeFileSync(file, JSON.stringify({ version: 1, entities: list.map(([entityId, canonicalPath]) => ({ entityId, canonicalPath, approvedBy: 'manuelxose', approvedAt: '2026-10-22T08:00:00Z' })) }));
    tick += 6_000;
    fs.utimesSync(file, new Date(tick), new Date(tick));
  };
  let n = 0;
  const seed = async () => {
    const v = verdictFor(`certificada_${++n}`, 7000 + n);
    const { entity } = await identity.createEntity({ title: v.title, normalizedTitle: v.key, kind: 'movie', year: 2001, externalIds: { tmdb: { type: 'movie', id: 7000 + n } },
      matching: { method: 'tmdb_exact', confidence: 0.9, decidedAt: NOW, decidedBy: 'ingest', assurance: 'independently_supported' } }, [v.path!]);
    const req = { entityId: entity.entityId, verdict: v, review: reviewFor([v.candidateId]), authorization: grant(keys, [v], {}, `oa_${String(n).padStart(16, '0')}`) };
    return { id: entity.entityId, path: v.path!, req, v };
  };
  try {
    assert.ok(dbName.startsWith('guiatv_test_'));
    process.env.CONTENT_ENTITIES_ENABLED = 'true';
    await mongoose.connection.dropDatabase();
    await ensureMongoCollectionsAndIndexes();
    const a = await seed();
    const b = await seed();
    const c = await seed();
    for (const s of [a, b, c]) await certify.certify(s.req);
    allow([a.id, a.path], [b.id, b.path]);
    watching = true;

    const ok = await read(a.path);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('x-robots-tag'), 'noindex, follow');
    assert.equal(ok.headers.get('cache-control'), 'no-store');
    const body = (await ok.json()) as { data: Record<string, unknown> };
    assert.deepEqual(Object.keys(body.data).sort(), ['canonicalPath', 'entityId', 'kind', 'title', 'year'], 'the DTO carries no attestation, review or provenance');
    assert.equal(await code(await read(c.path)), 'ENTITY_PUBLIC_READ_DISABLED', 'certified but not allowlisted');
    assert.deepEqual([...policy.canaryPaths()].sort(), [a.path, b.path].sort(), 'exactly the allowlist is kept out of sitemaps');

    // Revocation: the next read, no restart, no allowlist edit, and the rest is unaffected.
    await mutate(() => certify.revoke(b.id, 'Ana García', 'wrong work found in review'));
    assert.equal(await code(await read(b.path)), 'ENTITY_PUBLIC_READ_DISABLED');
    assert.equal((await read(a.path)).status, 200);

    // Expiry and key loss fail closed.
    clock = new Date('2027-01-01T00:00:00Z');
    assert.equal(await code(await read(a.path)), 'ENTITY_PUBLIC_READ_DISABLED', 'attestation expired');
    clock = NOW;
    assert.equal((await read(a.path)).status, 200);
    publicKey = undefined;
    assert.equal(await code(await read(a.path)), 'ENTITY_PUBLIC_READ_DISABLED', 'no owner key configured');
    publicKey = keys.publicPem;
    assert.equal((await read(a.path)).status, 200);

    // Kill switch still wins.
    fs.writeFileSync(kill, '');
    assert.equal(await code(await read(a.path)), 'ENTITY_PUBLIC_READ_DISABLED');
    fs.unlinkSync(kill);
    assert.equal((await read(a.path)).status, 200);
    assert.deepEqual(writes, [], 'public reads issue no Mongo write');

    // The cron monitor sees what the route sees (read-only guard, certification included).
    const cli = (list: Array<[string, string]>) => {
      allow(...list);
      return spawnSync(process.execPath, [path.resolve(__dirname, '../../scripts/content-identity.js'), 'canary-check', file], {
        env: { ...process.env, MONGODB_URI: process.env.TEST_MONGO_URI, MONGODB_DB_NAME: dbName, CONTENT_ENTITY_CANARY_MAX: '2', CONTENT_OWNER_PUBLIC_KEY_FILE: keyFile, NODE_PATH: '' }, encoding: 'utf8',
      });
    };
    const fine = cli([[a.id, a.path]]);
    assert.equal(fine.status, 0, fine.stdout + fine.stderr);
    const bad = cli([[a.id, a.path], [b.id, b.path]]);
    assert.equal(bad.status, 2, 'b was revoked');
    assert.match(bad.stdout, /resolves as not_found/);

    // A manually tampered entity (method flipped to manual without a person) is still not served.
    await mutate(() => mongoose.connection.collection('content_entities').updateOne({ entityId: a.id }, { $set: { 'matching.method': 'manual' } }));
    assert.equal(await code(await read(a.path)), 'ENTITY_PUBLIC_READ_DISABLED', 'manual method needs a person\'s name in decidedBy and lifecycle');
  } finally {
    server.close();
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    fs.rmSync(dir, { recursive: true, force: true });
    if (previous === undefined) delete process.env.CONTENT_ENTITIES_ENABLED; else process.env.CONTENT_ENTITIES_ENABLED = previous;
  }
});
