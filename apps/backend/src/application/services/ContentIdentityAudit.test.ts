import test from 'node:test';
import assert from 'node:assert/strict';
import type { IdentityTrace } from './ContentIdentityIngestion';
import { normalizeReviewerName } from './ContentIdentityService';
import {
  AUTO_CREATE,
  buildReviewRows,
  clopperPearson,
  parseCsv,
  REVIEW_COLUMNS,
  sampleTraces,
  scoreReview,
  compareReviews,
  toCsv,
  wilson,
} from './ContentIdentityAudit';

test('reviewer names: normalised, and never blank, automated or reserved in any case or spacing', () => {
  assert.equal(normalizeReviewerName('Manuel'), 'Manuel');
  assert.equal(normalizeReviewerName('  Ana \t  García  '), 'Ana García');
  assert.equal(normalizeReviewerName('Ｍａｎｕｅｌ'), 'Manuel', 'NFKC folds full-width letters');
  assert.equal(normalizeReviewerName('Ana García'), 'Ana García');
  assert.equal(normalizeReviewerName("O'Neill"), "O'Neill");
  assert.equal(normalizeReviewerName('manuel.x@example.org'), 'manuel.x@example.org');
  assert.equal(normalizeReviewerName('José María'), 'José María');
  for (const bad of [
    '', ' ', ' ', undefined, null, 'a', '1234', 'system', 'System', 'SYSTEM', 'system ', ' Ingest', 'AUTO', 'auto',
    'Review', 'admin', 'Root', 'bot', 'cron', 'cron-job', 'ci_bot', 'Auto Review', 'claude', 'ＳＹＳＴＥＭ', 'sys​tem',
    'unknown', 'n/a', '<script>', 'x'.repeat(65),
  ]) {
    assert.throws(() => normalizeReviewerName(bad), /reviewer_required/, JSON.stringify(bad));
  }
});

let n = 0;
const trace = (over: Partial<IdentityTrace> = {}): IdentityTrace => {
  const key = over.key ?? `title_${++n}`;
  return {
    candidateId: `${key}|show||`,
    key,
    kind: 'show',
    title: key.replace(/_/g, ' '),
    spellings: [key],
    airings: 1,
    epgYears: [],
    tmdb: { ids: [], evidence: 'none' },
    decision: 'create',
    state: 'candidate',
    method: 'title',
    confidence: 0.8,
    rowId: `${key}|show|*`,
    identity: `new:${key}|show|*`,
    path: `/programas/${key.replace(/_/g, '-')}`,
    pathRefused: [],
    historicOwner: false,
    ...over,
  };
};

test('samples are seeded and independent of input order', () => {
  const traces = Array.from({ length: 200 }, () => trace());
  const a = sampleTraces(traces, 20, 's1', AUTO_CREATE).map((t) => t.candidateId);
  assert.equal(a.length, 20);
  assert.deepEqual(sampleTraces([...traces].reverse(), 20, 's1', AUTO_CREATE).map((t) => t.candidateId), a);
  assert.notDeepEqual(sampleTraces(traces, 20, 's2', AUTO_CREATE).map((t) => t.candidateId), a);
  assert.deepEqual(sampleTraces(traces, 500, 's1', AUTO_CREATE).length, 200);
  // A larger sample extends a smaller one with the same seed, so labels done on 20 carry over to 40.
  assert.deepEqual(sampleTraces(traces, 40, 's1', AUTO_CREATE).slice(0, 20).map((t) => t.candidateId), a);
});

test('review sheet: CSV round trip keeps every cell; a candidate drawn twice appears once', () => {
  const traces = [
    trace({ key: 'dup', title: 'Título, "con" comillas\nlínea', tmdb: { ids: [1], evidence: 'confirmed', ref: { type: 'tv', id: 1 } } }),
    ...Array.from({ length: 10 }, () => trace()),
  ];
  const rows = buildReviewRows(traces, { seed: 'x', perClass: 50, precision: 50 });
  assert.equal(rows.length, 11);
  const dup = rows.find((r) => r.candidate_id === 'dup|show||')!;
  assert.deepEqual(dup.strata.split(';').slice(0, 3), [AUTO_CREATE, 'new_entity', 'tmdb_confirmed']);
  assert.equal(dup.tmdb_url, 'https://www.themoviedb.org/tv/1');
  assert.deepEqual(parseCsv(toCsv(rows)), rows);
  assert.deepEqual(Object.keys(rows[0]), REVIEW_COLUMNS);
});

test('exact intervals: known values, and zero errors in a small sample proves little', () => {
  const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-4, `${a} vs ${b}`);
  // Zero failures: the one-sided bound is alpha^(1/n) ("rule of three").
  near(clopperPearson(30, 30, 0.05).lower, 0.05 ** (1 / 30));
  near(clopperPearson(300, 300, 0.05).lower, 0.05 ** (1 / 300));
  near(clopperPearson(0, 10).upper, 1 - 0.025 ** (1 / 10));
  // Reference: 294/300 (98% observed) gives about 95.7%–99.3%.
  const ci = clopperPearson(294, 300);
  assert.ok(ci.lower > 0.956 && ci.lower < 0.958, String(ci.lower));
  assert.ok(ci.upper > 0.992 && ci.upper < 0.994, String(ci.upper));
  assert.ok(clopperPearson(30, 30, 0.05).lower < 0.98, '30/30 does not show precision above 98%');
  const w = wilson(294, 300);
  assert.ok(w.lower < 0.98 && w.upper > 0.98);
});

test('scoring: only signed labels count; the gate needs the full sample and no critical ownership error', () => {
  const traces = Array.from({ length: 300 }, () => trace());
  const rows = buildReviewRows(traces, { seed: 'g', perClass: 0, precision: 300 });
  const label = (r: Record<string, string>, ok: boolean, extra: Record<string, string> = {}) =>
    Object.assign(r, { reviewer: 'Manuel', identity_ok: ok ? 'y' : 'n', kind_ok: 'y', path_ok: 'y', ...extra });

  const unlabelled = scoreReview(rows);
  assert.equal(unlabelled.reviewed, 0);
  assert.equal(unlabelled.gate.pass, false);

  rows.forEach((r, i) => label(r, i >= 3, i < 3 ? { error_category: 'episode_as_work' } : {}));
  // A second person labels 50 of the same rows without seeing the first labels (2D-2E §9).
  const verify = () => rows.slice(0, 50).map((r) => ({ ...r, reviewer: 'Ana García' }));
  assert.match(scoreReview(rows).gate.blockers.join(), /independent verification: 0 auto-create rows/);
  const ok = scoreReview(rows, undefined, verify());
  assert.equal(ok.autoCreate.identityPrecision.n, 300);
  assert.equal(ok.autoCreate.identityPrecision.observed, 297 / 300);
  assert.ok(ok.autoCreate.identityPrecision.lower95 > 0.97);
  assert.deepEqual(ok.errorCategories, { episode_as_work: 3 });
  assert.deepEqual(ok.gate.blockers, []);
  assert.equal(ok.gate.pass, true);
  rows[0].error_category = '';
  assert.match(scoreReview(rows, undefined, verify()).gate.blockers.join(), /1 identity error\(s\) without a valid error_category/);
  rows[0].error_category = 'false_merge';

  rows[10].path_ok = 'n';
  rows[10].critical = 'y';
  assert.match(scoreReview(rows).gate.blockers.join(), /critical canonical-ownership/);
  rows[10].path_ok = 'y';

  rows[20].reviewer = 'system';
  const unsigned = scoreReview(rows);
  assert.deepEqual(unsigned.invalidReviewer, [rows[20].candidate_id]);
  assert.match(unsigned.gate.blockers.join(), /without a named reviewer/);
  rows[20].reviewer = 'Manuel';

  rows.slice(3, 10).forEach((r) => (r.identity_ok = 'n'));
  assert.match(scoreReview(rows).gate.blockers.join(), /precision 0.9666/);
  rows[50].identity_ok = '?';
  assert.match(scoreReview(rows).gate.blockers.join(), /1 unresolved/);
});

test('independent verification: disagreements block until adjudicated; kappa counts them; one person cannot verify themself', () => {
  const traces = Array.from({ length: 60 }, () => trace());
  const primary = buildReviewRows(traces, { seed: 'v', perClass: 0, precision: 60 }).map((r, i) =>
    Object.assign(r, { reviewer: 'Manuel', identity_ok: i < 6 ? 'n' : 'y', kind_ok: 'y', path_ok: 'y', error_category: i < 6 ? 'duplicate' : '' })
  );
  const second = primary.map((r) => ({ ...r, reviewer: 'Ana García' }));
  second[10].identity_ok = 'n';
  second[0].identity_ok = 'y';
  second[20].kind_ok = 'n';

  const raw = compareReviews(primary, second);
  assert.equal(raw.overlap, 60);
  assert.deepEqual(raw.open.map((d) => [d.candidate_id, d.field]).sort(), [
    [primary[0].candidate_id, 'identity_ok'],
    [primary[10].candidate_id, 'identity_ok'],
    [primary[20].candidate_id, 'kind_ok'],
  ].sort());
  assert.equal(raw.identityAgreement, 58 / 60);
  // Cohen's kappa by hand: po = 58/60; primary 54 y, verifier 54 y; pe = 0.9² + 0.1² = 0.82.
  assert.ok(Math.abs((raw.kappa as number) - (58 / 60 - 0.82) / (1 - 0.82)) < 1e-12);
  const gate = { precision: 0.9, minLabelled: 60, minVerified: 50 };
  assert.match(scoreReview(primary, gate, second).gate.blockers.join(), /3 reviewer disagreement\(s\) not adjudicated/);

  // Settled: the primary rows take the agreed labels and say so; agreement still counts the originals.
  Object.assign(primary[0], { identity_ok: 'y', error_category: '', notes: 'adjudicated identity_ok with Ana: same work' });
  Object.assign(primary[10], { identity_ok: 'n', error_category: 'episode_as_work', notes: 'Adjudicated identity_ok: episode' });
  Object.assign(primary[20], { kind_ok: 'n', notes: 'adjudicated' });
  assert.equal(compareReviews(primary, second).open.length, 0, 'labels agree now');
  assert.deepEqual(compareReviews(primary, second).disagreements.length, 2, 'a note naming no field settles nothing it can be counted for');
  primary[20].notes = 'adjudicated kind_ok';
  const settled = compareReviews(primary, second);
  assert.deepEqual(settled.open, []);
  assert.equal(settled.identityAgreement, 58 / 60, 'adjudication does not erase a disagreement');
  assert.equal(scoreReview(primary, gate, second).gate.pass, true);

  assert.match(scoreReview(primary, gate, primary).gate.blockers.join(), /60 verification row\(s\) labelled by the primary reviewer/);
  assert.match(scoreReview(primary, gate, second.slice(0, 49)).gate.blockers.join(), /49 auto-create rows labelled by a second person, 50 required/);
});
