import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { IMediaCatalogRepository } from '@/domain/repositories/IMediaCatalogRepository';
import { MediaCatalogEntry, MediaContentType } from '@/domain/entities/MediaCatalogEntry';
import { TMDBDetailResult, TMDBService } from '@/infrastructure/external/TMDBService';
import { StaleWhileRevalidateCache } from '@/infrastructure/cache/StaleWhileRevalidateCache';
import { l1Cache } from '@/infrastructure/cache/L1Cache';
import { isMediaEntryStale } from '@/shared/utils/mediaFreshness';
import { normalizeTvToken } from '@/shared/utils/tvMetadata';
import { logger } from '@/shared/utils/logger';
import { measureTiming } from '@/shared/utils/performanceTiming';

const serviceLogger = logger.child('MediaCatalogService');

/** Redis envelope policy: keeps serving a value for up to 30 days while the
 * Mongo/TMDB layers catch up in the background, refreshed opportunistically
 * every 6h. This is independent of the Mongo-level metadata freshness window
 * (`mediaFreshness.ts`) — the loader itself re-checks that before ever
 * touching TMDB, so a "fresh" Redis envelope can still short-circuit straight
 * to a Mongo hit without a network call. */
const REDIS_ENVELOPE_POLICY = { freshSeconds: 6 * 3600, staleSeconds: 30 * 24 * 3600 };
const L1_TTL_MS = 60_000;

export interface RecordSearchMatchInput {
  tmdbId: number;
  tmdbType: 'movie' | 'tv';
  title: string;
  synopsis?: string;
  year?: string;
  rating?: number;
  posterPath?: string | null;
  genreTags?: string[];
}

/**
 * Layered lookup for reusable media metadata:
 *   1. L1 in-process cache (per worker, ms-lived)
 *   2. Valkey/Redis (via StaleWhileRevalidateCache, hours-to-days)
 *   3. Local Mongo media catalog (persistent, days-to-weeks freshness window)
 *   4. TMDB — only on a genuine cache miss or stale Mongo metadata
 *
 * Returns the same `TMDBDetailResult` shape `TMDBService.getMovieById/getTVById`
 * already returned, so existing call sites (CatalogService, GetContentDetail)
 * need no changes to their mapping logic — only to where they fetch from.
 */
export class MediaCatalogService {
  private readonly swr: StaleWhileRevalidateCache;

  constructor(
    private readonly repository: IMediaCatalogRepository,
    private readonly tmdbService: TMDBService,
    private readonly cacheRepository?: ICacheRepository | null
  ) {
    this.swr = new StaleWhileRevalidateCache(cacheRepository ?? undefined);
  }

  async getDetail(
    tmdbId: number | undefined,
    tmdbType: 'movie' | 'tv'
  ): Promise<TMDBDetailResult | null> {
    if (!tmdbId || !Number.isFinite(tmdbId) || tmdbId <= 0) {
      return null;
    }

    const key = buildDetailKey(tmdbType, tmdbId);

    const l1Hit = l1Cache.get(key) as TMDBDetailResult | null | undefined;
    if (l1Hit !== undefined) {
      return l1Hit;
    }

    const result = await this.swr.getOrLoad<TMDBDetailResult | null>(
      key,
      REDIS_ENVELOPE_POLICY,
      () => this.loadFromMongoOrTmdb(tmdbId, tmdbType),
      (value) => value !== null
    );

    l1Cache.set(key, result, L1_TTL_MS);
    return result;
  }

  /**
   * TMDB-free read: L1 -> Redis (peek, no lock/revalidate) -> Mongo. Never
   * calls TMDB, so it always resolves in the low single-digit milliseconds —
   * safe to sit on the critical detail-page path. Returns whatever is known
   * locally even if stale; a stale Mongo hit kicks a non-blocking background
   * refresh via `getDetail` so the *next* request sees fresher data, without
   * making *this* request pay for it.
   */
  async getLocalOnly(
    tmdbId: number | undefined,
    tmdbType: 'movie' | 'tv'
  ): Promise<TMDBDetailResult | null> {
    if (!tmdbId || !Number.isFinite(tmdbId) || tmdbId <= 0) {
      return null;
    }

    const key = buildDetailKey(tmdbType, tmdbId);

    const l1Hit = l1Cache.get(key) as TMDBDetailResult | null | undefined;
    if (l1Hit !== undefined) {
      return l1Hit;
    }

    if (this.cacheRepository) {
      try {
        const envelope = await this.cacheRepository.get<{ value: TMDBDetailResult | null }>(key);
        if (envelope && envelope.value !== undefined) {
          l1Cache.set(key, envelope.value, L1_TTL_MS);
          return envelope.value;
        }
      } catch {
        // Redis being unavailable must never block a "local only" read.
      }
    }

    const existing = await measureTiming('media', async () => {
      try {
        return await this.repository.findByTmdbId(tmdbType, tmdbId);
      } catch (error) {
        serviceLogger.warn('Mongo media catalog lookup failed', {
          tmdbId,
          tmdbType,
          error: (error as Error).message,
        });
        return null;
      }
    });
    if (!existing) {
      return null;
    }

    const result = toTmdbDetailResult(existing);

    if (isMediaEntryStale(existing)) {
      // Fire-and-forget: refresh the shared cache for the next request; this
      // request already has what it needs. Triggered *before* the L1 write
      // below so `getDetail`'s own L1 check doesn't short-circuit on the
      // stale value we're about to cache and skip the refresh entirely.
      this.getDetail(tmdbId, tmdbType).catch(() => undefined);
    }

    l1Cache.set(key, result, L1_TTL_MS);
    return result;
  }

  /**
   * Lightweight write used by EPG enrichment / search once a TMDB match is
   * found, so the *next* detail lookup for that title resolves locally
   * instead of re-hitting TMDB. `markEnrichedNow` is deliberately omitted —
   * a search-result match doesn't carry cast/runtime/full genres, so the
   * entry stays "stale" until `getDetail` performs (and persists) a real
   * detail fetch.
   */
  async recordSearchMatch(input: RecordSearchMatchInput): Promise<string | undefined> {
    if (!input.tmdbId || !Number.isFinite(input.tmdbId)) return undefined;
    try {
      const entry = await this.repository.upsert({
        tmdbId: input.tmdbId,
        tmdbType: input.tmdbType,
        contentType: input.tmdbType === 'tv' ? 'series' : 'movie',
        title: input.title,
        canonicalGenres: input.genreTags,
        synopsis: input.synopsis,
        year: input.year,
        rating: input.rating,
        posterPath: input.posterPath ?? undefined,
        metadataSource: 'epg',
      });
      return entry.id;
    } catch (error) {
      serviceLogger.warn('Failed to record EPG/search TMDB match', {
        tmdbId: input.tmdbId,
        error: (error as Error).message,
      });
      return undefined;
    }
  }

  /** Best-effort identity resolution for titles seen through EPG, before
   * spending a TMDB search call. Returns entries that already carry a TMDB id. */
  async findKnownMatchesForTitles(titles: string[]): Promise<MediaCatalogEntry[]> {
    const normalized = Array.from(
      new Set(titles.map((title) => normalizeTvToken(title, ' ')).filter(Boolean))
    );
    if (!normalized.length) return [];
    const entries = await this.repository.findByNormalizedTitles(normalized);
    return entries.filter((entry) => typeof entry.tmdbId === 'number');
  }

  private async loadFromMongoOrTmdb(
    tmdbId: number,
    tmdbType: 'movie' | 'tv'
  ): Promise<TMDBDetailResult | null> {
    const contentType: MediaContentType = tmdbType === 'tv' ? 'series' : 'movie';

    let existing: MediaCatalogEntry | null = null;
    try {
      existing = await measureTiming('media', () => this.repository.findByTmdbId(tmdbType, tmdbId));
    } catch (error) {
      serviceLogger.warn('Mongo media catalog lookup failed', {
        tmdbId,
        tmdbType,
        error: (error as Error).message,
      });
    }

    if (existing && !isMediaEntryStale(existing)) {
      return toTmdbDetailResult(existing);
    }

    try {
      const detail = await measureTiming('tmdb', () =>
        tmdbType === 'movie'
          ? this.tmdbService.getMovieById(tmdbId)
          : this.tmdbService.getTVById(tmdbId)
      );

      if (detail) {
        // Write-through is fire-and-forget: a slow/failed persist must never
        // block the response that triggered it.
        this.persist(detail, tmdbType, contentType).catch((error) => {
          serviceLogger.warn('Failed to persist TMDB detail to media catalog', {
            tmdbId,
            tmdbType,
            error: (error as Error).message,
          });
        });
        return detail;
      }

      // TMDB responded with "not found" — serve whatever we already had
      // rather than surfacing a hole where a stale-but-real entry exists.
      return existing ? toTmdbDetailResult(existing) : null;
    } catch (error) {
      serviceLogger.warn('TMDB detail fetch failed, falling back to local catalog', {
        tmdbId,
        tmdbType,
        error: (error as Error).message,
      });
      // TMDB outage: never fail the request when local data — even stale —
      // is available.
      return existing ? toTmdbDetailResult(existing) : null;
    }
  }

  private async persist(
    detail: TMDBDetailResult,
    tmdbType: 'movie' | 'tv',
    contentType: MediaContentType
  ): Promise<void> {
    const title = detail.title || detail.name || '';
    if (!title) return;

    await this.repository.upsert({
      tmdbId: detail.id,
      tmdbType,
      contentType,
      title,
      originalTitle: detail.original_title || detail.original_name,
      canonicalGenres: (detail.genres || []).map((genre) => genre.name).filter(Boolean),
      tmdbGenres: (detail.genres || []).map((genre) => ({ id: genre.id, name: genre.name })),
      synopsis: detail.overview,
      year: extractYear(detail.release_date || detail.first_air_date),
      runtimeMinutes:
        typeof detail.runtime === 'number'
          ? detail.runtime
          : Array.isArray(detail.episode_run_time)
            ? detail.episode_run_time[0]
            : undefined,
      rating: detail.vote_average,
      voteCount: detail.vote_count,
      posterPath: detail.poster_path || undefined,
      backdropPath: detail.backdrop_path || undefined,
      castSummary: (detail.credits?.cast || []).slice(0, 10).map((member) => ({
        name: member.name,
        character: member.character,
        profilePath: member.profile_path || undefined,
      })),
      directors: (detail.credits?.crew || [])
        .filter((member) => member.job === 'Director' || member.job === 'Creator')
        .map((member) => member.name),
      metadataSource: 'tmdb',
      markEnrichedNow: true,
    });
  }
}

function buildDetailKey(tmdbType: 'movie' | 'tv', tmdbId: number): string {
  return `mediacat:detail:${tmdbType}:${tmdbId}`;
}

function extractYear(date?: string): string | undefined {
  if (!date) return undefined;
  const year = date.split('-')[0];
  return year && /^\d{4}$/.test(year) ? year : undefined;
}

/** Reconstructs a `TMDBDetailResult`-shaped object from a catalog entry so
 * downstream mapping code (CatalogService.mapCast/extractDirector, image URL
 * building via `getImageUrl(poster_path)`, etc.) works unchanged whether the
 * detail came from Mongo or a live TMDB call. */
function toTmdbDetailResult(entry: MediaCatalogEntry): TMDBDetailResult {
  const isTv = entry.contentType === 'series';
  const isoDate = entry.year ? `${entry.year}-01-01` : undefined;

  return {
    id: entry.tmdbId ?? 0,
    title: isTv ? '' : entry.title,
    name: isTv ? entry.title : undefined,
    original_title: entry.originalTitle || entry.title,
    original_name: isTv ? entry.originalTitle || entry.title : undefined,
    overview: entry.synopsis || '',
    poster_path: entry.posterPath || null,
    backdrop_path: entry.backdropPath || null,
    vote_average: entry.rating ?? 0,
    vote_count: entry.voteCount,
    release_date: !isTv ? isoDate : undefined,
    first_air_date: isTv ? isoDate : undefined,
    media_type: isTv ? 'tv' : 'movie',
    genres: entry.tmdbGenres.length
      ? entry.tmdbGenres
      : entry.canonicalGenres.map((name, index) => ({ id: -1 - index, name })),
    runtime: !isTv ? entry.runtimeMinutes : undefined,
    episode_run_time: isTv && entry.runtimeMinutes ? [entry.runtimeMinutes] : undefined,
    credits: {
      cast: entry.castSummary.map((member) => ({
        name: member.name,
        character: member.character,
        profile_path: member.profilePath || null,
      })),
      crew: entry.directors.map((name) => ({ name, job: 'Director' })),
    },
  };
}
