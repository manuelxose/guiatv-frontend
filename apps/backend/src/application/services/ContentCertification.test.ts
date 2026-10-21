/** Phase 3C pure rules: the owner's signed grant, the record chain, read-time validity, the refusal reasons. No database. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizationProblems, authorizationSignatureValid, canonicalJson, chainProblem, evaluateCertification, GENESIS, seal,
  AttestationBody, AttestationRecord, ATTESTED_DECIDER_PREFIX,
} from '@/domain/services/contentCertification';
import { mayBeIndexable } from '@/domain/services/contentIdentity';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import { certificationProblems, CertificationInput, reviewOfRow, verdictDigest } from './ContentCertification';
import { normalizeReviewerName } from './ContentIdentityService';
import { assessPublicationQuality } from './PublicationQuality';
import { grant, NOW, ownerKeys, reviewFor, verdictFor } from './ContentCertification.fixtures';

const keys = ownerKeys();
const other = ownerKeys();

function entityFor(v = verdictFor('la_isla', 100), over: Partial<ContentEntityRecord> = {}): ContentEntityRecord {
  return {
    entityId: 'ce_01HZZZZZZZZZZZZZZZZZZZZZZZ', kind: 'movie', status: 'candidate', title: 'La isla', normalizedTitle: v.key, year: 2001,
    externalIds: { tmdb: { type: 'movie', id: 100 } }, canonicalPath: v.path!,
    matching: { method: 'tmdb_exact', confidence: 0.9, decidedAt: NOW, decidedBy: 'ingest', assurance: 'independently_supported' },
    metadata: {}, indexability: { state: 'noindex', reasons: [] }, version: 0, createdAt: NOW, updatedAt: NOW, ...over,
  } as ContentEntityRecord;
}

function input(over: Partial<CertificationInput> = {}, v = verdictFor('la_isla', 100)): CertificationInput {
  const e = entityFor(v);
  return {
    entity: e, canonical: { path: e.canonicalPath!, entityId: e.entityId, role: 'canonical' }, pathOwner: { entityId: e.entityId, role: 'canonical' },
    verdict: v, review: reviewFor([v.candidateId]), authorization: grant(keys, [v]), ...over,
  };
}
const ctx = { now: NOW, ownerPublicKeyPem: keys.publicPem };

test('a complete, consistent bundle has no refusal reason', () => {
  assert.deepEqual(certificationProblems(input(), ctx), []);
});

test('the owner grant: only the owner key verifies it, any edit or foreign key breaks it', () => {
  const v = verdictFor('la_isla', 100);
  const g = grant(keys, [v]);
  assert.equal(authorizationSignatureValid(g, keys.publicPem), true);
  assert.equal(authorizationSignatureValid(g, other.publicPem), false, 'another key');
  assert.equal(authorizationSignatureValid(g, undefined), false, 'no configured key fails closed');
  const edited = { ...g, payload: { ...g.payload, batch: { ...g.payload.batch, max: 24 } } };
  assert.equal(authorizationSignatureValid(edited, keys.publicPem), false, 'edited payload');
  assert.ok(certificationProblems(input({ authorization: grant(other, [v]) }), ctx).includes('authorization_signature'), 'self-issued grant');
});

test('grant bounds: ceiling 25, window, lifetime, duplicates, statement', () => {
  const many = Array.from({ length: 26 }, (_, i) => verdictFor(`pelicula_${i}`, 1000 + i));
  assert.ok(authorizationProblems(grant(keys, many).payload).includes('authorization_ceiling'));
  const v = verdictFor('la_isla', 100);
  assert.deepEqual(authorizationProblems(grant(keys, [v]).payload), []);
  assert.ok(authorizationProblems(grant(keys, [v], { validDays: 181 }).payload).includes('authorization_valid_days'));
  assert.ok(authorizationProblems(grant(keys, [v], { statement: 'ok' }).payload).includes('authorization_statement'));
  assert.ok(authorizationProblems(grant(keys, [v], { executeBy: '2026-10-21T00:00:00Z' }).payload).includes('authorization_window'));
  const dup = grant(keys, [v, v]);
  assert.ok(authorizationProblems(dup.payload).includes('authorization_duplicate_item'));
});

test('evidence: missing, contradicted, unverified, pathless or non-accepted verdicts are refused', () => {
  const base = verdictFor('la_isla', 100);
  const refuse = (over: Partial<typeof base>, code: string) => {
    const v = { ...base, ...over };
    assert.ok(certificationProblems(input({ verdict: v, authorization: grant(keys, [v]), review: reviewFor([v.candidateId]) }), ctx).includes(code), `${code} for ${JSON.stringify(over)}`);
  };
  refuse({ contradictions: ['tmdb_conflict'] }, 'verdict_contradictions');
  refuse({ missing: ['runtime'] }, 'verdict_missing_evidence');
  refuse({ unverified: ['year'] }, 'verdict_unverified');
  refuse({ decision: 'QUARANTINE' as never }, 'verdict_not_accepted');
  refuse({ assurance: 'machine_supported' as never }, 'verdict_not_accepted');
  refuse({ path: null }, 'verdict_pathless');
  refuse({ support: [] }, 'evidence_gate_violation');
  refuse({ identity: 'new:otra|movie|tmdb:movie:100' }, 'verdict_identity_mismatch');
  refuse({ path: '/peliculas/otra' }, 'verdict_entity_mismatch');
});

test('entity and canonical ownership: only a path-owning independently supported candidate', () => {
  const v = verdictFor('la_isla', 100);
  const e = (over: Partial<ContentEntityRecord>) => input({ entity: entityFor(v, over) });
  assert.ok(certificationProblems(e({ status: 'active' }), ctx).includes('entity_not_candidate'));
  assert.ok(certificationProblems(e({ matching: { method: 'tmdb_exact', confidence: 0.9, decidedAt: NOW, decidedBy: 'ingest' } }), ctx).includes('entity_not_independently_supported'));
  assert.ok(certificationProblems(e({ externalIds: {} }), ctx).includes('entity_without_tmdb'));
  assert.ok(certificationProblems(e({ canonicalPath: undefined }), ctx).includes('entity_pathless'));
  assert.ok(certificationProblems(input({ pathOwner: { entityId: 'ce_OTHER', role: 'canonical' } }), ctx).includes('canonical_ownership_ambiguous'));
  assert.ok(certificationProblems(input({ pathOwner: null }), ctx).includes('canonical_ownership_ambiguous'));
  assert.ok(certificationProblems(input({ canonical: null }), ctx).includes('canonical_registry_mismatch'));
});

test('review: the AI ledger row must be accepted twice, by AI reviewers, with the gate passed on basis ai', () => {
  const v = verdictFor('la_isla', 100);
  const refuse = (review: ReturnType<typeof reviewFor>, code: string) => assert.ok(certificationProblems(input({ review }), ctx).includes(code), code);
  refuse(reviewFor([v.candidateId], { second: false }), 'review_second_missing');
  refuse(reviewFor([v.candidateId], { secondDecision: 'reject' }), 'review_second_dissent');
  refuse(reviewFor([v.candidateId], { gatePass: false }), 'review_gate_failed');
  refuse(reviewFor([v.candidateId], { basis: 'mixed' }), 'review_basis_not_ai');
  refuse(reviewFor(['otra|movie|movie:1|2000']), 'review_missing');
  assert.deepEqual(reviewOfRow(reviewFor([v.candidateId]), v.candidateId).problems, []);
  assert.deepEqual(reviewOfRow(reviewFor([v.candidateId]), v.candidateId).reviewers.map((r) => `${r.role}:${r.kind}`), ['primary:ai', 'second:ai']);
});

test('authorisation window, batch and approved verdict are enforced', () => {
  const v = verdictFor('la_isla', 100);
  const late = { now: new Date(NOW.getTime() + 2 * 86_400_000), ownerPublicKeyPem: keys.publicPem };
  assert.ok(certificationProblems(input(), late).includes('authorization_expired'));
  assert.ok(certificationProblems(input({ authorization: grant(keys, [verdictFor('otra', 5)]) }), ctx).includes('authorization_batch_mismatch'));
  const changed = { ...v, support: [...v.support, { ...v.support[1], claim: 'a new claim' }] };
  assert.ok(certificationProblems(input({ verdict: changed, authorization: grant(keys, [v]), review: reviewFor([v.candidateId]) }), ctx).includes('verdict_changed_since_approval'));
  assert.notEqual(verdictDigest(v), verdictDigest(changed));
  assert.ok(certificationProblems(input({ authorization: grant(keys, [v], { issuedAt: '2026-10-23T00:00:00Z', executeBy: '2026-10-24T00:00:00Z' }) }), ctx).includes('authorization_not_yet_valid'));
});

test('the AI identity never reads as a person and is never indexable', () => {
  for (const name of ['AI Sonnet 5.5 A', 'AI Opus 5.5 B', 'AI Fable 5.1 C', `${ATTESTED_DECIDER_PREFIX}at_abc`, 'certify:manuelxose']) {
    assert.throws(() => normalizeReviewerName(name), /reviewer_required/, name);
  }
  assert.equal(mayBeIndexable({ status: 'active', matching: { method: 'ai_attested', confidence: 1 } }), false);
});

// ---- chain and read-time validity ---------------------------------------------------------------------------------

function certified(over: { validUntil?: string } = {}) {
  const v = verdictFor('la_isla', 100);
  const i = input({}, v);
  const body: AttestationBody = {
    schema: 1, type: 'attestation', attestationId: 'at_1', entityId: i.entity.entityId, candidateId: v.candidateId, identity: v.identity!, kind: 'movie',
    tmdb: { type: 'movie', id: 100 }, canonicalPath: v.path!, reviewBasis: 'ai',
    evidence: { verdictSha256: verdictDigest(v), decision: 'AUTO_ACCEPT', assurance: 'independently_supported', independentRoots: [] },
    review: { ledgerHeadHash: i.review.ledgerHeadHash, sheetSha256: i.review.sheetSha256, rowDecisionHashes: [], reviewers: [], gate: { pass: true, labelled: 360, secondReviewed: 119, precisionLower95: 0.98 } },
    authorization: i.authorization, previousMatching: { method: 'tmdb_exact', confidence: 0.9, decidedAt: NOW.toISOString(), decidedBy: 'ingest', assurance: 'independently_supported' },
    attestedAt: NOW.toISOString(), validUntil: over.validUntil ?? '2026-11-21T10:00:00Z', attestedBy: 'test',
  };
  const record = seal(i.entity.entityId, 0, GENESIS, body);
  const entity = entityFor(v, {
    status: 'active', matching: { method: 'ai_attested', confidence: 0.9, decidedAt: NOW, decidedBy: `${ATTESTED_DECIDER_PREFIX}at_1`, assurance: 'independently_supported' },
    certification: { attestationId: 'at_1', seq: 0, hash: record.hash, certifiedAt: NOW },
  });
  return { entity, record, body };
}

test('evaluateCertification: valid, then every way it stops being valid fails closed', () => {
  const { entity, record, body } = certified();
  const state = (e = entity, chain: AttestationRecord[] = [record], c: { now: Date; ownerPublicKeyPem?: string } = ctx) => evaluateCertification(e, chain, c);
  assert.equal(state().state, 'certified');
  assert.equal(state(entity, [record], { now: NOW }).state, 'invalid', 'no owner key configured');
  assert.equal(state(entity, [record], { now: NOW, ownerPublicKeyPem: other.publicPem }).state, 'invalid', 'another owner key');
  assert.deepEqual(state(entity, [record], { now: new Date('2026-12-01T00:00:00Z'), ownerPublicKeyPem: keys.publicPem }), { state: 'invalid', reason: 'expired' });
  assert.equal(state({ ...entity, certification: { ...entity.certification!, hash: 'f'.repeat(64) } }).state, 'invalid', 'pin points elsewhere');
  assert.equal(state({ ...entity, canonicalPath: '/peliculas/otra' }).state, 'invalid', 'path moved after attestation');
  assert.equal(state({ ...entity, externalIds: { tmdb: { type: 'movie', id: 101 } } }).state, 'invalid', 'tmdb moved after attestation');
  const tampered = { ...record, body: { ...body, canonicalPath: '/peliculas/otra' } };
  assert.deepEqual(state(entity, [tampered]), { state: 'invalid', reason: 'record_modified' });
  assert.equal(state({ ...entity, status: 'candidate', certification: undefined }).state, 'pending');
  const revocation = seal(entity.entityId, 1, record.hash, { schema: 1, type: 'revocation', attestationId: 'at_1', entityId: entity.entityId, reason: 'wrong work', revokedBy: 'Ana García', revokedAt: NOW.toISOString() });
  assert.equal(state(entity, [record, revocation]).state, 'revoked', 'revoked on a still-pinned entity (a crash between the writes)');
  assert.equal(state(entity, [revocation]).state, 'invalid');
  assert.equal(state(entity, []).state, 'none');
});

test('chain: contiguous, linked, unmodified and about this entity only', () => {
  const { record, body } = certified();
  assert.equal(chainProblem(record.entityId, [record]), null);
  assert.equal(chainProblem('ce_OTHER', [record]), 'record_for_another_entity');
  assert.equal(chainProblem(record.entityId, [{ ...record, seq: 1 }]), 'sequence_gap');
  assert.equal(chainProblem(record.entityId, [{ ...record, prevHash: 'a'.repeat(64) }]), 'broken_chain');
  assert.equal(chainProblem(record.entityId, [{ ...record, body: { ...body, validUntil: '2999-01-01T00:00:00Z' } }]), 'record_modified');
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
});

test('quality: an AI-attested identity may reach the noindex canary tier but never index_candidate', () => {
  const full = {
    kind: 'movie' as const, title: 'La isla', year: 2001, yearProvenance: 'independent' as const, synopsis: 'x'.repeat(400), synopsisSource: 'manual' as const,
    genres: ['Drama'], runtimeMinutes: 100, epgDescription: 'Programa de la tarde', upcomingAirings: 2, inboundLinks: 5, legacyPage: 'none' as const, registryClean: true, ssr: { ok: 25, total: 25 },
  };
  assert.equal(assessPublicationQuality({ ...full, verified: true }).tier, 'index_candidate');
  const ai = assessPublicationQuality({ ...full, verified: false, aiAttested: true });
  assert.equal(ai.tier, 'canary');
  assert.equal(ai.indexable, false);
  assert.equal(ai.criteria.find((c) => c.id === 'identity_verified')!.status, 'unknown');
  assert.equal(assessPublicationQuality({ ...full, verified: false }).tier, 'blocked');
});

test('admitted write scope: a longer admit file than the ceiling admits nothing; the legacy mode is unchanged', () => {
  const fs = require('node:fs') as typeof import('node:fs');
  const os = require('node:os') as typeof import('node:os');
  const path = require('node:path') as typeof import('node:path');
  const { admissionFromEnv } = require('./ContentIdentityIngestion') as typeof import('./ContentIdentityIngestion');
  const { contentIdentityWriteScope } = require('@/shared/config/contentEntities') as typeof import('@/shared/config/contentEntities');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-'));
  try {
    const lines = (n: number) => Array.from({ length: n }, (_, i) => JSON.stringify({ candidateId: `p${i}|movie|movie:${i}|2000`, decision: 'AUTO_ACCEPT', assurance: 'independently_supported' })).join('\n');
    const file = (n: number) => { const f = path.join(dir, `a${n}.jsonl`); fs.writeFileSync(f, lines(n)); return f; };
    const env = (n: number, scope?: string) => ({ CONTENT_IDENTITY_ADMIT_FILE: file(n), ...(scope ? { CONTENT_IDENTITY_WRITE_SCOPE: scope } : {}) }) as NodeJS.ProcessEnv;
    assert.equal(admissionFromEnv(env(25, 'admitted')).size, 25);
    assert.equal(admissionFromEnv(env(26, 'admitted')).size, 0, 'over the ceiling');
    assert.equal(admissionFromEnv(env(26)).size, 26, 'without the scope the 2D behaviour is unchanged');
    assert.equal(contentIdentityWriteScope({ CONTENT_IDENTITY_WRITE_SCOPE: 'admitted' } as NodeJS.ProcessEnv), 'admitted');
    for (const v of ['', 'true', 'all', 'Admitted ']) assert.equal(contentIdentityWriteScope({ CONTENT_IDENTITY_WRITE_SCOPE: v } as NodeJS.ProcessEnv), v.trim() === 'admitted' ? 'admitted' : undefined);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the grant pins the exact ledger the owner saw; a moved ledger certifies nothing', () => {
  const v = verdictFor('la_isla', 100);
  const approved = input({}, v);
  assert.deepEqual(certificationProblems(approved, ctx), []);
  const moved = input({ review: reviewFor([v.candidateId], { secondDecision: 'accept' }), authorization: grant(keys, [v], {}, 'oa_0123456789abcdef', 'f'.repeat(64)) }, v);
  assert.ok(certificationProblems(moved, ctx).includes('review_ledger_not_approved'));
  const other = reviewFor([v.candidateId, 'otra|movie|movie:2|2000']);
  assert.notEqual(other.ledgerHeadHash, approved.review.ledgerHeadHash);
  assert.ok(certificationProblems({ ...approved, review: other }, ctx).includes('review_ledger_not_approved'), 'a different ledger file, even one that passes the gate');
});

test('read-time: the lifetime comes from the signed grant, a long chain is corrupt, and the ledger pin must match', () => {
  const { entity, record, body } = certified();
  const reseal = (over: Partial<AttestationBody>) => seal(entity.entityId, 0, GENESIS, { ...body, ...over });
  const stretched = reseal({ validUntil: '2027-12-31T00:00:00Z' });
  const e = { ...entity, certification: { ...entity.certification!, hash: stretched.hash } };
  assert.deepEqual(evaluateCertification(e, [stretched], ctx), { state: 'invalid', reason: 'validity_exceeds_grant' }, 'a re-sealed record cannot outlive the grant');
  const early = reseal({ attestedAt: '2026-10-01T00:00:00Z', validUntil: '2026-10-31T00:00:00Z' });
  assert.equal(evaluateCertification({ ...entity, certification: { ...entity.certification!, hash: early.hash } }, [early], ctx).state, 'invalid', 'attested before the grant existed');
  const wrongLedger = reseal({ review: { ...body.review, ledgerHeadHash: 'e'.repeat(64) } });
  assert.deepEqual(evaluateCertification({ ...entity, certification: { ...entity.certification!, hash: wrongLedger.hash } }, [wrongLedger], ctx), { state: 'invalid', reason: 'ledger_not_approved' });
  const long = Array.from({ length: 101 }, () => record);
  assert.deepEqual(evaluateCertification(entity, long, ctx), { state: 'invalid', reason: 'chain_too_long' });
});

test('an admit file pinned to the approved hash admits only that exact file, and a pin implies the canary scope', () => {
  const fs = require('node:fs') as typeof import('node:fs');
  const os = require('node:os') as typeof import('node:os');
  const path = require('node:path') as typeof import('node:path');
  const { admissionFromEnv } = require('./ContentIdentityIngestion') as typeof import('./ContentIdentityIngestion');
  const { contentIdentityWriteScope } = require('@/shared/config/contentEntities') as typeof import('@/shared/config/contentEntities');
  const { sha256 } = require('@/domain/services/contentCertification') as typeof import('@/domain/services/contentCertification');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pin-'));
  try {
    const line = (i: number) => JSON.stringify({ candidateId: `p${i}|movie|movie:${i}|2000`, decision: 'AUTO_ACCEPT', assurance: 'independently_supported' });
    const file = path.join(dir, 'admit.jsonl');
    const text = [1, 2].map(line).join('\n') + '\n';
    fs.writeFileSync(file, text);
    const env = (pin?: string) => ({ CONTENT_IDENTITY_ADMIT_FILE: file, ...(pin ? { CONTENT_IDENTITY_ADMIT_SHA256: pin } : {}) }) as NodeJS.ProcessEnv;
    assert.equal(admissionFromEnv(env(sha256(text))).size, 2);
    assert.equal(admissionFromEnv(env('0'.repeat(64))).size, 0, 'any other file admits nothing');
    fs.writeFileSync(file, text + line(3) + '\n');
    assert.equal(admissionFromEnv(env(sha256(text))).size, 0, 'a line added after approval admits nothing');
    assert.equal(contentIdentityWriteScope(env('a'.repeat(64))), 'admitted', 'a pinned file is a canary: no scope variable to forget');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
