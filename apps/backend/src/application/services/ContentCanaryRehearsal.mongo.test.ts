/**
 * Phase 3C write-canary rehearsal on a throwaway database, with the COMMITTED proposed batch: the
 * real admitted-scope ingestion, certification, canary policy, revocation and rollback, each step
 * measured against a whole-database baseline.   TEST_MONGO_URI=mongodb://127.0.0.1:27119 npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { CanaryManifest } from './ContentCanaryManifest';
import { diffBaselines, rehearseWriteCanary, SCRATCH_DB } from './ContentCanaryRehearsal';
import { loadRealInputs, realInputsAvailable, realRoot } from './ContentCertification.fixtures';

test('rehearsal refuses a database that is not named like a throwaway one', () => {
  assert.equal(SCRATCH_DB.test('guiatv'), false);
  assert.equal(SCRATCH_DB.test('guiatv_production'), false);
  assert.equal(SCRATCH_DB.test('guiatv_scratch_3c'), true);
  assert.equal(SCRATCH_DB.test('guiatv_test_3c_123'), true);
});

test('rehearsal of the proposed canary: write, idempotency, certification, read, revocation, rollback — measured', { skip: !process.env.TEST_MONGO_URI || !realInputsAvailable() }, async () => {
  const dbName = `guiatv_test_3crehearsal_${process.pid}`;
  const options = { autoCreate: false, autoIndex: false } as const; // no model may recreate collections behind the cleanup
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName, ...options });
  try {
    const committed = JSON.parse(fs.readFileSync(path.join(realRoot, 'phase-3c/canary-manifest.json'), 'utf8')) as CanaryManifest;
    const inputs = loadRealInputs();
    const all = new Map(inputs.days.flatMap((d) => d.verdicts).map((v) => [v.candidateId, v] as const));
    const verdicts = new Map(committed.entities.map((e) => [e.candidateId, all.get(e.candidateId)!] as const));
    const noise = committed.notSelected.slice(0, 20).map((n) => ({ candidateId: n.candidateId, title: n.title }));
    const report = await rehearseWriteCanary({ manifest: committed, verdicts, review: inputs.review, noise, now: new Date(committed.generatedAt) });
    for (const c of report.checks) assert.ok(c.ok, `${c.step}: ${c.detail}`);
    assert.equal(report.ok, true);
    assert.ok(report.batch >= 1 && report.batch <= 25);
    assert.equal(report.baselines.final !== report.baselines.seeded, true, 'only the audit trail remains');
    // The refusal: a production-looking database name.
    await mongoose.disconnect();
    await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName: `guiatv_prod_${process.pid}`, ...options });
    await assert.rejects(rehearseWriteCanary({ manifest: committed, verdicts, review: inputs.review, noise }), /throwaway database/);
  } finally {
    await mongoose.disconnect();
    await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName, ...options });
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test('baseline diff: exact, and structural for a live database (traffic moves other collections, never content_* or indexes)', () => {
  const base = { digest: 'a', collections: { users: { documents: 10, indexes: 3 }, content_entities: { documents: 0, indexes: 4 } } };
  const live = { digest: 'b', collections: { users: { documents: 12, indexes: 3 }, content_entities: { documents: 0, indexes: 4 } } };
  assert.deepEqual(Object.keys(diffBaselines(base, live)), ['users']);
  assert.deepEqual(diffBaselines(base, live, true), {}, 'traffic alone is not a change');
  const written = { digest: 'c', collections: { ...live.collections, content_entities: { documents: 1, indexes: 4 } } };
  assert.deepEqual(Object.keys(diffBaselines(base, written, true)), ['content_entities']);
  const indexed = { digest: 'd', collections: { ...live.collections, users: { documents: 12, indexes: 4 } } };
  assert.deepEqual(Object.keys(diffBaselines(base, indexed, true)), ['users'], 'a new index is always a change');
  const created = { digest: 'e', collections: { ...live.collections, content_slugs: { documents: 0, indexes: 3 } } };
  assert.deepEqual(Object.keys(diffBaselines(base, created, true)), ['content_slugs'], 'a new collection is always a change');
});
