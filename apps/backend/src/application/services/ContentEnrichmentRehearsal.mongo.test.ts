/**
 * Phase 3D rehearsal on a throwaway database, with the COMMITTED batch and fixtures: enrichment of every film from
 * the catalogue, broadcasts from the read model, per-film quality and consolidation. The committed report must be
 * exactly what this produces.   TEST_MONGO_URI=mongodb://127.0.0.1:27118 npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { CanaryManifest } from './ContentCanaryManifest';
import { rehearseWriteCanary } from './ContentCanaryRehearsal';
import { enrichmentRehearsal, type EnrichmentFixtures } from './ContentEnrichmentRehearsal';
import { loadRealInputs, realInputsAvailable, realRoot } from './ContentCertification.fixtures';

const dir3d = path.join(realRoot, 'phase-3d');
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(dir3d, file), 'utf8')) as T;

test('3D rehearsal of the committed batch: enrichment, broadcasts, quality and consolidation, measured', { skip: !process.env.TEST_MONGO_URI || !realInputsAvailable() || !fs.existsSync(path.join(dir3d, 'fixtures/catalog.json')) }, async () => {
  const dbName = `guiatv_test_3drehearsal_${process.pid}`;
  const options = { autoCreate: false, autoIndex: false } as const;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName, ...options });
  try {
    const committed = JSON.parse(fs.readFileSync(path.join(realRoot, 'phase-3c/canary-manifest.json'), 'utf8')) as CanaryManifest;
    const inputs = loadRealInputs();
    const all = new Map(inputs.days.flatMap((d) => d.verdicts).map((v) => [v.candidateId, v] as const));
    const verdicts = new Map(committed.entities.map((e) => [e.candidateId, all.get(e.candidateId)!] as const));
    const noise = committed.notSelected.slice(0, 20).map((n) => ({ candidateId: n.candidateId, title: n.title }));
    const fixtures: EnrichmentFixtures = { catalog: read('fixtures/catalog.json'), airings: read('fixtures/airings.json'), legacy: read('fixtures/legacy-snapshot.json') };
    const report = await rehearseWriteCanary({ manifest: committed, verdicts, review: inputs.review, noise, now: new Date(committed.generatedAt), afterServed: enrichmentRehearsal(fixtures) });
    for (const c of report.checks) assert.ok(c.ok, `${c.step}: ${c.detail}`);
    assert.equal(report.ok, true);
    const phase3d = (report as unknown as { phase3d: { films: Array<{ verdict: string; consolidation: { decision: string }; quality: { indexable: boolean } }>; summary: { films: number; indexable: number } } }).phase3d;
    assert.equal(phase3d.films.length, committed.entities.length);
    assert.equal(phase3d.summary.indexable, 0, 'no film is an index candidate');
    // The committed report is this run's output, byte for byte (re-generate with the CLI: see docs/seo/phase-3d/README.md).
    const file = path.join(dir3d, 'film-quality-report.json');
    if (fs.existsSync(file)) {
      const committedReport = JSON.parse(fs.readFileSync(file, 'utf8')) as { films: unknown; summary: unknown; evaluatedAt: string };
      assert.deepEqual({ films: committedReport.films, summary: committedReport.summary, evaluatedAt: committedReport.evaluatedAt }, JSON.parse(JSON.stringify({ films: phase3d.films, summary: phase3d.summary, evaluatedAt: (phase3d as unknown as { evaluatedAt: string }).evaluatedAt })));
    }
  } finally {
    await mongoose.disconnect();
    await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName, ...options });
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
