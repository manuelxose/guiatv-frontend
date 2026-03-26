import { Program } from '../entities/Program';
import { ChannelId } from '../value-objects/ChannelId';
import { DateRange } from '../value-objects/DateRange';

/**
 * Optional constraints to narrow program searches.
 */
export interface ProgramFilters {
  channelId?: string;
  dateRange?: DateRange;
  genre?: string;
  limit?: number;
  offset?: number;
}

/**
 * Persistence abstraction for working with program records.
 */
export interface IProgramRepository {
  /**
   * Retrieves a single program by its unique identifier.
   */
  findById(id: string): Promise<Program | null>;
  /**
   * Loads all programs for the given channel in a date range.
   */
  findByChannel(channelId: ChannelId, dateRange: DateRange): Promise<Program[]>;
  /**
   * Retrieves programs filtered by date and optional attributes.
   */
  findByDateRange(
    dateRange: DateRange,
    filters?: ProgramFilters
  ): Promise<Program[]>;
  /**
   * Returns programs for a specific day. Date format: YYYYMMDD.
   */
  findByDate(date: string, fields?: 'minimal' | 'full'): Promise<Program[]>; // YYYYMMDD format
  /**
   * Fetches programs currently airing for the provided channels.
   */
  findNowPlaying(channelIds: string[], at: Date): Promise<Program[]>;
  /**
   * Full text and faceted search across programs.
   */
  search(params: {
    date: string;
    text?: string;
    category?: string;
    channelIds?: string[];
    limit: number;
    offset?: number;
    fields?: 'minimal' | 'full';
  }): Promise<{ items: Program[]; total: number }>;
  /**
   * Inserts or updates a single program aggregate.
   */
  save(program: Program): Promise<void>;
  /**
   * Inserts or updates multiple programs in bulk.
   */
  saveBatch(programs: Program[]): Promise<void>;
  /**
   * Removes programs within a given date range.
   */
  deleteByDateRange(dateRange: DateRange): Promise<void>;
  /**
   * Removes overlapping programs for a set of channels in a given date range.
   * Used by sync to replace a channel/day slice without keeping stale airings.
   */
  deleteOverlappingByChannels(
    channelIds: string[],
    dateRange: DateRange
  ): Promise<void>;
  /**
   * Removes overlapping programs for a source/channel/date slice without
   * touching rows from other feeds.
   */
  deleteOverlappingBySourceAndChannels(
    sourceFeed: string,
    channelIds: string[],
    dateRange: DateRange
  ): Promise<void>;
  /**
   * Computes and patches derived fields for a given day, returning the number of updated records.
   */
  backfillComputedFields(date: string): Promise<number>;
  /**
   * Flexible title search within a rolling time window.
   * Returns programs whose title contains titleFragment (case-insensitive)
   * and that overlap with [now-1h, now+windowHours].
   */
  findByTitleApprox(titleFragment: string, windowHours?: number): Promise<Program[]>;
  /**
   * Returns previously enriched metadata (tmdbId + image) for a set of exact titles.
   * Used to avoid redundant TMDB API calls on repeated syncs.
   */
  findEnrichedByTitles(titles: string[]): Promise<Array<{
    title: string;
    tmdbId: number;
    image: string;
    description?: string;
    year?: string;
    rating?: string;
  }>>;
}
