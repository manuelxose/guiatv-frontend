/**
 * Phases 2D-2F/2D-2G: machine-evidence adjudication of identity traces. Pure functions over the
 * traces of read-only shadow runs (`trace-dump.js` output) and the TMDB lookups made for the check
 * (`tmdb-check.js`). Every candidate gets an assurance category and a decision, taken per proposed
 * identity: one contradicting airing group quarantines the whole entity.
 *
 * Provenance (2D-2G). Every evidence item names its class and its root, the origin of the
 * information. Items sharing a root count once. Where the information comes from in the chain
 * XMLTV → EPG sync → media catalogue → TMDB match → GuíaTV URL:
 *  - `epg_title`: the title hypothesis itself; keys, slugs, episode markers, the same title on other days;
 *  - `tmdb_guess`: the sync's TMDB search for that title (airing id, catalogue row). The sync also
 *    writes the TMDB year, overview and genre tags into the airing, and picks the movie or TV search
 *    from the XMLTV category, so the TMDB type agreeing with that category proves nothing;
 *  - `legacy_url`: a GuíaTV page already answering the path. Its owners are brand titles (EPG
 *    titles) and catalogue rows (TMDB guesses): ownership evidence, never identity proof;
 *  - `broadcaster_feed`: XMLTV category (`genre`, never written from TMDB), slot length, season markers, channel;
 *  - `tmdb_index:<work>`: the TMDB lookups made for this check (search with alternative titles, details);
 *  - `manual`: a stored row a named person verified.
 * Independent support means external metadata and broadcaster data that agree although neither was
 * derived from the other: TMDB lists exactly one work of the type under that title (alternative
 * titles included), at least one consistency check between its details and the broadcaster's data
 * passed (runtime vs slot, seasons vs markers, TMDB genres vs XMLTV category), and the kind follows
 * from those same sources. A unique search result alone is not proof, and title-only works can never
 * be independently supported.
 *
 * Assurance categories: `independently_supported` (the only one that is AUTO_ACCEPT),
 * `machine_supported` (consistent, but its support is all derived), `contradictory`, `insufficient`.
 * This is a machine-evidence status: `scoreReview` never reads it and the human write gate
 * (`score --verify`) is unchanged.
 */
import { createHash } from 'node:crypto';
import { parseEpgTitle, slugifyEntityTitle, titleIdentityKey } from '@/domain/services/contentIdentity';
import type { ContentKind } from '@/domain/services/contentIdentity';
import type { IdentityTrace } from './ContentIdentityIngestion';

export type EvidenceDecision = 'AUTO_ACCEPT' | 'AUTO_REJECT' | 'QUARANTINE';
export type AssuranceCategory = 'independently_supported' | 'machine_supported' | 'contradictory' | 'insufficient' | 'rejected_slot';
export type Provenance =
  | 'external_id'
  | 'external_metadata'
  | 'manual_identity'
  | 'historic_url'
  | 'broadcaster'
  | 'derived'
  | 'ai';

export interface EvidenceItem {
  source: string;
  claim: string;
  provenance: Provenance;
  /** Where the information originates; items sharing a root are one piece of evidence. */
  root: string;
  /** Counts toward independent support (external or manual roots only). */
  independent: boolean;
}

export interface EvidenceVerdict {
  candidateId: string;
  key: string;
  kind: ContentKind;
  title: string;
  identity?: string;
  path?: string | null;
  decision: EvidenceDecision;
  assurance: AssuranceCategory;
  /** What established the kind. `category` (series vs show from the broadcaster's category alone) is never independent. */
  kindBasis: 'tmdb_genres' | 'tmdb_runtime' | 'category' | 'none';
  support: EvidenceItem[];
  /** Evidence against the identity (any of its candidates); any one quarantines. */
  contradictions: string[];
  /** Machine evidence the identity lacks (2D-2F rules). */
  missing: string[];
  /** Independent evidence it lacks; with nothing else wrong it is `machine_supported`. */
  unverified: string[];
}

/** TMDB lookups made for the check (`tmdb-check.js`, format 2): search results, the bound work's details, alternative titles. */
export interface TmdbSearchCheck {
  v?: number;
  type: 'movie' | 'tv';
  id: number;
  query: string;
  results?: Array<{ id: number; title?: string; originalTitle?: string; year?: number; genreIds?: number[] }>;
  details?: { year?: number; runtime?: number; seasons?: number; genreIds?: number[]; alternativeTitles?: string[] };
  /** Alternative titles of other results of the same type, by TMDB id. */
  alternatives?: Record<string, string[]>;
  error?: string;
}

/** Title residue that may be an installment, an edition, a variant or a date rather than a work. */
const RESIDUE: Array<[string, RegExp]> = [
  ['trailing_number', /\s\d{1,4}$/u],
  ['parenthetical', /\([^)]*\)/u],
  ['spaced_separator', /\s[-–—:·]\s/u],
  ['date_in_title', /\b\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/iu],
  ['part_marker', /\b\d+\s*[ºª°]?\s*parte\b|\bparte\s+\d+\b|\b(primera|segunda|tercera|última)\s+parte\b/iu],
  // "Serie: Autopista hacia el cielo", "SERIE «EL VIRGINIANO»": a container word in front of the work.
  ['container_prefix', /^(serie|series|película|pel·lícula|cine|documental|programa)\s*[:«"“]/iu],
  // "JT 19h30", "Le 6h info": an edition named by its hour.
  ['time_of_day', /\b\d{1,2}\s?h(?:\s?\d{2})?\b/iu],
];
/**
 * Words of schedule slots and news editions in the feed languages. A title made only of these (and
 * digits or ordinals) names a slot, not a work: "Informativo mediodía", "Boletín informativo",
 * "Espacios comerciales", "Les Notícies Edició vespre". "Noticias Cuatro" keeps a name and passes.
 * ponytail: a word list, so a slot in an unlisted language or wording still passes; the upgrade is
 * a per-channel schedule-slot model (the same title in the same slot every day on one channel).
 */
const SLOT_WORDS = new Set(
  (
    'el la los las les lo l de del d en y i e a al con the of and le du des et ' +
    'informativo informativos informatiu informativa informatius noticias noticia notícies noticies noticiero novas berriak news newsroom ' +
    'journal actualidad actualitat boletin butlleti butlletins bulletin edicion edicio ed mediodia migdia manana mati matinal tarde ' +
    'vespre noche nit madrugada directo directe live servicios espacios espacio comerciales comercial publicidad teletienda videoclips ' +
    'musica cine pelicula serie series documental revista programa resumen avance avances tiempo meteo prevision deportes especial ' +
    'magazine magazin info informacio local regional internacional territorial central diario horas hora primera segunda tercera ' +
    'ultima ultimas hoy dia edition edizioa'
  ).split(' ')
);
const isSlotWord = (w: string) => SLOT_WORDS.has(w) || /^\d+$|^[ivx]+$/.test(w);
/** "noticias_cuatro_mediodia" is an edition of "noticias_cuatro" when that work is proposed too: the key of a proposed work plus slot words only. */
function editionOf(key: string, proposedKeys: ReadonlySet<string>): string | undefined {
  const words = key.split('_');
  for (let i = words.length - 1; i > 0; i--) {
    if (!words.slice(i).every(isSlotWord)) return undefined;
    if (proposedKeys.has(words.slice(0, i).join('_'))) return words.slice(0, i).join('_');
  }
  return undefined;
}
const isSlotWording = (title: string) => {
  const words = title.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const named = words.filter((w) => !isSlotWord(w));
  return words.some((w) => !/^\d+$/.test(w) && SLOT_WORDS.has(w) && w.length > 3) && !named.length;
};
/** Pathless reasons that mean another work, or an unbound TMDB work, answers the slug. */
const OWNERSHIP_DOUBT = new Set(['historic_conflict', 'historic_ambiguous', 'historic_unverified']);
/** A title-only TV work needs this many other days showing the same key under the same kind. */
export const MIN_OTHER_DAYS = 2;

/**
 * TMDB TV genres that tell a programme from a fiction series. Talk, News and Reality are programmes;
 * fiction and animation genres are series; Documentary and Family can be either.
 */
const TMDB_SHOW_GENRES = new Set([10763, 10764, 10767]);
const TMDB_SERIES_GENRES = new Set([10759, 16, 35, 80, 18, 9648, 10765, 10766, 10768, 37, 10762]);
/** XMLTV categories (after `normalizeCategory`) and the kind each one claims; others claim nothing. */
const BROADCASTER_KIND: Record<string, ContentKind> = {
  series: 'series', cine: 'movie', cortometrajes: 'movie', noticias: 'show', entretenimiento: 'show', magazine: 'show',
  deportes: 'show', música: 'show', musica: 'show', culture: 'show', 'cultural/educativo': 'show', religión: 'show',
  decoración: 'show', entrevistas: 'show', teletienda: 'show', moda: 'show', toros: 'show',
};
/** A film slot shorter than this share of its TMDB runtime is another work (or an excerpt). */
const MIN_SLOT_SHARE = 0.75;
/** Above this multiple of the runtime the slot says nothing about the film. */
const MAX_SLOT_MULTIPLE = 2.5;

const tmdbKey = (type: string, id: number) => `${type}:${id}`;
const isWork = (title: string) => ['work', 'uncertain'].includes(parseEpgTitle(title).resolutionState);
const item = (source: string, claim: string, provenance: Provenance, root: string): EvidenceItem => ({
  source, claim, provenance, root, independent: provenance === 'external_metadata' || provenance === 'external_id' || provenance === 'manual_identity',
});

/** TMDB works of the type whose title, original title or (when looked up) alternative title has `key`. */
export function exactTmdbWorks(check: TmdbSearchCheck, key: string): number[] {
  const same = (title?: string) => Boolean(title) && titleIdentityKey(title) === key;
  const alternatives = (id: number) => (id === check.id ? check.details?.alternativeTitles : check.alternatives?.[id]) ?? [];
  return [...new Set((check.results ?? []).filter((r) => same(r.title) || same(r.originalTitle) || alternatives(r.id).some(same)).map((r) => r.id))].sort((a, b) => a - b);
}

/** The kind TMDB's TV genres give: `show`, `series`, or null when they don't decide (none, both, documentary, family). */
export function tmdbTvKind(genreIds: readonly number[] = []): 'show' | 'series' | null {
  const show = genreIds.some((g) => TMDB_SHOW_GENRES.has(g));
  const series = genreIds.some((g) => TMDB_SERIES_GENRES.has(g));
  return show === series ? null : show ? 'show' : 'series';
}

/** The kinds the broadcaster's categories claim for a candidate (empty when none claims one). */
export function broadcasterKinds(genres: readonly string[] = []): ContentKind[] {
  return [...new Set(genres.map((g) => BROADCASTER_KIND[g.trim().toLowerCase()]).filter((k): k is ContentKind => Boolean(k)))].sort();
}

export function adjudicateEvidence(
  day: readonly IdentityTrace[],
  otherDays: ReadonlyArray<readonly IdentityTrace[]> = [],
  tmdbChecks: ReadonlyMap<string, TmdbSearchCheck> = new Map()
): EvidenceVerdict[] {
  // Cross-day: on how many other days each key was a known-kind candidate, under which kinds, bound to which TMDB works.
  const seen = new Map<string, Map<ContentKind, number>>();
  const tmdbSeen = new Map<string, Set<string>>();
  for (const traces of otherDays) {
    const kinds = new Map<string, Set<ContentKind>>();
    for (const t of traces) {
      if (t.decision === 'rejected' || t.kind === 'unknown') continue;
      kinds.set(t.key, (kinds.get(t.key) ?? new Set()).add(t.kind));
      if (t.tmdb.evidence === 'confirmed' && t.tmdb.ref) tmdbSeen.set(`${t.key}|${t.kind}`, (tmdbSeen.get(`${t.key}|${t.kind}`) ?? new Set()).add(tmdbKey(t.tmdb.ref.type, t.tmdb.ref.id)));
    }
    for (const [key, set] of kinds) {
      const days = seen.get(key) ?? new Map<ContentKind, number>();
      set.forEach((k) => days.set(k, (days.get(k) ?? 0) + 1));
      seen.set(key, days);
    }
  }
  const proposed = day.filter((t) => t.identity?.startsWith('new:') || t.decision === 'create');
  const owners = (of: (t: IdentityTrace) => string | null | undefined) => {
    const map = new Map<string, Set<string>>();
    for (const t of proposed) {
      const k = of(t);
      if (k) map.set(k, (map.get(k) ?? new Set()).add(t.identity ?? t.candidateId));
    }
    return map;
  };
  const proposedKeys = new Set(proposed.map((t) => t.key));
  const slugOwners = owners((t) => slugifyEntityTitle(t.title) ?? t.key);
  const pathOwners = owners((t) => t.path);

  const verdicts = day.map((t): EvidenceVerdict => {
    const verdict: EvidenceVerdict = {
      candidateId: t.candidateId, key: t.key, kind: t.kind, title: t.title, identity: t.identity, path: t.path,
      decision: 'QUARANTINE', assurance: 'insufficient', kindBasis: 'none', support: [], contradictions: [], missing: [], unverified: [],
    };
    const { support, contradictions, missing, unverified } = verdict;
    if (t.decision === 'rejected') {
      support.push(item('slot_rule', t.reason ?? 'excluded', 'derived', 'epg_title'));
      return { ...verdict, decision: 'AUTO_REJECT', assurance: 'rejected_slot' };
    }
    // A bind or match to an entity this run proposes is one more airing group of that entity.
    const inRun = (t.decision === 'matched' || t.decision === 'bind') && t.identity?.startsWith('new:');
    if (t.decision === 'matched' || t.decision === 'bind') {
      if (t.state === 'verified' && t.method === 'manual' && !inRun) support.push(item('stored_identity', `row ${t.rowId} verified by a person`, 'manual_identity', 'manual'));
      else if (!inRun) missing.push(`stored_${t.state ?? 'row'}`);
    } else if (t.decision !== 'create') {
      // Held out of matching by the run: a conflict is a contradiction, missing evidence is missing.
      (t.reason === 'cross_kind_conflict' || t.reason === 'tmdb_conflict' ? contradictions : missing).push(t.reason ?? t.decision);
      return verdict;
    }

    // Contradictions (2D-2F).
    if (t.tmdb.evidence === 'unconfirmed' || t.tmdb.evidence === 'mixed') contradictions.push(`tmdb_${t.tmdb.evidence}:${t.tmdb.ids.join(',')}`);
    if (t.crossKind) contradictions.push(`cross_kind:${t.crossKind.join('+')}`);
    if ((slugOwners.get(slugifyEntityTitle(t.title) ?? t.key)?.size ?? 0) > 1) contradictions.push('duplicate_slug');
    if (t.path && (pathOwners.get(t.path)?.size ?? 0) > 1) contradictions.push('path_collision');
    if (t.pathless && OWNERSHIP_DOUBT.has(t.pathless)) contradictions.push(`pathless_${t.pathless}`);
    // Any other missing path (unsupported slug, "9-1-1") is not identity doubt but the entity could never resolve.
    else if (!t.path && t.decision === 'create') missing.push(`pathless_${t.pathless ?? 'unknown'}`);
    if (t.pathRefused?.includes('historic_conflict')) contradictions.push('legacy_owner_conflict');
    if (!isWork(t.title)) contradictions.push(`title_${parseEpgTitle(t.title).resolutionState}`);
    const tmdb = t.tmdb.evidence === 'confirmed' ? t.tmdb.ref : undefined;
    const days = seen.get(t.key);
    const otherKinds = [...(days?.keys() ?? [])].filter((k) => k !== t.kind);
    if (otherKinds.length) contradictions.push(`kind_unstable:${otherKinds.sort().join('+')}`);
    const markers = Object.entries(t.titleEvidence ?? {}).filter(([e]) => e.startsWith('episode:'));
    if (markers.length) {
      support.push(item('episode_markers', markers.map(([e, n]) => `${e}=${n}`).join(' '), 'derived', 'epg_title'));
      if (t.kind === 'movie') contradictions.push('movie_with_episodes');
    }
    // The EPG year is the TMDB year on enriched airings: agreement proves nothing, a mismatch still contradicts.
    if (tmdb?.type === 'movie' && t.year && t.epgYears.some((y) => Math.abs(y - t.year!) > 1)) contradictions.push(`movie_year:${t.epgYears.join(',')}≠${t.year}`);
    const sameKindDays = days?.get(t.kind) ?? 0;
    if (sameKindDays) support.push(item('cross_day', `${t.kind} on ${sameKindDays} other day(s)`, 'derived', 'epg_title'));
    if (t.historicOwner) support.push(item('historic_url', `legacy owner of ${t.path}`, 'historic_url', 'legacy_url'));

    // Broadcaster kind claims (XMLTV category) against the run's kind.
    const claimed = broadcasterKinds(t.broadcaster?.genres);
    if (claimed.length > 1) contradictions.push(`broadcaster_kinds:${claimed.join('+')}`);
    // The run's kind can come from TMDB-written fields (overview, `tmdbKind`); the XMLTV category never does.
    if (claimed.length === 1 && claimed[0] !== t.kind) contradictions.push(`broadcaster_kind_${claimed[0]}_vs_${t.kind}`);

    if (tmdb) {
      const root = `tmdb_index:${tmdbKey(tmdb.type, tmdb.id)}`;
      support.push(item('tmdb_catalogue', `${tmdbKey(tmdb.type, tmdb.id)} catalogue title matches`, 'derived', 'tmdb_guess'));
      if (tmdb.type === 'movie' ? t.kind !== 'movie' : t.kind === 'movie') contradictions.push(`tmdb_type_${tmdb.type}_vs_${t.kind}`);
      const elsewhere = [...(tmdbSeen.get(`${t.key}|${t.kind}`) ?? [])].filter((k) => k !== tmdbKey(tmdb.type, tmdb.id));
      if (elsewhere.length) contradictions.push(`tmdb_id_unstable:${elsewhere.sort().join(',')}`);
      const check = tmdbChecks.get(tmdbKey(tmdb.type, tmdb.id));
      const exact = check && !check.error ? exactTmdbWorks(check, t.key) : [];
      if (!check || check.error) unverified.push(check ? 'tmdb_lookup_failed' : 'tmdb_lookup_missing');
      else if (!exact.includes(tmdb.id)) contradictions.push(`tmdb_not_exact:${exact.join(',') || 'none'}`);
      else if (exact.length > 1) unverified.push(`tmdb_homonyms:${exact.join(',')}`);
      else support.push(item('tmdb_unique_title', `only ${tmdb.type} titled "${check.query}" in TMDB (alternative titles included)`, 'external_metadata', root));
      const details = check && !check.error ? check.details : undefined;
      if (!details) unverified.push('tmdb_details_missing');
      const passed: string[] = [];
      if (details && tmdb.type === 'movie') {
        const slot = t.broadcaster?.minutes?.max;
        if (details.runtime && slot && slot < MIN_SLOT_SHARE * details.runtime) contradictions.push(`slot_shorter_than_runtime:${slot}m<${details.runtime}m`);
        else if (details.runtime && slot && slot <= MAX_SLOT_MULTIPLE * details.runtime) passed.push(`slot ${slot} min fits runtime ${details.runtime} min`);
        // The feed's own year (kept beside the TMDB one since EPG_YEAR_PROVENANCE): remakes and homonyms.
        const raw = t.broadcaster?.rawYears ?? [];
        if (details.year && raw.some((y) => Math.abs(y - details.year!) > 1)) contradictions.push(`raw_year_vs_tmdb:${raw.join(',')}≠${details.year}`);
        else if (details.year && raw.length) passed.push(`feed year ${raw.join(',')} matches TMDB ${details.year}`);
        if (passed.length) verdict.kindBasis = 'tmdb_runtime';
        else unverified.push('movie_without_independent_check');
      }
      if (details && tmdb.type === 'tv') {
        const season = t.broadcaster?.maxSeason;
        if (season && details.seasons && season > details.seasons + 1) contradictions.push(`season_beyond_tmdb:${season}>${details.seasons}`);
        else if (season && details.seasons && season <= details.seasons) passed.push(`EPG season ${season} ≤ TMDB seasons ${details.seasons}`);
        const kind = tmdbTvKind(details.genreIds);
        if (kind && kind !== t.kind) contradictions.push(`tmdb_genres_${kind}_vs_${t.kind}`);
        else if (kind) {
          passed.push(`TMDB genres say ${kind}`);
          verdict.kindBasis = 'tmdb_genres';
        } else unverified.push('tv_kind_unverified');
      }
      passed.forEach((claim) => support.push(item('consistency_check', claim, 'external_metadata', `${root}+broadcaster_feed`)));
    } else {
      if (t.kind !== 'unknown') verdict.kindBasis = 'category';
      // A TMDB title match settles residue ("Scream 2"); without one, residue is doubt.
      RESIDUE.filter(([, re]) => re.test(t.title)).forEach(([name]) => contradictions.push(`residue_${name}`));
      if (isSlotWording(t.title)) contradictions.push('residue_slot_wording');
      const base = editionOf(t.key, proposedKeys);
      if (base) contradictions.push(`edition_of:${base}`);
      unverified.push('title_only');
    }

    if (!inRun && t.decision === 'create') {
      if (t.kind === 'movie') {
        // A title-only film can't be told from a remake.
        if (!tmdb) missing.push('movie_without_tmdb');
      } else if (t.kind === 'series' || t.kind === 'show') {
        if (!tmdb) {
          if (!t.historicOwner) missing.push('title_only_without_legacy_url');
          if (sameKindDays < MIN_OTHER_DAYS) missing.push(`seen_on_${sameKindDays}_other_days`);
          // Same title on several channels: possibly different programmes (regional news, magazines).
          if ((t.channels?.length ?? 0) > 1) missing.push('title_only_several_channels');
        }
      } else missing.push(`kind_${t.kind}`);
    }
    return verdict;
  });

  // One decision per proposed identity, from the evidence of all its candidates.
  const groups = new Map<string, EvidenceVerdict[]>();
  verdicts.forEach((v) => v.decision !== 'AUTO_REJECT' && groups.set(v.identity ?? v.candidateId, [...(groups.get(v.identity ?? v.candidateId) ?? []), v]));
  for (const members of groups.values()) {
    const union = (pick: (v: EvidenceVerdict) => string[]) => [...new Set(members.flatMap(pick))];
    const contradictions = union((v) => v.contradictions);
    const missing = union((v) => v.missing);
    const unverified = union((v) => v.unverified);
    const roots = new Set(members.flatMap((v) => v.support.filter((s) => s.independent).map((s) => s.root)));
    const checked = [...roots].some((r) => r.endsWith('+broadcaster_feed'));
    const unique = [...roots].some((r) => r.startsWith('tmdb_index:') && !r.endsWith('+broadcaster_feed'));
    const manual = roots.has('manual');
    if (!manual && !(unique && checked) && !unverified.length) unverified.push('no_independent_agreement');
    const kindKnown = members.some((v) => v.kindBasis === 'tmdb_genres' || v.kindBasis === 'tmdb_runtime') || manual;
    if (!kindKnown && !unverified.length) unverified.push('kind_unverified');
    const assurance: AssuranceCategory = contradictions.length ? 'contradictory' : missing.length ? 'insufficient' : unverified.length ? 'machine_supported' : 'independently_supported';
    const decision: EvidenceDecision = assurance === 'independently_supported' ? 'AUTO_ACCEPT' : 'QUARANTINE';
    for (const v of members) Object.assign(v, { decision, assurance, contradictions, missing, unverified });
  }
  return verdicts;
}

const count = (list: readonly string[]) =>
  Object.fromEntries(Object.entries(list.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {})).sort(([a], [b]) => a.localeCompare(b)));

/**
 * Machine-evidence gates over the verdicts. `status: pass` means no known violation among the
 * accepted identities; it says nothing about human-reviewed precision, which stays unmeasured.
 * Counts are given at each level, so no rate mixes them: candidates (one per identity context),
 * distinct work keys, proposed entities (identities the run would create), and candidates the run
 * never proposed (unknown kind, uncertain title, held conflicts).
 */
export function evaluateEvidence(verdicts: readonly EvidenceVerdict[]) {
  const accepted = verdicts.filter((v) => v.decision === 'AUTO_ACCEPT');
  const identity = (v: EvidenceVerdict) => v.identity ?? v.candidateId;
  const by = (of: (v: EvidenceVerdict) => string | null | undefined) => {
    const map = new Map<string, Set<string>>();
    accepted.forEach((v) => of(v) && map.set(of(v)!, (map.get(of(v)!) ?? new Set()).add(identity(v))));
    return map;
  };
  const paths = by((v) => v.path);
  const keys = by((v) => v.key);
  const kindsOf = new Map<string, Set<ContentKind>>();
  accepted.forEach((v) => kindsOf.set(identity(v), (kindsOf.get(identity(v)) ?? new Set()).add(v.kind)));
  const kindsByKey = new Map<string, Set<ContentKind>>();
  accepted.forEach((v) => kindsByKey.set(v.key, (kindsByKey.get(v.key) ?? new Set()).add(v.kind)));
  const rootsOf = (v: EvidenceVerdict) => new Set(verdicts.filter((o) => identity(o) === identity(v)).flatMap((o) => o.support.filter((s) => s.independent).map((s) => s.root)));
  const violations = {
    canonicalOwnership: accepted.filter((v) => v.path && paths.get(v.path)!.size > 1).map((v) => v.candidateId),
    crossKindMerges: accepted.filter((v) => kindsOf.get(identity(v))!.size > 1 || (kindsByKey.get(v.key)!.size > 1 && keys.get(v.key)!.size > 1)).map((v) => v.candidateId),
    episodeAsWork: accepted.filter((v) => !isWork(v.title)).map((v) => v.candidateId),
    // Independence claimed from roots that are all derived (EPG title, TMDB guess, legacy URL).
    circularIndependence: accepted.filter((v) => ![...rootsOf(v)].some((r) => r.startsWith('tmdb_index:') || r === 'manual')).map((v) => v.candidateId),
    unsupportedTmdb: accepted.filter((v) => !v.support.some((s) => s.source === 'tmdb_unique_title') && !rootsOf(v).has('manual')).map((v) => v.candidateId),
    kindUnverified: accepted.filter((v) => v.kindBasis === 'category' || v.kindBasis === 'none').filter((v) => !rootsOf(v).has('manual')).map((v) => v.candidateId),
    acceptedPathless: accepted.filter((v) => !v.path).map((v) => v.candidateId),
    acceptedWithConflicts: accepted.filter((v) => v.contradictions.length || v.missing.length || v.unverified.length).map((v) => v.candidateId),
  };
  const identities = new Map<string, EvidenceVerdict>();
  verdicts.forEach((v) => v.decision !== 'AUTO_REJECT' && !identities.has(identity(v)) && identities.set(identity(v), v));
  const entities = [...identities.values()].filter((v) => v.identity?.startsWith('new:'));
  const unproposed = [...identities.values()].filter((v) => !v.identity?.startsWith('new:'));
  const acceptedEntities = entities.filter((v) => v.decision === 'AUTO_ACCEPT');
  const reasons = (list: EvidenceVerdict[], pick: (v: EvidenceVerdict) => string[]) =>
    count(list.flatMap((v) => pick(v).map((r) => r.split(':')[0]).filter((r, i, a) => a.indexOf(r) === i)));
  const pass = Object.values(violations).every((list) => !list.length);
  return {
    status: pass ? 'pass' : 'fail',
    meaning: 'machine evidence only: no known violation among auto-accepted identities. Not human-validated precision; the human write gate is separate.',
    levels: {
      candidates: verdicts.filter((v) => v.decision !== 'AUTO_REJECT').length,
      distinctWorkKeys: new Set(verdicts.filter((v) => v.decision !== 'AUTO_REJECT').map((v) => v.key)).size,
      proposedEntities: entities.length,
      candidatesNeverProposed: unproposed.length,
      rejectedSlotTitles: verdicts.filter((v) => v.decision === 'AUTO_REJECT').length,
    },
    proposedEntities: {
      byAssurance: count(entities.map((v) => v.assurance)),
      acceptedShare: entities.length ? acceptedEntities.length / entities.length : 0,
      acceptedByKind: count(acceptedEntities.map((v) => v.kind)),
      acceptedByKindBasis: count(acceptedEntities.map((v) => v.kindBasis)),
      acceptedPathless: acceptedEntities.filter((v) => !v.path).length,
    },
    candidatesNeverProposed: { byAssurance: count(unproposed.map((v) => v.assurance)), reasons: reasons(unproposed, (v) => [...v.contradictions, ...v.missing]) },
    // Per proposed entity, every reason once.
    reasons: {
      contradictions: reasons(entities, (v) => v.contradictions),
      missing: reasons(entities, (v) => v.missing),
      unverified: reasons(entities.filter((v) => v.assurance === 'machine_supported'), (v) => v.unverified),
    },
    violations,
    digest: createHash('sha256').update(JSON.stringify(verdicts)).digest('hex'),
  };
}
