/**
 * Phase 3B: is a correctly identified entity a page worth showing, and worth indexing? Pure and
 * deterministic. Identity verification answers "is this the right work"; nothing here changes that
 * answer, and a pass here never verifies an identity.
 *
 * Fail-closed: a criterion is `pass` only on positive evidence in the signals. Missing data is
 * `unknown`, which blocks the tier that needs it. No field is invented or inferred from the title.
 *
 *   tier `blocked`          identity, title or canonical criteria fail: not even a canary page
 *   tier `canary`           safe to show noindex to the allowlist: identity, title, canonical, SSR
 *   tier `index_candidate`  every criterion passes; still needs an explicit owner decision to index
 *
 * Thresholds are the criteria in docs/seo/PHASE-3B-CONTENT-QUALITY-CRITERIA.md; change them there first.
 */
import { isGenericContentTitle, parseEpgTitle, type ContentKind } from '@/domain/services/contentIdentity';

export const QUALITY_THRESHOLDS = {
  synopsisMinChars: 300,
  synopsisThinChars: 150,
  /** Share of the EPG description's words the synopsis may repeat before it adds nothing. */
  duplicateOfEpgMax: 0.9,
  inboundLinksMin: 3,
  ssrMinChecks: 20,
  ssrMinSuccess: 0.99,
  /** Required fields of an index candidate, by kind (a film without a year can't be told from a remake). */
  requiredFilm: ['title', 'year', 'genres', 'synopsis', 'runtime'] as const,
  requiredOther: ['title', 'genres', 'synopsis'] as const,
} as const;

export interface PublicationSignals {
  /** The public read says active + manual + named reviewers (PublicContentEntityService). */
  verified: boolean;
  /**
   * Phase 3C: certified from an owner-authorised AI review (`ai_attested`, reviewBasis `ai`) and valid at this read.
   * Enough for a noindex canary page; never counts as a person's verification, so never an index candidate.
   */
  aiAttested?: boolean;
  kind: ContentKind;
  title: string;
  originalTitle?: string;
  year?: number;
  /** `independent`: confirmed by the feed's own year (EPG_YEAR_PROVENANCE) and the catalogue; `tmdb_overwrite`: the stored year is TMDB's. */
  yearProvenance?: 'independent' | 'tmdb_overwrite' | 'unknown';
  synopsis?: string;
  /** Length of a synopsis that was measured but not kept (e.g. read from the public page); `synopsis` wins when both are given. */
  synopsisChars?: number;
  synopsisSource?: 'manual' | 'tmdb' | 'epg';
  /** The EPG description of the same work today, for the duplicate check. */
  epgDescription?: string;
  genres?: string[];
  runtimeMinutes?: number;
  /** Broadcasts joined to this entity on evidence (`EntityBroadcastService`), not on the title. */
  upcomingAirings?: number;
  /** Phase 3D: the page names the source of the copied facts and images (TMDB's required notice) and the stored values carry provenance. */
  attributed?: boolean;
  /** Internal links to this page from indexable pages. */
  inboundLinks?: number;
  /** What the existing legacy page for the same work does once the entity page exists. */
  legacyPage?: 'none' | 'redirects_to_entity' | 'live_duplicate' | 'unknown';
  /** The canonical audit found nothing for this entity and its path. */
  registryClean?: boolean;
  ssr?: { ok: number; total: number };
  /** Another entity with the same normalised title and year. */
  duplicateOf?: string;
}

export type CriterionStatus = 'pass' | 'fail' | 'unknown';
export interface Criterion { id: string; status: CriterionStatus; detail: string }
export type Tier = 'blocked' | 'canary' | 'index_candidate';
export type AdsenseRisk = 'high' | 'medium' | 'low';

const words = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2);
/** Share of the synopsis' distinct words that the EPG description already contains. */
export function overlapWithEpg(synopsis: string, epg: string): number {
  const a = new Set(words(synopsis));
  const b = new Set(words(epg));
  if (!a.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / a.size;
}

const ok = (id: string, detail: string): Criterion => ({ id, status: 'pass', detail });
const no = (id: string, detail: string): Criterion => ({ id, status: 'fail', detail });
const unknown = (id: string, detail: string): Criterion => ({ id, status: 'unknown', detail });
const T = QUALITY_THRESHOLDS;

export function assessPublicationQuality(s: PublicationSignals) {
  const c: Criterion[] = [];
  c.push(s.verified ? ok('identity_verified', 'active, manual, named reviewers')
    : s.aiAttested ? unknown('identity_verified', 'AI-attested under the owner\'s authorisation (basis ai): not verified by a named person')
      : no('identity_verified', 'not verified by a named person'));

  const parsed = parseEpgTitle(s.title);
  c.push(!s.title.trim() || isGenericContentTitle(s.title) || parsed.resolutionState !== 'work'
    ? no('title_accurate', `title reads as ${parsed.resolutionState === 'work' ? 'a generic slot' : parsed.resolutionState}`)
    : ok('title_accurate', 'a work title, no episode or slot wording'));

  const needsYear = s.kind === 'movie';
  if (s.year === undefined) c.push(needsYear ? no('year_reliable', 'a film without a year') : unknown('year_reliable', 'no year'));
  else if (s.yearProvenance === 'independent') c.push(ok('year_reliable', 'confirmed by the feed year and the catalogue'));
  else c.push(unknown('year_reliable', `year comes from ${s.yearProvenance ?? 'unknown'} provenance: the same source as the match, not independent evidence`));

  const synopsis = (s.synopsis ?? '').trim();
  const chars = synopsis ? synopsis.length : Math.max(0, s.synopsisChars ?? 0);
  const overlap = synopsis && s.epgDescription ? overlapWithEpg(synopsis, s.epgDescription) : null;
  if (!chars) c.push(no('description_reliable', 'no synopsis'));
  else if (chars < T.synopsisMinChars) c.push(no('description_reliable', `synopsis has ${chars} characters, ${T.synopsisMinChars} needed`));
  else if (!s.synopsisSource) c.push(unknown('description_reliable', 'synopsis without a recorded source'));
  else c.push(ok('description_reliable', `${chars} characters from ${s.synopsisSource}`));

  c.push(overlap === null
    ? unknown('no_duplicate_of_epg', 'no EPG description to compare with')
    : overlap >= T.duplicateOfEpgMax ? no('no_duplicate_of_epg', `synopsis repeats ${Math.round(overlap * 100)}% of the EPG description`) : ok('no_duplicate_of_epg', `${Math.round(overlap * 100)}% overlap with the EPG description`));

  c.push(s.duplicateOf ? no('no_duplicate_entity', `same title and year as ${s.duplicateOf}`) : ok('no_duplicate_entity', 'no other entity with this title and year'));
  c.push(s.legacyPage === 'none' || s.legacyPage === 'redirects_to_entity'
    ? ok('legacy_consolidated', s.legacyPage === 'none' ? 'no legacy page for this work' : 'the legacy page redirects to the entity page')
    : s.legacyPage === 'live_duplicate' ? no('legacy_consolidated', 'a live legacy page serves the same work: two indexable pages for one work') : unknown('legacy_consolidated', 'legacy page behaviour not checked'));

  const required = needsYear ? T.requiredFilm : T.requiredOther;
  const present: Record<string, boolean> = {
    title: !!s.title.trim(), year: s.year !== undefined, genres: !!s.genres?.length, synopsis: chars > 0, runtime: (s.runtimeMinutes ?? 0) > 0,
  };
  const missing = required.filter((f) => !present[f]);
  c.push(missing.length ? no('metadata_complete', `missing ${missing.join(', ')}`) : ok('metadata_complete', `all ${required.length} required fields present`));

  c.push(s.inboundLinks === undefined ? unknown('internal_links_ready', 'inbound links not measured')
    : s.inboundLinks >= T.inboundLinksMin ? ok('internal_links_ready', `${s.inboundLinks} inbound links`) : no('internal_links_ready', `${s.inboundLinks} inbound links, ${T.inboundLinksMin} needed`));
  c.push(s.registryClean === undefined ? unknown('canonical_consistent', 'canonical audit not run') : s.registryClean ? ok('canonical_consistent', 'canonical audit clean') : no('canonical_consistent', 'canonical audit found an inconsistency'));
  c.push(!s.ssr || s.ssr.total < T.ssrMinChecks ? unknown('ssr_reliable', `fewer than ${T.ssrMinChecks} SSR checks`)
    : s.ssr.ok / s.ssr.total >= T.ssrMinSuccess ? ok('ssr_reliable', `${s.ssr.ok}/${s.ssr.total} renders correct`) : no('ssr_reliable', `${s.ssr.ok}/${s.ssr.total} renders correct`));

  // What a visitor gets that the EPG listing does not: a real description plus where to watch it.
  const substantial = chars >= T.synopsisMinChars && (overlap === null || overlap < T.duplicateOfEpgMax);
  const useful = substantial && (s.upcomingAirings ?? 0) >= 1;
  c.push(useful ? ok('user_useful', 'a substantial description and at least one upcoming broadcast')
    : s.upcomingAirings === undefined ? unknown('user_useful', 'upcoming broadcasts not measured') : no('user_useful', substantial ? 'no upcoming broadcast to point to' : 'no description beyond the listing'));

  // Phase 3D. Copied facts must say where they come from; a long TMDB synopsis alone is third-party text on thousands
  // of sites, so the page's own value is the evidence-joined schedule (or text a person wrote).
  const copied = chars > 0 || Boolean(s.genres?.length);
  c.push(!copied ? unknown('source_attributed', 'no copied facts to attribute')
    : s.attributed === undefined || !s.synopsisSource ? unknown('source_attributed', 'source or on-page attribution not recorded')
      : s.attributed ? ok('source_attributed', `facts from ${s.synopsisSource}, attribution shown`) : no('source_attributed', 'copied facts without a visible source'));
  c.push(s.synopsisSource === 'manual' && chars >= T.synopsisMinChars ? ok('original_value', 'text written by a person')
    : (s.upcomingAirings ?? 0) >= 1 ? ok('original_value', `${s.upcomingAirings} evidence-joined upcoming broadcast(s) with channel links, beyond the TMDB text`)
      : s.upcomingAirings === undefined ? unknown('original_value', 'upcoming broadcasts not measured')
        : no('original_value', 'TMDB text only: no scheduled broadcast and no editorial text'));

  // AdSense / helpful-content risk. High: thin or a copy of the listing. Medium: short, or third-party text
  // (TMDB is on thousands of sites) with nothing of ours beside it. Low: substantial text plus manual
  // editorial content or a real programme schedule.
  const thin = !chars || chars < T.synopsisThinChars || (overlap !== null && overlap >= T.duplicateOfEpgMax);
  const risk: AdsenseRisk = thin ? 'high'
    : chars < T.synopsisMinChars || (s.synopsisSource !== 'manual' && (s.upcomingAirings ?? 0) < 1) ? 'medium' : 'low';
  c.push(risk === 'high' ? no('adsense_risk', 'thin or duplicated content')
    : risk === 'medium' ? unknown('adsense_risk', 'short text, or third-party text with no schedule or editorial content beside it')
      : ok('adsense_risk', 'substantial text with original schedule or editorial content'));

  const status = (id: string) => c.find((x) => x.id === id)!.status;
  const need = (ids: string[], want: CriterionStatus = 'pass') => ids.every((id) => status(id) === want);
  const identityOk = status('identity_verified') === 'pass' || Boolean(s.aiAttested);
  const canaryOk = identityOk && need(['title_accurate', 'canonical_consistent', 'no_duplicate_entity']) && status('ssr_reliable') === 'pass';
  const tier: Tier = [status('identity_verified'), status('title_accurate'), status('no_duplicate_entity')].includes('fail') || status('canonical_consistent') === 'fail'
    ? 'blocked'
    : c.every((x) => x.status === 'pass') ? 'index_candidate' : canaryOk ? 'canary' : 'blocked';
  return {
    tier,
    adsenseRisk: risk,
    criteria: c,
    blockers: c.filter((x) => x.status !== 'pass').map((x) => `${x.id}: ${x.detail}`),
    indexable: tier === 'index_candidate',
  };
}
