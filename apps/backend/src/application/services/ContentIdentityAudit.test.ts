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

  rows.forEach((r, i) => label(r, i >= 3));
  const ok = scoreReview(rows);
  assert.equal(ok.autoCreate.identityPrecision.n, 300);
  assert.equal(ok.autoCreate.identityPrecision.observed, 297 / 300);
  assert.ok(ok.autoCreate.identityPrecision.lower95 > 0.97);
  assert.deepEqual(ok.gate.blockers, []);
  assert.equal(ok.gate.pass, true);

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
