import test from 'node:test';
import assert from 'node:assert/strict';
import type { IdentityTrace } from './ContentIdentityIngestion';
import type { EvidenceVerdict } from './ContentIdentityEvidence';
import {
  EVIDENCE_SHEET_COLUMNS, buildEvidenceSheet,
  authenticate, hashToken, ledgerReport, nextRows, openLedger, parseLedger, parseRoster, recordDecision, rowStates, toSheets, verifyChain,
  type LedgerEntry, type Roster,
} from './ContentIdentityReviewLedger';

const rows = (n: number, autoShare = 1): Record<string, string>[] =>
  Array.from({ length: n }, (_, i) => ({ candidate_id: `c${i}`, strata: i < n * autoShare ? 'auto_create' : 'ambiguous', method: 'tmdb_exact', tmdb_evidence: 'confirmed', proposed_path: `/peliculas/p${i}`, epg_title: `T${i}` }));
const roster: Roster = parseRoster(JSON.stringify({ version: 1, reviewers: ['Ana García', 'Luis Pérez', 'Marta Ruiz'].map((name) => ({ name, tokenSha256: hashToken(`tok-${name}`) })) }));
const T0 = new Date('2026-10-22T09:00:00Z');

class Book {
  entries: LedgerEntry[];
  constructor(readonly sheet: Record<string, string>[]) { this.entries = [openLedger(sheet, 'Ana García', T0)]; }
  decide(rowId: string, decision: string, reviewer: string, extra: Record<string, unknown> = {}) {
    const d = recordDecision(this.entries, this.sheet, { rowId, decision, reviewer, ...extra }, new Date(T0.getTime() + this.entries.length * 1000));
    this.entries.push(d);
    return d;
  }
}
const serialize = (entries: LedgerEntry[]) => entries.map((e) => JSON.stringify(e)).join('\n');

test('roster: only named people with their own token authenticate; automation names and bad rosters are refused', () => {
  assert.equal(authenticate(roster, 'ana garcía', 'tok-Ana García'), 'Ana García');
  for (const [name, token] of [['Ana García', 'tok-Luis Pérez'], ['Ana García', undefined], ['Ana García', ''], ['Nadie Real', 'x'], ['claude', 'tok-claude'], ['system', 'x']] as const) {
    assert.throws(() => authenticate(roster, name, token), /reviewer/, `${name}`);
  }
  assert.throws(() => parseRoster(JSON.stringify({ version: 1, reviewers: [{ name: 'Codex', tokenSha256: hashToken('x') }] })), /reviewer/);
  assert.throws(() => parseRoster(JSON.stringify({ version: 1, reviewers: [{ name: 'Ana', tokenSha256: 'zz' }] })));
  assert.throws(() => parseRoster(JSON.stringify({ version: 1, reviewers: ['Ana', 'ana'].map((name) => ({ name, tokenSha256: hashToken(name) })) })), /invalid roster entry/);
});

test('ledger: immutable history, corrections supersede, nothing can be rewritten undetected', () => {
  const book = new Book(rows(6));
  book.decide('c0', 'accept', 'Ana García');
  assert.throws(() => book.decide('c0', 'reject', 'Ana García', { errorCategory: 'wrong_kind' }), /already decided/);
  const fix = book.decide('c0', 'reject', 'Ana García', { errorCategory: 'wrong_kind', correct: true, note: 'misread' });
  assert.equal(fix.supersedes, 1);
  assert.equal(rowStates(book.entries).get('c0')!.primary!.decision, 'reject');
  assert.equal(rowStates(book.entries).get('c0')!.history.length, 2, 'the superseded entry stays');
  assert.deepEqual(parseLedger(serialize(book.entries)).length, 3);
  const lines = serialize(book.entries).split('\n');
  const tamper = (change: (l: string[]) => string[]) => assert.throws(() => parseLedger(change([...lines]).join('\n')), /ledger entry/);
  tamper((l) => { l[1] = l[1].replace('"accept"', '"reject"'); return l; });
  tamper((l) => l.slice(0, 1).concat(l.slice(2)));
  tamper((l) => [l[0], l[2], l[1]]);
  tamper((l) => { l[2] = l[2].replace('misread', 'edited'); return l; });
  tamper((l) => { l[0] = l[0].replace('"rows":6', '"rows":7'); return l; });
  const withLabels = new Book(rows(2));
  withLabels.decide('c0', 'accept', 'Ana García', { labels: { path_ok: 'y' } });
  assert.throws(() => parseLedger(serialize(withLabels.entries).replace('"path_ok":"y"', '"path_ok":"n"')), /modified/, 'nested label changes are covered by the hash');
  assert.deepEqual(verifyChain(book.entries), { ok: true });
});

test('decisions need valid input: category on rejection, named reviewer, a row of this sheet, the sheet the ledger was opened for', () => {
  const book = new Book(rows(3));
  assert.throws(() => book.decide('c0', 'reject', 'Ana García'), /error-category/);
  assert.throws(() => book.decide('c0', 'reject', 'Ana García', { errorCategory: 'nonsense' }), /error-category/);
  assert.throws(() => book.decide('c0', 'maybe', 'Ana García'), /decision must be/);
  assert.throws(() => book.decide('c0', 'accept', 'claude'), /reviewer/);
  assert.throws(() => book.decide('zzz', 'accept', 'Ana García'), /not in the sheet/);
  assert.throws(() => recordDecision(book.entries, rows(4), { rowId: 'c0', decision: 'accept', reviewer: 'Ana García' }, T0), /not the one/);
  assert.throws(() => book.decide('c0', 'accept', 'Ana García', { correct: true }), /nothing of yours/);
});

test('second review is a different person and blind; adjudication needs a third; settled rows are closed', () => {
  const book = new Book(rows(4));
  book.decide('c0', 'accept', 'Ana García');
  assert.throws(() => book.decide('c0', 'accept', 'Ana García', { correct: false }), /already decided/);
  const forLuis = nextRows(book.entries, book.sheet, 'Luis Pérez', 10);
  assert.equal(forLuis[0].candidate_id, 'c0', 'rows awaiting a second reviewer come first');
  assert.ok(forLuis.every((r) => !('identity_ok' in r) && !('reviewer' in r)), 'no label of anyone is served');
  assert.ok(!nextRows(book.entries, book.sheet, 'Ana García', 10).some((r) => r.candidate_id === 'c0'), 'nobody reviews their own row twice');
  assert.deepEqual(nextRows(book.entries, book.sheet, 'Marta Ruiz', 10, true).map((r) => r.candidate_id), ['c0'], 'second-only skips fresh rows');
  book.decide('c0', 'reject', 'Luis Pérez', { errorCategory: 'false_merge' });
  assert.throws(() => book.decide('c0', 'accept', 'Ana García', { correct: true }), /second review exists/);
  assert.deepEqual(ledgerReport(book.sheet, book.entries).openDisagreements, ['c0']);
  book.decide('c0', 'reject', 'Marta Ruiz', { errorCategory: 'false_merge', note: 'two different films' });
  assert.throws(() => book.decide('c0', 'accept', 'Luis Pérez', { correct: true }), /adjudicated/);
  assert.deepEqual(ledgerReport(book.sheet, book.entries).openDisagreements, []);
  // Agreement needs no adjudicator.
  book.decide('c1', 'accept', 'Ana García');
  book.decide('c1', 'accept', 'Luis Pérez');
  assert.throws(() => book.decide('c1', 'accept', 'Marta Ruiz'), /nothing to adjudicate/);
  // Non-auto rows take a single review.
  const mixed = new Book(rows(4, 0.5));
  mixed.decide('c3', 'accept', 'Ana García');
  assert.throws(() => mixed.decide('c3', 'accept', 'Luis Pérez'), /only auto-create/);
});

/** 300 auto-create rows labelled by Ana (`wrong` rejections), the first `verified` of them re-labelled by Luis. */
function campaign(wrong: number, verified: number, overrides: { disagreeAt?: number[] } = {}) {
  const book = new Book(rows(320));
  for (let i = 0; i < 300; i++) {
    if (i < wrong) book.decide(`c${i}`, 'reject', 'Ana García', { errorCategory: 'false_merge' });
    else book.decide(`c${i}`, 'accept', 'Ana García', { labels: { kind_ok: 'y', path_ok: 'y', critical: 'n' } });
  }
  for (let i = 0; i < verified; i++) {
    const flip = overrides.disagreeAt?.includes(i);
    const primaryAccepts = i >= wrong;
    const accepts = flip ? !primaryAccepts : primaryAccepts;
    // The scorer compares kind_ok/path_ok/critical too: the second reviewer labels the same fields.
    book.decide(`c${i}`, accepts ? 'accept' : 'reject', 'Luis Pérez', accepts ? { labels: { kind_ok: 'y', path_ok: 'y', critical: 'n' } } : { errorCategory: 'false_merge' });
  }
  return book;
}

test('the unchanged gate decides: 300 labels, 98 % precision, 50 second-reviewer rows, no open disagreement', () => {
  const pass = ledgerReport(campaign(3, 60).sheet, campaign(3, 60).entries);
  assert.equal(pass.score.gate.pass, true, JSON.stringify(pass.score.gate.blockers));
  assert.deepEqual(pass.progress.labelled, { have: 300, need: 300 });
  assert.equal(pass.progress.verified.have, 60);
  assert.equal(pass.rawAgreement, 1);

  const cases: Array<[string, ReturnType<typeof campaign>, RegExp]> = [
    ['precision below 98 %', campaign(7, 60), /precision/],
    ['too few second-reviewer rows', campaign(3, 49), /second person/],
    ['too few labels', (() => { const b = new Book(rows(320)); for (let i = 0; i < 299; i++) b.decide(`c${i}`, 'accept', 'Ana García'); return b; })(), /identity labels: 299/],
    ['no second reviewer at all', campaign(3, 0), /second person/],
  ];
  for (const [name, book, blocker] of cases) {
    const report = ledgerReport(book.sheet, book.entries);
    assert.equal(report.score.gate.pass, false, name);
    assert.ok(report.score.gate.blockers.some((b) => blocker.test(b)), `${name}: ${report.score.gate.blockers}`);
  }
});

test('a reviewer disagreement keeps the gate shut until a third person settles it; uncertain rows never count as labels', () => {
  const book = campaign(3, 60, { disagreeAt: [10] });
  let report = ledgerReport(book.sheet, book.entries);
  assert.deepEqual(report.openDisagreements, ['c10']);
  assert.equal(report.score.gate.pass, false);
  assert.ok(report.score.gate.blockers.some((b) => /disagreement/.test(b)));
  book.decide('c10', 'accept', 'Marta Ruiz', { note: 'checked TMDB and the broadcaster page' });
  report = ledgerReport(book.sheet, book.entries);
  assert.deepEqual(report.openDisagreements, []);
  assert.equal(report.rawAgreement, 59 / 60, 'raw agreement ignores the adjudication');
  assert.equal(report.score.gate.pass, true, JSON.stringify(report.score.gate.blockers));

  const unsure = new Book(rows(5));
  unsure.decide('c0', 'uncertain', 'Ana García', { note: 'cannot tell' });
  const r = ledgerReport(unsure.sheet, unsure.entries);
  assert.equal(r.uncertain, 1);
  assert.equal(r.progress.labelled.have, 0);
  assert.equal(toSheets(unsure.sheet, unsure.entries).primary[0].identity_ok, '?');
});

test('export: sheets carry reviewer attribution and the errors counted by category', () => {
  const book = campaign(3, 60);
  const { primary, second } = toSheets(book.sheet, book.entries);
  assert.equal(primary.filter((r) => r.reviewer === 'Ana García').length, 300);
  assert.equal(second.length, 60);
  assert.ok(second.every((r) => r.reviewer === 'Luis Pérez'));
  const report = ledgerReport(book.sheet, book.entries);
  assert.deepEqual(report.score.errorCategories, { false_merge: 3 });
  assert.deepEqual(report.reviewers, { 'Ana García': 300, 'Luis Pérez': 60 });
});

test('evidence sheet: only gate-accepted identities, one row per identity across days, evidence shown, deterministic', () => {
  const trace = (n: number, over: Partial<IdentityTrace> = {}): IdentityTrace => ({
    candidateId: `w${n}|movie|movie:${n}|1999`, key: `w${n}`, kind: 'movie', title: `W${n}`, spellings: [`W${n}`], channels: ['la1'],
    broadcaster: { genres: [], minutes: null, maxSeason: null }, airings: 1, epgYears: [1999], tmdb: { ids: [n], evidence: 'confirmed', ref: { type: 'movie', id: n } as never },
    decision: 'create', identity: `new:w${n}|movie|tmdb:movie:${n}`, path: `/peliculas/w${n}`, ...over,
  });
  const verdict = (t: IdentityTrace, over: Partial<EvidenceVerdict> = {}): EvidenceVerdict => ({
    candidateId: t.candidateId, key: t.key, kind: t.kind, title: t.title, identity: t.identity, path: t.path, decision: 'AUTO_ACCEPT', assurance: 'independently_supported',
    kindBasis: 'tmdb_runtime', support: [{ source: 'tmdb_unique_title', claim: `only film titled "${t.title}"`, provenance: 'external_metadata', root: `tmdb_index:movie:${t.title}`, independent: true },
      { source: 'cross_day', claim: 'seen on 3 days', provenance: 'derived', root: 'epg_title', independent: false }], contradictions: [], missing: [], unverified: [], ...over,
  });
  const a = [1, 2, 3, 4].map((n) => trace(n));
  const day1 = { traces: a, verdicts: [verdict(a[0]), verdict(a[1]), verdict(a[2], { decision: 'QUARANTINE', assurance: 'machine_supported', unverified: ['title_only'] }), verdict(a[3], { assurance: 'machine_supported' })] };
  const b = [1, 5].map((n) => trace(n));
  const day2 = { traces: b, verdicts: b.map((t) => verdict(t)) };
  const { population, rows } = buildEvidenceSheet([day1, day2], { seed: 's', size: 10 });
  assert.equal(population, 3, 'w1 (both days), w2, w5; quarantined and machine-supported rows are not in the population');
  assert.equal(rows.length, 3);
  assert.ok(rows.every((r) => r.strata === 'auto_create'));
  assert.match(rows[0].independent_evidence, /only film titled/);
  assert.doesNotMatch(rows[0].independent_evidence, /seen on 3 days/, 'derived evidence is not shown as independent');
  assert.deepEqual(buildEvidenceSheet([day1, day2], { seed: 's', size: 10 }).rows, rows);
  assert.equal(buildEvidenceSheet([day1, day2], { seed: 's', size: 2 }).rows.length, 2);
  assert.ok(EVIDENCE_SHEET_COLUMNS.indexOf('independent_evidence') < EVIDENCE_SHEET_COLUMNS.indexOf('reviewer'));
  const book = new Book(rows);
  book.decide(rows[0].candidate_id, 'accept', 'Ana García');
  assert.equal(ledgerReport(rows, book.entries).decided, 1);
});
