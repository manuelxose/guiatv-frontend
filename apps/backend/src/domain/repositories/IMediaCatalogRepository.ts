import {
  MediaCastMemberProps,
  MediaCatalogEntry,
  MediaContentType,
  MediaGenreRefProps,
  MediaMetadataSource,
} from '../entities/MediaCatalogEntry';

/**
 * Fields accepted by `upsert`. All fields other than `title`, `contentType`
 * and `metadataSource` are optional so a lightweight EPG/search write never
 * has to know (or clobber) the richer fields a prior TMDB detail fetch filled in.
 */
export interface MediaCatalogUpsertInput {
  tmdbId?: number;
  tmdbType?: 'movie' | 'tv';
  contentType: MediaContentType;
  title: string;
  originalTitle?: string;
  canonicalGenres?: string[];
  tmdbGenres?: MediaGenreRefProps[];
  synopsis?: string;
  year?: string;
  runtimeMinutes?: number;
  rating?: number;
  voteCount?: number;
  posterPath?: string;
  backdropPath?: string;
  castSummary?: MediaCastMemberProps[];
  directors?: string[];
  metadataSource: MediaMetadataSource;
  /** Set true only when this write comes from a full TMDB detail fetch, so
   * freshness rules can distinguish "fully enriched" from "seen once via EPG/search". */
  markEnrichedNow?: boolean;
}

/**
 * Persistence abstraction for the local, reusable media catalog.
 */
export interface IMediaCatalogRepository {
  findById(id: string): Promise<MediaCatalogEntry | null>;
  findByTmdbId(tmdbType: 'movie' | 'tv', tmdbId: number): Promise<MediaCatalogEntry | null>;
  findManyByTmdbIds(
    tmdbType: 'movie' | 'tv',
    tmdbIds: number[]
  ): Promise<MediaCatalogEntry[]>;
  findByNormalizedIdentity(identity: string): Promise<MediaCatalogEntry | null>;
  /** Used by EPG enrichment to check whether any known title/alias already
   * resolves to a catalog entry before spending a TMDB search call. */
  findByNormalizedTitles(normalizedTitles: string[]): Promise<MediaCatalogEntry[]>;
  /** Inserts or merges a media entry, deduped by TMDB id when known, otherwise
   * by normalized identity. Never downgrades a richer existing entry. */
  upsert(input: MediaCatalogUpsertInput): Promise<MediaCatalogEntry>;
  /** Entries never enriched from a full TMDB detail fetch, or last enriched
   * before `olderThan`. Used by freshness backfill/monitoring jobs. */
  findStale(olderThan: Date, limit: number): Promise<MediaCatalogEntry[]>;
  countAll(): Promise<number>;
}
