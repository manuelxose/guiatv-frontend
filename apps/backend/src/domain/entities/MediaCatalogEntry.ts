// src/v2/domain/entities/MediaCatalogEntry.ts

/**
 * A single cast credit kept for quick display without a full TMDB round trip.
 */
export interface MediaCastMemberProps {
  name: string;
  character?: string;
  profilePath?: string;
}

/** A TMDB genre id/name pair, kept alongside `canonicalGenres` so discover-style
 * TMDB calls (which need genre ids, not names) still work when a detail page is
 * served entirely from the local catalog instead of a live TMDB response. */
export interface MediaGenreRefProps {
  id: number;
  name: string;
}

export type MediaContentType = 'movie' | 'series';
export type MediaMetadataSource = 'tmdb' | 'epg' | 'manual' | 'backfill';

/**
 * Shape of a reusable media entity persisted in the local catalog. One row
 * per distinct piece of content (movie or series), independent of how many
 * EPG airings or user interactions reference it.
 */
export interface MediaCatalogEntryProps {
  id: string;
  tmdbId?: number;
  tmdbType?: 'movie' | 'tv';
  contentType: MediaContentType;
  title: string;
  normalizedTitle: string;
  originalTitle?: string;
  /** `${contentType}:${normalizedTitle}:${year}` — identity key used to dedupe
   * entries discovered before a TMDB id has been resolved (e.g. from EPG only). */
  normalizedIdentity: string;
  canonicalGenres: string[];
  tmdbGenres: MediaGenreRefProps[];
  synopsis?: string;
  year?: string;
  runtimeMinutes?: number;
  rating?: number;
  voteCount?: number;
  /** TMDB-relative image paths (e.g. "/abc123.jpg"), not absolute URLs, so the
   * existing `TMDBService.getImageUrl(path, size)` helper keeps working unchanged
   * regardless of whether the path came from a live TMDB call or this catalog. */
  posterPath?: string;
  backdropPath?: string;
  castSummary: MediaCastMemberProps[];
  directors: string[];
  metadataSource: MediaMetadataSource;
  /** Set only when this entry was populated from a full TMDB detail fetch.
   * Absent/undefined means the entry only has lightweight EPG/search data and
   * should still be treated as stale for freshness purposes. */
  lastEnrichedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Builds the dedup identity key shared by entities that have not resolved a TMDB id yet. */
export function computeNormalizedIdentity(
  contentType: MediaContentType,
  normalizedTitle: string,
  year?: string
): string {
  return `${contentType}:${normalizedTitle}:${year || ''}`;
}

/**
 * Immutable domain aggregate for a reusable media catalog entry.
 */
export class MediaCatalogEntry {
  private constructor(private readonly props: MediaCatalogEntryProps) {
    this.validate();
  }

  static create(props: MediaCatalogEntryProps): MediaCatalogEntry {
    return new MediaCatalogEntry(props);
  }

  private validate(): void {
    if (!this.props.id?.trim()) {
      throw new Error('MediaCatalogEntry ID cannot be empty');
    }
    if (!this.props.title?.trim()) {
      throw new Error('MediaCatalogEntry title cannot be empty');
    }
    if (!this.props.normalizedTitle?.trim()) {
      throw new Error('MediaCatalogEntry normalizedTitle cannot be empty');
    }
    if (!this.props.normalizedIdentity?.trim()) {
      throw new Error('MediaCatalogEntry normalizedIdentity cannot be empty');
    }
    if (this.props.tmdbId !== undefined && (!Number.isFinite(this.props.tmdbId) || this.props.tmdbId <= 0)) {
      throw new Error('MediaCatalogEntry tmdbId must be a positive number when present');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get tmdbId(): number | undefined {
    return this.props.tmdbId;
  }

  get tmdbType(): 'movie' | 'tv' | undefined {
    return this.props.tmdbType;
  }

  get contentType(): MediaContentType {
    return this.props.contentType;
  }

  get title(): string {
    return this.props.title;
  }

  get normalizedTitle(): string {
    return this.props.normalizedTitle;
  }

  get originalTitle(): string | undefined {
    return this.props.originalTitle;
  }

  get normalizedIdentity(): string {
    return this.props.normalizedIdentity;
  }

  get canonicalGenres(): string[] {
    return [...this.props.canonicalGenres];
  }

  get tmdbGenres(): MediaGenreRefProps[] {
    return [...this.props.tmdbGenres];
  }

  get synopsis(): string | undefined {
    return this.props.synopsis;
  }

  get year(): string | undefined {
    return this.props.year;
  }

  get runtimeMinutes(): number | undefined {
    return this.props.runtimeMinutes;
  }

  get rating(): number | undefined {
    return this.props.rating;
  }

  get voteCount(): number | undefined {
    return this.props.voteCount;
  }

  get posterPath(): string | undefined {
    return this.props.posterPath;
  }

  get backdropPath(): string | undefined {
    return this.props.backdropPath;
  }

  get castSummary(): MediaCastMemberProps[] {
    return [...this.props.castSummary];
  }

  get directors(): string[] {
    return [...this.props.directors];
  }

  get metadataSource(): MediaMetadataSource {
    return this.props.metadataSource;
  }

  get lastEnrichedAt(): Date | undefined {
    return this.props.lastEnrichedAt;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  toJSON() {
    return { ...this.props };
  }
}
