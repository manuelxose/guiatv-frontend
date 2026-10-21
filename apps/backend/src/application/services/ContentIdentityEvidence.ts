/**
 * Phase 2D-2F: machine-evidence adjudication of identity traces. Pure functions over the traces of
 * read-only shadow runs (`trace-dump.js` output): every candidate of a day becomes AUTO_ACCEPT,
 * AUTO_REJECT or QUARANTINE, with the evidence trail that decided it. The decision is taken per
 * proposed identity: one contradicting airing group quarantines the whole entity.
 *
 * Evidence counts as independent only when the run's own match did not produce it:
 *  - a TMDB search made for this check, in which the bound work is the only one of its type whose
 *    title or original title has the candidate's key (homonyms and remakes stay quarantined);
 *  - a legacy GuíaTV URL already answering the planned path for the same title;
 *  - a stored verified title-key row (manual or exact TMDB).
 * Not independent, so never sufficient: the catalogue row confirming the airing's TMDB id (it is
 * that match's own result), the EPG year on an enriched airing (the EPG sync overwrites it with the
 * TMDB year), the same rules repeated on other days, and episode markers. Any contradiction
 * quarantines.
 *
 * This is a machine-evidence status. It is not a label, `scoreReview` never reads it, and it does
 * not open the human write gate (`score --verify`).
 */
import { createHash } from 'node:crypto';
import { parseEpgTitle, slugifyEntityTitle, titleIdentityKey } from '@/domain/services/contentIdentity';
import type { ContentKind } from '@/domain/services/contentIdentity';
import type { IdentityTrace } from './ContentIdentityIngestion';

export type EvidenceDecision = 'AUTO_ACCEPT' | 'AUTO_REJECT' | 'QUARANTINE';

export interface EvidenceItem {
  source: 'tmdb_search' | 'tmdb_catalogue' | 'historic_url' | 'stored_identity' | 'cross_day' | 'episode_markers' | 'slot_rule';
  claim: string;
  /** From data the run's own match did not produce. */
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
  /** What established the kind: series vs show is the broadcaster category unless TMDB says film. */
  kindBasis: 'tmdb_type' | 'category' | 'none';
  support: EvidenceItem[];
  /** Evidence against the identity (any of its candidates); any one quarantines. */
  contradictions: string[];
  /** Evidence an acceptance needs and the identity lacks. */
  missing: string[];
}

/** One TMDB search made for the check (`tmdb-check.js`): raw results, or the error that stopped it. */
export interface TmdbSearchCheck {
  type: 'movie' | 'tv';
  id: number;
  query: string;
  results?: Array<{ id: number; title?: string; originalTitle?: string; year?: number }>;
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

const tmdbKey = (type: string, id: number) => `${type}:${id}`;
const isWork = (title: string) => ['work', 'uncertain'].includes(parseEpgTitle(title).resolutionState);

/** TMDB works of the type whose title or original title has `key`, from the check's results. */
export function exactTmdbWorks(check: TmdbSearchCheck, key: string): number[] {
  const same = (title?: string) => Boolean(title) && titleIdentityKey(title) === key;
  return [...new Set((check.results ?? []).filter((r) => same(r.title) || same(r.originalTitle)).map((r) => r.id))].sort((a, b) => a - b);
}

export function adjudicateEvidence(
  day: readonly IdentityTrace[],
  otherDays: ReadonlyArray<readonly IdentityTrace[]> = [],
  tmdbChecks: ReadonlyMap<string, TmdbSearchCheck> = new Map()
): EvidenceVerdict[] {
  // Cross-day: on how many other days each key was a known-kind candidate, and under which kinds.
  const seen = new Map<string, Map<ContentKind, number>>();
  for (const traces of otherDays) {
    const kinds = new Map<string, Set<ContentKind>>();
    for (const t of traces) if (t.decision !== 'rejected' && t.kind !== 'unknown') kinds.set(t.key, (kinds.get(t.key) ?? new Set()).add(t.kind));
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
      decision: 'QUARANTINE', kindBasis: 'none', support: [], contradictions: [], missing: [],
    };
    const { support, contradictions, missing } = verdict;
    if (t.decision === 'rejected') {
      support.push({ source: 'slot_rule', claim: t.reason ?? 'excluded', independent: false });
      return { ...verdict, decision: 'AUTO_REJECT' };
    }
    // A bind or match to an entity this run proposes is one more airing group of that entity.
    const inRun = (t.decision === 'matched' || t.decision === 'bind') && t.identity?.startsWith('new:');
    if (t.decision === 'matched' || t.decision === 'bind') {
      if (t.state === 'verified' && !inRun) support.push({ source: 'stored_identity', claim: `verified row ${t.rowId} (${t.method})`, independent: true });
      else if (!inRun) missing.push(`stored_${t.state ?? 'row'}`);
    } else if (t.decision !== 'create') {
      contradictions.push(t.reason ?? t.decision);
      return verdict;
    }

    if (t.tmdb.evidence === 'unconfirmed' || t.tmdb.evidence === 'mixed') contradictions.push(`tmdb_${t.tmdb.evidence}:${t.tmdb.ids.join(',')}`);
    if (t.crossKind) contradictions.push(`cross_kind:${t.crossKind.join('+')}`);
    if ((slugOwners.get(slugifyEntityTitle(t.title) ?? t.key)?.size ?? 0) > 1) contradictions.push('duplicate_slug');
    if (t.path && (pathOwners.get(t.path)?.size ?? 0) > 1) contradictions.push('path_collision');
    if (t.pathless && OWNERSHIP_DOUBT.has(t.pathless)) contradictions.push(`pathless_${t.pathless}`);
    if (t.pathRefused?.includes('historic_conflict')) contradictions.push('legacy_owner_conflict');
    if (!isWork(t.title)) contradictions.push(`title_${parseEpgTitle(t.title).resolutionState}`);
    const tmdb = t.tmdb.evidence === 'confirmed' ? t.tmdb.ref : undefined;
    const days = seen.get(t.key);
    const otherKinds = [...(days?.keys() ?? [])].filter((k) => k !== t.kind);
    if (otherKinds.length) contradictions.push(`kind_unstable:${otherKinds.sort().join('+')}`);
    const markers = Object.entries(t.titleEvidence ?? {}).filter(([e]) => e.startsWith('episode:'));
    if (markers.length) {
      support.push({ source: 'episode_markers', claim: markers.map(([e, n]) => `${e}=${n}`).join(' '), independent: false });
      if (t.kind === 'movie') contradictions.push('movie_with_episodes');
    }
    // The EPG year is the TMDB year on enriched airings, so agreement proves nothing; a mismatch still contradicts.
    if (tmdb?.type === 'movie' && t.year && t.epgYears.some((y) => Math.abs(y - t.year!) > 1)) contradictions.push(`movie_year:${t.epgYears.join(',')}≠${t.year}`);
    const sameKindDays = days?.get(t.kind) ?? 0;
    if (sameKindDays) support.push({ source: 'cross_day', claim: `${t.kind} on ${sameKindDays} other day(s)`, independent: false });
    if (t.historicOwner) support.push({ source: 'historic_url', claim: `legacy owner of ${t.path}`, independent: true });

    if (tmdb) {
      support.push({ source: 'tmdb_catalogue', claim: `${tmdbKey(tmdb.type, tmdb.id)} catalogue title matches`, independent: false });
      if (tmdb.type === 'movie' ? t.kind !== 'movie' : t.kind === 'movie') contradictions.push(`tmdb_type_${tmdb.type}_vs_${t.kind}`);
      else verdict.kindBasis = tmdb.type === 'movie' ? 'tmdb_type' : 'category';
      const check = tmdbChecks.get(tmdbKey(tmdb.type, tmdb.id));
      const exact = check && !check.error ? exactTmdbWorks(check, t.key) : [];
      if (!check || check.error) missing.push(check ? 'tmdb_search_failed' : 'tmdb_search_unchecked');
      else if (!exact.includes(tmdb.id)) contradictions.push(`tmdb_not_exact:${exact.join(',') || 'none'}`);
      else if (exact.length > 1) missing.push(`tmdb_homonyms:${exact.join(',')}`);
      else support.push({ source: 'tmdb_search', claim: `only ${tmdb.type} titled "${check.query}" in TMDB search`, independent: true });
    } else {
      if (t.kind !== 'unknown') verdict.kindBasis = 'category';
      // A TMDB title match settles residue ("Scream 2"); without one, residue is doubt.
      RESIDUE.filter(([, re]) => re.test(t.title)).forEach(([name]) => contradictions.push(`residue_${name}`));
      if (isSlotWording(t.title)) contradictions.push('residue_slot_wording');
      const base = editionOf(t.key, proposedKeys);
      if (base) contradictions.push(`edition_of:${base}`);
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
    const independent = members.some((v) => v.support.some((s) => s.independent));
    const decision: EvidenceDecision = !contradictions.length && !missing.length && independent && members.some((v) => v.kindBasis !== 'none') ? 'AUTO_ACCEPT' : 'QUARANTINE';
    for (const v of members) Object.assign(v, { decision, contradictions, missing });
  }
  return verdicts;
}

/**
 * Machine-evidence gates over the verdicts. `status: pass` means no known violation among the
 * accepted identities; it says nothing about human-reviewed precision, which stays unmeasured.
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
  const violations = {
    canonicalOwnership: accepted.filter((v) => v.path && paths.get(v.path)!.size > 1).map((v) => v.candidateId),
    crossKindMerges: accepted.filter((v) => kindsOf.get(identity(v))!.size > 1 || (kindsByKey.get(v.key)!.size > 1 && keys.get(v.key)!.size > 1)).map((v) => v.candidateId),
    episodeAsWork: accepted.filter((v) => !isWork(v.title)).map((v) => v.candidateId),
    withoutIndependentEvidence: accepted.filter((v) => !verdicts.some((o) => identity(o) === identity(v) && o.support.some((s) => s.independent))).map((v) => v.candidateId),
    acceptedWithConflicts: accepted.filter((v) => v.contradictions.length || v.missing.length).map((v) => v.candidateId),
  };
  const count = (list: readonly string[]) => list.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
  const firstOf = (v: EvidenceVerdict) => identity(v);
  const identities = new Map<string, EvidenceVerdict>();
  verdicts.forEach((v) => v.decision !== 'AUTO_REJECT' && !identities.has(firstOf(v)) && identities.set(firstOf(v), v));
  const entities = [...identities.values()];
  const acceptedEntities = entities.filter((v) => v.decision === 'AUTO_ACCEPT');
  const pass = Object.values(violations).every((list) => !list.length);
  return {
    status: pass ? 'pass' : 'fail',
    meaning: 'machine evidence only: no known violation among auto-accepted identities. Not human-validated precision; the human write gate is separate.',
    candidates: count(verdicts.map((v) => v.decision)),
    identities: count(entities.map((v) => v.decision)),
    quarantineRate: entities.length ? entities.filter((v) => v.decision === 'QUARANTINE').length / entities.length : 0,
    accepted: {
      byKind: count(acceptedEntities.map((v) => v.kind)),
      byKindBasis: count(acceptedEntities.map((v) => v.kindBasis)),
      byIndependentSource: count(
        acceptedEntities.map((v) => [...new Set(verdicts.filter((o) => identity(o) === identity(v)).flatMap((o) => o.support.filter((s) => s.independent).map((s) => s.source)))].sort().join('+'))
      ),
      pathless: acceptedEntities.filter((v) => !v.path).length,
    },
    // Every reason, counted once per quarantined identity (an identity can have several).
    quarantineReasons: count(
      entities.filter((v) => v.decision === 'QUARANTINE').flatMap((v) => [...v.contradictions, ...v.missing].map((r) => r.split(':')[0]).filter((r, i, a) => a.indexOf(r) === i))
    ),
    violations,
    digest: createHash('sha256').update(JSON.stringify(verdicts)).digest('hex'),
  };
}
