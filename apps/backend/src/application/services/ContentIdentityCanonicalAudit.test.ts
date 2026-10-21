import test from 'node:test';
import assert from 'node:assert/strict';
import type { IdentityTrace } from './ContentIdentityIngestion';
import { auditProposedPaths, auditRegistry } from './ContentIdentityCanonicalAudit';

const trace = (title: string, over: Partial<IdentityTrace> = {}): IdentityTrace => ({
  candidateId: `${title}|show`, key: title, kind: 'show', title, spellings: [title], channels: ['la1'],
  broadcaster: { genres: [], minutes: null, maxSeason: null }, airings: 1, epgYears: [], tmdb: { ids: [], evidence: 'none' },
  decision: 'create', identity: `new:${title}`, path: `/programas/${title}`, ...over,
});
const codes = (r: { findings: Array<{ code: string }> }) => r.findings.map((f) => f.code);

test('proposed paths: a clean day passes; every planted defect is a blocker with a machine-readable finding', () => {
  const clean = auditProposedPaths([trace('alpha'), trace('beta', { kind: 'movie', path: '/peliculas/beta' }), trace('alpha', { decision: 'bind' })]);
  assert.equal(clean.pass, true);
  assert.deepEqual(clean.summary, { proposed: 2, withPath: 2, pathless: 0, legacyInherited: 0, severity: { blocker: 0, quarantine: 0, review: 0 } });
  const bad = auditProposedPaths([
    trace('one', { path: '/programas/dup' }), trace('two', { path: '/programas/Dup/' }),
    trace('three', { path: '/peliculas/three' }),                       // namespace: a show under films
    trace('four', { path: '/programas/four?x=1' }),                     // unsafe
    trace('five', { path: '/programas/cine' }),                         // reserved
  ]);
  assert.equal(bad.pass, false);
  assert.deepEqual(codes(bad).sort(), ['path_collision', 'path_namespace_kind_mismatch', 'path_not_normalised', 'path_reserved_slug', 'path_unsafe_characters'].sort());
  assert.deepEqual(bad.collisions, [{ path: '/programas/dup', identities: ['new:one', 'new:two'] }]);
});

test('proposed paths: pathless identities are quarantined, and a blocker when the gate accepted them', () => {
  const pathless = [trace('9-1-1', { kind: 'series', path: null, pathless: 'unsupported_slug' }), trace('x', { path: null, pathless: 'historic_unverified' })];
  const held = auditProposedPaths(pathless);
  assert.equal(held.pass, true);
  assert.deepEqual(held.quarantine.map((f) => f.code), ['pathless_historic_unverified', 'pathless_unsupported_slug']);
  const accepted = auditProposedPaths(pathless, new Set(['new:9-1-1']));
  assert.equal(accepted.pass, false);
  assert.equal(accepted.findings.find((f) => f.severity === 'blocker')?.identity, 'new:9-1-1');
});

test('proposed paths: the same slug in two namespaces is a review item, not a collision; output is deterministic', () => {
  const twins = [trace('gamma'), trace('gamma', { kind: 'series', path: '/series/gamma', identity: 'new:gamma-series' })];
  const a = auditProposedPaths(twins);
  assert.equal(a.pass, true);
  assert.deepEqual(a.findings.map((f) => [f.code, f.severity]), [['same_slug_several_namespaces', 'review']]);
  assert.deepEqual(auditProposedPaths([...twins].reverse()), a);
});

const ent = (entityId: string, over: Record<string, unknown> = {}) => ({ entityId, kind: 'movie' as const, status: 'active' as const, canonicalPath: `/peliculas/${entityId}`, ...over });
const slug = (path: string, entityId: string, role: 'canonical' | 'redirect' | 'gone' = 'canonical') => ({ path, entityId, role });

test('registry: a consistent registry passes, including merges, removals and an empty registry', () => {
  assert.equal(auditRegistry([], []).pass, true);
  const ok = auditRegistry(
    [ent('a'), ent('b', { status: 'merged', mergedInto: 'a', canonicalPath: undefined }), ent('c', { status: 'removed' }), ent('d', { status: 'candidate', canonicalPath: undefined }), ent('e', { status: 'removed' })],
    [slug('/peliculas/a', 'a'), slug('/peliculas/old', 'a', 'redirect'), slug('/peliculas/b', 'b', 'redirect'), slug('/peliculas/c', 'c', 'gone'), slug('/peliculas/e', 'e')]
  );
  assert.deepEqual(ok.findings, []);
  assert.deepEqual(ok.summary.severity, { blocker: 0, quarantine: 0, review: 0 });
});

test('registry: every planted inconsistency is found', () => {
  const planted: Array<[string, ReturnType<typeof auditRegistry>]> = [
    ['active_without_canonical_row', auditRegistry([ent('a')], [])],
    ['canonical_cache_mismatch', auditRegistry([ent('a', { canonicalPath: '/peliculas/zzz' })], [slug('/peliculas/a', 'a')])],
    ['several_canonical_rows', auditRegistry([ent('a')], [slug('/peliculas/a', 'a'), slug('/peliculas/a2', 'a')])],
    ['slug_owner_missing', auditRegistry([], [slug('/peliculas/a', 'ghost')])],
    ['duplicate_path_owner', auditRegistry([ent('a'), ent('b')], [slug('/peliculas/a', 'a'), slug('/peliculas/a', 'b')])],
    ['duplicate_entity_id', auditRegistry([ent('a'), ent('a')], [slug('/peliculas/a', 'a')])],
    ['path_namespace_kind_mismatch', auditRegistry([ent('a', { kind: 'series' })], [slug('/peliculas/a', 'a')])],
    ['path_bad_slug', auditRegistry([ent('a')], [slug('/peliculas/A_b', 'a')])],
    ['merged_entity_keeps_canonical', auditRegistry([ent('a'), ent('b', { status: 'merged', mergedInto: 'a' })], [slug('/peliculas/a', 'a'), slug('/peliculas/b', 'b')])],
    ['merge_target_missing', auditRegistry([ent('b', { status: 'merged', mergedInto: 'nowhere' })], [slug('/peliculas/b', 'b', 'redirect')])],
    ['merge_chain', auditRegistry([ent('a'), ent('b', { status: 'merged', mergedInto: 'c' }), ent('c', { status: 'merged', mergedInto: 'a' })], [slug('/peliculas/a', 'a')])],
    ['merge_target_not_active', auditRegistry([ent('a', { status: 'removed' }), ent('b', { status: 'merged', mergedInto: 'a' })], [])],
    ['redirect_cycle', auditRegistry([ent('a', { status: 'merged', mergedInto: 'b' }), ent('b', { status: 'merged', mergedInto: 'a' })], [slug('/peliculas/a', 'a', 'redirect')])],
    ['redirect_chain', auditRegistry([ent('a'), ent('b', { status: 'merged', mergedInto: 'a' }), ent('c', { status: 'merged', mergedInto: 'b' })], [slug('/peliculas/a', 'a'), slug('/peliculas/c', 'c', 'redirect')])],
    ['redirect_to_pathless_entity', auditRegistry([ent('a', { canonicalPath: undefined })], [slug('/peliculas/old', 'a', 'redirect')])],
    ['redirect_to_itself', auditRegistry([ent('a')], [slug('/peliculas/a', 'a', 'redirect')])],
  ];
  for (const [code, report] of planted) {
    assert.ok(codes(report).includes(code), `${code}: ${codes(report)}`);
    assert.equal(report.pass, false, code);
  }
});
