/** Test fixtures for the Phase 3C certification tests: an owner key, verdicts, a real hash-chained AI ledger, a signed grant. */
import { generateKeyPairSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canonicalJson, OwnerAuthorizationPayload, sha256, signOwnerAuthorization } from '@/domain/services/contentCertification';
import type { EvidenceVerdict } from './ContentIdentityEvidence';
import { LedgerEntry, openLedger, recordDecision } from './ContentIdentityReviewLedger';
import { loadReviewEvidence, ReviewEvidence, verdictDigest } from './ContentCertification';
import type { DayInput, LegacyProbe } from './ContentCanaryManifest';

export function ownerKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { publicPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(), privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };
}

export const NOW = new Date('2026-10-22T10:00:00Z');

export const tmdbKey = (type: 'movie' | 'tv', id: number) => `tmdb:${type}:${id}`;

export function verdictFor(key: string, tmdbId: number, over: Partial<EvidenceVerdict> = {}, year = 2001): EvidenceVerdict {
  const slug = key.replace(/_/g, '-');
  return {
    candidateId: `${key}|movie|movie:${tmdbId}|${year}`, key, kind: 'movie', title: key.replace(/_/g, ' '),
    identity: `new:${key}|movie|tmdb:movie:${tmdbId}`, path: `/peliculas/${slug}`, decision: 'AUTO_ACCEPT', assurance: 'independently_supported', kindBasis: 'tmdb_runtime',
    support: [
      { source: 'tmdb_unique_title', claim: `only movie titled "${key}"`, provenance: 'external_metadata', root: `tmdb_index:movie:${tmdbId}`, independent: true },
      { source: 'consistency_check', claim: 'slot 94 min fits runtime 97 min', provenance: 'external_metadata', root: `tmdb_index:movie:${tmdbId}+broadcaster_feed`, independent: true },
    ] as EvidenceVerdict['support'],
    contradictions: [], missing: [], unverified: [], ...over,
  };
}

const AI_A = 'AI Sonnet 5.5 A';
const AI_B = 'AI Opus 5.5 B';
const accept = { kind_ok: 'y', tmdb_ok: 'y', path_ok: 'y', critical: 'n' };

/** A real ledger (hash chain, AI reviewers) over `ids`; the gate summary is set by the caller because the real thresholds need 300 rows. */
export function reviewFor(ids: string[], opts: { second?: boolean; secondDecision?: 'accept' | 'reject'; humanPrimary?: boolean; gatePass?: boolean; basis?: string } = {}): ReviewEvidence {
  const rows = ids.map((id) => ({ candidate_id: id, strata: 'auto_create' }));
  const entries: LedgerEntry[] = [openLedger(rows, AI_A, NOW)];
  const add = (input: Parameters<typeof recordDecision>[2]) => entries.push(recordDecision(entries, rows, input, NOW));
  for (const id of ids) {
    add({ rowId: id, decision: 'accept', reviewer: opts.humanPrimary ? 'Ana García' : AI_A, reviewerKind: opts.humanPrimary ? undefined : 'ai', labels: accept, note: 'TMDB checked' });
    if (opts.second !== false) {
      const d = opts.secondDecision ?? 'accept';
      add({ rowId: id, decision: d, reviewer: AI_B, reviewerKind: 'ai', labels: accept, errorCategory: d === 'reject' ? 'wrong_tmdb' : undefined, note: 'blind check' });
    }
  }
  return {
    entries, rows, ledgerHeadHash: entries[entries.length - 1].hash, sheetSha256: sha256(rows.map((r) => r.candidate_id).join()),
    gate: { pass: opts.gatePass ?? true, basis: opts.basis ?? 'ai', labelled: 360, secondReviewed: 119, precisionLower95: 0.987, blockers: [] },
  };
}

export function grant(keys: { privatePem: string }, verdicts: EvidenceVerdict[], over: Partial<OwnerAuthorizationPayload> = {}, id = 'oa_0123456789abcdef') {
  const payload: OwnerAuthorizationPayload = {
    schema: 1, authorizationId: id, owner: 'manuelxose', scope: 'certify',
    issuedAt: new Date(NOW.getTime() - 3_600_000).toISOString(), executeBy: new Date(NOW.getTime() + 86_400_000).toISOString(), validDays: 30,
    batch: { manifestDigest: sha256(canonicalJson(verdicts.map((v) => v.candidateId))), max: 25, items: verdicts.map((v) => ({ candidateId: v.candidateId, verdictSha256: verdictDigest(v) })) },
    statement: 'I authorise certifying exactly this batch.', ...over,
  };
  return signOwnerAuthorization(payload, keys.privatePem);
}

// ---- the committed Phase 3B/3C inputs (replay verdicts + traces, AI ledger, public-page probes) ----------------------

export const realRoot = path.resolve(__dirname, '../../../../../docs/seo');
export const realInputsAvailable = () => fs.existsSync(path.join(realRoot, 'phase-3c/canary-manifest.json')) && fs.existsSync(path.join(realRoot, 'phase-3b/round2/replay-inputs-r2.tar.gz'));

export function loadRealInputs() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-'));
  try {
    execFileSync('tar', ['xzf', path.join(realRoot, 'phase-3b/round2/replay-inputs-r2.tar.gz'), '-C', dir]);
    const lines = (f: string) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith('{'));
    const days = ['20261020', '20261021', '20261022', '20261023'];
    const dayInputs: DayInput[] = days.map((day) => ({
      day, traces: lines(path.join(dir, `traces-${day}-run1.jsonl`)).filter((l) => l.startsWith('{"candidateId"')).map((l) => JSON.parse(l)), verdicts: lines(path.join(dir, `verdicts-${day}.jsonl`)).map((l) => JSON.parse(l)),
    }));
    const tmdbChecks = days.flatMap((day) => JSON.parse(fs.readFileSync(path.join(dir, `tmdb-checks-${day}.json`), 'utf8')));
    const review = loadReviewEvidence(fs.readFileSync(path.join(realRoot, 'phase-3b/ai-review/round2/ledger.jsonl'), 'utf8'), fs.readFileSync(path.join(realRoot, 'phase-3b/round2/review-sheet-3b-r2.csv'), 'utf8'));
    const probes = JSON.parse(fs.readFileSync(path.join(realRoot, 'phase-3c/canary-legacy-probes.json'), 'utf8')) as LegacyProbe[];
    return { days: dayInputs, tmdbChecks, review, probes };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
