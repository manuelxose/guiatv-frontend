/**
 * Phase 3C: the bounded write-canary manifest. Pure and offline: replay verdicts + traces + the AI
 * review ledger + (optionally) public-page measurements in, one auditable batch of at most 25 identities out.
 *
 * Three questions are kept apart, per identity:
 *   technical   may it be certified and shown noindex?  (evidence, AI review, canonical ownership)
 *   content     is the page worth showing?              (measured metadata, synopsis, programme context)
 *   indexing    may Google index it?                    (never from this tool: needs a person, year provenance, links…)
 *
 * Nothing is invented: a field nobody measured is `unknown`, which keeps the identity out of the
 * `ready` set. The manifest is the document the owner approves; its digest is what the signed
 * authorisation binds to, and its admit lines are the only input a write run is given.
 */
import { canonicalJson, CERTIFICATION_HARD_CAP, OwnerAuthorizationPayload, sha256 } from '@/domain/services/contentCertification';
import { ContentKind, isGenericContentTitle, parseEpgTitle } from '@/domain/services/contentIdentity';
import { reviewOfRow, ReviewEvidence, verdictDigest } from './ContentCertification';
import { evaluateEvidence, EvidenceVerdict } from './ContentIdentityEvidence';
import type { TmdbSearchCheck } from './ContentIdentityEvidence';
import type { IdentityTrace } from './ContentIdentityIngestion';
import { assessPublicationQuality } from './PublicationQuality';

export const MANIFEST_VERSION = 1;

export interface DayInput { day: string; verdicts: EvidenceVerdict[]; traces: IdentityTrace[] }

/** What a crawler sees today at the legacy URL of the work (numbers and short labels only; no synopsis text is kept). */
export interface LegacyProbe {
  candidateId: string;
  url: string;
  status: number;
  robots: string | null;
  descriptionChars: number;
  year?: number;
  measuredAt: string;
}

export interface ManifestEntity {
  rank: number;
  candidateId: string;
  identity: string;
  title: string;
  kind: ContentKind;
  year?: number;
  tmdb: { type: 'movie' | 'tv'; id: number };
  canonicalPath: string;
  verdictSha256: string;
  evidence: { daysAccepted: string[]; independentRoots: number; sources: string[] };
  review: { reviewers: string[]; decisionHashes: string[] };
  legacy: { url: string; status: number | null; robots: string | null; indexableToday: boolean | null };
  readiness: {
    technical: 'eligible';
    content: 'ready' | 'needs_enrichment' | 'unmeasured';
    needsEnrichment: string[];
    /** Why Google indexing is not on the table yet (always non-empty from this tool). */
    indexingBlockers: string[];
    adsenseRisk: string;
    upcomingAirings: number;
  };
}

export interface CanaryManifest {
  version: typeof MANIFEST_VERSION;
  kind: 'phase-3c-write-canary';
  generatedAt: string;
  contract: string;
  reviewBasis: 'ai';
  ceiling: number;
  evidenceDays: string[];
  /** The latest day with an accepted verdict, and when the evidence stops being fresh enough to execute. */
  evidenceDay: string;
  freshUntil: string;
  review: { ledgerHeadHash: string; sheetSha256: string; gate: ReviewEvidence['gate'] };
  probes: { count: number; sha256: string | null };
  pool: { eligible: number; excluded: Record<string, number> };
  entities: ManifestEntity[];
  /** Eligible on evidence but not selected, with what each still needs. */
  notSelected: Array<{ candidateId: string; title: string; reasons: string[] }>;
  /** Facts the owner must weigh before approving; never hidden in the entities. */
  warnings: string[];
  digest: string;
  admitSha256: string;
}

const WARNINGS = [
  'entity_metadata_empty_at_admission: admission stores title, year, TMDB id and path only; a public canary page would show title and year until a sourced metadata copy exists, so "content ready" means the facts exist upstream (catalogue, TMDB), not on the entity',
  'entity_page_answers_at_the_legacy_url: a served entity page replaces the legacy page at the same URL; entries marked indexableToday=true would lose a rich indexable page for a noindex one',
  'year_provenance_unmeasured: EPG_YEAR_PROVENANCE is off, so no year is independently confirmed; this blocks indexing, not the noindex canary',
  'review_basis_ai: every label behind the batch is an owner-authorised AI review; nothing here is human-validated precision',
];

const dayOf = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(now).replace(/-/g, '');
const count = (m: Record<string, number>, k: string) => (m[k] = (m[k] ?? 0) + 1);

export interface PoolItem {
  verdict: EvidenceVerdict;
  days: string[];
  tmdb: { type: 'movie' | 'tv'; id: number };
  year?: number;
  review: ReturnType<typeof reviewOfRow>;
}

/** Every accepted identity that passes the evidence, ledger, ownership and title rules; the rest, counted by first reason. */
export function eligiblePool(days: DayInput[], review: ReviewEvidence, kinds: readonly ContentKind[] = ['movie']) {
  const excluded: Record<string, number> = {};
  const all = days.flatMap((d) => d.verdicts.map((v) => ({ v, day: d.day })));
  const accepted = all.filter((x) => x.v.decision === 'AUTO_ACCEPT');
  const violations = evaluateEvidence(all.map((x) => x.v)).violations as Record<string, string[]>;
  const violating = new Set(Object.values(violations).flat());
  const idsByPath = new Map<string, Set<string>>();
  for (const { v } of all) if (v.path && v.decision !== 'AUTO_REJECT') idsByPath.set(v.path, (idsByPath.get(v.path) ?? new Set()).add(v.identity ?? v.candidateId));
  const byCandidate = new Map<string, { v: EvidenceVerdict; days: string[] }>();
  for (const { v, day } of accepted) {
    const cur = byCandidate.get(v.candidateId);
    if (!cur) byCandidate.set(v.candidateId, { v, days: [day] });
    else cur.days.push(day);
  }
  const titleYear = new Map<string, Set<string>>();
  for (const { v } of byCandidate.values()) {
    const id = /\|(\w+):(\d+)\|/.exec(v.candidateId);
    const k = `${v.key}|${v.candidateId.split('|').pop()}`;
    if (id) titleYear.set(k, (titleYear.get(k) ?? new Set()).add(`${id[1]}:${id[2]}`));
  }
  const pool: PoolItem[] = [];
  for (const { v, days: seen } of [...byCandidate.values()].sort((a, b) => a.v.candidateId.localeCompare(b.v.candidateId))) {
    const m = /^(.+)\|(movie|series|show)\|(movie|tv):(\d+)\|(\d{4})?$/.exec(v.candidateId);
    const reject = (reason: string) => { count(excluded, reason); };
    if (!kinds.includes(v.kind)) { reject(`kind_${v.kind}`); continue; }
    if (!m || !v.identity?.startsWith('new:') || !v.path) { reject('no_tmdb_identity_or_path'); continue; }
    if (violating.has(v.candidateId)) { reject('evidence_gate_violation'); continue; }
    if ((idsByPath.get(v.path)?.size ?? 0) > 1) { reject('path_contested'); continue; }
    if (isGenericContentTitle(v.title) || parseEpgTitle(v.title).resolutionState !== 'work') { reject('title_not_a_work'); continue; }
    if ((titleYear.get(`${v.key}|${m[5] ?? ''}`)?.size ?? 0) > 1) { reject('duplicate_title_year'); continue; }
    const row = reviewOfRow(review, v.candidateId);
    if (!review.gate.pass || review.gate.basis !== 'ai') { reject('review_gate_failed'); continue; }
    if (row.problems.length) { reject(row.problems[0]); continue; }
    pool.push({ verdict: v, days: seen.sort(), tmdb: { type: m[3] as 'movie' | 'tv', id: Number(m[4]) }, year: m[5] ? Number(m[5]) : undefined, review: row });
  }
  return { pool, excluded };
}

/** TMDB facts about the bound work (runtime, genres): upstream data the catalogue can supply, not text we wrote. */
export type TmdbFacts = ReadonlyMap<string, NonNullable<TmdbSearchCheck['details']>>;

function assess(item: PoolItem, probe: LegacyProbe | undefined, upcoming: number, facts?: NonNullable<TmdbSearchCheck['details']>) {
  const q = assessPublicationQuality({
    verified: false, aiAttested: true, kind: item.verdict.kind, title: item.verdict.title, year: item.year,
    // The stored year is TMDB's own until EPG_YEAR_PROVENANCE has run: same source as the match, so never independent.
    yearProvenance: 'tmdb_overwrite',
    synopsisChars: probe?.descriptionChars, genres: facts?.genreIds?.map(String), runtimeMinutes: facts?.runtime, upcomingAirings: upcoming,
    registryClean: true, legacyPage: probe ? (probe.status === 200 ? 'live_duplicate' : 'none') : 'unknown',
  });
  const status = (id: string) => q.criteria.find((c) => c.id === id)!.status;
  const needs: string[] = [];
  if (!probe) needs.push('quality_unmeasured');
  else {
    if (status('description_reliable') === 'fail') needs.push('synopsis_short_or_missing');
    if (status('metadata_complete') === 'fail') needs.push(`metadata_${q.criteria.find((c) => c.id === 'metadata_complete')!.detail.replace('missing ', '').replace(/, /g, '+')}`);
    if (status('adsense_risk') === 'fail') needs.push('adsense_risk_high');
  }
  const content = !probe ? 'unmeasured' as const : needs.length ? 'needs_enrichment' as const : 'ready' as const;
  return { q, needs, content };
}

export interface BuildOptions {
  days: DayInput[];
  review: ReviewEvidence;
  probes?: LegacyProbe[];
  /** TMDB checks of the replay days (`tmdb-checks-<day>.json`), for runtime and genres. */
  tmdbChecks?: TmdbSearchCheck[];
  size?: number;
  now: Date;
  kinds?: readonly ContentKind[];
  contract?: string;
  /**
   * The entity page answers at the legacy URL, so a canary on a page Google can index today would swap a rich
   * indexable page for a bare noindex one. Excluded unless the owner opts in.
   */
  allowIndexedLegacy?: boolean;
  /** Evidence older than this many days is refused at execution (the owner re-runs the replay). */
  maxEvidenceAgeDays?: number;
}

/** The admit file: the exact verdict lines of the approved batch, in manifest order. A write run is given this file and nothing else. */
export const admitLines = (entities: readonly ManifestEntity[], verdicts: ReadonlyMap<string, EvidenceVerdict>) =>
  entities.map((e) => JSON.stringify(verdicts.get(e.candidateId))).join('\n') + '\n';

export const manifestDigest = (m: Pick<CanaryManifest, 'ceiling' | 'entities' | 'review'>) =>
  sha256(canonicalJson({ v: MANIFEST_VERSION, ceiling: m.ceiling, ledgerHeadHash: m.review.ledgerHeadHash, items: m.entities.map((e) => ({ candidateId: e.candidateId, verdictSha256: e.verdictSha256, canonicalPath: e.canonicalPath, tmdb: e.tmdb })) }));

export function buildCanaryManifest(o: BuildOptions): { manifest: CanaryManifest; verdicts: Map<string, EvidenceVerdict>; poolItems: PoolItem[] } {
  const size = Math.min(o.size ?? CERTIFICATION_HARD_CAP, CERTIFICATION_HARD_CAP);
  const { pool, excluded } = eligiblePool(o.days, o.review, o.kinds);
  const today = dayOf(o.now);
  const probes = new Map((o.probes ?? []).map((p) => [p.candidateId, p] as const));
  const facts: TmdbFacts = new Map((o.tmdbChecks ?? []).filter((c) => c.details).map((c) => [`${c.type}:${c.id}`, c.details!] as const));
  const upcomingOf = (id: string) => o.days.filter((d) => d.day > today).reduce((n, d) => n + (d.traces.find((t) => t.candidateId === id)?.airings ?? 0), 0);
  const scored = pool.map((item) => {
    const probe = probes.get(item.verdict.candidateId);
    const upcoming = upcomingOf(item.verdict.candidateId);
    return { item, probe, upcoming, ...assess(item, probe, upcoming, facts.get(`${item.tmdb.type}:${item.tmdb.id}`)), roots: new Set(item.verdict.support.filter((s) => s.independent).map((s) => s.root)).size };
  });
  const impact = (s: typeof scored[number]) => s.probe && s.probe.status === 200 && /\bindex\b/.test(s.probe.robots ?? '') && !/noindex/.test(s.probe.robots ?? '');
  const eligible = (s: typeof scored[number]) => s.content === 'ready' && (o.allowIndexedLegacy || !impact(s));
  const rank = (a: typeof scored[number], b: typeof scored[number]) =>
    Number(!eligible(a)) - Number(!eligible(b)) ||
    b.item.days.length - a.item.days.length ||
    b.roots - a.roots ||
    b.upcoming - a.upcoming ||
    (b.probe?.descriptionChars ?? 0) - (a.probe?.descriptionChars ?? 0) ||
    a.item.verdict.candidateId.localeCompare(b.item.verdict.candidateId);
  scored.sort(rank);
  const chosen = scored.filter(eligible).slice(0, size);
  const evidenceDay = o.days.map((d) => d.day).sort().pop() ?? '';
  // Replays include future schedule days; the evidence was produced no later than now.
  const anchor = evidenceDay > today ? today : evidenceDay;
  const evidenceStart = new Date(`${anchor.slice(0, 4)}-${anchor.slice(4, 6)}-${anchor.slice(6, 8)}T00:00:00Z`);
  const verdicts = new Map(chosen.map((s) => [s.item.verdict.candidateId, s.item.verdict] as const));
  const entities: ManifestEntity[] = chosen.map((s, i) => ({
    rank: i + 1, candidateId: s.item.verdict.candidateId, identity: s.item.verdict.identity!, title: s.item.verdict.title, kind: s.item.verdict.kind, ...(s.item.year ? { year: s.item.year } : {}),
    tmdb: s.item.tmdb, canonicalPath: s.item.verdict.path!, verdictSha256: verdictDigest(s.item.verdict),
    evidence: { daysAccepted: s.item.days, independentRoots: s.roots, sources: [...new Set(s.item.verdict.support.map((x) => x.source))].sort() },
    review: { reviewers: s.item.review.reviewers.map((r) => `${r.name} (${r.role}, ${r.kind})`), decisionHashes: s.item.review.hashes },
    legacy: { url: s.probe?.url ?? s.item.verdict.path!, status: s.probe?.status ?? null, robots: s.probe?.robots ?? null, indexableToday: s.probe ? s.probe.status === 200 && /\bindex\b/.test(s.probe.robots ?? '') && !/noindex/.test(s.probe.robots ?? '') : null },
    readiness: {
      technical: 'eligible', content: s.content, needsEnrichment: s.needs,
      indexingBlockers: s.q.criteria.filter((c) => c.status !== 'pass').map((c) => c.id),
      adsenseRisk: s.q.adsenseRisk, upcomingAirings: s.upcoming,
    },
  }));
  const partial = { ceiling: size, entities, review: { ledgerHeadHash: o.review.ledgerHeadHash, sheetSha256: o.review.sheetSha256, gate: o.review.gate } };
  const manifest: CanaryManifest = {
    version: MANIFEST_VERSION, kind: 'phase-3c-write-canary', generatedAt: o.now.toISOString(), contract: o.contract ?? 'PHASE-3-ENTRY-CONTRACT v1.4', reviewBasis: 'ai', ...partial,
    evidenceDays: o.days.map((d) => d.day).sort(), evidenceDay,
    freshUntil: new Date(evidenceStart.getTime() + ((o.maxEvidenceAgeDays ?? 3) + 1) * 86_400_000).toISOString(),
    probes: { count: probes.size, sha256: probes.size ? sha256(canonicalJson([...probes.values()].sort((a, b) => a.candidateId.localeCompare(b.candidateId)))) : null },
    pool: { eligible: pool.length, excluded },
    notSelected: scored.filter((s) => !verdicts.has(s.item.verdict.candidateId)).map((s) => ({
      candidateId: s.item.verdict.candidateId, title: s.item.verdict.title,
      reasons: s.content !== 'ready' ? s.needs : eligible(s) ? ['beyond_ceiling'] : ['replaces_indexed_legacy_page'],
    })),
    warnings: WARNINGS, digest: '', admitSha256: '',
  };
  manifest.digest = manifestDigest(manifest);
  manifest.admitSha256 = sha256(admitLines(entities, verdicts));
  return { manifest, verdicts, poolItems: pool };
}

/** The grant the owner would sign for exactly this manifest. Unsigned: only the owner's key can make it valid. */
export function authorizationTemplate(m: CanaryManifest, o: { owner: string; now: Date; executeDays: number; validDays: number; statement: string; id: string }): OwnerAuthorizationPayload {
  return {
    schema: 1, authorizationId: o.id, owner: o.owner, scope: 'certify', issuedAt: o.now.toISOString(),
    executeBy: new Date(o.now.getTime() + o.executeDays * 86_400_000).toISOString(), validDays: o.validDays,
    batch: { manifestDigest: m.digest, max: m.ceiling, items: m.entities.map((e) => ({ candidateId: e.candidateId, verdictSha256: e.verdictSha256 })) },
    statement: o.statement,
  };
}

/** Why a manifest must not be executed now (stale evidence, a changed digest, an over-ceiling batch, a failed review gate). */
export function manifestProblems(m: CanaryManifest, now: Date): string[] {
  const out: string[] = [];
  if (m.version !== MANIFEST_VERSION || m.kind !== 'phase-3c-write-canary') out.push('manifest_format');
  if (m.digest !== manifestDigest(m)) out.push('manifest_digest');
  if (!m.entities.length) out.push('manifest_empty');
  if (m.entities.length > Math.min(m.ceiling, CERTIFICATION_HARD_CAP)) out.push('manifest_over_ceiling');
  if (new Set(m.entities.map((e) => e.canonicalPath)).size !== m.entities.length || new Set(m.entities.map((e) => `${e.tmdb.type}:${e.tmdb.id}`)).size !== m.entities.length) out.push('manifest_duplicate_entry');
  if (now.getTime() > Date.parse(m.freshUntil)) out.push('evidence_stale');
  if (m.reviewBasis !== 'ai' || !m.review.gate.pass) out.push('review_gate_failed');
  if (m.entities.some((e) => e.readiness.content !== 'ready')) out.push('content_not_ready');
  return out;
}
