/**
 * Phase 3E: attaches independently verified metadata and upcoming broadcasts to an existing legacy detail payload.
 * It reads two existing stores (the media catalogue row, the EPG read model) and writes nothing.
 *
 * Contract: `apply` always returns a usable payload. Off, out of scope, no TMDB identity, a failed identity check, a
 * slow or failing read: the legacy payload comes back untouched (same object), so an enrichment problem can never
 * turn a healthy page into an error or an empty one. Only `enrichment` is ever added, and `airings`, robots-relevant
 * fields, synopsis, cast and artwork are not read back or altered.
 */
import type { IMediaCatalogRepository } from '@/domain/repositories/IMediaCatalogRepository';
import type { EnrichmentSource } from '@/domain/services/entityEnrichment';
import { TMDB_ATTRIBUTION } from '@/domain/services/entityEnrichment';
import { legacyBindingRefusals, legacyMetadataGaps, type LegacyPage } from '@/domain/services/legacyEnrichment';
import type { CatalogDetailDTO, CatalogLegacyEnrichmentDTO } from '@/application/dto/CatalogDTO';
import { Logger } from '@/shared/utils/logger';
import { enrichmentSourceFromCatalog } from './ContentEntityEnrichment';
import {
  BROADCAST_QUERY_LIMIT, BROADCAST_WINDOW_DAYS, GUIDE_TIME_ZONE, MongoBroadcastReader, broadcastWindowDates, selectWorkBroadcasts,
  type AiringRow, type IBroadcastReader,
} from './EntityBroadcastService';
import { LegacyEnrichmentPolicy, legacyEnrichmentPolicy } from './LegacyEnrichmentPolicy';

const logger = new Logger('LegacyEnrichment');

const DEFAULT_TIMEOUT_MS = 800;
const FACTS_TTL_MS = 60_000;
const FACTS_MAX = 500;
/** ponytail: per-process breaker; after this many consecutive failures enrichment is skipped for a minute. A shared breaker needs a store. */
const BREAKER_FAILURES = 5;
const BREAKER_PAUSE_MS = 60_000;

interface Facts { row: EnrichmentSource | null; rows: AiringRow[] | 'unavailable'; at: number }

export interface LegacyEnrichmentDeps {
  catalog: Pick<IMediaCatalogRepository, 'findByTmdbId'>;
  reader?: IBroadcastReader;
  policy?: LegacyEnrichmentPolicy;
  clock?: () => Date;
  timeoutMs?: number;
}

export interface LegacyEnrichmentContext {
  /** The TMDB type the page's tmdbId refers to; null = the page has no resolvable TMDB identity. */
  tmdbType: 'movie' | 'tv' | null;
  /** The request named the page by slug: whether that slug is the page's own (false = TMDB "first result" fallback). Undefined = requested by id. */
  slugBound?: boolean;
}

export class LegacyEnrichmentService {
  private readonly catalog: LegacyEnrichmentDeps['catalog'];
  private readonly reader: IBroadcastReader;
  private readonly policy: LegacyEnrichmentPolicy;
  private readonly clock: () => Date;
  private readonly timeoutMs: number;
  private readonly facts = new Map<string, Facts>();
  private readonly inFlight = new Map<string, Promise<Facts>>();
  private failures = 0;
  private pausedUntil = 0;
  /** Outcome counters for operators (`attached`, `refused:<reason>`, `skipped:<reason>`, `error`, `timeout`). */
  readonly counters: Record<string, number> = {};

  constructor(deps: LegacyEnrichmentDeps) {
    this.catalog = deps.catalog;
    this.timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.reader = deps.reader ?? new MongoBroadcastReader(this.timeoutMs);
    this.policy = deps.policy ?? legacyEnrichmentPolicy;
    this.clock = deps.clock ?? (() => new Date());
  }

  private count(outcome: string) { this.counters[outcome] = (this.counters[outcome] ?? 0) + 1; }

  async apply(detail: CatalogDetailDTO, ctx: LegacyEnrichmentContext): Promise<CatalogDetailDTO> {
    try {
      if (!this.policy.decide(detail.detailPath).enabled) return detail;
      if (!detail.tmdbId || !ctx.tmdbType) { this.count('skipped:no_tmdb_identity'); return detail; }
      if (Date.now() < this.pausedUntil) { this.count('skipped:breaker_open'); return detail; }
      const enrichment = await this.withTimeout(this.build(detail, detail.tmdbId, ctx.tmdbType, ctx.slugBound));
      this.failures = 0;
      return enrichment ? { ...detail, enrichment } : detail;
    } catch (error) {
      const timedOut = (error as Error)?.message === 'legacy enrichment timeout';
      this.count(timedOut ? 'timeout' : 'error');
      if (++this.failures >= BREAKER_FAILURES) { this.pausedUntil = Date.now() + BREAKER_PAUSE_MS; this.failures = 0; logger.warn('Legacy enrichment paused after repeated failures'); }
      logger.warn('Legacy enrichment failed; serving the legacy page unchanged', { message: String((error as Error)?.message || error).slice(0, 200) });
      return detail;
    }
  }

  private withTimeout<T>(work: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('legacy enrichment timeout')), this.timeoutMs); });
    work.catch(() => undefined); // a read that outlives the timeout must not become an unhandled rejection
    return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
  }

  private async build(detail: CatalogDetailDTO, tmdbId: number, tmdbType: 'movie' | 'tv', slugBound?: boolean): Promise<CatalogLegacyEnrichmentDTO | null> {
    // A programme page is already schedule-centric (now / next on its channels); its verified metadata is the addition.
    const withSchedule = detail.contentType !== 'program';
    const { row, rows } = await this.load(tmdbType, tmdbId, withSchedule);
    const page: LegacyPage = {
      source: detail.source, tmdbId, tmdbType, title: detail.title, releaseYear: detail.releaseYear, slugBound,
      genres: detail.genres ?? [], durationMinutes: detail.durationMinutes,
    };
    const refusals = legacyBindingRefusals(page, row);
    if (refusals.length || !row) {
      for (const reason of refusals) this.count(`refused:${reason}`);
      return null;
    }

    const gaps = legacyMetadataGaps(page, row);
    const hasGaps = Object.keys(gaps).length > 0;
    const now = this.clock();
    const enrichment: CatalogLegacyEnrichmentDTO = { version: 1 };
    if (hasGaps) {
      enrichment.metadata = gaps;
      enrichment.attribution = { notice: TMDB_ATTRIBUTION, updatedAt: row.lastEnrichedAt!.toISOString() };
    }
    if (!withSchedule) { /* no schedule section */ } else if (rows !== 'unavailable') {
      const selection = selectWorkBroadcasts(
        { tmdbId, titles: [row.title, row.originalTitle], mediaId: row.mediaId, requireCatalogueRow: true }, rows, now
      );
      enrichment.broadcasts = {
        status: selection.items.length ? 'ok' : 'none', windowDays: BROADCAST_WINDOW_DAYS, generatedAt: now.toISOString(), timeZone: GUIDE_TIME_ZONE, items: selection.items,
      };
      for (const [reason, n] of Object.entries(selection.rejected)) if (reason !== 'already_ended' && reason !== 'duplicate_slot') this.counters[`rejected:${reason}`] = (this.counters[`rejected:${reason}`] ?? 0) + n;
    } else this.count('skipped:schedule_unavailable');
    this.count('attached');
    return enrichment;
  }

  /** One catalogue read and one indexed schedule read per work per minute, shared by concurrent requests. */
  private load(tmdbType: 'movie' | 'tv', tmdbId: number, withSchedule: boolean): Promise<Facts> {
    const key = `${tmdbType}:${tmdbId}:${withSchedule ? 's' : 'm'}`;
    const cached = this.facts.get(key);
    if (cached && Date.now() - cached.at < FACTS_TTL_MS) return Promise.resolve(cached);
    const pending = this.inFlight.get(key);
    if (pending) return pending;
    const read = (async (): Promise<Facts> => {
      const entry = await this.catalog.findByTmdbId(tmdbType, tmdbId);
      const row = entry ? enrichmentSourceFromCatalog(entry) : null;
      let rows: Facts['rows'] = 'unavailable';
      if (row && withSchedule) {
        try { rows = await this.reader.findByTmdbId(tmdbId, broadcastWindowDates(this.clock()), BROADCAST_QUERY_LIMIT); }
        catch (error) { logger.warn('Schedule read failed; not claiming a schedule', { message: String((error as Error)?.message || error).slice(0, 200) }); }
      }
      const facts = { row, rows, at: Date.now() };
      if (rows !== 'unavailable' || !row || !withSchedule) {
        if (this.facts.size >= FACTS_MAX) this.facts.delete(this.facts.keys().next().value as string);
        this.facts.set(key, facts);
      }
      return facts;
    })().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, read);
    return read;
  }
}
