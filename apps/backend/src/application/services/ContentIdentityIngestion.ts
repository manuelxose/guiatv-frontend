/**
 * Phase 2D-2: persistent identity for the airings of one rebuilt day. Runs after the day's
 * airings are stored, so the normal schedule never depends on it, and does nothing unless a
 * CONTENT_IDENTITY_* flag is on. Batch shape: one read per collection for the whole day (title
 * keys by `$in`, TMDB owners, catalogue evidence, existing entities), then one decision per
 * distinct identity candidate, never per airing.
 */
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
  isGenericContentTitle,
  newEntityId,
  planCanonicalPaths,
  plannedSlugs,
  TitleKeyRow,
  titleIdentityKey,
  TmdbRef,
} from '@/domain/services/contentIdentity';
import { contentIdentityMaxCreates, readContentIdentityFlags } from '@/shared/config/contentEntities';
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
  editorialCategory?: string;
  sportFacet?: string | null;
  tmdbId?: number;
  mediaId?: string;
  /** EPG `<date>`; used only for films, where it tells remakes apart. */
  year?: number;
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

interface Candidate {
  key: string;
  kind: ContentKind;
  title: string;
  year?: number;
  tmdb?: TmdbRef;
  airingIds: string[];
  entityId?: string;
  rowId?: string;
}

export function observationsFromAirings(airings: any[], years: ReadonlyMap<string, unknown>): IdentityObservation[] {
  return airings.map((airing) => {
    const year = Number.parseInt(String(years.get(airing.id) ?? ''), 10);
    return {
      airingId: airing.id,
      title: String(airing.program?.title || ''),
      editorialCategory: airing.program?.editorialCategory,
      sportFacet: airing.program?.sportFacet,
      tmdbId: Number.isInteger(airing.program?.tmdbId) ? airing.program.tmdbId : undefined,
      mediaId: airing.program?.mediaId ? String(airing.program.mediaId) : undefined,
      year: year >= 1888 && year <= 2100 ? year : undefined,
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
    private readonly opts: { mode: 'shadow' | 'write'; airingRefs: boolean; maxCreates: number; actor?: string }
  ) {}

  async run(date: string, observations: IdentityObservation[]): Promise<IdentityRunReport> {
    const started = Date.now();
    const write = this.opts.mode === 'write';
    const report = newIdentityReport(this.opts.mode, date);
    report.airings = observations.length;

    // 1. Exclusions that need no I/O. Not the read model's `titleResolutionState`: it comes from
    // `isGenericMovieTitle`, which also suppresses named programmes such as "Cine de barrio".
    const kept: Array<{ obs: IdentityObservation; key: string }> = [];
    for (const obs of observations) {
      const key = titleIdentityKey(obs.title);
      if (!key) count(report.excluded, 'unkeyable_title');
      else if (isGenericContentTitle(obs.title)) count(report.excluded, 'generic_title');
      else kept.push({ obs, key });
    }

    // 2. TMDB evidence and kind, then group by identity context (same key, kind, TMDB work, year).
    const catalog = await this.ports.evidence.catalogEntries(
      kept.map(({ obs }) => obs.mediaId).filter((id): id is string => Boolean(id)),
      kept.map(({ obs }) => obs.tmdbId).filter((id): id is number => Boolean(id))
    );
    const groups = new Map<string, Candidate>();
    for (const { obs, key } of kept) {
      const confirmed = confirmTmdb(obs, key, catalog);
      if (obs.tmdbId) report.tmdb[confirmed ? 'confirmed' : 'unconfirmed']++;
      const kind = classifyContentKind({ ...obs, tmdbType: confirmed?.tmdb?.type });
      if (kind === 'sport') {
        count(report.excluded, 'sport_event');
        continue;
      }
      const tmdb = confirmed?.tmdb;
      const year = confirmed ? confirmed.year : kind === 'movie' ? obs.year : undefined;
      const id = [key, kind, tmdb ? `${tmdb.type}:${tmdb.id}` : '', year ?? ''].join('|');
      const group = groups.get(id) ?? { key, kind, title: obs.title, year, tmdb, airingIds: [] };
      // The shortest spelling is the cleanest title ("La Promesa" over "La Promesa T1 E929").
      if (obs.title.length < group.title.length || (obs.title.length === group.title.length && obs.title < group.title)) {
        group.title = obs.title;
      }
      group.airingIds.push(obs.airingId);
      groups.set(id, group);
    }
    // Deterministic order; within a key, TMDB-backed and dated candidates decide first.
    const candidates = [...groups.entries()]
      .sort(([a, x], [b, y]) => x.key.localeCompare(y.key) || Number(!x.tmdb) - Number(!y.tmdb) || Number(!x.year) - Number(!y.year) || a.localeCompare(b))
      .map(([, c]) => c);
    report.candidates = candidates.length;
    candidates.forEach((c) => count(report.kinds, c.kind));

    // 3. Everything already stored for these keys and TMDB works: one batch each.
    const rowsByKey = new Map<string, TitleKeyRecord[]>();
    for (const row of await this.ports.titleKeys.listByKeys([...new Set(candidates.map((c) => c.key))])) {
      rowsByKey.set(row.key, [...(rowsByKey.get(row.key) ?? []), row]);
    }
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
        c.tmdb ? tmdbOwner.get(`${c.tmdb.type}:${c.tmdb.id}`) : null
      );
      if (decision.decision === 'review' && decision.row.reason === 'unknown_kind') {
        count(report.decisions, 'unresolved');
        count(report.reasons, 'unknown_kind');
        return;
      }
      count(report.decisions, decision.decision);
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
    for (const e of pathless) {
      const plan = plans.get(e.entityId) as ReturnType<typeof planCanonicalPaths>;
      plan.blocked.forEach((reason) => count(report.slugs.refused, reason));
      let path: string | null = null;
      if (write && plan.paths.length) {
        try {
          path = await this.service.allocateCanonicalPath(e.entityId, plan.paths);
        } catch (error) {
          if (error instanceof ContentIdentityNotReadyError) throw error;
          report.failed++;
          count(report.slugs.pathless, 'write_failed');
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
      } else count(report.slugs.pathless, plan.paths.length ? 'taken' : plan.blocked[0]);
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
      },
    };
  }
}

const log = logger.child('ContentIdentity');
const evidence = new MongoIdentityEvidenceSource();

export function createContentIdentityIngestion(mode: 'shadow' | 'write', airingRefs = false): ContentIdentityIngestion {
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
  });
}

/**
 * Called by `TvReadModelBuilder.rebuildDate` after the day is stored. Null when every flag is off.
 * Never throws: an identity failure is logged and the schedule rebuild carries on unchanged.
 */
export async function runContentIdentity(
  date: string,
  airings: any[],
  years: ReadonlyMap<string, unknown>
): Promise<IdentityRunReport | null> {
  const flags = readContentIdentityFlags(process.env, mongoose.connection.db?.databaseName);
  if (!flags.shadow && !flags.writes) return null;
  try {
    const report = await createContentIdentityIngestion(flags.writes ? 'write' : 'shadow', flags.airingRefs).run(
      date,
      observationsFromAirings(airings, years)
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
