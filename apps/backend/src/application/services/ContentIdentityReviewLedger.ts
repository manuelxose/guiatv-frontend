/**
 * Phase 3B: human review ledger for the identity gate. A review sheet (2D-2D) stays the sample; the
 * ledger is where named people record decisions on its rows.
 *
 *  - Append-only JSON lines, hash-chained (`prev`/`hash`), so any edit, deletion or reordering is
 *    detected by `verifyChain`. A correction is a new entry that `supersedes` the old one; both stay.
 *  - Reviewers are named people on a roster with a personal token (only its SHA-256 is stored).
 *    Automation names are refused by `normalizeReviewerName`; nothing here can sign as a person.
 *  - The first reviewer of a row is its primary, a different person its second (blind: the primary's
 *    label is never shown to them), a third person adjudicates a disagreement. A primary can no longer
 *    change a label once a second review exists.
 *  - `toSheets` exports the effective labels in the 2D-2E sheet format, so the unchanged gate
 *    (`scoreReview`: 300 labels, 98 % precision, 50 second-reviewer rows, error categories) decides.
 *    Nothing here lowers or bypasses it, and no machine verdict is ever a label.
 *
 * AI reviewers (3B-AI): on 2026-10-21 the owner authorised AI agents to do the review. They are never
 * a person: names start with "AI " (a human name may not), the roster must carry the owner's
 * `aiAuthorization`, every ledger entry says `reviewerKind: 'ai'`, and reports count them apart
 * (`reviewBasis`). The human rule (`normalizeReviewerName`) is unchanged for everything else:
 * `verifyEntity`, public reads and the canary still need a named person.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { AUTO_CREATE, ERROR_CATEGORIES, REVIEW_COLUMNS, buildReviewRows, scoreReview, type ScoreGate } from './ContentIdentityAudit';
import type { EvidenceVerdict } from './ContentIdentityEvidence';
import type { IdentityTrace } from './ContentIdentityIngestion';
import { canonicalJson, GENESIS } from '@/domain/services/contentCertification';
import { ContentIdentityError, normalizeReviewerName } from './ContentIdentityService';

export const GENESIS_HASH = GENESIS;
export const DECISIONS = ['accept', 'reject', 'uncertain'] as const;
export type ReviewDecisionKind = (typeof DECISIONS)[number];
export const REQUIRED_GATE: ScoreGate = { precision: 0.98, minLabelled: 300, minVerified: 50 };

export interface SubLabels { kind_ok?: string; tmdb_ok?: string; path_ok?: string; critical?: string; duplicate_of?: string }
export interface LedgerOpen { seq: number; at: string; prev: string; hash: string; type: 'open'; sheetSha256: string; rows: number; openedBy: string }
export interface LedgerDecision {
  seq: number; at: string; prev: string; hash: string; type: 'decision';
  rowId: string; decision: ReviewDecisionKind; reviewer: string; reviewerKind?: 'ai';
  errorCategory?: string; labels?: SubLabels; note?: string; supersedes?: number;
}
export type LedgerEntry = LedgerOpen | LedgerDecision;

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
export const hashToken = (token: string) => sha(`guiatv-review\0${token}`);
const bodyOf = ({ hash: _hash, ...rest }: LedgerEntry) => rest;
const canonical = canonicalJson;
export const entryHash = (entry: Omit<LedgerEntry, 'hash'>) => sha(canonical(entry));
export const sheetDigest = (rows: readonly Record<string, string>[]) => sha(rows.map((r) => `${r.candidate_id}|${r.strata}`).join('\n'));

// ---------------------------------------------------------------------------------------------
// The sheet to review

/** Sheet columns: the 2D-2E review columns plus what a reviewer needs to check the machine's claim. */
export const EVIDENCE_SHEET_COLUMNS = [...REVIEW_COLUMNS.slice(0, REVIEW_COLUMNS.indexOf('reviewer')), 'independent_evidence', 'evidence_gaps', ...REVIEW_COLUMNS.slice(REVIEW_COLUMNS.indexOf('reviewer'))];

/**
 * A review sheet whose auto-create stratum is exactly the population a write canary would admit: the
 * identities the evidence gate accepts (`independently_supported`), over several replay days, one row
 * per identity, a deterministic random sample of `size`. The machine's independent evidence is shown
 * beside each row so the reviewer checks a claim instead of searching from scratch; it is evidence to
 * check, never a label.
 */
export function buildEvidenceSheet(days: ReadonlyArray<{ traces: readonly IdentityTrace[]; verdicts: readonly EvidenceVerdict[] }>, plan: { seed: string; size: number }) {
  const byIdentity = new Map<string, { trace: IdentityTrace; verdict: EvidenceVerdict }>();
  for (const { traces, verdicts } of days) {
    const verdictOf = new Map(verdicts.map((v) => [v.candidateId, v]));
    for (const t of [...traces].sort((a, b) => a.candidateId.localeCompare(b.candidateId))) {
      const v = verdictOf.get(t.candidateId);
      if (t.decision !== 'create' || !t.identity || v?.decision !== 'AUTO_ACCEPT' || v.assurance !== 'independently_supported' || byIdentity.has(t.identity)) continue;
      byIdentity.set(t.identity, { trace: t, verdict: v });
    }
  }
  const population = [...byIdentity.values()];
  const rows = buildReviewRows(population.map((p) => p.trace), { seed: plan.seed, perClass: 0, precision: plan.size });
  const verdictFor = new Map(population.map((p) => [p.trace.candidateId, p.verdict]));
  for (const row of rows) {
    const v = verdictFor.get(row.candidate_id)!;
    row.independent_evidence = v.support.filter((x) => x.independent).map((x) => x.claim).join(' ; ');
    row.evidence_gaps = [...v.missing, ...v.unverified].join(' ');
  }
  return { population: population.length, rows };
}

// ---------------------------------------------------------------------------------------------
// Roster

/** AI reviewer names: "AI Sonnet 5.5 A". Humans may not use this form, so a name always says what signed. */
export const AI_REVIEWER_NAME = /^AI [\p{L}\p{N}][\p{L}\p{N} .-]{1,38}$/u;
export interface AiAuthorization { by: string; at: string; note: string }
export interface Roster { version: 1; aiAuthorization?: AiAuthorization; reviewers: Array<{ name: string; tokenSha256: string; kind?: 'ai' }> }

/** Name to store for a reviewer of the given kind; humans keep the unchanged person rule and may not look like an AI. */
export function reviewerName(name: unknown, kind?: 'ai'): string {
  const text = String(name ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (kind === 'ai') {
    if (!AI_REVIEWER_NAME.test(text)) throw new ContentIdentityError('reviewer_required', 'an AI reviewer is named "AI <model> <letter>"');
    return text;
  }
  if (text.startsWith('AI ')) throw new ContentIdentityError('reviewer_required', 'a person cannot sign with an "AI …" name');
  return normalizeReviewerName(text);
}

/** The roster member `name` with `token`, else throws. */
export function authenticateMember(roster: Roster, name: string, token: string | undefined): { name: string; kind?: 'ai' } {
  const who = String(name).trim().startsWith('AI ') ? reviewerName(name, 'ai') : reviewerName(name);
  const member = roster.reviewers.find((r) => r.name.toLowerCase() === who.toLowerCase());
  const given = Buffer.from(hashToken(token ?? ''), 'hex');
  const stored = Buffer.from(member?.tokenSha256 ?? '', 'hex');
  if (!member || !token || stored.length !== given.length || !timingSafeEqual(stored, given)) {
    throw new ContentIdentityError('reviewer_required', 'unknown reviewer or wrong token');
  }
  return { name: member.name, ...(member.kind ? { kind: member.kind } : {}) };
}

/** The normalised reviewer name if `token` is the personal token of a roster member, else throws. */
export const authenticate = (roster: Roster, name: string, token: string | undefined): string => authenticateMember(roster, name, token).name;

/** Validates a roster document; every name must be a person, no duplicates. */
export function parseRoster(text: string): Roster {
  const doc = JSON.parse(text) as Roster;
  if (doc.version !== 1 || !Array.isArray(doc.reviewers)) throw new Error('roster must be {version:1, reviewers:[{name, tokenSha256}]}');
  const seen = new Set<string>();
  const auth = doc.aiAuthorization;
  if (auth && (!auth.note || Number.isNaN(Date.parse(auth.at)) || !normalizeReviewerName(auth.by))) throw new Error('invalid aiAuthorization (by, at, note)');
  for (const r of doc.reviewers) {
    if (r.kind === 'ai' && !auth) throw new Error(`AI reviewer ${r.name} needs the owner's aiAuthorization in the roster`);
    if (r.kind !== undefined && r.kind !== 'ai') throw new Error(`invalid reviewer kind for ${r.name}`);
    r.name = reviewerName(r.name, r.kind);
    if (!/^[0-9a-f]{64}$/.test(r.tokenSha256) || seen.has(r.name.toLowerCase())) throw new Error(`invalid roster entry ${r.name}`);
    seen.add(r.name.toLowerCase());
  }
  return doc;
}

// ---------------------------------------------------------------------------------------------
// Chain

export function verifyChain(entries: readonly LedgerEntry[]): { ok: true } | { ok: false; at: number; reason: string } {
  let prev = GENESIS_HASH;
  for (const [i, e] of entries.entries()) {
    if (e.seq !== i) return { ok: false, at: i, reason: 'sequence gap or reorder' };
    if (e.prev !== prev) return { ok: false, at: i, reason: 'broken chain' };
    if (entryHash(bodyOf(e)) !== e.hash) return { ok: false, at: i, reason: 'entry was modified' };
    if (i === 0 ? e.type !== 'open' : e.type !== 'decision') return { ok: false, at: i, reason: i === 0 ? 'first entry must open the ledger' : 'unexpected entry type' };
    prev = e.hash;
  }
  return { ok: true };
}

export function parseLedger(text: string): LedgerEntry[] {
  const entries = text.split('\n').filter(Boolean).map((line) => JSON.parse(line) as LedgerEntry);
  const chain = verifyChain(entries);
  if (!chain.ok) throw new ContentIdentityError('invalid_ledger', `ledger entry ${chain.at}: ${chain.reason}`);
  return entries;
}

function seal(entries: readonly LedgerEntry[], body: Omit<LedgerOpen, 'seq' | 'prev' | 'hash'> | Omit<LedgerDecision, 'seq' | 'prev' | 'hash'>): LedgerEntry {
  const unsigned = { ...body, seq: entries.length, prev: entries.length ? entries[entries.length - 1].hash : GENESIS_HASH };
  return { ...unsigned, hash: entryHash(unsigned as Omit<LedgerEntry, 'hash'>) } as LedgerEntry;
}

export function openLedger(rows: readonly Record<string, string>[], by: string, now: Date): LedgerOpen {
  return seal([], { type: 'open', at: now.toISOString(), sheetSha256: sheetDigest(rows), rows: rows.length, openedBy: reviewerName(by, AI_REVIEWER_NAME.test(by.trim()) ? 'ai' : undefined) }) as LedgerOpen;
}

// ---------------------------------------------------------------------------------------------
// State of one row

export interface RowState {
  primary?: LedgerDecision;
  second?: LedgerDecision;
  adjudication?: LedgerDecision;
  /** Every entry for the row, oldest first, superseded ones included. */
  history: LedgerDecision[];
}

const decisions = (entries: readonly LedgerEntry[]) => entries.filter((e): e is LedgerDecision => e.type === 'decision');

/** The latest non-superseded entry of each reviewer per row, assigned to primary / second / adjudication by who came first. */
export function rowStates(entries: readonly LedgerEntry[]): Map<string, RowState> {
  const out = new Map<string, RowState>();
  const superseded = new Set(decisions(entries).flatMap((d) => (d.supersedes === undefined ? [] : [d.supersedes])));
  for (const d of decisions(entries)) {
    const state = out.get(d.rowId) ?? { history: [] };
    state.history.push(d);
    out.set(d.rowId, state);
  }
  for (const state of out.values()) {
    const live = state.history.filter((d) => !superseded.has(d.seq));
    const order: string[] = [];
    for (const d of state.history) if (!order.includes(d.reviewer)) order.push(d.reviewer);
    const of = (reviewer?: string) => live.filter((d) => d.reviewer === reviewer).pop();
    state.primary = of(order[0]);
    state.second = of(order[1]);
    state.adjudication = of(order[2]);
  }
  return out;
}

/** Why `reviewer` may not record a decision on the row now, or null. */
export function refusal(rows: readonly Record<string, string>[], states: Map<string, RowState>, rowId: string, reviewer: string, supersedes?: number): string | null {
  const row = rows.find((r) => r.candidate_id === rowId);
  if (!row) return 'row is not in the sheet';
  const state = states.get(rowId);
  const mine = state?.history.filter((d) => d.reviewer === reviewer) ?? [];
  const live = mine.at(-1);
  if (live && supersedes !== live.seq) return 'you already decided this row: correct it explicitly (supersedes) instead of deciding again';
  if (supersedes !== undefined && !mine.some((d) => d.seq === supersedes)) return 'you can only correct your own latest decision';
  if (supersedes !== undefined && state?.adjudication) return 'the row was adjudicated: its label is settled';
  if (supersedes !== undefined && state?.primary?.reviewer === reviewer && state.second) return 'a second review exists: only adjudication can change this row now';
  if (!live) {
    const people = new Set(state?.history.map((d) => d.reviewer));
    if (people.size >= 3) return 'row already has a primary, a second reviewer and an adjudicator';
    if (people.size === 2 && !(state?.primary && state.second && needsAdjudication(state))) return 'primary and second reviewer agree: nothing to adjudicate';
    if (people.size === 1 && !String(row.strata).split(';').includes(AUTO_CREATE)) return 'only auto-create rows take a second reviewer';
  }
  return null;
}

const label = (d?: LedgerDecision) => (d?.decision === 'accept' ? 'y' : d?.decision === 'reject' ? 'n' : '?');
export const disagree = (s: RowState) => !!s.primary && !!s.second && label(s.primary) !== label(s.second);
/** Two reviewers disagreeing, or agreeing only that they cannot tell: either way the row has no yes/no label yet. */
export const needsAdjudication = (s: RowState) => disagree(s) || (!!s.primary && !!s.second && label(s.primary) === '?');

// ---------------------------------------------------------------------------------------------
// Recording and serving rows

export function recordDecision(
  entries: readonly LedgerEntry[], rows: readonly Record<string, string>[],
  input: { rowId: string; decision: string; reviewer: string; reviewerKind?: 'ai'; errorCategory?: string; labels?: SubLabels; note?: string; correct?: boolean }, now: Date
): LedgerDecision {
  const open = entries[0] as LedgerOpen | undefined;
  if (!open || open.sheetSha256 !== sheetDigest(rows)) throw new ContentIdentityError('invalid_ledger', 'the sheet is not the one this ledger was opened for');
  if (!(DECISIONS as readonly string[]).includes(input.decision)) throw new ContentIdentityError('invalid_decision', `decision must be one of ${DECISIONS.join(', ')}`);
  const reviewer = reviewerName(input.reviewer, input.reviewerKind);
  const states = rowStates(entries);
  const latest = states.get(input.rowId)?.history.filter((d) => d.reviewer === reviewer).at(-1);
  if (input.correct && !latest) throw new ContentIdentityError('review_refused', 'nothing of yours to correct on this row');
  const problem = refusal(rows, states, input.rowId, reviewer, input.correct ? latest?.seq : undefined);
  if (problem) throw new ContentIdentityError('review_refused', problem);
  if (input.decision === 'reject' && !(ERROR_CATEGORIES as readonly string[]).includes(String(input.errorCategory))) {
    throw new ContentIdentityError('invalid_decision', `a rejection needs --error-category (${ERROR_CATEGORIES.join(', ')})`);
  }
  const body: Omit<LedgerDecision, 'seq' | 'prev' | 'hash'> = { type: 'decision', at: now.toISOString(), rowId: input.rowId, decision: input.decision as ReviewDecisionKind, reviewer };
  if (input.reviewerKind === 'ai') body.reviewerKind = 'ai';
  if (input.decision === 'reject') body.errorCategory = input.errorCategory;
  if (input.labels && Object.keys(input.labels).length) body.labels = input.labels;
  if (input.note) body.note = input.note;
  if (input.correct && latest) body.supersedes = latest.seq;
  return seal(entries, body) as LedgerDecision;
}

/**
 * Rows `reviewer` can still work on, in a stable per-reviewer order (hash of the row id and the
 * reviewer, so two people start at different rows and the second sample is not a copy of the first).
 * The result never contains another reviewer's label.
 */
export function nextRows(entries: readonly LedgerEntry[], rows: readonly Record<string, string>[], reviewerNameInput: string, limit = 10, secondOnly = false): Record<string, string>[] {
  const reviewer = reviewerName(reviewerNameInput, AI_REVIEWER_NAME.test(reviewerNameInput.trim()) ? 'ai' : undefined);
  const states = rowStates(entries);
  return rows
    .filter((r) => !states.get(r.candidate_id)?.history.some((d) => d.reviewer === reviewer) && !refusal(rows, states, r.candidate_id, reviewer))
    .filter((r) => !secondOnly || states.get(r.candidate_id)?.history.length)
    // Rows with exactly one review come first for second reviewers: finishing the verification set matters most.
    .sort((a, b) => {
      const needs = (r: Record<string, string>) => (states.get(r.candidate_id)?.history.length ? 0 : 1);
      return needs(a) - needs(b) || sha(`${reviewer}\0${a.candidate_id}`).localeCompare(sha(`${reviewer}\0${b.candidate_id}`));
    })
    .slice(0, limit);
}

// ---------------------------------------------------------------------------------------------
// Export in the 2D-2E sheet format, and progress

/** Fields the scorer compares between the two reviewers; an adjudicated row settles all of them. */
const NOTE_ADJUDICATED = 'adjudicated identity_ok kind_ok path_ok critical';
/**
 * One sheet row. On an adjudicated row both reviewers' sheets carry the adjudicator's label and
 * sub-labels (the scorer closes a disagreement only when the labels converge and the note names it);
 * each reviewer's own first label stays in the ledger and in `rawAgreement`.
 */
function sheetRow(row: Record<string, string>, d: LedgerDecision, settled?: LedgerDecision): Record<string, string> {
  const final = settled ?? d;
  const identity = label(final);
  return {
    ...row,
    reviewer: d.reviewer, identity_ok: identity, error_category: identity === 'n' ? final.errorCategory ?? d.errorCategory ?? '' : '',
    ...(final.labels ?? {}),
    notes: [d.note, settled ? `${NOTE_ADJUDICATED}: ${settled.reviewer}` : ''].filter(Boolean).join(' · '),
  };
}

/** Effective labels as two sheets (primary / second reviewer) for `scoreReview`. Uncertain rows export as `?`: unresolved. */
export function toSheets(rows: readonly Record<string, string>[], entries: readonly LedgerEntry[]) {
  const states = rowStates(entries);
  const primary: Record<string, string>[] = [];
  const second: Record<string, string>[] = [];
  for (const row of rows) {
    const s = states.get(row.candidate_id);
    if (!s?.primary) { primary.push({ ...row }); continue; }
    const settled = s.adjudication && needsAdjudication(s) ? s.adjudication : undefined;
    primary.push(sheetRow(row, s.primary, settled));
    if (s.second) second.push(sheetRow(row, s.second, settled));
  }
  return { primary, second };
}

/** Gate score from the ledger alone, plus progress against each threshold and the open disagreements. */
export function ledgerReport(rows: readonly Record<string, string>[], entries: readonly LedgerEntry[], gate: ScoreGate = REQUIRED_GATE) {
  const { primary, second } = toSheets(rows, entries);
  const aiNames = new Set(decisions(entries).filter((d) => d.reviewerKind === 'ai').map((d) => d.reviewer));
  const score = scoreReview(primary, gate, second, aiNames);
  const states = [...rowStates(entries).values()];
  const reviewers = new Map<string, number>();
  for (const d of decisions(entries)) reviewers.set(d.reviewer, (reviewers.get(d.reviewer) ?? 0) + 1);
  const auto = (r: Record<string, string>) => String(r.strata).split(';').includes(AUTO_CREATE);
  const autoIds = new Set(rows.filter(auto).map((r) => r.candidate_id));
  const raw = states.filter((s) => s.primary && s.second && autoIds.has(s.primary.rowId));
  const agreed = raw.filter((s) => label(s.primary) === label(s.second)).length;
  const humanNames = new Set(decisions(entries).filter((d) => d.reviewerKind !== 'ai').map((d) => d.reviewer));
  return {
    chain: verifyChain(entries),
    /** Who the labels come from. `ai` and `mixed` are never reported as a human-validated precision. */
    reviewBasis: aiNames.size && humanNames.size ? 'mixed' : aiNames.size ? 'ai' : 'human',
    aiReviewers: [...aiNames].sort(),
    humanReviewers: [...humanNames].sort(),
    sheetRows: rows.length,
    autoCreateRows: autoIds.size,
    decided: states.filter((s) => s.primary).length,
    uncertain: states.filter((s) => s.primary && label(s.primary) === '?').length,
    secondReviewed: states.filter((s) => s.primary && s.second && autoIds.has(s.primary.rowId)).length,
    entries: decisions(entries).length,
    corrections: decisions(entries).filter((d) => d.supersedes !== undefined).length,
    reviewers: Object.fromEntries([...reviewers].sort(([a], [b]) => a.localeCompare(b))),
    /** Raw agreement of the two first labels on rows with two reviewers, before any adjudication. */
    rawAgreement: raw.length ? agreed / raw.length : null,
    openDisagreements: states.filter((s) => needsAdjudication(s) && !s.adjudication).map((s) => s.primary!.rowId).sort(),
    progress: {
      labelled: { have: score.autoCreate.identityPrecision.n, need: gate.minLabelled },
      verified: { have: score.verification?.overlap ?? 0, need: gate.minVerified ?? 0 },
      precision: { observed: score.autoCreate.identityPrecision.observed, lower95: score.autoCreate.identityPrecision.lower95, need: gate.precision },
    },
    score,
  };
}
