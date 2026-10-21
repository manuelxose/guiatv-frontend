/**
 * Phase 3C: certification lifecycle. Turns an independently supported candidate that an
 * owner-authorised AI review accepted into an `ai_attested` entity, through its own transition:
 *
 *   candidate ──certify──▶ active (method ai_attested, pinned to an attestation) ──revoke──▶ candidate
 *
 * It is not `verifyEntity`: it never pretends an AI is a person (`normalizeReviewerName` still refuses
 * every AI name), it records `reviewBasis: ai`, and the entity stays non-indexable. The public read
 * accepts a certified entity only while its attestation is valid at that very read.
 *
 * No transactions (standalone Mongo). Ordered single-document writes, each resumable:
 *   certify: attestation record (insert-only, unique) -> entity promotion (conditional on version)
 *   revoke:  revocation record                        -> entity demotion  (conditional on the pin)
 * A crash between the two leaves `pending` (stored, not promoted: serves nothing) or a revoked chain
 * on a still-pinned entity (fails closed on read); calling the same operation again finishes it.
 */
import fs from 'node:fs';
import type {
  ContentEntityRecord,
  IContentAttestationRepository,
  IContentEntityRepository,
  IContentSlugRepository,
} from '@/domain/repositories/IContentIdentityRepository';
import {
  ATTESTED_DECIDER_PREFIX,
  attestationIdOf,
  AttestationBody,
  AttestationRecord,
  authorizationProblems,
  authorizationSignatureValid,
  canonicalJson,
  CertificationState,
  evaluateCertification,
  GENESIS,
  seal,
  sha256,
  SignedOwnerAuthorization,
} from '@/domain/services/contentCertification';
import { MongoContentAttestationRepository, MongoContentEntityRepository, MongoContentSlugRepository } from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { evaluateEvidence, EvidenceVerdict } from './ContentIdentityEvidence';
import { parseCsv } from './ContentIdentityAudit';
import { AI_REVIEWER_NAME, ledgerReport, LedgerEntry, parseLedger, rowStates, sheetDigest, needsAdjudication, LedgerDecision } from './ContentIdentityReviewLedger';
import { ContentIdentityError, normalizeReviewerName } from './ContentIdentityService';

export const verdictDigest = (verdict: EvidenceVerdict) => sha256(canonicalJson(verdict));

// ---------------------------------------------------------------------------------------------
// The AI review, as the ledger recorded it

export interface ReviewEvidence {
  entries: LedgerEntry[];
  /** Sheet rows the ledger was opened for; the digest is checked against the ledger's first entry. */
  rows: Record<string, string>[];
  ledgerHeadHash: string;
  sheetSha256: string;
  gate: { pass: boolean; basis: string; labelled: number; secondReviewed: number; precisionLower95: number; blockers: string[] };
}

/** Reads a ledger and its sheet: the hash chain must hold, the sheet must be the one the ledger was opened for, and the gate is the unchanged scorer's. */
export function loadReviewEvidence(ledgerText: string, sheetCsv: string): ReviewEvidence {
  const entries = parseLedger(ledgerText);
  const rows = parseCsv(sheetCsv);
  const sheetSha256 = sheetDigest(rows);
  if ((entries[0] as { sheetSha256?: string })?.sheetSha256 !== sheetSha256) {
    throw new ContentIdentityError('invalid_ledger', 'the sheet is not the one this ledger was opened for');
  }
  const report = ledgerReport(rows, entries);
  return {
    entries, rows, sheetSha256, ledgerHeadHash: entries[entries.length - 1].hash,
    gate: {
      pass: report.score.gate.pass && report.openDisagreements.length === 0,
      basis: report.reviewBasis,
      labelled: report.progress.labelled.have,
      secondReviewed: report.secondReviewed,
      precisionLower95: report.progress.precision.lower95,
      blockers: report.score.gate.blockers,
    },
  };
}

const yes = (d?: LedgerDecision) => d?.decision === 'accept' && d.labels?.kind_ok === 'y' && d.labels.tmdb_ok === 'y' && d.labels.path_ok === 'y' && d.labels.critical === 'n';

/** What the ledger says about one identity: its codes of refusal, or the reviewers and decision hashes to attest. */
export function reviewOfRow(review: ReviewEvidence, candidateId: string) {
  const problems: string[] = [];
  const state = rowStates(review.entries).get(candidateId);
  if (!state?.primary) return { problems: ['review_missing'], reviewers: [], hashes: [] as string[] };
  const { primary, second, adjudication } = state;
  const roles: Array<[LedgerDecision | undefined, 'primary' | 'second' | 'adjudication']> = [[primary, 'primary'], [second, 'second'], [adjudication, 'adjudication']];
  const reviewers = roles.filter(([d]) => d).map(([d, role]) => ({ name: d!.reviewer, kind: 'ai' as const, role, decision: d!.decision }));
  if (roles.some(([d]) => d && (d.reviewerKind !== 'ai' || !AI_REVIEWER_NAME.test(d.reviewer)))) problems.push('review_not_ai');
  if (!yes(primary)) problems.push('review_not_accepted');
  if (!second) problems.push('review_second_missing');
  else if (!yes(second)) problems.push('review_second_dissent');
  if (needsAdjudication(state) && (!adjudication || !yes(adjudication))) problems.push('review_disagreement');
  if (adjudication && !yes(adjudication)) problems.push('review_adjudicated_against');
  return { problems, reviewers, hashes: roles.flatMap(([d]) => (d ? [d.hash] : [])) };
}

// ---------------------------------------------------------------------------------------------
// Validation: every reason an identity must not be certified, all of them reported

export interface CertificationInput {
  entity: ContentEntityRecord;
  /** The slug registry's canonical row of the entity, and the row that owns `entity.canonicalPath`. */
  canonical: { path: string; entityId: string; role: string } | null;
  pathOwner: { entityId: string; role: string } | null;
  verdict: EvidenceVerdict;
  review: ReviewEvidence;
  authorization: SignedOwnerAuthorization;
}

export interface CertificationClock { now: Date; ownerPublicKeyPem?: string }

export function certificationProblems(i: CertificationInput, ctx: CertificationClock): string[] {
  const out: string[] = [];
  const { entity: e, verdict: v } = i;
  const tmdb = e.externalIds?.tmdb;
  if (e.status !== 'candidate') out.push('entity_not_candidate');
  if (e.matching?.assurance !== 'independently_supported') out.push('entity_not_independently_supported');
  if (!tmdb) out.push('entity_without_tmdb');
  if (!['movie', 'series', 'show'].includes(e.kind)) out.push('entity_kind_unsupported');
  if (!e.canonicalPath) out.push('entity_pathless');
  else {
    if (i.canonical?.path !== e.canonicalPath || i.canonical.entityId !== e.entityId || i.canonical.role !== 'canonical') out.push('canonical_registry_mismatch');
    if (i.pathOwner?.entityId !== e.entityId || i.pathOwner.role !== 'canonical') out.push('canonical_ownership_ambiguous');
  }

  if (v.decision !== 'AUTO_ACCEPT' || v.assurance !== 'independently_supported') out.push('verdict_not_accepted');
  if (v.contradictions?.length) out.push('verdict_contradictions');
  if (v.missing?.length) out.push('verdict_missing_evidence');
  if (v.unverified?.length) out.push('verdict_unverified');
  if (!v.path) out.push('verdict_pathless');
  if (evaluateEvidence([v]).status !== 'pass') out.push('evidence_gate_violation');
  if (tmdb && v.identity !== `new:${v.key}|${v.kind}|tmdb:${tmdb.type}:${tmdb.id}`) out.push('verdict_identity_mismatch');
  if (tmdb && !v.candidateId.startsWith(`${v.key}|${v.kind}|${tmdb.type}:${tmdb.id}|`)) out.push('verdict_identity_mismatch');
  if (v.key !== e.normalizedTitle || v.kind !== e.kind || (e.canonicalPath && v.path !== e.canonicalPath)) out.push('verdict_entity_mismatch');

  const row = reviewOfRow(i.review, v.candidateId);
  out.push(...row.problems);
  if (!i.review.gate.pass) out.push('review_gate_failed');
  if (i.review.gate.basis !== 'ai') out.push('review_basis_not_ai');

  const a = i.authorization;
  if (!authorizationSignatureValid(a, ctx.ownerPublicKeyPem)) out.push('authorization_signature');
  else {
    out.push(...authorizationProblems(a.payload));
    try { normalizeReviewerName(a.payload.owner); } catch { out.push('authorization_owner'); }
    if (ctx.now.getTime() < Date.parse(a.payload.issuedAt)) out.push('authorization_not_yet_valid');
    if (ctx.now.getTime() > Date.parse(a.payload.executeBy)) out.push('authorization_expired');
    const item = a.payload.batch.items.find((x) => x.candidateId === v.candidateId);
    if (!item) out.push('authorization_batch_mismatch');
    else if (item.verdictSha256 !== verdictDigest(v)) out.push('verdict_changed_since_approval');
  }
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------------------------
// Service

export interface CertifyRequest {
  entityId: string;
  verdict: EvidenceVerdict;
  review: ReviewEvidence;
  authorization: SignedOwnerAuthorization;
}

export type CertifyResult = { outcome: 'certified' | 'already_certified'; attestation: AttestationRecord; entity: ContentEntityRecord };

export class ContentCertificationService {
  private readonly now: () => Date;

  constructor(
    private readonly entities: IContentEntityRepository,
    private readonly slugs: IContentSlugRepository,
    private readonly attestations: IContentAttestationRepository,
    private readonly opts: { ownerPublicKeyPem?: string; now?: () => Date; actor?: string } = {}
  ) {
    this.now = opts.now ?? (() => new Date());
  }

  /** Where this entity stands, from its entity row and its chain. */
  async stateOf(entity: ContentEntityRecord): Promise<CertificationState> {
    return evaluateCertification(entity, await this.attestations.listForEntity(entity.entityId), { now: this.now(), ownerPublicKeyPem: this.opts.ownerPublicKeyPem });
  }

  /** All reasons the request would be refused, without writing anything (the dry run). */
  async check(req: CertifyRequest): Promise<string[]> {
    const entity = await this.entities.findById(req.entityId);
    if (!entity) return ['entity_not_found'];
    return certificationProblems(await this.inputFor(entity, req), { now: this.now(), ownerPublicKeyPem: this.opts.ownerPublicKeyPem });
  }

  private async inputFor(entity: ContentEntityRecord, req: CertifyRequest): Promise<CertificationInput> {
    const [canonical, owner] = await Promise.all([
      this.slugs.findCanonical(entity.entityId),
      entity.canonicalPath ? this.slugs.findByPath(entity.canonicalPath) : Promise.resolve(null),
    ]);
    return { entity, canonical, pathOwner: owner, verdict: req.verdict, review: req.review, authorization: req.authorization };
  }

  async certify(req: CertifyRequest): Promise<CertifyResult> {
    const entity = await this.entities.findById(req.entityId);
    if (!entity) throw new ContentIdentityError('not_found', req.entityId);
    const chain = await this.attestations.listForEntity(entity.entityId);
    const state = evaluateCertification(entity, chain, { now: this.now(), ownerPublicKeyPem: this.opts.ownerPublicKeyPem });
    const authorizationId = req.authorization.payload.authorizationId;
    const sameGrant = (r: AttestationRecord) => (r.body as AttestationBody).authorization.payload.authorizationId === authorizationId;

    if (state.state === 'invalid') throw new ContentIdentityError('certification_inconsistent', `${entity.entityId}: ${state.reason}`);
    if (state.state === 'certified') {
      if (sameGrant(state.attestation)) return { outcome: 'already_certified', attestation: state.attestation, entity };
      throw new ContentIdentityError('already_certified', `${entity.entityId} is certified under another authorisation; revoke it first`);
    }
    if (state.state === 'pending' && !sameGrant(state.attestation)) {
      throw new ContentIdentityError('certification_pending', `${entity.entityId} has an unfinished attestation under another authorisation; revoke it first`);
    }
    // A revoked attestation id is dead; a new one needs a new authorisation (the id includes it).
    if (state.state === 'revoked' && sameGrant(state.attestation)) {
      throw new ContentIdentityError('certification_revoked', `${entity.entityId} was revoked under this authorisation; a new one is needed`);
    }

    const problems = certificationProblems(await this.inputFor(entity, req), { now: this.now(), ownerPublicKeyPem: this.opts.ownerPublicKeyPem });
    if (problems.length) throw new ContentIdentityError('certification_refused', problems.join(','));

    const record = state.state === 'pending' ? state.attestation : await this.append(entity, chain, req);
    const body = record.body as AttestationBody;
    const promoted = await this.entities.certify(entity.entityId, {
      expectedVersion: entity.version,
      matching: { method: 'ai_attested', confidence: entity.matching.confidence, decidedAt: this.now(), decidedBy: `${ATTESTED_DECIDER_PREFIX}${body.attestationId}`, assurance: 'independently_supported' },
      certification: { attestationId: body.attestationId, seq: record.seq, hash: record.hash, certifiedAt: this.now() },
      by: `certify:${body.authorization.payload.owner}`.slice(0, 64),
      reason: `ai-attested (${body.reviewBasis}) ${body.attestationId}`,
    });
    if (!promoted) {
      // Lost a race: someone else promoted or changed the entity. Idempotent if it is our attestation.
      const now = await this.entities.findById(entity.entityId);
      if (now?.certification?.attestationId === body.attestationId) return { outcome: 'already_certified', attestation: record, entity: now };
      throw new ContentIdentityError('concurrent_modification', entity.entityId);
    }
    return { outcome: 'certified', attestation: record, entity: promoted };
  }

  private async append(entity: ContentEntityRecord, chain: AttestationRecord[], req: CertifyRequest): Promise<AttestationRecord> {
    const tmdb = entity.externalIds.tmdb!;
    const { verdict, review, authorization } = req;
    const attestationId = attestationIdOf({
      entityId: entity.entityId, candidateId: verdict.candidateId, identity: verdict.identity!, canonicalPath: entity.canonicalPath!, tmdb,
      verdictSha256: verdictDigest(verdict), ledgerHeadHash: review.ledgerHeadHash, authorizationId: authorization.payload.authorizationId,
    });
    const row = reviewOfRow(review, verdict.candidateId);
    const at = this.now();
    const body: AttestationBody = {
      schema: 1, type: 'attestation', attestationId, entityId: entity.entityId, candidateId: verdict.candidateId, identity: verdict.identity!,
      kind: entity.kind, tmdb, ...(entity.year !== undefined ? { year: entity.year } : {}), canonicalPath: entity.canonicalPath!, reviewBasis: 'ai',
      evidence: {
        verdictSha256: verdictDigest(verdict), decision: 'AUTO_ACCEPT', assurance: 'independently_supported',
        independentRoots: [...new Set(verdict.support.filter((s) => s.independent).map((s) => s.root))].sort(),
      },
      review: {
        ledgerHeadHash: review.ledgerHeadHash, sheetSha256: review.sheetSha256, rowDecisionHashes: row.hashes, reviewers: row.reviewers,
        gate: { pass: true, labelled: review.gate.labelled, secondReviewed: review.gate.secondReviewed, precisionLower95: review.gate.precisionLower95 },
      },
      authorization,
      previousMatching: {
        method: entity.matching.method, confidence: entity.matching.confidence, decidedAt: new Date(entity.matching.decidedAt).toISOString(),
        decidedBy: entity.matching.decidedBy, ...(entity.matching.assurance ? { assurance: entity.matching.assurance } : {}),
      },
      attestedAt: at.toISOString(),
      validUntil: new Date(at.getTime() + authorization.payload.validDays * 86_400_000).toISOString(),
      attestedBy: this.opts.actor ?? 'certify-cli',
    };
    const last = chain[chain.length - 1];
    const res = await this.attestations.insert(seal(entity.entityId, chain.length, last?.hash ?? GENESIS, body));
    if (res.inserted) return res.record;
    if (res.conflict === 'exists' && res.existing) return res.existing;
    throw new ContentIdentityError('concurrent_modification', `${entity.entityId}: attestation chain moved`);
  }

  /**
   * Revocation is the safe direction, so it needs a named actor and a reason but no owner signature:
   * anyone operating the system can withdraw a page. Idempotent and resumable.
   */
  async revoke(entityId: string, by: string, reason: string): Promise<{ outcome: 'revoked' | 'already_revoked'; entity: ContentEntityRecord }> {
    const actor = normalizeReviewerName(by);
    const why = String(reason || '').trim();
    if (why.length < 5) throw new ContentIdentityError('reason_required', 'a revocation needs a reason');
    const entity = await this.entities.findById(entityId);
    if (!entity) throw new ContentIdentityError('not_found', entityId);
    const chain = await this.attestations.listForEntity(entityId);
    const last = chain[chain.length - 1];
    if (!last) throw new ContentIdentityError('not_certified', entityId);
    const attestation = last.body.type === 'attestation' ? last : chain.find((r) => r.body.type === 'attestation' && r.body.attestationId === last.body.attestationId);
    if (!attestation) throw new ContentIdentityError('certification_inconsistent', `${entityId}: revocation without attestation`);
    const body = attestation.body as AttestationBody;

    if (last.body.type === 'attestation') {
      const res = await this.attestations.insert(seal(entityId, chain.length, last.hash, {
        schema: 1, type: 'revocation', attestationId: body.attestationId, entityId, reason: why.slice(0, 300), revokedBy: actor, revokedAt: this.now().toISOString(),
      }));
      if (!res.inserted && res.conflict !== 'exists') throw new ContentIdentityError('concurrent_modification', entityId);
    }
    if (entity.certification?.attestationId !== body.attestationId) return { outcome: 'already_revoked', entity };

    const pm = body.previousMatching;
    const demoted = await this.entities.revokeCertification(entityId, {
      expectedVersion: entity.version, attestationId: body.attestationId,
      matching: { method: pm.method as ContentEntityRecord['matching']['method'], confidence: pm.confidence, decidedAt: new Date(pm.decidedAt), decidedBy: pm.decidedBy, ...(pm.assurance ? { assurance: pm.assurance as 'independently_supported' } : {}) },
      by: actor, reason: `certification revoked: ${why}`.slice(0, 200),
    });
    if (!demoted) {
      const now = await this.entities.findById(entityId);
      if (now && now.certification?.attestationId !== body.attestationId) return { outcome: 'revoked', entity: now };
      throw new ContentIdentityError('concurrent_modification', entityId);
    }
    return { outcome: 'revoked', entity: demoted };
  }
}

// ---------------------------------------------------------------------------------------------
// Read-time validation for the public read

/** The owner's public key, re-read when the file changes. Missing or unreadable: no certification is valid. */
export function ownerPublicKeyReader(env: NodeJS.ProcessEnv = process.env): () => string | undefined {
  let cached: { file: string; mtimeMs: number; pem?: string } | undefined;
  return () => {
    const file = String(env.CONTENT_OWNER_PUBLIC_KEY_FILE || '').trim();
    if (!file) return undefined;
    try {
      const { mtimeMs } = fs.statSync(file);
      if (cached?.file !== file || cached.mtimeMs !== mtimeMs) cached = { file, mtimeMs, pem: fs.readFileSync(file, 'utf8') };
      return cached.pem;
    } catch { return undefined; }
  };
}

export interface CertificationReader {
  /** True only if the entity's certification is in force right now. Never throws for a bad chain: that is `false`. */
  isCertified(entity: ContentEntityRecord): Promise<boolean>;
}

export function createCertificationReader(
  attestations: IContentAttestationRepository = new MongoContentAttestationRepository(),
  publicKey: () => string | undefined = ownerPublicKeyReader(),
  now: () => Date = () => new Date()
): CertificationReader {
  return {
    async isCertified(entity) {
      if (entity.status !== 'active' || entity.matching?.method !== 'ai_attested') return false;
      const state = evaluateCertification(entity, await attestations.listForEntity(entity.entityId), { now: now(), ownerPublicKeyPem: publicKey() });
      return state.state === 'certified';
    },
  };
}

export const createContentCertificationService = (ownerPublicKeyPem?: string, actor?: string) =>
  new ContentCertificationService(new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentAttestationRepository(), { ownerPublicKeyPem, actor });

// ---------------------------------------------------------------------------------------------
// Public-read canary preparation

export interface CanaryAllowlistSource {
  entities: IContentEntityRepository;
  certification: ContentCertificationService;
  /** The same read the route performs; an entity is listed only if it is served right now. */
  reader: { resolve(path: string): Promise<{ status: string; entity?: { entityId: string; canonicalPath: string } }> };
}

/**
 * The `CONTENT_ENTITY_CANARY_FILE` document for a manifest, or the reasons there is none. All or nothing:
 * every identity must be certified (valid at this moment), served by the public read as canonical at its
 * manifest path, and the batch within the ceiling. `approvedBy` is the person who approves publication
 * (the policy refuses AI and automation names); it is never taken from the attestation.
 * Reads only; writing the file and setting the flags remain separate, owner-approved steps.
 */
export async function buildCanaryAllowlist(
  manifest: { ceiling: number; entities: Array<{ candidateId: string; canonicalPath: string; tmdb: { type: 'movie' | 'tv'; id: number } }> },
  source: CanaryAllowlistSource,
  approvedBy: string,
  now: Date
): Promise<{ allowlist: { version: 1; entities: Array<{ entityId: string; canonicalPath: string; approvedBy: string; approvedAt: string }> } | null; refused: Array<{ candidateId: string; reason: string }> }> {
  const person = normalizeReviewerName(approvedBy);
  const refused: Array<{ candidateId: string; reason: string }> = [];
  const entries: Array<{ entityId: string; canonicalPath: string; approvedBy: string; approvedAt: string }> = [];
  if (manifest.entities.length > Math.min(manifest.ceiling, 25)) refused.push({ candidateId: '*', reason: 'over_ceiling' });
  for (const e of manifest.entities) {
    const entity = await source.entities.findLiveByTmdb(e.tmdb);
    if (!entity) { refused.push({ candidateId: e.candidateId, reason: 'entity_not_written' }); continue; }
    const state = await source.certification.stateOf(entity);
    if (state.state !== 'certified') { refused.push({ candidateId: e.candidateId, reason: `certification_${state.state}` }); continue; }
    const read = await source.reader.resolve(e.canonicalPath);
    if (read.status !== 'canonical' || read.entity?.entityId !== entity.entityId || read.entity.canonicalPath !== e.canonicalPath) {
      refused.push({ candidateId: e.candidateId, reason: `read_${read.status}` });
      continue;
    }
    entries.push({ entityId: entity.entityId, canonicalPath: e.canonicalPath, approvedBy: person, approvedAt: now.toISOString() });
  }
  return { allowlist: refused.length ? null : { version: 1, entities: entries }, refused };
}
