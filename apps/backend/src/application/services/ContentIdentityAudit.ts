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
    if (t.decision === 'unresolved') add('unknown_kind', t);
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
export const LABEL_COLUMNS = ['reviewer', 'identity_ok', 'kind_ok', 'duplicate_of', 'tmdb_ok', 'path_ok', 'critical', 'notes'] as const;
const MACHINE_COLUMNS = [
  'strata', 'candidate_id', 'epg_title', 'spellings', 'normalized_title', 'kind', 'epg_years', 'identity_year', 'tmdb_id',
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
      epg_title: t.title,
      spellings: t.spellings.join(' | '),
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
}

/**
 * Scores a labelled review sheet. Only rows signed by a named person count (the same reviewer rule
 * as approvals); a row with machine output and no label is unreviewed, never correct by default.
 */
export function scoreReview(rows: readonly Record<string, string>[], gate: ScoreGate = { precision: 0.98, minLabelled: 300 }) {
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
  const created = traces.filter(isNew);
  const proposed = new Map(created.map((t) => [t.identity, t]));
  const pathless = [...proposed.values()].filter((t) => t.pathless);
  return {
    candidates: traces.length,
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
    classes: Object.fromEntries([...auditClasses(traces)].map(([c, list]) => [c, list.length])),
  };
}
