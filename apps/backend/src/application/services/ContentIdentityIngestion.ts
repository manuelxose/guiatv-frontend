/**
 * Phase 2D-2: persistent identity for the airings of one rebuilt day. Runs after the day's
 * airings are stored, so the normal schedule never depends on it, and does nothing unless a
 * CONTENT_IDENTITY_* flag is on. Batch shape: one read per collection for the whole day (title
 * keys by `$in`, TMDB owners, catalogue evidence, existing entities), then one decision per
 * distinct identity candidate, never per airing.
 */
import fs from 'node:fs';
import mongoose from 'mongoose';
import type {
  AiringEntityRef,
  CatalogEvidence,
  ContentEntityInsert,
  ContentEntityRecord,
  IAiringEntityRefWriter,
  IContentEntityRepository,
  IContentSlugRepository,
  IContentTitleKeyRepository,
  IIdentityEvidenceSource,
  TitleKeyRecord,
} from '@/domain/repositories/IContentIdentityRepository';
import {
  classifyContentKind,
  ContentKind,
  decideIngestionMatch,
  newEntityId,
  ParsedEpgTitle,
  parseEpgTitle,
  stripChannelSegment,
  planCanonicalPaths,
  plannedSlugs,
  TitleKeyRow,
  titleIdentityKey,
  TmdbRef,
} from '@/domain/services/contentIdentity';
import { ADMITTED_SCOPE_CEILING, contentIdentityMaxCreates, contentIdentityWriteScope, readContentIdentityFlags } from '@/shared/config/contentEntities';
import { logger } from '@/shared/utils/logger';
import {
  MongoAiringEntityRefWriter,
  MongoContentEntityRepository,
  MongoContentSlugRepository,
  MongoContentTitleKeyRepository,
  MongoIdentityEvidenceSource,
} from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { ContentIdentityService } from './ContentIdentityService';
import { ContentIdentityNotReadyError } from '@/infrastructure/repositories/MongoContentIdentityRepositories';

export interface IdentityObservation {
  airingId: string;
  title: string;
  /** XMLTV `sub-title`: the episode name when the feed sends one. */
  subtitle?: string;
  editorialCategory?: string;
  sportFacet?: string | null;
  tmdbId?: number;
  mediaId?: string;
  /**
   * EPG `<date>`; used only for films, where it tells remakes apart. The EPG sync overwrites it
   * with the matched TMDB year, so on a TMDB-enriched airing it is not independent of that match.
   */
  year?: number;
  /** The airing's channel id and its names, so a channel-name segment is not taken for a work. */
  channel?: { id: string; names: string[] };
  /** XMLTV category as the sync normalised it (`normalizeCategory`); never written from TMDB (2D-2G provenance). */
  genre?: string;
  /** Airing slot length in minutes, from the feed's start and stop. */
  minutes?: number;
  /** The feed's own `<date>` before TMDB enrichment, when the sync kept it (`yearProvenance.rawXmltvYear`). */
  rawYear?: number;
}

/** A search-derived TMDB id confirmed by the catalogue title: provisional, never verified (2C §E.2). */
export const CONFIRMED_SEARCH_CONFIDENCE = 0.9;
/** Uncompressed bytes per entity incl. its slug, title key and their index entries, measured on
 * 5 replayed real EPG days (5,317 entities: 7.9 MB). An estimate for planning, not a limit. */
const BYTES_PER_ENTITY = 1_500;

const count = (map: Record<string, number>, key: string, n = 1) => {
  map[key] = (map[key] ?? 0) + n;
};

export function newIdentityReport(mode: 'shadow' | 'write', date: string) {
  return {
    mode,
    date,
    airings: 0,
    candidates: 0,
    excluded: {} as Record<string, number>,
    /** Kept airings by title evidence: `work`, `episode:<source>`, `episode:corroborated`, `title_part`, `uncertain` (2D-2E). */
    titles: {} as Record<string, number>,
    kinds: {} as Record<string, number>,
    tmdb: { confirmed: 0, unconfirmed: 0 },
    decisions: {} as Record<string, number>,
    /** New title-key rows by state (planned in shadow mode). */
    newRows: {} as Record<string, number>,
    /** Why a new or existing row is unbound or provisional. */
    reasons: {} as Record<string, number>,
    deferred: 0,
    /** Candidates skipped because a write failed; retried by the next run. */
    failed: 0,
    slugs: {
      allocated: 0,
      /** Paths given to entities an earlier run left pathless (crash leftovers, new evidence). */
      repaired: 0,
      /** Allocated paths a legacy title of this same work already answered. */
      historicOwner: 0,
      /** Candidate paths refused, by `PathBlock` reason (a refused bare slug may leave the year path). */
      refused: {} as Record<string, number>,
      /**
       * Entities left without a path, by reason. All intentional (no safe path, or `taken` by
       * another entity) except `write_failed`, which the next run retries.
       */
      pathless: {} as Record<string, number>,
    },
    writes: {
      entities: 0,
      titleKeys: 0,
      slugs: 0,
      duplicateKeyConflicts: 0,
      /** Bound rows whose entity can't be materialised because another entity owns its TMDB work. */
      claimConflicts: 0,
      /** …of those, provisional rows moved to the review queue (`claim_conflict`). */
      claimsFlagged: 0,
    },
    airingRefs: { applied: 0, skipped: '' },
    estimate: { newEntities: 0, approxBytes: 0 },
    durationMs: 0,
  };
}
export type IdentityRunReport = ReturnType<typeof newIdentityReport>;

/**
 * One identity candidate as the run decided it: the unit an audit samples and a person reviews.
 * Built only when `run` is given a trace array; it needs no reads beyond the run's own. `identity`
 * is `new:<title-key row>` for an entity this run proposes, so shadow output is reproducible.
 */
export interface IdentityTrace {
  candidateId: string;
  key: string;
  kind: ContentKind;
  /** The work title (an episode's series or programme, 2D-2E). */
  title: string;
  /** Distinct EPG spellings grouped into this candidate, sorted (the review sheet shows 5). */
  spellings: string[];
  airings: number;
  /** Airings by title evidence (`ContentIdentityIngestion` report `titles`). */
  titleEvidence?: Record<string, number>;
  /**
   * Broadcaster evidence the EPG sync never derives from TMDB (2D-2G): XMLTV categories, airing
   * slot lengths in minutes, and the highest season number in the titles (4-digit years excluded).
   */
  broadcaster?: { genres: string[]; minutes: { min: number; max: number } | null; maxSeason: number | null; rawYears?: number[]; maxEpisodes?: Record<string, number> };
  /** Broadcaster keys of its airings, sorted (`broadcasterKey`; 2D-2F broadcaster consistency). */
  channels?: string[];
  /** Known kinds this candidate's work was seen under in the run, when more than one. */
  crossKind?: ContentKind[];
  epgYears: number[];
  year?: number;
  /** Airing TMDB ids, and whether the catalogue confirmed them (`mixed`: some airings unconfirmed). */
  tmdb: { ids: number[]; evidence: 'confirmed' | 'unconfirmed' | 'mixed' | 'none'; ref?: TmdbRef };
  decision: 'create' | 'bind' | 'matched' | 'held' | 'review' | 'unresolved' | 'deferred' | 'rejected' | 'failed';
  state?: string;
  method?: string;
  confidence?: number;
  reason?: string;
  rowId?: string;
  identity?: string;
  path?: string | null;
  pathRefused?: string[];
  historicOwner?: boolean;
  pathless?: string;
}

interface Candidate {
  id: string;
  key: string;
  kind: ContentKind;
  title: string;
  year?: number;
  tmdb?: TmdbRef;
  airingIds: string[];
  entityId?: string;
  rowId?: string;
  spellings: Set<string>;
  channels: Set<string>;
  genres: Set<string>;
  minutes: number[];
  maxSeason: number | null;
  /** Highest episode number seen per season (`0` = no season marker): the number of episodes the feed claims exist. */
  maxEpisodes: Record<string, number>;
  rawYears: Set<number>;
  titleEvidence: Record<string, number>;
  /** Held out of matching for the whole run (unresolved, not stored). */
  hold?: 'title_uncertain';
  crossKind?: ContentKind[];
  epgYears: Set<number>;
  tmdbIds: Set<number>;
  unconfirmed: number;
  outcome?: Pick<IdentityTrace, 'decision' | 'state' | 'method' | 'confidence' | 'reason'>;
}

/**
 * One key per broadcaster: the channel name without accents, a ".TV" feed suffix or punctuation, so
 * one channel ingested from two feeds ("ETB 2" and "ETB2.TV") counts once. Different names stay apart.
 */
export function broadcasterKey(channel: { id: string; names: string[] }): string {
  const name = (channel.names[0] ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\.tv$/, '');
  return name.replace(/[^a-z0-9]/g, '') || channel.id;
}

const slotMinutes = (start: unknown, end: unknown): number | undefined => {
  const minutes = Math.round((new Date(String(end)).getTime() - new Date(String(start)).getTime()) / 60_000);
  return minutes > 0 && minutes < 24 * 60 ? minutes : undefined;
};

const parseYear = (value: unknown) => {
  const year = Number.parseInt(String(value ?? ''), 10);
  return year >= 1888 && year <= 2100 ? year : undefined;
};

/** `rawYears`: the feed's own year by airing, where the sync kept it (`EPG_YEAR_PROVENANCE`, 2D-2G). */
export function observationsFromAirings(airings: any[], years: ReadonlyMap<string, unknown>, rawYears?: ReadonlyMap<string, unknown>): IdentityObservation[] {
  return airings.map((airing) => {
    const year = parseYear(years.get(airing.id));
    return {
      airingId: airing.id,
      title: String(airing.program?.title || ''),
      subtitle: airing.program?.subtitle ? String(airing.program.subtitle) : undefined,
      editorialCategory: airing.program?.editorialCategory,
      sportFacet: airing.program?.sportFacet,
      tmdbId: Number.isInteger(airing.program?.tmdbId) ? airing.program.tmdbId : undefined,
      mediaId: airing.program?.mediaId ? String(airing.program.mediaId) : undefined,
      year,
      rawYear: parseYear(rawYears?.get(airing.id)),
      genre: airing.program?.genre ? String(airing.program.genre) : undefined,
      minutes: slotMinutes(airing.airing?.start, airing.airing?.end),
      channel: airing.channel?.id
        ? { id: String(airing.channel.id), names: [airing.channel.name, ...(airing.channel.aliases ?? [])].filter(Boolean).map(String) }
        : undefined,
    };
  });
}

/** The catalogue row that confirms an airing's TMDB id, or null: same id, same title key, year within ±1 for films. */
function confirmTmdb(obs: IdentityObservation, key: string, catalog: CatalogEvidence[]): CatalogEvidence | null {
  if (!obs.tmdbId) return null;
  const sameWork = catalog.filter(
    (e) =>
      e.tmdb?.id === obs.tmdbId &&
      (!obs.mediaId || e.mediaId === obs.mediaId) &&
      (titleIdentityKey(e.title) === key || titleIdentityKey(e.originalTitle) === key)
  );
  if (sameWork.length !== 1) return null;
  const entry = sameWork[0];
  if (entry.tmdb?.type === 'movie' && obs.year && entry.year && Math.abs(obs.year - entry.year) > 1) return null;
  return entry;
}

const LIVE = new Set(['candidate', 'active']);
const LIVE_ROW = new Set(['verified', 'candidate']);
/** Titles that never become candidates, by parse state: no work identity at all. */
const EXCLUDED_TITLES = { generic: 'generic_title', no_work: 'episode_without_work', unkeyable: 'unkeyable_title' } as const;

export class ContentIdentityIngestion {
  constructor(
    private readonly ports: {
      entities: IContentEntityRepository;
      slugs: IContentSlugRepository;
      titleKeys: IContentTitleKeyRepository;
      evidence: IIdentityEvidenceSource;
      airingRefs: IAiringEntityRefWriter;
    },
    private readonly service: ContentIdentityService,
    private readonly opts: {
      mode: 'shadow' | 'write';
      airingRefs: boolean;
      maxCreates: number;
      actor?: string;
      /**
       * Write mode creates an entity only for a candidate id in this set (the evidence gate's
       * `independently_supported` AUTO_ACCEPTs); `'all'` is for tests. Unset: nothing is created,
       * existing rows still bind. Shadow mode ignores it and reports what an open gate would do.
       */
      admit?: ReadonlySet<string> | 'all';
      /**
       * Phase 3C: `admitted` makes write mode touch only the candidates in `admit` (no title-key row for
       * any other candidate, no binding to an existing row), so a bounded canary writes a bounded set.
       * Unset: the 2D-2 behaviour, where every decided candidate leaves a title-key row.
       */
      scope?: 'admitted';
    }
  ) {}

  private admitted(c: Candidate): boolean {
    return this.opts.admit === 'all' || Boolean(this.opts.admit?.has(c.id));
  }

  async run(date: string, observations: IdentityObservation[], trace?: IdentityTrace[]): Promise<IdentityRunReport> {
    const started = Date.now();
    const write = this.opts.mode === 'write';
    const report = newIdentityReport(this.opts.mode, date);
    report.airings = observations.length;

    // 1. Title parse (2D-2E) and the exclusions that need no I/O: slots, titles without a work, no
    // Latin identity. Not the read model's `titleResolutionState`: it comes from
    // `isGenericMovieTitle`, which also suppresses named programmes such as "Cine de barrio".
    const kept: Array<{ obs: IdentityObservation; title: ParsedEpgTitle }> = [];
    const rejectedTitles = new Map<string, { reason: string; airings: number }>();
    for (const obs of observations) {
      const title = parseEpgTitle(stripChannelSegment(obs.title, obs.channel?.names), obs.subtitle);
      const reason = EXCLUDED_TITLES[title.resolutionState as keyof typeof EXCLUDED_TITLES];
      if (!reason) {
        kept.push({ obs, title });
        continue;
      }
      count(report.excluded, reason);
      const seen = rejectedTitles.get(obs.title) ?? { reason, airings: 0 };
      seen.airings++;
      rejectedTitles.set(obs.title, seen);
    }

    // 2. Evidence for the whole day, one read per source: catalogue (TMDB), and every stored title
    // key for the works and the possible works behind an uncertain separator.
    const catalog = await this.ports.evidence.catalogEntries(
      kept.map(({ obs }) => obs.mediaId).filter((id): id is string => Boolean(id)),
      kept.map(({ obs }) => obs.tmdbId).filter((id): id is number => Boolean(id))
    );
    const rowsByKey = new Map<string, TitleKeyRecord[]>();
    const wanted = new Set(kept.flatMap(({ title: t }) => [t.normalizedWorkKey as string, ...(t.uncertainSplit ? [t.uncertainSplit.workKey] : [])]));
    for (const row of await this.ports.titleKeys.listByKeys([...wanted])) {
      rowsByKey.set(row.key, [...(rowsByKey.get(row.key) ?? []), row]);
    }
    const known = (key: string) => (rowsByKey.get(key) ?? []).some((r) => r.entityId && LIVE_ROW.has(r.state));
    // Works the run sees without doubt: a plain title or an explicit episode of it.
    const confident = new Set(kept.filter(({ title: t }) => t.resolutionState !== 'uncertain').map(({ title: t }) => t.normalizedWorkKey));

    // 3. Work, TMDB evidence and kind per airing, then group by identity context (same key, kind,
    // TMDB work, year). Every rule reads sets built from the whole day, never an earlier decision.
    const groups = new Map<string, Candidate>();
    for (const { obs, title: parsed } of kept) {
      let key = parsed.normalizedWorkKey as string;
      let title = parsed.proposedWorkTitle as string;
      let evidence = parsed.resolutionState === 'episode' ? `episode:${parsed.evidenceSource}` : 'work';
      let confirmed = confirmTmdb(obs, key, catalog);
      let hold: Candidate['hold'];
      const split = parsed.uncertainSplit;
      if (split) {
        // "X - Y": the whole text is the work when the catalogue or a stored row knows it, or when it
        // is a film (film titles carry subtitles: "Misión imposible - Fallout"). It is an episode of X
        // when TMDB, a stored row or another airing of the day confirms X. Otherwise: no guess.
        const splitTmdb = confirmed ? null : confirmTmdb(obs, split.workKey, catalog);
        const hint = classifyContentKind({ ...obs, tmdbType: (confirmed ?? splitTmdb)?.tmdb?.type });
        if (confirmed || known(key) || hint === 'movie') evidence = 'title_part';
        else if (splitTmdb || known(split.workKey) || confident.has(split.workKey)) {
          [key, title, confirmed, evidence] = [split.workKey, split.workTitle, splitTmdb, 'episode:corroborated'];
        } else [evidence, hold] = ['uncertain', 'title_uncertain'];
      }
      count(report.titles, evidence);
      if (obs.tmdbId) report.tmdb[confirmed ? 'confirmed' : 'unconfirmed']++;
      const kind = classifyContentKind({ ...obs, title, tmdbType: confirmed?.tmdb?.type });
      if (kind === 'sport') {
        count(report.excluded, 'sport_event');
        continue;
      }
      const tmdb = confirmed?.tmdb;
      const year = confirmed ? confirmed.year : kind === 'movie' ? obs.year : undefined;
      const id = [key, kind, tmdb ? `${tmdb.type}:${tmdb.id}` : '', year ?? ''].join('|') + (hold ? '|held' : '');
      const group: Candidate = groups.get(id) ?? {
        id, key, kind, title, year, tmdb, hold, airingIds: [], spellings: new Set(), channels: new Set(), genres: new Set(), minutes: [], maxSeason: null, maxEpisodes: {}, rawYears: new Set(), titleEvidence: {}, epgYears: new Set(), tmdbIds: new Set(), unconfirmed: 0,
      };
      group.spellings.add(obs.title);
      if (obs.channel) group.channels.add(broadcasterKey(obs.channel));
      if (obs.genre) group.genres.add(obs.genre);
      if (obs.minutes) group.minutes.push(obs.minutes);
      if (obs.rawYear) group.rawYears.add(obs.rawYear);
      if (parsed.seasonNumber !== undefined && parsed.seasonNumber < 1900) group.maxSeason = Math.max(group.maxSeason ?? 0, parsed.seasonNumber);
      if (parsed.episodeNumber !== undefined && parsed.episodeNumber < 1900) {
        const season = String(parsed.seasonNumber !== undefined && parsed.seasonNumber < 1900 ? parsed.seasonNumber : 0);
        group.maxEpisodes[season] = Math.max(group.maxEpisodes[season] ?? 0, parsed.episodeNumber);
      }
      count(group.titleEvidence, evidence);
      if (obs.year) group.epgYears.add(obs.year);
      if (obs.tmdbId) group.tmdbIds.add(obs.tmdbId);
      if (obs.tmdbId && !confirmed) group.unconfirmed++;
      // The shortest spelling is the cleanest title ("La Promesa" over "La Promesa T1 E929").
      if (title.length < group.title.length || (title.length === group.title.length && title < group.title)) {
        group.title = title;
      }
      group.airingIds.push(obs.airingId);
      groups.set(id, group);
    }
    // Deterministic order; within a key, TMDB-backed and dated candidates decide first.
    const candidates = [...groups.entries()]
      .sort(([a, x], [b, y]) => x.key.localeCompare(y.key) || Number(!x.tmdb) - Number(!y.tmdb) || Number(!x.year) - Number(!y.year) || a.localeCompare(b))
      .map(([, c]) => c);
    // Cross-kind (2D-2E §5). One channel's category is weak evidence of kind: a title-only work seen
    // under two known kinds, or one TMDB work under two kinds, is held for review instead of becoming
    // two entities with two paths. A TMDB work is not held by a title-only sighting of another kind
    // (that sighting is), and two different TMDB works may share a title (film and series).
    const kindsOf = new Map<string, Set<ContentKind>>();
    const note = (k: string, kind: ContentKind) => kindsOf.set(k, (kindsOf.get(k) ?? new Set()).add(kind));
    const tmdbKey = (t: TmdbRef) => `tmdb:${t.type}:${t.id}`;
    for (const c of candidates.filter((c) => c.kind !== 'unknown' && !c.hold)) {
      note(c.key, c.kind);
      if (c.tmdb) note(tmdbKey(c.tmdb), c.kind);
    }
    for (const c of candidates.filter((c) => c.kind !== 'unknown' && !c.hold)) {
      const kinds = kindsOf.get(c.tmdb ? tmdbKey(c.tmdb) : c.key) as Set<ContentKind>;
      if (kinds.size > 1) c.crossKind = [...kinds].sort();
    }
    const outcome = (c: Candidate, decision: IdentityTrace['decision'], row?: TitleKeyRow) =>
      (c.outcome = { decision, state: row?.state, method: row?.method, confidence: row?.confidence, reason: row?.reason });
    report.candidates = candidates.length;
    candidates.forEach((c) => count(report.kinds, c.kind));

    // TMDB works already owned by an entity: one batch.
    const tmdbOwner = new Map<string, { entityId: string; kind: ContentKind }>();
    const refs = candidates.map((c) => c.tmdb).filter((t): t is TmdbRef => Boolean(t));
    for (const e of refs.length ? await this.ports.entities.findLiveByTmdbRefs(refs) : []) {
      const t = e.externalIds.tmdb as TmdbRef;
      tmdbOwner.set(`${t.type}:${t.id}`, { entityId: e.entityId, kind: e.kind });
    }

    // 4. One decision per candidate, in order; each new row is visible to the next decision.
    const seenRows: string[] = [];
    const claimed = new Map<string, Candidate>();
    let creates = 0;
    const store = async (row: TitleKeyRow): Promise<TitleKeyRow> => {
      count(report.newRows, row.state);
      if (row.reason) count(report.reasons, row.reason);
      if (!write) return row;
      const res = await this.ports.titleKeys.insert({ ...row, decidedBy: this.opts.actor ?? 'ingest' });
      if (res.inserted) {
        report.writes.titleKeys++;
        return res.record;
      }
      report.writes.duplicateKeyConflicts++;
      return res.existing ?? row;
    };
    const decide = async (c: Candidate) => {
      if (write && this.opts.scope === 'admitted' && !this.admitted(c)) {
        count(report.decisions, 'unresolved');
        count(report.reasons, 'out_of_scope');
        c.outcome = { decision: 'unresolved', reason: 'out_of_scope' };
        return;
      }
      if (c.hold) {
        count(report.decisions, 'unresolved');
        count(report.reasons, c.hold);
        c.outcome = { decision: 'unresolved', reason: c.hold };
        return;
      }
      const rows = rowsByKey.get(c.key) ?? [];
      const decision = decideIngestionMatch(
        {
          title: c.title,
          kind: c.kind,
          tmdb: c.tmdb,
          year: c.year,
          method: c.tmdb ? 'tmdb_exact' : 'title',
          confidence: c.tmdb ? CONFIRMED_SEARCH_CONFIDENCE : 0.8,
        },
        rows,
        c.tmdb ? tmdbOwner.get(`${c.tmdb.type}:${c.tmdb.id}`) : null,
        { crossKind: Boolean(c.crossKind) }
      );
      if (decision.decision === 'review' && decision.row.reason === 'unknown_kind') {
        count(report.decisions, 'unresolved');
        count(report.reasons, 'unknown_kind');
        outcome(c, 'unresolved', decision.row);
        return;
      }
      if (write && decision.decision === 'create' && !this.admitted(c)) {
        count(report.decisions, 'unresolved');
        count(report.reasons, 'not_admitted');
        c.outcome = { decision: 'unresolved', reason: 'not_admitted' };
        return;
      }
      count(report.decisions, decision.decision);
      outcome(c, decision.decision, decision.decision === 'rejected' ? undefined : decision.row);
      let row: TitleKeyRow | null = null;
      if (decision.decision === 'matched' || decision.decision === 'held') {
        seenRows.push(decision.row.id);
        c.rowId = decision.row.id;
        if (decision.row.reason) count(report.reasons, decision.row.reason);
        c.entityId = decision.decision === 'matched' ? decision.row.entityId : undefined;
        return;
      }
      if (decision.decision === 'rejected') return;
      if (decision.decision === 'create') {
        if (creates >= this.opts.maxCreates) {
          report.deferred++;
          outcome(c, 'deferred', decision.row);
          return;
        }
        creates++;
        // TMDB works: entity first, so the TMDB unique index picks one winner across processes and
        // the row always points at a real entity. Title-only: the row claims a fresh id first (the
        // title key is the only uniqueness there); the entity is materialised in step 5.
        let entityId = newEntityId();
        if (c.tmdb && write) {
          const entity = await this.service.ensureEntity(this.entityInput(c, decision.row), entityId);
          if (entity.entityId === entityId) report.writes.entities++;
          entityId = entity.entityId;
        }
        row = await store({ ...decision.row, entityId });
        if (row.entityId === entityId) claimed.set(entityId, c);
        if (c.tmdb && row.entityId) tmdbOwner.set(`${c.tmdb.type}:${c.tmdb.id}`, { entityId: row.entityId, kind: c.kind });
      } else {
        row = await store(decision.row);
      }
      rowsByKey.set(c.key, [...rows, row as TitleKeyRecord]);
      c.rowId = row.id;
      c.entityId = row.state === 'verified' || row.state === 'candidate' ? row.entityId : undefined;
    };
    // One bad candidate (a write the database refuses) is counted and skipped; the rest of the day
    // still resolves, and the insert-only writes make the next run pick it up again.
    const isolated = async (c: Candidate, step: (c: Candidate) => Promise<void>) => {
      try {
        await step(c);
      } catch (error) {
        if (!write || error instanceof ContentIdentityNotReadyError) throw error;
        report.failed++;
        c.entityId = undefined;
        c.outcome = { decision: 'failed' };
        log.warn('Content identity candidate skipped', { error: String((error as Error)?.message || '').slice(0, 200) });
      }
    };
    for (const c of candidates) await isolated(c, decide);
    report.estimate.newEntities = claimed.size;
    report.estimate.approxBytes = claimed.size * BYTES_PER_ENTITY;

    // 5. Entities behind every binding: create the claimed ones (and any a crash left behind).
    const bound = candidates.filter((c) => c.entityId);
    const entities = new Map(
      (await this.ports.entities.findByIds(bound.map((c) => c.entityId as string))).map((e) => [e.entityId, e] as const)
    );
    const materialise = async (c: Candidate) => {
      const id = c.entityId as string;
      if (entities.has(id)) return;
      if (!write) {
        entities.set(id, { ...this.entityInput(c), entityId: id, status: 'candidate' } as ContentEntityRecord);
        return;
      }
      const entity = await this.service.ensureEntity(this.entityInput(claimed.get(id) ?? c), id);
      if (entity.entityId !== id) {
        // The row's entity is missing and its TMDB work belongs to another live entity, so this id
        // can never be created. Not re-pointed automatically: a provisional row goes to review with
        // the owner as evidence (durable, queryable); a verified row is left alone and counted.
        report.writes.claimConflicts++;
        c.entityId = undefined;
        const by = this.opts.actor ?? 'ingest';
        if (c.rowId && (await this.ports.titleKeys.flagClaimConflict(c.rowId, { entityId: id, candidates: [entity.entityId], by }))) {
          report.writes.claimsFlagged++;
        } else log.warn('Content identity claim conflict on a non-provisional row', { row: c.rowId, entityId: id });
        return;
      }
      // Counted by the run that claimed the id, whichever process got to insert it.
      if (claimed.has(id)) report.writes.entities++;
      entities.set(id, entity);
    };
    for (const c of bound) await isolated(c, materialise);

    // 6. Canonical paths for live entities that have none yet: new ones, crash leftovers and
    // earlier refusals. Only paths no other work can claim (`planCanonicalPaths`), so the result
    // doesn't depend on processing order; a path already taken leaves the entity pathless.
    const pathless = [...new Map(bound.map((c) => [c.entityId as string, entities.get(c.entityId as string)])).values()].filter(
      (e): e is ContentEntityRecord => Boolean(e && LIVE.has(e.status) && !e.canonicalPath)
    );
    const plans = await this.planPaths(pathless);
    const taken = write
      ? new Set<string>()
      : new Set((await this.ports.slugs.findByPaths([...plans.values()].flatMap((p) => p.paths))).map((s) => s.path));
    const pathOf = new Map<string, Pick<IdentityTrace, 'path' | 'pathRefused' | 'historicOwner' | 'pathless'>>();
    for (const e of pathless) {
      const plan = plans.get(e.entityId) as ReturnType<typeof planCanonicalPaths>;
      const traced = { path: null as string | null, pathRefused: plan.blocked, historicOwner: false, pathless: undefined as string | undefined };
      pathOf.set(e.entityId, traced);
      plan.blocked.forEach((reason) => count(report.slugs.refused, reason));
      let path: string | null = null;
      if (write && plan.paths.length) {
        try {
          path = await this.service.allocateCanonicalPath(e.entityId, plan.paths);
        } catch (error) {
          if (error instanceof ContentIdentityNotReadyError) throw error;
          report.failed++;
          count(report.slugs.pathless, 'write_failed');
          traced.pathless = 'write_failed';
          log.warn('Content identity path allocation skipped', { error: String((error as Error)?.message || '').slice(0, 200) });
          continue;
        }
      }
      if (!write) path = plan.paths.find((p) => !taken.has(p)) ?? null;
      if (path) {
        taken.add(path);
        report.slugs.allocated++;
        if (!claimed.has(e.entityId)) report.slugs.repaired++;
        if (plan.historic.includes(path)) report.slugs.historicOwner++;
        if (write) report.writes.slugs++;
        e.canonicalPath = path;
        Object.assign(traced, { path, historicOwner: plan.historic.includes(path) });
      } else {
        traced.pathless = plan.paths.length ? 'taken' : plan.blocked[0];
        count(report.slugs.pathless, traced.pathless);
      }
    }

    // 7. Airing references: only with the flag, and only once the hand-built index exists.
    if (write && this.opts.airingRefs) {
      if (!(await this.ports.airingRefs.indexReady())) report.airingRefs.skipped = 'index_missing';
      else {
        const refs: AiringEntityRef[] = [];
        for (const c of bound) {
          const e = c.entityId ? entities.get(c.entityId) : undefined;
          if (!e || !LIVE.has(e.status)) continue;
          for (const airingId of c.airingIds) refs.push({ airingId, entityId: e.entityId, canonicalPath: e.canonicalPath });
        }
        report.airingRefs.applied = await this.ports.airingRefs.apply(date, refs);
      }
    } else report.airingRefs.skipped = write ? 'flag_off' : 'shadow';

    if (write) await this.ports.titleKeys.touch(seenRows, new Date());
    for (const c of trace ? candidates : []) {
      const claimer = c.entityId ? claimed.get(c.entityId) : undefined;
      const entity = c.entityId ? entities.get(c.entityId) : undefined;
      trace!.push({
        candidateId: c.id,
        key: c.key,
        kind: c.kind,
        title: c.title,
        spellings: [...c.spellings].sort(),
        channels: [...c.channels].sort(),
        broadcaster: {
          genres: [...c.genres].sort(),
          minutes: c.minutes.length ? { min: Math.min(...c.minutes), max: Math.max(...c.minutes) } : null,
          maxSeason: c.maxSeason,
          ...(Object.keys(c.maxEpisodes).length ? { maxEpisodes: c.maxEpisodes } : {}),
          ...(c.rawYears.size ? { rawYears: [...c.rawYears].sort() } : {}),
        },
        airings: c.airingIds.length,
        titleEvidence: c.titleEvidence,
        ...(c.crossKind ? { crossKind: c.crossKind } : {}),
        epgYears: [...c.epgYears].sort(),
        year: c.year,
        tmdb: {
          ids: [...c.tmdbIds].sort((a, b) => a - b),
          evidence: c.tmdb ? 'confirmed' : !c.unconfirmed ? 'none' : c.unconfirmed === c.airingIds.length ? 'unconfirmed' : 'mixed',
          ref: c.tmdb,
        },
        ...(c.outcome ?? { decision: 'failed' }),
        rowId: c.rowId,
        identity: c.entityId && (claimer ? `new:${claimer.rowId}` : c.entityId),
        ...(entity ? pathOf.get(entity.entityId) ?? { path: entity.canonicalPath ?? null } : {}),
      });
    }
    // Excluded titles too, so slots and episode-only titles can be sampled; they hold no identity.
    for (const [title, seen] of trace ? [...rejectedTitles].sort(([a], [b]) => a.localeCompare(b)) : []) {
      trace!.push({
        candidateId: `rejected|${title}`,
        key: titleIdentityKey(title) ?? '',
        kind: 'unknown',
        title,
        spellings: [title],
        airings: seen.airings,
        epgYears: [],
        tmdb: { ids: [], evidence: 'none' },
        decision: 'rejected',
        reason: seen.reason,
      });
    }
    report.durationMs = Date.now() - started;
    return report;
  }

  /** Path plan per entity from one bounded legacy-title read; also used by the `pathless` audit. */
  async planPaths(entities: ContentEntityRecord[]): Promise<Map<string, ReturnType<typeof planCanonicalPaths>>> {
    const owners = await this.ports.evidence.historicSlugOwners([...new Set(entities.flatMap((e) => plannedSlugs(e)))]);
    return new Map(entities.map((e) => [e.entityId, planCanonicalPaths(e, (slug) => owners.get(slug) ?? [])] as const));
  }

  private entityInput(c: Candidate, row?: TitleKeyRow): Omit<ContentEntityInsert, 'entityId'> {
    return {
      kind: c.kind,
      title: c.title,
      normalizedTitle: c.key,
      year: c.year,
      externalIds: c.tmdb ? { tmdb: c.tmdb } : {},
      matching: {
        method: row?.method ?? (c.tmdb ? 'tmdb_exact' : 'title'),
        confidence: row?.confidence ?? (c.tmdb ? CONFIRMED_SEARCH_CONFIDENCE : 0.8),
        decidedAt: new Date(),
        decidedBy: this.opts.actor ?? 'ingest',
        ...(this.opts.admit instanceof Set && this.admitted(c) ? { assurance: 'independently_supported' as const } : {}),
      },
    };
  }
}

const log = logger.child('ContentIdentity');
const evidence = new MongoIdentityEvidenceSource();

export function createContentIdentityIngestion(
  mode: 'shadow' | 'write',
  airingRefs = false,
  admit?: ReadonlySet<string>,
  scope?: 'admitted'
): ContentIdentityIngestion {
  const ports = {
    entities: new MongoContentEntityRepository(),
    slugs: new MongoContentSlugRepository(),
    titleKeys: new MongoContentTitleKeyRepository(),
    evidence,
    airingRefs: new MongoAiringEntityRefWriter(),
  };
  return new ContentIdentityIngestion(ports, new ContentIdentityService(ports.entities, ports.slugs, ports.titleKeys), {
    mode,
    airingRefs,
    maxCreates: contentIdentityMaxCreates(),
    admit,
    scope,
  });
}

/**
 * CONTENT_IDENTITY_ADMIT_FILE: the `content-identity evidence --out` verdicts. Only AUTO_ACCEPT
 * lines of independently supported identities admit a candidate; an unset, missing or unreadable
 * file admits nothing, so a write flag alone never creates an entity.
 */
export function admissionFromEnv(env: NodeJS.ProcessEnv = process.env): ReadonlySet<string> {
  const admitted = new Set<string>();
  const file = String(env.CONTENT_IDENTITY_ADMIT_FILE || '').trim();
  if (!file) return admitted;
  try {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.startsWith('{')) continue;
      const v = JSON.parse(line);
      if (v.decision === 'AUTO_ACCEPT' && v.assurance === 'independently_supported' && typeof v.candidateId === 'string') admitted.add(v.candidateId);
    }
  } catch (error) {
    log.warn('Content identity admission file unreadable; nothing is admitted', { message: String((error as Error)?.message || '').slice(0, 200) });
    return new Set();
  }
  if (contentIdentityWriteScope(env) && admitted.size > ADMITTED_SCOPE_CEILING) {
    log.warn('Content identity admission file exceeds the admitted-scope ceiling; nothing is admitted', { admitted: admitted.size, ceiling: ADMITTED_SCOPE_CEILING });
    return new Set();
  }
  return admitted;
}

/**
 * Called by `TvReadModelBuilder.rebuildDate` after the day is stored. Null when every flag is off.
 * Never throws: an identity failure is logged and the schedule rebuild carries on unchanged.
 */
export async function runContentIdentity(
  date: string,
  airings: any[],
  years: ReadonlyMap<string, unknown>,
  rawYears?: ReadonlyMap<string, unknown>
): Promise<IdentityRunReport | null> {
  const flags = readContentIdentityFlags(process.env, mongoose.connection.db?.databaseName);
  if (!flags.shadow && !flags.writes) return null;
  try {
    const report = await createContentIdentityIngestion(flags.writes ? 'write' : 'shadow', flags.airingRefs, admissionFromEnv(), contentIdentityWriteScope()).run(
      date,
      observationsFromAirings(airings, years, rawYears)
    );
    log.info('Content identity run', report);
    return report;
  } catch (error) {
    log.warn('Content identity run failed; schedule rebuild unaffected', {
      date,
      error: (error as Error)?.name,
      message: String((error as Error)?.message || '').slice(0, 300),
    });
    return null;
  }
}
