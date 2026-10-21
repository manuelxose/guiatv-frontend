/**
 * Phase 3C: the pure rules of AI-review certification. An owner-authorised AI review of an
 * identity is recorded as an immutable, hash-chained attestation and promotes a candidate through a
 * distinct transition (`candidate -> active`, `matching.method = ai_attested`). It is never a
 * person's verification: `reviewBasis` stays `ai`, `mayBeIndexable` stays false, and the
 * persistent write or public exposure it enables still needs its own owner authorisation.
 *
 * The owner authorises with an Ed25519 key only the owner holds, so an agent cannot grant itself the
 * authority it acts under. Everything here is deterministic and free of I/O; the lifecycle service
 * (application) does the reads and the ordered single-document writes.
 */
import { createHash, createPublicKey, sign, verify, createPrivateKey } from 'node:crypto';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import type { TmdbRef } from './contentIdentity';

/** The canary is a handful of pages; one authorisation can never cover more. Mirrors CANARY_HARD_CAP. */
export const CERTIFICATION_HARD_CAP = 25;
export const MAX_VALID_DAYS = 180;
/** An entity's chain is a handful of records; one this long is read as corrupt, never truncated. */
export const MAX_CHAIN = 100;
export const GENESIS = '0'.repeat(64);
export const ATTESTED_DECIDER_PREFIX = 'attestation:';

export const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

/** JSON with sorted keys at every depth, so a hash covers nested values and survives key reordering. */
export const canonicalJson = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(canonicalJson).join(',')}]`
    : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson((v as Record<string, unknown>)[k])}`).join(',')}}`
      : JSON.stringify(v) ?? 'null';

// ---------------------------------------------------------------------------------------------
// Owner authorisation: one signed grant per batch.

export interface OwnerAuthorizationPayload {
  schema: 1;
  authorizationId: string;
  owner: string;
  scope: 'certify';
  issuedAt: string;
  /** The window in which `certify` may run. After it the grant is dead. */
  executeBy: string;
  /** How long each attestation made under this grant stays valid; reads refuse it afterwards. */
  validDays: number;
  /** The exact batch: the digest of the manifest and each approved identity with the verdict line it was approved on. */
  /** `ledgerHeadHash`: the exact AI-review ledger state the owner approved; a ledger that moved since (a later correction, adjudication or a different file) certifies nothing. */
  batch: { manifestDigest: string; ledgerHeadHash: string; max: number; items: Array<{ candidateId: string; verdictSha256: string }> };
  /** The owner's own words, kept verbatim in every attestation made under the grant. */
  statement: string;
}

export interface SignedOwnerAuthorization { payload: OwnerAuthorizationPayload; keyId: string; signature: string }

export const keyIdOf = (publicKeyPem: string) =>
  sha256(createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' })).slice(0, 16);

export function signOwnerAuthorization(payload: OwnerAuthorizationPayload, privateKeyPem: string): SignedOwnerAuthorization {
  const key = createPrivateKey(privateKeyPem);
  const publicPem = createPublicKey(key).export({ type: 'spki', format: 'pem' }).toString();
  return { payload, keyId: keyIdOf(publicPem), signature: sign(null, Buffer.from(canonicalJson(payload)), key).toString('base64') };
}

export function authorizationSignatureValid(auth: SignedOwnerAuthorization, publicKeyPem: string | undefined): boolean {
  if (!publicKeyPem || !auth?.payload || typeof auth.signature !== 'string') return false;
  try {
    return auth.keyId === keyIdOf(publicKeyPem) &&
      verify(null, Buffer.from(canonicalJson(auth.payload)), createPublicKey(publicKeyPem), Buffer.from(auth.signature, 'base64'));
  } catch { return false; }
}

/** Shape and bounds of a grant, independent of the signature and the clock. Returns the problems found. */
export function authorizationProblems(p: OwnerAuthorizationPayload): string[] {
  const out: string[] = [];
  if (p?.schema !== 1 || p.scope !== 'certify') out.push('authorization_scope');
  if (!p?.authorizationId || !/^oa_[0-9a-f]{16,64}$/.test(p.authorizationId)) out.push('authorization_id');
  if (!p?.owner || typeof p.statement !== 'string' || p.statement.trim().length < 10) out.push('authorization_statement');
  if (Number.isNaN(Date.parse(p?.issuedAt)) || Number.isNaN(Date.parse(p?.executeBy)) || Date.parse(p.executeBy) <= Date.parse(p.issuedAt)) out.push('authorization_window');
  if (!Number.isInteger(p?.validDays) || p.validDays < 1 || p.validDays > MAX_VALID_DAYS) out.push('authorization_valid_days');
  const items = p?.batch?.items;
  if (!Array.isArray(items) || !items.length || items.length > CERTIFICATION_HARD_CAP || !Number.isInteger(p.batch.max) || p.batch.max < items.length || p.batch.max > CERTIFICATION_HARD_CAP) out.push('authorization_ceiling');
  else if (new Set(items.map((i) => i.candidateId)).size !== items.length) out.push('authorization_duplicate_item');
  if (!/^[0-9a-f]{64}$/.test(p?.batch?.manifestDigest ?? '') || !/^[0-9a-f]{64}$/.test(p?.batch?.ledgerHeadHash ?? '')) out.push('authorization_manifest_digest');
  return out;
}

// ---------------------------------------------------------------------------------------------
// Attestation records: insert-only, one chain per entity.

export type ReviewerRole = 'primary' | 'second' | 'adjudication';

export interface AttestationBody {
  schema: 1;
  type: 'attestation';
  attestationId: string;
  entityId: string;
  candidateId: string;
  identity: string;
  kind: ContentEntityRecord['kind'];
  tmdb: TmdbRef;
  year?: number;
  canonicalPath: string;
  /** Always `ai`: this is not a person's verification and is never reported as one. */
  reviewBasis: 'ai';
  evidence: { verdictSha256: string; decision: 'AUTO_ACCEPT'; assurance: 'independently_supported'; independentRoots: string[] };
  review: {
    ledgerHeadHash: string;
    sheetSha256: string;
    rowDecisionHashes: string[];
    reviewers: Array<{ name: string; kind: 'ai'; role: ReviewerRole; decision: string }>;
    gate: { pass: true; labelled: number; secondReviewed: number; precisionLower95: number };
  };
  authorization: SignedOwnerAuthorization;
  /** What the candidate looked like before, so revocation restores it exactly. */
  previousMatching: { method: string; confidence: number; decidedAt: string; decidedBy: string; assurance?: string };
  attestedAt: string;
  validUntil: string;
  attestedBy: string;
}

export interface RevocationBody {
  schema: 1;
  type: 'revocation';
  attestationId: string;
  entityId: string;
  reason: string;
  revokedBy: string;
  revokedAt: string;
}

export type AttestationRecordBody = AttestationBody | RevocationBody;

export interface AttestationRecord {
  entityId: string;
  /** Position in the entity's chain, from 0. Unique per entity. */
  seq: number;
  prevHash: string;
  hash: string;
  body: AttestationRecordBody;
}

export const attestationIdOf = (b: { entityId: string; candidateId: string; identity: string; canonicalPath: string; tmdb: TmdbRef; verdictSha256: string; ledgerHeadHash: string; authorizationId: string }) =>
  `at_${sha256(canonicalJson(b)).slice(0, 32)}`;

export const recordHash = (r: Pick<AttestationRecord, 'seq' | 'prevHash' | 'body'>) => sha256(canonicalJson({ seq: r.seq, prevHash: r.prevHash, body: r.body }));

export function seal(entityId: string, seq: number, prevHash: string, body: AttestationRecordBody): AttestationRecord {
  return { entityId, seq, prevHash, hash: recordHash({ seq, prevHash, body }), body };
}

/** An entity's chain, oldest first: contiguous from 0, linked, unmodified, and every record about this entity. */
export function chainProblem(entityId: string, chain: readonly AttestationRecord[]): string | null {
  let prev = GENESIS;
  for (const [i, r] of chain.entries()) {
    if (r.entityId !== entityId || r.body.entityId !== entityId) return 'record_for_another_entity';
    if (r.seq !== i) return 'sequence_gap';
    if (r.prevHash !== prev) return 'broken_chain';
    if (recordHash(r) !== r.hash) return 'record_modified';
    prev = r.hash;
  }
  return null;
}

export type CertificationState =
  | { state: 'none' }
  /** The attestation is stored but the entity has not been promoted yet (a crash between the two writes). */
  | { state: 'pending'; attestation: AttestationRecord }
  | { state: 'certified'; attestation: AttestationRecord }
  | { state: 'revoked'; attestation: AttestationRecord; revocation: AttestationRecord }
  | { state: 'invalid'; reason: string };

export interface CertificationContext {
  now: Date;
  /** The owner's public key, from deployment configuration. Absent: nothing is valid. */
  ownerPublicKeyPem?: string;
}

/**
 * Is this entity's certification in force right now? Pure; the public read calls it on every request
 * with the entity's chain, so a revocation, a modified record, a mismatched pin, an expired or
 * unsigned authorisation all fail closed on the next read.
 */
export function evaluateCertification(entity: ContentEntityRecord, chain: readonly AttestationRecord[], ctx: CertificationContext): CertificationState {
  if (chain.length > MAX_CHAIN) return { state: 'invalid', reason: 'chain_too_long' };
  const broken = chainProblem(entity.entityId, chain);
  if (broken) return { state: 'invalid', reason: broken };
  const last = chain[chain.length - 1];
  if (!last) return { state: 'none' };
  if (last.body.type === 'revocation') {
    const revoked = chain.find((r) => r.body.type === 'attestation' && r.body.attestationId === (last.body as RevocationBody).attestationId);
    return revoked ? { state: 'revoked', attestation: revoked, revocation: last } : { state: 'invalid', reason: 'revocation_without_attestation' };
  }
  const attestation = last;
  const b = attestation.body as AttestationBody;
  const pin = entity.certification;
  if (!pin || entity.status !== 'active') return { state: 'pending', attestation };
  if (pin.attestationId !== b.attestationId || pin.seq !== attestation.seq || pin.hash !== attestation.hash) return { state: 'invalid', reason: 'pin_mismatch' };
  if (entity.matching?.method !== 'ai_attested' || entity.matching.decidedBy !== `${ATTESTED_DECIDER_PREFIX}${b.attestationId}`) return { state: 'invalid', reason: 'matching_mismatch' };
  const t = entity.externalIds?.tmdb;
  if (b.reviewBasis !== 'ai' || b.kind !== entity.kind || b.canonicalPath !== entity.canonicalPath || t?.type !== b.tmdb.type || t.id !== b.tmdb.id) return { state: 'invalid', reason: 'attestation_mismatch' };
  if (!authorizationSignatureValid(b.authorization, ctx.ownerPublicKeyPem)) return { state: 'invalid', reason: 'authorization_signature' };
  const problems = authorizationProblems(b.authorization.payload);
  if (problems.length) return { state: 'invalid', reason: problems[0] };
  if (!b.authorization.payload.batch.items.some((i) => i.candidateId === b.candidateId && i.verdictSha256 === b.evidence.verdictSha256)) return { state: 'invalid', reason: 'not_in_authorized_batch' };
  // The lifetime the grant allowed is the ceiling, whatever the stored body says.
  const g = b.authorization.payload;
  const attestedAt = Date.parse(b.attestedAt);
  if (b.review.ledgerHeadHash !== g.batch.ledgerHeadHash) return { state: 'invalid', reason: 'ledger_not_approved' };
  if (!(attestedAt >= Date.parse(g.issuedAt) && attestedAt <= Date.parse(g.executeBy)) || !(Date.parse(b.validUntil) <= attestedAt + g.validDays * 86_400_000)) return { state: 'invalid', reason: 'validity_exceeds_grant' };
  if (!(ctx.now.getTime() < Date.parse(b.validUntil))) return { state: 'invalid', reason: 'expired' };
  return { state: 'certified', attestation };
}
