/**
 * Phase 3D: the auditable per-film answer to "may this entity page replace the legacy page at its URL, and is
 * it worth showing?". Pure: inputs are an entity record, the evidence-joined broadcasts and a snapshot of what
 * the legacy page offers; the output is a decision with its reasons. The thresholds are not here: the quality
 * assessment is `assessPublicationQuality` unchanged.
 *
 * Consolidation rules (per URL, never automatic):
 *   - a legacy page that is indexable now is never replaced (the read-time guard enforces the same rule continuously);
 *   - a legacy page that is not indexable may be replaced only if the entity page loses nothing it shows today;
 *   - the entity keeps the legacy canonical path, so there is one canonical URL per work.
 */
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import { assessPublicationQuality, type PublicationSignals } from './PublicationQuality';
import type { EnrichmentPlan } from '@/domain/services/entityEnrichment';
import type { BroadcastSelection } from './EntityBroadcastService';

/** What a crawler (or the public API) shows for the legacy page of a work. Counts, not text. */
export interface LegacySnapshot {
  path: string;
  tmdbId: number;
  title: string;
  measuredAt: string;
  status: number;
  robots: string | null;
  /** `measured`: the page's robots header; `predicted_from_airings`: `catalogRobotsPolicy` applied to the API payload (verified equal on every page measured both ways). */
  robotsBasis: 'measured' | 'predicted_from_airings';
  facts: { synopsisChars: number; castCount: number; hasDirector: boolean; hasPoster: boolean; hasBackdrop: boolean; upcomingAirings: number; releaseYear?: number };
}

export const legacyIndexable = (s: Pick<LegacySnapshot, 'status' | 'robots'>) => s.status === 200 && /\bindex\b/.test(s.robots ?? '') && !/noindex/.test(s.robots ?? '');

/** What the entity page itself shows, from the stored copy and the joined broadcasts. */
export interface EntityFacts { synopsisChars: number; castCount: number; hasDirector: boolean; hasPoster: boolean; hasBackdrop: boolean; broadcasts: number; genres: number; hasRuntime: boolean; hasOriginalTitle: boolean }

export function entityFacts(entity: ContentEntityRecord | null, broadcasts: number): EntityFacts {
  const m = entity?.metadata ?? {};
  return {
    synopsisChars: m.synopsis?.value.trim().length ?? 0,
    castCount: m.credits?.value.cast.length ?? 0,
    hasDirector: Boolean(m.credits?.value.directors.length),
    hasPoster: Boolean(m.images?.value.posterPath),
    hasBackdrop: Boolean(m.images?.value.backdropPath),
    broadcasts,
    genres: m.genres?.value.length ?? 0,
    hasRuntime: Boolean(m.runtimeMinutes?.value),
    hasOriginalTitle: Boolean(entity?.originalTitle),
  };
}

export interface ConsolidationDecision {
  decision: 'serve_entity' | 'keep_legacy';
  reasons: string[];
  /** What the legacy page shows today that the entity page would not. */
  regressions: string[];
  /** What the entity page adds. */
  gains: string[];
}

/** The legacy page shows at most 10 cast members; the entity keeps 10. */
const castOf = (n: number) => Math.min(n, 10);

export function decideConsolidation(legacy: LegacySnapshot | undefined, entityPath: string | undefined, facts: EntityFacts): ConsolidationDecision {
  const regressions: string[] = [];
  if (!legacy) return { decision: 'keep_legacy', reasons: ['legacy_unmeasured'], regressions, gains: [] };
  if (legacy.status !== 200) return { decision: 'serve_entity', reasons: ['no_legacy_page'], regressions, gains: [] };
  const l = legacy.facts;
  if (facts.synopsisChars < l.synopsisChars) regressions.push(`synopsis ${facts.synopsisChars} < ${l.synopsisChars} chars`);
  if (facts.castCount < castOf(l.castCount)) regressions.push(`cast ${facts.castCount} < ${castOf(l.castCount)}`);
  if (l.hasDirector && !facts.hasDirector) regressions.push('director');
  if (l.hasPoster && !facts.hasPoster) regressions.push('poster');
  if (l.hasBackdrop && !facts.hasBackdrop) regressions.push('backdrop');
  if (l.upcomingAirings > 0 && facts.broadcasts === 0) regressions.push(`broadcasts 0 < ${l.upcomingAirings}`);
  const gains = [
    ...(facts.hasRuntime ? ['runtime'] : []), ...(facts.genres ? ['genres'] : []), ...(facts.hasOriginalTitle ? ['original_title'] : []),
    ...(facts.broadcasts > 0 ? ['evidence_joined_broadcasts', 'channel_links'] : []), 'source_attribution',
  ];
  const reasons: string[] = [];
  if (legacyIndexable(legacy)) reasons.push('legacy_indexable_now');
  if (entityPath !== legacy.path) reasons.push('canonical_path_differs');
  if (regressions.length) reasons.push('content_regression');
  return reasons.length
    ? { decision: 'keep_legacy', reasons, regressions, gains }
    : { decision: 'serve_entity', reasons: ['legacy_noindex', 'no_content_regression', 'same_canonical_path'], regressions, gains };
}

export interface FilmReportInput {
  candidateId: string;
  title: string;
  canonicalPath: string;
  entity: ContentEntityRecord | null;
  /** The enrichment plan/outcome for this entity (a dry run or the run just made). */
  enrichment?: { outcome: string; reasons?: string[]; warnings?: string[] };
  selection?: BroadcastSelection;
  legacy?: LegacySnapshot;
  /** Measured SSR renders of this entity page (not available offline: stays unknown). */
  ssr?: { ok: number; total: number };
  registryClean?: boolean;
}

/** Criteria that must not fail for a noindex page to be worth showing (identity is attested, never person-verified). */
const SHOW_NOT_FAILING = ['title_accurate', 'canonical_consistent', 'no_duplicate_entity', 'metadata_complete', 'description_reliable', 'source_attributed'];
/**
 * Criteria that must positively pass: a page that is only the TMDB text and facts adds nothing over the legacy page
 * (a long TMDB synopsis alone is not original value), so the evidence-joined schedule is what earns the page its place.
 */
const SHOW_PASSING = ['original_value', 'user_useful'];

export function filmReport(i: FilmReportInput) {
  const e = i.entity;
  const broadcasts = i.selection?.items.length;
  const facts = entityFacts(e, broadcasts ?? 0);
  const m = e?.metadata;
  const signals: PublicationSignals = {
    verified: false,
    aiAttested: Boolean(e?.certification),
    kind: e?.kind ?? 'movie',
    title: e?.title ?? i.title,
    originalTitle: e?.originalTitle,
    year: e?.year,
    // EPG_YEAR_PROVENANCE is off in production: the stored year is TMDB's own, which the criterion treats as unknown.
    yearProvenance: 'tmdb_overwrite',
    synopsis: m?.synopsis?.value,
    synopsisSource: m?.synopsis?.source === 'tmdb' || m?.synopsis?.source === 'manual' || m?.synopsis?.source === 'epg' ? m.synopsis.source : undefined,
    genres: m?.genres?.value,
    runtimeMinutes: m?.runtimeMinutes?.value,
    upcomingAirings: broadcasts,
    attributed: m?.enrichment ? true : undefined,
    legacyPage: i.legacy ? (i.legacy.status === 200 ? 'live_duplicate' : 'none') : 'unknown',
    registryClean: i.registryClean,
    ssr: i.ssr,
  };
  const quality = assessPublicationQuality(signals);
  const consolidation = decideConsolidation(i.legacy, e?.canonicalPath, facts);
  const failing = quality.criteria.filter((c) => c.status === 'fail').map((c) => c.id);
  const legacyBlockers = consolidation.decision === 'keep_legacy' ? [`consolidation:${consolidation.reasons.join('+')}`] : [];
  const qualityBlockers = [
    ...(e ? [] : ['entity_missing']),
    ...SHOW_NOT_FAILING.filter((id) => failing.includes(id)),
    ...SHOW_PASSING.filter((id) => quality.criteria.find((c) => c.id === id)?.status !== 'pass'),
    ...(quality.adsenseRisk === 'high' ? ['adsense_risk_high'] : []),
  ];
  const showBlockers = [...legacyBlockers, ...qualityBlockers];
  return {
    candidateId: i.candidateId,
    title: i.title,
    canonicalPath: i.canonicalPath,
    entityId: e?.entityId ?? null,
    enrichment: i.enrichment ?? null,
    facts,
    broadcasts: i.selection ? {
      count: broadcasts, channels: [...new Set(i.selection.items.map((b) => b.channel.name))], next: i.selection.items[0]?.startLocal ?? null,
      evidence: i.selection.evidence, rejected: i.selection.rejected,
    } : null,
    legacy: i.legacy ? { status: i.legacy.status, robots: i.legacy.robots, robotsBasis: i.legacy.robotsBasis, indexable: legacyIndexable(i.legacy), measuredAt: i.legacy.measuredAt } : null,
    consolidation,
    quality: { tier: quality.tier, adsenseRisk: quality.adsenseRisk, indexable: quality.indexable, criteria: Object.fromEntries(quality.criteria.map((c) => [c.id, c.status])), blockers: quality.blockers },
    /**
     * `show_noindex`: the page may answer at its URL while the read-time guard allows it. `hold_legacy`: the legacy page stays
     * (indexable now, content regression, other canonical, or unmeasured). `hold_quality`: the legacy page could be replaced
     * but the entity page is not worth showing. Never `index`: that is an owner decision with its own evidence.
     */
    verdict: (legacyBlockers.length ? 'hold_legacy' : qualityBlockers.length ? 'hold_quality' : 'show_noindex') as 'show_noindex' | 'hold_legacy' | 'hold_quality',
    verdictBlockers: showBlockers,
    indexingBlockers: quality.blockers.map((b) => b.split(':')[0]),
  };
}

export type FilmReport = ReturnType<typeof filmReport>;

export function summarizeFilmReports(reports: FilmReport[]) {
  const count = (pick: (r: FilmReport) => string) => reports.reduce<Record<string, number>>((o, r) => ({ ...o, [pick(r)]: (o[pick(r)] ?? 0) + 1 }), {});
  return {
    films: reports.length,
    verdict: count((r) => r.verdict),
    consolidation: count((r) => r.consolidation.decision),
    adsenseRisk: count((r) => r.quality.adsenseRisk),
    tier: count((r) => r.quality.tier),
    indexable: reports.filter((r) => r.quality.indexable).length,
    enrichment: count((r) => r.enrichment?.outcome ?? 'not_run'),
  };
}

export function renderFilmReportMarkdown(reports: FilmReport[], title: string): string {
  const cell = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|');
  const rows = reports.map((r, i) => `| ${i + 1} | ${cell(r.title)} | \`${r.canonicalPath}\` | ${r.enrichment?.outcome ?? '—'} | ${r.facts.synopsisChars} | ${r.facts.genres} | ${r.facts.hasRuntime ? 'yes' : 'no'} | ${r.broadcasts?.count ?? '—'} | ${r.legacy ? (r.legacy.indexable ? 'index' : 'noindex') : '?'} | ${r.consolidation.decision} | ${r.quality.adsenseRisk} | ${r.verdict} | ${cell(r.verdictBlockers.join(', ') || '—')} |`);
  return [
    `# ${title}`, '',
    '| # | Film | Path | Enrichment | Synopsis chars | Genres | Runtime | Broadcasts | Legacy | Consolidation | AdSense risk | Verdict | Verdict blockers |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|', ...rows, '',
  ].join('\n');
}

export type { EnrichmentPlan };
