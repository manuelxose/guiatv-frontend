/**
 * Phase 2D-2D: read-only quality audit of identity decisions. Pure functions over the traces of a
 * shadow run (`ContentIdentityIngestion.run(..., trace)`): decision classes, deterministic samples,
 * a review sheet for people to label, and the scores of a labelled sheet. Nothing here reads or
 * writes a database, and no machine decision is ever counted as a label.
 */
import { createHash } from 'node:crypto';
import { slugifyEntityTitle } from '@/domain/services/contentIdentity';
import type { IdentityTrace } from './ContentIdentityIngestion';
import { normalizeReviewerName } from './ContentIdentityService';

export const AUDIT_CLASSES = [
  'new_entity',
  'existing_match',
  'tmdb_confirmed',
  'tmdb_rejected',
  'ambiguous',
  'manual_review',
  'unknown_kind',
  'duplicate_looking',
  'shared_title',
  'pathless',
  'historic_ownership',
  'deferred',
  // 2D-2E strata: the normalisation and cross-kind rules under review.
  'episode_normalized',
  'title_uncertain',
  'cross_kind_conflict',
  'generic_slot',
] as const;
export type AuditClass = (typeof AUDIT_CLASSES)[number];

/** The precision stratum: every candidate the run would create automatically. */
export const AUTO_CREATE = 'auto_create';

const isNew = (t: IdentityTrace) => t.decision === 'create';

/** Every class a trace belongs to; a trace can be in several. */
export function auditClasses(traces: readonly IdentityTrace[]): Map<AuditClass, IdentityTrace[]> {
  const out = new Map<AuditClass, IdentityTrace[]>(AUDIT_CLASSES.map((c) => [c, []]));
  const add = (c: AuditClass, t: IdentityTrace) => out.get(c)!.push(t);
  // Proposed entities whose titles give the same slug, of any kind ("La gran belleza" as a film and
  // as a series): one work counted twice, or homonyms a person has to tell apart.
  const slugOf = (t: IdentityTrace) => slugifyEntityTitle(t.title) ?? t.key;
  const bySlug = new Map<string, Set<string>>();
  for (const t of traces.filter(isNew)) bySlug.set(slugOf(t), (bySlug.get(slugOf(t)) ?? new Set()).add(t.identity ?? t.candidateId));
  // One title key, several known-kind contexts (kind, TMDB work or year): remakes, homonyms, splits.
  // An unknown-kind sighting of a known title is not a second work; it is in `unknown_kind`.
  const contexts = new Map<string, number>();
  traces.filter((t) => t.kind !== 'unknown').forEach((t) => contexts.set(t.key, (contexts.get(t.key) ?? 0) + 1));
  for (const t of traces) {
    if (isNew(t)) add('new_entity', t);
    if (t.decision === 'matched' || t.decision === 'bind') add('existing_match', t);
    if (t.tmdb.evidence === 'confirmed') add('tmdb_confirmed', t);
    if (t.tmdb.evidence === 'unconfirmed' || t.tmdb.evidence === 'mixed') add('tmdb_rejected', t);
    if ((t.decision === 'review' || t.decision === 'held') && t.state === 'ambiguous') add('ambiguous', t);
    if ((t.decision === 'review' || t.decision === 'held') && t.state === 'manual_review') add('manual_review', t);
    if (t.decision === 'unresolved' && t.reason === 'unknown_kind') add('unknown_kind', t);
    if (Object.keys(t.titleEvidence ?? {}).some((e) => e.startsWith('episode:')) || t.reason === 'episode_without_work') add('episode_normalized', t);
    if (t.reason === 'title_uncertain') add('title_uncertain', t);
    if (t.reason === 'cross_kind_conflict' || t.crossKind) add('cross_kind_conflict', t);
    if (t.decision === 'rejected' && t.reason === 'generic_title') add('generic_slot', t);
    if (isNew(t) && (bySlug.get(slugOf(t))?.size ?? 0) > 1) add('duplicate_looking', t);
    if ((contexts.get(t.key) ?? 0) > 1) add('shared_title', t);
    if (t.pathless) add('pathless', t);
    if (t.historicOwner || t.pathRefused?.some((r) => r.startsWith('historic_'))) add('historic_ownership', t);
    if (t.decision === 'deferred') add('deferred', t);
  }
  return out;
}

/** Seeded, order-independent sample: the `n` traces with the lowest hash of seed, stratum and candidate id. */
export function sampleTraces(traces: readonly IdentityTrace[], n: number, seed: string, stratum: string): IdentityTrace[] {
  const rank = (t: IdentityTrace) => createHash('sha256').update(`${seed}\0${stratum}\0${t.candidateId}`).digest('hex');
  return traces
    .map((t) => [rank(t), t] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, Math.max(0, n))
    .map(([, t]) => t);
}

/** Label columns a reviewer fills in; every other column is machine output. */
export const LABEL_COLUMNS = [
  'reviewer', 'identity_ok', 'kind_ok', 'duplicate_of', 'tmdb_ok', 'path_ok', 'critical', 'error_category', 'notes',
] as const;
/** Required with `identity_ok=n` (2D-2E §9): what kind of error it is, so errors can be counted by cause. */
export const ERROR_CATEGORIES = [
  'episode_as_work', 'generic_slot', 'cross_kind_split', 'false_merge', 'duplicate', 'wrong_kind', 'wrong_tmdb', 'wrong_path',
  'not_a_work', 'other',
] as const;
const MACHINE_COLUMNS = [
  'strata', 'candidate_id', 'epg_title', 'work_title', 'title_evidence', 'cross_kind', 'spellings', 'normalized_title', 'kind',
  'epg_years', 'identity_year', 'tmdb_id',
  'tmdb_type', 'tmdb_evidence', 'tmdb_url', 'decision', 'state', 'method', 'confidence', 'reason', 'proposed_identity',
  'proposed_path', 'path_refused', 'pathless_reason', 'historic_owner', 'airings',
] as const;
export const REVIEW_COLUMNS = [...MACHINE_COLUMNS, ...LABEL_COLUMNS];

export interface ReviewPlan {
  seed: string;
  /** Rows per decision class (high-risk and descriptive strata). */
  perClass: number;
  /** Simple random sample size of the auto-create stratum. */
  precision: number;
}

/**
 * The review sheet: a simple random sample of the auto-create stratum, plus `perClass` rows of
 * every class. A candidate appears once, with every stratum it was drawn for; label columns empty.
 */
export function buildReviewRows(traces: readonly IdentityTrace[], plan: ReviewPlan): Record<string, string>[] {
  const classes = auditClasses(traces);
  const strata = new Map<string, string[]>();
  const draws: Array<[string, IdentityTrace[]]> = [
    [AUTO_CREATE, sampleTraces(classes.get('new_entity')!, plan.precision, plan.seed, AUTO_CREATE)],
    ...AUDIT_CLASSES.map((c) => [c, sampleTraces(classes.get(c)!, plan.perClass, plan.seed, c)] as [string, IdentityTrace[]]),
  ];
  const order: IdentityTrace[] = [];
  for (const [stratum, rows] of draws) {
    for (const t of rows) {
      if (!strata.has(t.candidateId)) order.push(t);
      strata.set(t.candidateId, [...(strata.get(t.candidateId) ?? []), stratum]);
    }
  }
  return order.map((t) => {
    const ref = t.tmdb.ref;
    const tmdbId = ref?.id ?? t.tmdb.ids[0];
    const row: Record<string, string> = {
      strata: strata.get(t.candidateId)!.join(';'),
      candidate_id: t.candidateId,
      epg_title: t.spellings[0] ?? t.title,
      work_title: t.title,
      title_evidence: Object.entries(t.titleEvidence ?? {}).map(([e, n]) => `${e}=${n}`).join(' '),
      cross_kind: (t.crossKind ?? []).join(' '),
      spellings: t.spellings.slice(0, 5).join(' | '),
      normalized_title: t.key,
      kind: t.kind,
      epg_years: t.epgYears.join(' '),
      identity_year: t.year ? String(t.year) : '',
      tmdb_id: t.tmdb.ids.join(' '),
      tmdb_type: ref?.type ?? '',
      tmdb_evidence: t.tmdb.evidence,
      // Public TMDB page, so a reviewer can check the work; unconfirmed ids are shown as searched.
      tmdb_url: !tmdbId ? '' : ref ? `https://www.themoviedb.org/${ref.type}/${tmdbId}` : `https://www.themoviedb.org/search?query=${encodeURIComponent(t.title)}`,
      decision: t.decision,
      state: t.state ?? '',
      method: t.method ?? '',
      confidence: t.confidence === undefined ? '' : String(t.confidence),
      reason: t.reason ?? '',
      proposed_identity: t.identity ?? '',
      proposed_path: t.path ?? '',
      path_refused: (t.pathRefused ?? []).join(' '),
      pathless_reason: t.pathless ?? '',
      historic_owner: t.historicOwner ? 'y' : '',
      airings: String(t.airings),
    };
    for (const c of LABEL_COLUMNS) row[c] = '';
    return row;
  });
}

export function toCsv(rows: readonly Record<string, string>[], columns: readonly string[] = REVIEW_COLUMNS): string {
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [columns.join(','), ...rows.map((r) => columns.map((c) => cell(r[c] ?? '')).join(','))].join('\n') + '\n';
}

/** RFC 4180 subset: quoted fields, doubled quotes, CRLF or LF. The header names the columns. */
export function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') record.push(field), (field = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      record.push(field), records.push(record), (field = ''), (record = []);
    } else field += ch;
  }
  if (field || record.length) record.push(field), records.push(record);
  const [header = [], ...rows] = records.filter((r) => r.some((v) => v !== ''));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h.replace(/^﻿/, ''), r[i] ?? ''])));
}

// --- Interval estimates -----------------------------------------------------------------------

function binomialCdf(k: number, n: number, p: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  let logTerm = n * Math.log(1 - p);
  let sum = Math.exp(logTerm);
  for (let i = 1; i <= k; i++) {
    logTerm += Math.log((n - i + 1) / i) + Math.log(p / (1 - p));
    sum += Math.exp(logTerm);
  }
  return Math.min(1, sum);
}

const bisect = (f: (p: number) => boolean) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid)) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};

/** Exact (Clopper–Pearson) bounds for x successes in n trials; each tail gets `alpha`. */
export function clopperPearson(x: number, n: number, alpha = 0.025): { lower: number; upper: number } {
  if (n <= 0) return { lower: 0, upper: 1 };
  // P(X >= x | p) grows with p: the lower bound is where it reaches alpha.
  const lower = x === 0 ? 0 : bisect((p) => 1 - binomialCdf(x - 1, n, p) >= alpha);
  // P(X <= x | p) falls with p: the upper bound is where it drops to alpha.
  const upper = x === n ? 1 : bisect((p) => binomialCdf(x, n, p) <= alpha);
  return { lower, upper };
}

export function wilson(x: number, n: number, z = 1.959964): { lower: number; upper: number } {
  if (n <= 0) return { lower: 0, upper: 1 };
  const p = x / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { lower: Math.max(0, c - h), upper: Math.min(1, c + h) };
}

export interface Proportion {
  /** Rows with a yes/no label; `?`, `unsure` and blanks are counted apart as `unresolved`. */
  n: number;
  ok: number;
  unresolved: number;
  observed: number | null;
  /** Two-sided 95%, exact. */
  ci95: { lower: number; upper: number };
  /** One-sided 95% lower bound, exact: the precision the sample supports with 95% confidence. */
  lower95: number;
}

function proportion(values: string[]): Proportion {
  const yes = values.filter((v) => YES.has(v)).length;
  const no = values.filter((v) => NO.has(v)).length;
  const n = yes + no;
  return {
    n,
    ok: yes,
    unresolved: values.length - n,
    observed: n ? yes / n : null,
    ci95: clopperPearson(yes, n),
    lower95: clopperPearson(yes, n, 0.05).lower,
  };
}

const YES = new Set(['y', 'yes', 's', 'si', 'sí', 'true', '1', 'ok']);
const NO = new Set(['n', 'no', 'false', '0', 'wrong']);
const norm = (v: string | undefined) => String(v ?? '').trim().toLowerCase();

export interface ScoreGate {
  /** Minimum observed identity precision of the auto-create stratum. */
  precision: number;
  /** Auto-create rows that must carry a label before the gate can pass. */
  minLabelled: number;
  /** Auto-create rows a second, different person must label independently (2D-2E §9). */
  minVerified?: number;
}

/** Labelled rows signed by a valid reviewer name (normalised), and the ids of labelled rows that are not. */
function signedRows(rows: readonly Record<string, string>[]) {
  const reviewed: Record<string, string>[] = [];
  const invalidReviewer: string[] = [];
  for (const r of rows) {
    if (!LABEL_COLUMNS.some((c) => c !== 'reviewer' && c !== 'notes' && norm(r[c]))) continue;
    try {
      reviewed.push({ ...r, reviewer: normalizeReviewerName(r.reviewer) });
    } catch {
      invalidReviewer.push(r.candidate_id);
    }
  }
  return { reviewed, invalidReviewer };
}

const COMPARED = ['identity_ok', 'kind_ok', 'path_ok', 'critical'] as const;
const yesNo = (v: string) => (YES.has(norm(v)) ? 'y' : NO.has(norm(v)) ? 'n' : '');
/** "adjudicated identity_ok kind_ok: …": the fields a note settles. */
const adjudicatedFields = (notes: string | undefined) =>
  /\badjudicated\b/i.test(notes ?? '') ? new Set(COMPARED.filter((f) => new RegExp(`\\b${f}\\b`, 'i').test(notes ?? ''))) : new Set<string>();

/**
 * Independent verification (2D-2E §9): a second person labels a copy of the sheet without seeing
 * the first labels. Every overlapping auto-create row where the two differ is a disagreement until
 * both settle it and the primary row carries the agreed label and a note naming it ("adjudicated
 * identity_ok: …"); an adjudicated label still counts as a disagreement for agreement and Cohen's
 * kappa (identity labels are binary, so the primary's original label is the opposite of the verifier's).
 */
export function compareReviews(primary: readonly Record<string, string>[], verification: readonly Record<string, string>[]) {
  const auto = (list: Record<string, string>[]) =>
    new Map(list.filter((r) => String(r.strata).split(';').includes(AUTO_CREATE)).map((r) => [r.candidate_id, r] as const));
  const a = auto(signedRows(primary).reviewed);
  const b = auto(signedRows(verification).reviewed);
  const pairs = [...b].filter(([id, r]) => a.has(id) && yesNo(a.get(id)!.identity_ok) && yesNo(r.identity_ok)).map(([id, r]) => [a.get(id)!, r] as const);
  const sameReviewer = pairs.filter(([p, v]) => p.reviewer.toLowerCase() === v.reviewer.toLowerCase()).map(([p]) => p.candidate_id);
  const disagreements: Array<{ candidate_id: string; field: string; primary: string; verifier: string; adjudicated: boolean }> = [];
  let agreed = 0;
  let primaryYes = 0;
  let verifierYes = 0;
  for (const [p, v] of pairs) {
    const settled = adjudicatedFields(p.notes);
    for (const field of COMPARED) {
      const [x, y] = [yesNo(p[field]), yesNo(v[field])];
      const adjudicated = settled.has(field);
      if (x !== y || adjudicated) disagreements.push({ candidate_id: p.candidate_id, field, primary: x, verifier: y, adjudicated });
    }
    const verifier = yesNo(v.identity_ok);
    const original = settled.has('identity_ok') && yesNo(p.identity_ok) === verifier ? (verifier === 'y' ? 'n' : 'y') : yesNo(p.identity_ok);
    if (original === verifier) agreed++;
    if (original === 'y') primaryYes++;
    if (verifier === 'y') verifierYes++;
  }
  const n = pairs.length;
  const observed = n ? agreed / n : null;
  const chance = n ? (primaryYes / n) * (verifierYes / n) + (1 - primaryYes / n) * (1 - verifierYes / n) : null;
  const kappa = observed === null || chance === null ? null : chance === 1 ? (observed === 1 ? 1 : 0) : (observed - chance) / (1 - chance);
  return {
    overlap: n,
    reviewers: { primary: [...new Set(pairs.map(([p]) => p.reviewer))].sort(), verifier: [...new Set(pairs.map(([, v]) => v.reviewer))].sort() },
    sameReviewer,
    identityAgreement: observed,
    kappa,
    disagreements,
    /** Disagreements not yet settled: the labels still differ, or the primary row has no adjudication note. */
    open: disagreements.filter((d) => d.primary !== d.verifier || !d.adjudicated),
  };
}

/**
 * Scores a labelled review sheet. Only rows signed by a named person count (the same reviewer rule
 * as approvals); a row with machine output and no label is unreviewed, never correct by default.
 * `verification` is the second reviewer's sheet; without it the gate cannot pass when `minVerified` > 0.
 */
export function scoreReview(
  rows: readonly Record<string, string>[],
  gate: ScoreGate = { precision: 0.98, minLabelled: 300, minVerified: 50 },
  verification?: readonly Record<string, string>[]
) {
  const { reviewed, invalidReviewer } = signedRows(rows);
  const inStratum = (s: string) => reviewed.filter((r) => String(r.strata).split(';').includes(s));
  const auto = inStratum(AUTO_CREATE);
  const autoDrawn = rows.filter((r) => String(r.strata).split(';').includes(AUTO_CREATE)).length;
  const identity = proportion(auto.map((r) => norm(r.identity_ok)));
  const byMethod: Record<string, Proportion> = {};
  for (const method of [...new Set(auto.map((r) => r.method || 'none'))].sort()) {
    byMethod[method] = proportion(auto.filter((r) => (r.method || 'none') === method).map((r) => norm(r.identity_ok)));
  }
  const duplicates = auto.filter((r) => norm(r.duplicate_of)).length;
  const critical = reviewed.filter((r) => NO.has(norm(r.path_ok)) && YES.has(norm(r.critical)));
  const strata: Record<string, { reviewed: number; identityErrors: number; kindErrors: number; tmdbErrors: number; pathErrors: number }> = {};
  for (const s of [AUTO_CREATE, ...AUDIT_CLASSES]) {
    const list = inStratum(s);
    if (!list.length) continue;
    strata[s] = {
      reviewed: list.length,
      identityErrors: list.filter((r) => NO.has(norm(r.identity_ok))).length,
      kindErrors: list.filter((r) => NO.has(norm(r.kind_ok))).length,
      tmdbErrors: list.filter((r) => NO.has(norm(r.tmdb_ok))).length,
      pathErrors: list.filter((r) => NO.has(norm(r.path_ok))).length,
    };
  }
  const blockers: string[] = [];
  if (autoDrawn < gate.minLabelled) blockers.push(`auto-create sample has ${autoDrawn} rows, the plan needs ${gate.minLabelled}`);
  if (identity.n < gate.minLabelled || identity.unresolved > 0) {
    blockers.push(`auto-create identity labels: ${identity.n} yes/no of ${gate.minLabelled} required, ${identity.unresolved} unresolved`);
  }
  if (identity.observed === null || identity.observed < gate.precision) {
    blockers.push(`observed identity precision ${identity.observed ?? 'n/a'} below ${gate.precision}`);
  }
  if (critical.length) blockers.push(`${critical.length} critical canonical-ownership violation(s)`);
  if (invalidReviewer.length) blockers.push(`${invalidReviewer.length} labelled row(s) without a named reviewer`);
  const wrong = reviewed.filter((r) => NO.has(norm(r.identity_ok)));
  const uncategorised = wrong.filter((r) => !(ERROR_CATEGORIES as readonly string[]).includes(norm(r.error_category)));
  if (uncategorised.length) blockers.push(`${uncategorised.length} identity error(s) without a valid error_category`);
  const minVerified = gate.minVerified ?? 0;
  const agreement = verification ? compareReviews(rows, verification) : null;
  if (minVerified > 0) {
    if (!agreement || agreement.overlap < minVerified) {
      blockers.push(`independent verification: ${agreement?.overlap ?? 0} auto-create rows labelled by a second person, ${minVerified} required`);
    }
    if (agreement?.sameReviewer.length) blockers.push(`${agreement.sameReviewer.length} verification row(s) labelled by the primary reviewer`);
    if (agreement?.open.length) blockers.push(`${agreement.open.length} reviewer disagreement(s) not adjudicated`);
  }
  return {
    rows: rows.length,
    reviewed: reviewed.length,
    reviewers: [...new Set(reviewed.map((r) => r.reviewer))].sort(),
    invalidReviewer,
    autoCreate: {
      drawn: autoDrawn,
      identityPrecision: identity,
      kindAccuracy: proportion(auto.map((r) => norm(r.kind_ok))),
      duplicateRate: auto.length ? duplicates / auto.length : null,
      duplicates,
      /** Share of confirmed TMDB ids a reviewer accepted; the incorrect-assignment rate is 1 − observed. */
      tmdbAssignment: proportion(auto.filter((r) => r.tmdb_evidence === 'confirmed').map((r) => norm(r.tmdb_ok))),
      canonicalOwnership: proportion(auto.filter((r) => r.proposed_path).map((r) => norm(r.path_ok))),
      identityByMethod: byMethod,
    },
    strata,
    errorCategories: Object.fromEntries(
      [...new Set(wrong.map((r) => norm(r.error_category) || 'missing'))].sort().map((c) => [c, wrong.filter((r) => (norm(r.error_category) || 'missing') === c).length])
    ),
    verification: agreement,
    criticalOwnershipViolations: critical.map((r) => ({ candidate_id: r.candidate_id, proposed_path: r.proposed_path, notes: r.notes })),
    gate: { ...gate, pass: blockers.length === 0, blockers },
  };
}

/** Machine-side summary of a run's traces: class sizes, decisions and missing paths by reason. */
export function summarizeTraces(traces: readonly IdentityTrace[]) {
  const count = (list: readonly IdentityTrace[], f: (t: IdentityTrace) => string | undefined) => {
    const out: Record<string, number> = {};
    for (const t of list) {
      const k = f(t);
      if (k) out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  };
  const rejected = traces.filter((t) => t.decision === 'rejected');
  traces = traces.filter((t) => t.decision !== 'rejected');
  const created = traces.filter(isNew);
  const proposed = new Map(created.map((t) => [t.identity, t]));
  const pathless = [...proposed.values()].filter((t) => t.pathless);
  return {
    candidates: traces.length,
    /** Excluded titles (slots, episode-only, unkeyable) by reason, with their airing counts. */
    rejectedTitles: count(rejected, (t) => t.reason),
    rejectedAirings: rejected.reduce((n, t) => n + t.airings, 0),
    titleEvidence: traces.reduce<Record<string, number>>((acc, t) => {
      for (const [e, n] of Object.entries(t.titleEvidence ?? {})) acc[e] = (acc[e] ?? 0) + n;
      return acc;
    }, {}),
    decisions: count(traces, (t) => t.decision),
    kinds: count(traces, (t) => t.kind),
    tmdbEvidence: count(traces, (t) => t.tmdb.evidence),
    newEntities: proposed.size,
    newEntitiesByKind: count([...proposed.values()], (t) => t.kind),
    newEntitiesByMethod: count([...proposed.values()], (t) => t.method),
    withPath: proposed.size - pathless.length,
    historicOwner: [...proposed.values()].filter((t) => t.historicOwner).length,
    pathlessByReason: count(pathless, (t) => t.pathless),
    pathlessRate: proposed.size ? pathless.length / proposed.size : null,
    reviewReasons: count(traces.filter((t) => t.decision === 'review' || t.decision === 'held'), (t) => t.reason),
    classes: Object.fromEntries([...auditClasses([...traces, ...rejected])].map(([c, list]) => [c, list.length])),
  };
}
