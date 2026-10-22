/** Phase 3C manifest: bounded, reproducible, fail-closed. Synthetic cases plus the committed real batch. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { authorizationSignatureValid } from '@/domain/services/contentCertification';
import type { EvidenceVerdict } from './ContentIdentityEvidence';
import type { IdentityTrace } from './ContentIdentityIngestion';
import { authorizationTemplate, buildCanaryManifest, CanaryManifest, DayInput, eligiblePool, LegacyProbe, manifestProblems, admitLines } from './ContentCanaryManifest';
import { certificationProblems } from './ContentCertification';
import { grant, loadRealInputs, NOW, ownerKeys, realInputsAvailable, realRoot, reviewFor, verdictFor } from './ContentCertification.fixtures';
import { parseCsv } from './ContentIdentityAudit';

const traceFor = (v: EvidenceVerdict, airings = 1): IdentityTrace => ({ candidateId: v.candidateId, key: v.key, kind: v.kind, title: v.title, spellings: [v.title], airings, epgYears: [2001], tmdb: { ids: [1], evidence: 'confirmed' }, decision: 'create' }) as IdentityTrace;
const probe = (v: EvidenceVerdict, over: Partial<LegacyProbe> = {}): LegacyProbe => ({ candidateId: v.candidateId, url: `https://x.test${v.path}`, status: 200, robots: 'noindex, follow', descriptionChars: 400, year: 2001, measuredAt: NOW.toISOString(), ...over });
const tmdb = (v: EvidenceVerdict) => ({ type: 'movie' as const, id: Number(/movie:(\d+)/.exec(v.candidateId)![1]), query: v.title, details: { runtime: 100, genreIds: [18] } });

function scenario(n: number) {
  const vs = Array.from({ length: n }, (_, i) => verdictFor(`pelicula_${String(i).padStart(2, '0')}`, 1000 + i));
  const days: DayInput[] = [{ day: '20261021', verdicts: vs, traces: vs.map((v) => traceFor(v)) }, { day: '20261022', verdicts: [], traces: vs.map((v) => traceFor(v, 2)) }];
  return { vs, days, review: reviewFor(vs.map((v) => v.candidateId)), probes: vs.map((v) => probe(v)), tmdbChecks: vs.map(tmdb) };
}

test('manifest: ceiling 25, deterministic, digest binds the batch', () => {
  const s = scenario(30);
  const a = buildCanaryManifest({ ...s, now: NOW, size: 100 }).manifest;
  const b = buildCanaryManifest({ ...s, now: new Date(NOW.getTime() + 1000), size: 100 }).manifest;
  assert.equal(a.entities.length, 25, 'asking for more is capped at 25');
  assert.equal(a.digest, b.digest, 'same inputs, same digest (the clock is not part of it)');
  assert.deepEqual(manifestProblems(a, NOW), []);
  assert.equal(a.notSelected.filter((n) => n.reasons.includes('beyond_ceiling')).length, 5);
  const changed = { ...a, entities: a.entities.slice(0, 24) };
  assert.ok(manifestProblems(changed, NOW).includes('manifest_digest'), 'removing an entry breaks the digest');
  assert.ok(manifestProblems({ ...a, ceiling: 25, entities: [...a.entities, a.entities[0]] }, NOW).includes('manifest_over_ceiling'));
  assert.ok(manifestProblems(a, new Date('2026-12-01T00:00:00Z')).includes('evidence_stale'));
});

test('manifest: only films with a double AI accept, a clean path and a work title; the rest are counted, not listed as ready', () => {
  const s = scenario(6);
  const [good, noSecond, contested, series, generic] = s.vs;
  s.vs[2] = { ...contested };
  const rival = verdictFor('otra', 99, { path: contested.path, identity: 'new:otra|movie|tmdb:movie:99', decision: 'QUARANTINE' as never });
  const dup = { ...series, kind: 'series' as const };
  const gen = verdictFor('cine', 55, { title: 'Cine' });
  const days: DayInput[] = [{ day: '20261021', verdicts: [good, noSecond, contested, rival, dup, gen, generic], traces: [] }];
  const review = reviewFor([good.candidateId, contested.candidateId, dup.candidateId, gen.candidateId, generic.candidateId, rival.candidateId]);
  const { pool, excluded } = eligiblePool(days, review);
  const ids = pool.map((p) => p.verdict.candidateId);
  assert.ok(ids.includes(good.candidateId));
  assert.ok(!ids.includes(noSecond.candidateId) && excluded.review_missing === 1, 'never reviewed');
  assert.ok(!ids.includes(contested.candidateId) && !ids.includes(rival.candidateId) && excluded.path_contested === 1, 'a path another identity claims, even a quarantined one, is not certifiable');
  assert.ok(!ids.includes(dup.candidateId) && excluded.kind_series === 1);
  assert.ok(!ids.includes(gen.candidateId) && (excluded.title_not_a_work ?? excluded.evidence_gate_violation) === 1, 'a generic slot title is not a work');
  assert.equal(eligiblePool(days, reviewFor([good.candidateId], { second: false })).pool.length, 0, 'no second review: nobody');
  assert.equal(eligiblePool(days, reviewFor([good.candidateId], { gatePass: false })).pool.length, 0, 'gate failed: nobody');
  assert.equal(eligiblePool(days, reviewFor([good.candidateId], { humanPrimary: true })).pool.length, 0, 'a non-AI label is not an AI attestation');
});

test('manifest: a contradiction on any replay day against the same identity excludes it', () => {
  const s = scenario(2);
  const [good, bad] = s.vs;
  const later: DayInput = { day: '20261023', verdicts: [{ ...bad, decision: 'QUARANTINE' as never, contradictions: ['tmdb_conflict'] }], traces: [] };
  const { pool, excluded } = eligiblePool([...s.days, later], s.review);
  assert.deepEqual(pool.map((p) => p.verdict.candidateId), [good.candidateId]);
  assert.equal(excluded.contradicted_on_another_day, 1);
});

test('manifest: content readiness is measured, never assumed; indexed legacy pages are held back by default', () => {
  const s = scenario(5);
  const [ok, thin, noProbe, indexed] = s.vs;
  const probes = [probe(ok), probe(thin, { descriptionChars: 120 }), probe(indexed, { robots: 'index, follow' }), probe(s.vs[4])];
  const base = { ...s, probes, tmdbChecks: s.tmdbChecks.filter((c) => c.id !== tmdb(s.vs[4]).id), now: NOW };
  const m = buildCanaryManifest(base).manifest;
  const sel = m.entities.map((e) => e.candidateId);
  assert.deepEqual(sel, [ok.candidateId], 'only the measured, long-enough, noindex-legacy film');
  const why = (id: string) => m.notSelected.find((n) => n.candidateId === id)!.reasons;
  assert.ok(why(thin.candidateId).includes('synopsis_short_or_missing') && why(thin.candidateId).includes('adsense_risk_high'));
  assert.deepEqual(why(noProbe.candidateId), ['quality_unmeasured']);
  assert.deepEqual(why(indexed.candidateId), ['replaces_indexed_legacy_page']);
  assert.ok(why(s.vs[4].candidateId).some((r) => r.startsWith('metadata_')), 'no runtime/genres from TMDB: missing, not invented');
  const allowed = buildCanaryManifest({ ...base, allowIndexedLegacy: true }).manifest;
  assert.ok(allowed.entities.some((e) => e.candidateId === indexed.candidateId && e.legacy.indexableToday === true), 'opt-in, and the risk stays visible on the entry');
  assert.ok(m.entities[0].readiness.indexingBlockers.includes('identity_verified') && m.entities[0].readiness.indexingBlockers.includes('year_reliable'), 'technical eligibility is not indexing readiness');
  assert.ok(m.warnings.some((w) => w.startsWith('entity_metadata_empty_at_admission')));
});

test('authorisation template covers exactly the manifest; a signed grant makes every entity certifiable', () => {
  const s = scenario(3);
  const { manifest, verdicts } = buildCanaryManifest({ ...s, now: NOW });
  const keys = ownerKeys();
  const payload = authorizationTemplate(manifest, { owner: 'manuelxose', now: new Date(NOW.getTime() - 60_000), executeDays: 2, validDays: 30, statement: 'Approved by the owner for this batch.', id: 'oa_00112233445566ff' });
  assert.equal(payload.batch.manifestDigest, manifest.digest);
  assert.deepEqual(payload.batch.items.map((i) => i.candidateId), manifest.entities.map((e) => e.candidateId));
  const { signOwnerAuthorization } = require('@/domain/services/contentCertification') as typeof import('@/domain/services/contentCertification');
  const signed = signOwnerAuthorization(payload, keys.privatePem);
  assert.equal(authorizationSignatureValid(signed, keys.publicPem), true);
  assert.equal(payload.batch.ledgerHeadHash, manifest.review.ledgerHeadHash, 'the grant pins the ledger the manifest was built from');
  assert.ok(Date.parse(payload.executeBy) <= Date.parse(manifest.freshUntil), 'the signed window never outlives the evidence');
  const long = authorizationTemplate(manifest, { owner: 'manuelxose', now: NOW, executeDays: 3650, validDays: 30, statement: 'Approved by the owner.', id: 'oa_00112233445566ff' });
  assert.equal(long.executeBy, manifest.freshUntil, 'asking for a longer window is clamped to the freshness');
  assert.equal(admitLines(manifest.entities, verdicts).trim().split('\n').length, 3);
  for (const e of manifest.entities) {
    const v = verdicts.get(e.candidateId)!;
    const entity = { entityId: 'ce_01HZZZZZZZZZZZZZZZZZZZZZZZ', kind: 'movie', status: 'candidate', title: v.title, normalizedTitle: v.key, externalIds: { tmdb: e.tmdb }, canonicalPath: e.canonicalPath, matching: { method: 'tmdb_exact', confidence: 0.9, decidedAt: NOW, decidedBy: 'ingest', assurance: 'independently_supported' } } as never;
    const problems = certificationProblems({ entity, canonical: { path: e.canonicalPath, entityId: 'ce_01HZZZZZZZZZZZZZZZZZZZZZZZ', role: 'canonical' }, pathOwner: { entityId: 'ce_01HZZZZZZZZZZZZZZZZZZZZZZZ', role: 'canonical' }, verdict: v, review: s.review, authorization: signed }, { now: NOW, ownerPublicKeyPem: keys.publicPem });
    assert.deepEqual(problems, []);
  }
  void grant;
});

// ---- the committed real batch ------------------------------------------------------------------------------------

const root = realRoot;
const have = realInputsAvailable();

test('the committed real manifest is reproducible from the committed inputs and respects every bound', { skip: !have && 'docs not present' }, () => {
  const inputs = loadRealInputs();
  assert.equal(inputs.review.gate.pass, true);
  assert.equal(inputs.review.gate.basis, 'ai');
  assert.equal(parseCsv(fs.readFileSync(path.join(root, 'phase-3b/round2/review-sheet-3b-r2.csv'), 'utf8')).length, 360);
  const committed = JSON.parse(fs.readFileSync(path.join(root, 'phase-3c/canary-manifest.json'), 'utf8')) as CanaryManifest;
  const { manifest, verdicts } = buildCanaryManifest({ ...inputs, now: new Date(committed.generatedAt), size: 25 });
  assert.equal(manifest.digest, committed.digest, 'regenerating from the inputs gives the committed digest');
  assert.equal(manifest.admitSha256, committed.admitSha256);
  assert.equal(sha(fs.readFileSync(path.join(root, 'phase-3c/canary-admit.jsonl'), 'utf8')), committed.admitSha256, 'the admit file is exactly the batch');
  assert.ok(committed.entities.length >= 1 && committed.entities.length <= 25);
  assert.deepEqual(manifestProblems(committed, new Date(committed.generatedAt)), []);
  assert.equal(new Set(committed.entities.map((e) => e.canonicalPath)).size, committed.entities.length, 'no path twice');
  assert.ok(committed.entities.every((e) => e.kind === 'movie' && e.readiness.content === 'ready' && e.legacy.indexableToday === false && /^\/peliculas\/[a-z0-9-]+$/.test(e.canonicalPath)));
  assert.ok(committed.entities.every((e) => e.review.reviewers.length === 2 && e.review.reviewers.every((r) => r.includes(', ai)'))), 'two AI reviewers, labelled as such');
  assert.equal(verdicts.size, committed.entities.length);
});

const sha = (text: string) => require('node:crypto').createHash('sha256').update(text).digest('hex') as string;

test('3D: a manifest rebuilt later from the same replay does not make that evidence younger', () => {
  // The replay covers days up to the 22nd but ran on the 21st (it reads tomorrow's guide). Rebuilt on the 22nd, the
  // default anchor (today, because the latest replay day is in the future) would add a day of freshness.
  const s = scenario(3);
  const rebuilt = new Date('2026-10-22T10:00:00Z');
  const naive = buildCanaryManifest({ ...s, now: rebuilt, size: 3 }).manifest;
  const pinned = buildCanaryManifest({ ...s, now: rebuilt, size: 3, evidenceProducedDay: '20261021' }).manifest;
  assert.equal(naive.freshUntil, '2026-10-26T00:00:00.000Z');
  assert.equal(pinned.freshUntil, '2026-10-25T00:00:00.000Z', 'the replay ran on 21 October: fresh through the 24th');
  assert.equal(naive.digest, pinned.digest, 'freshness is not part of what the owner signs');
  assert.ok(manifestProblems(pinned, new Date('2026-10-25T12:00:00Z')).includes('evidence_stale'));
});

test('3D: the refreshed manifest is reproducible, keeps nothing whose legacy page became indexable, and needs a new grant', { skip: !have && 'docs not present' }, () => {
  const inputs = loadRealInputs();
  const refreshed = JSON.parse(fs.readFileSync(path.join(root, 'phase-3d/canary-manifest.json'), 'utf8')) as CanaryManifest;
  const previous = JSON.parse(fs.readFileSync(path.join(root, 'phase-3c/canary-manifest.json'), 'utf8')) as CanaryManifest;
  const probes = JSON.parse(fs.readFileSync(path.join(root, 'phase-3d/canary-legacy-probes.json'), 'utf8')) as LegacyProbe[];
  const { manifest } = buildCanaryManifest({ ...inputs, probes, now: new Date(refreshed.generatedAt), size: 25, evidenceProducedDay: '20261021' });
  assert.equal(manifest.digest, refreshed.digest, 'regenerating from the committed inputs gives the committed digest');
  assert.equal(sha(fs.readFileSync(path.join(root, 'phase-3d/canary-admit.jsonl'), 'utf8')), refreshed.admitSha256);
  assert.deepEqual(manifestProblems(refreshed, new Date(refreshed.generatedAt)), []);
  assert.ok(refreshed.entities.every((e) => e.legacy.indexableToday === false), 'no legacy page that Google can index today is replaced');
  const kept = new Set(refreshed.entities.map((e) => e.candidateId));
  const dropped = previous.entities.filter((e) => !kept.has(e.candidateId));
  assert.ok(dropped.length > 0, 'the evidence changed: some of the previous batch left');
  const probeOf = new Map(probes.map((p) => [p.candidateId, p] as const));
  assert.ok(dropped.every((e) => /\bindex\b/.test(probeOf.get(e.candidateId)!.robots!) && !/noindex/.test(probeOf.get(e.candidateId)!.robots!)), 'every one left because its legacy page is now indexable');
  assert.ok(refreshed.entities.every((e) => previous.entities.some((p) => p.candidateId === e.candidateId)), 'nothing new entered on partial evidence');
  assert.notEqual(refreshed.digest, previous.digest, 'a different batch is a different digest: the old grant covers nothing here');
  assert.equal(refreshed.freshUntil, previous.freshUntil, 'the replay was not re-run, so its freshness did not move');
});
