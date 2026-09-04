import { Program, ProgramProps } from '@/domain/entities/Program';
import { ChannelId } from '@/domain/value-objects/ChannelId';
import { DateRange } from '@/domain/value-objects/DateRange';
import {
  IProgramRepository,
  ProgramFilters,
} from '@/domain/repositories/IProgramRepository';
import { ProgramModel, IProgramDocument } from '../database/models/Program.model';
import { logger } from '../../shared/utils/logger';
import { DateUtils } from '../../shared/utils/dateUtils';
import {
  buildProgramBrandKey,
  buildProgramTitleAliases,
  normalizeTvToken,
} from '../../shared/utils/tvMetadata';

// Using a local loose type for lean results to avoid depending on specific
// `mongoose` exported types (which vary between versions). We only access
// the document fields, so a partial document shape is sufficient here.
type ProgramDoc = Partial<IProgramDocument> & Record<string, any>;

export class MongoProgramRepository implements IProgramRepository {
  /**
   * Find program by ID
   */
  async findById(id: string): Promise<Program | null> {
    try {
      const doc = await ProgramModel.findOne({ id }).lean().exec() as ProgramDoc | null;
      return doc ? this.mapToDomain(doc) : null;
    } catch (error) {
      logger.error('Error finding program by ID', { id, error });
      throw error;
    }
  }

  /**
   * Find programs by channel and date range
   */
  async findByChannel(
    channelId: ChannelId,
    dateRange: DateRange
  ): Promise<Program[]> {
    try {
      const docs = await ProgramModel.find({
        channelId: channelId.value,
        startTime: { $lt: dateRange.end },
        endTime: { $gt: dateRange.start },
      })
        .sort({ startTime: 1 })
        .lean()
        .exec();

      return docs.map((doc: ProgramDoc) => this.mapToDomain(doc));
    } catch (error) {
      logger.error('Error finding programs by channel', {
        channelId: channelId.value,
        dateRange,
        error,
      });
      throw error;
    }
  }

  /**
   * Find programs by date range with optional filters
   */
  async findByDateRange(
    dateRange: DateRange,
    filters?: ProgramFilters
  ): Promise<Program[]> {
    try {
      const query: any = {
        startTime: { $lt: dateRange.end },
        endTime: { $gt: dateRange.start },
      };

      if (filters?.channelId) {
        query.channelId = filters.channelId;
      }

      if (filters?.genre) {
        // Case-insensitive substring match (mirrors the historical in-process
        // `genre.includes(...)` filter callers used to apply after fetching
        // full days of data) so pushing this filter into Mongo doesn't change
        // matching behavior for callers migrating off unbounded JS filtering.
        const escaped = filters.genre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.category = new RegExp(escaped, 'i');
      }

      let queryBuilder = ProgramModel.find(query).sort({ startTime: 1 });

      if (filters?.limit) {
        queryBuilder = queryBuilder.limit(filters.limit);
      }

      if (filters?.offset) {
        queryBuilder = queryBuilder.skip(filters.offset);
      }

      const docs = await queryBuilder.lean().exec() as ProgramDoc[];
      return docs.map((doc: ProgramDoc) => this.mapToDomain(doc));
    } catch (error) {
      logger.error('Error finding programs by date range', {
        dateRange,
        filters,
        error,
      });
      throw error;
    }
  }

  /**
   * Save (create or update) a program
   */
  async save(program: Program): Promise<void> {
    try {
      const setDoc = this.buildSetDoc(program);

      await ProgramModel.findOneAndUpdate(
        { id: program.id },
        { $set: setDoc },
        { upsert: true, new: true }
      ).exec();

      logger.debug('Program saved', { programId: program.id });
    } catch (error) {
      logger.error('Error saving program', { programId: program.id, error });
      throw error;
    }
  }

  /**
   * Save multiple programs in batch
   */
  async saveBatch(programs: Program[]): Promise<void> {
    try {
      if (programs.length === 0) {
        return;
      }

      const bulkOps = programs.map((program) => ({
        updateOne: {
          filter: { id: program.id },
          // Use $set so unset fields don't overwrite existing enriched data.
          // image/tmdbId/rating are omitted when null so a prior TMDB-matched
          // poster is preserved if this sync run's TMDB lookup failed.
          update: { $set: this.buildSetDoc(program) },
          upsert: true,
        },
      }));

      await ProgramModel.bulkWrite(bulkOps);
      logger.debug('Programs saved in batch', { count: programs.length });
    } catch (error) {
      logger.error('Error saving programs in batch', {
        count: programs.length,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete programs by date range
   */
  async deleteByDateRange(dateRange: DateRange): Promise<void> {
    try {
      const result = await ProgramModel.deleteMany({
        startTime: { $gte: dateRange.start },
        endTime: { $lte: dateRange.end },
      }).exec();

      logger.debug('Programs deleted by date range', {
        dateRange,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      logger.error('Error deleting programs by date range', {
        dateRange,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete overlapping programs for a given set of channels.
   * This keeps sync idempotent even when feed ids or titles change between runs.
   */
  async deleteOverlappingByChannels(
    channelIds: string[],
    dateRange: DateRange
  ): Promise<void> {
    try {
      if (!channelIds.length) {
        return;
      }

      const result = await ProgramModel.deleteMany({
        channelId: { $in: channelIds },
        startTime: { $lt: dateRange.end },
        endTime: { $gt: dateRange.start },
      }).exec();

      logger.debug('Programs deleted by overlapping channel/date range', {
        channelCount: channelIds.length,
        dateRange,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      logger.error('Error deleting programs by overlapping channel/date range', {
        channelIds,
        dateRange,
        error,
      });
      throw error;
    }
  }

  async deleteOverlappingBySourceAndChannels(
    sourceFeed: string,
    channelIds: string[],
    dateRange: DateRange
  ): Promise<void> {
    try {
      if (!sourceFeed || !channelIds.length) {
        return;
      }

      const result = await ProgramModel.deleteMany({
        sourceFeed,
        channelId: { $in: channelIds },
        startTime: { $lt: dateRange.end },
        endTime: { $gt: dateRange.start },
      }).exec();

      logger.debug('Programs deleted by source/channel/date overlap', {
        sourceFeed,
        channelCount: channelIds.length,
        dateRange,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      logger.error('Error deleting programs by source/channel/date overlap', {
        sourceFeed,
        channelIds,
        dateRange,
        error,
      });
      throw error;
    }
  }

  /**
   * Find programs by specific date (YYYYMMDD format)
   * INCLUDES programs that started before this day but are still airing (crossing midnight)
   */
  async findByDate(date: string, fields: 'minimal' | 'full' = 'full'): Promise<Program[]> {
    try {
      const dateRange = this.parseDateToRange(date);

      // Inclusion projection for minimal: only the fields needed for grid rendering
      // plus tmdbId (needed by SitemapController.buildProgramsSitemap() to filter
      // TMDB-enriched programs — without it every doc.tmdbId is undefined and the
      // sitemap silently ends up empty regardless of real data).
      // Inclusion is faster than exclusion because Mongo reads fewer fields from disk.
      const projection =
        fields === 'minimal'
          ? { _id: 0, id: 1, channelId: 1, canonicalChannelId: 1, title: 1, startTime: 1, endTime: 1, category: 1, type: 1, tmdbId: 1 }
          : undefined;

      // Use overlap detection: program overlaps with day if:
      // - Program starts before day ends AND
      // - Program ends after day starts
      // This includes:
      // 1. Programs starting and ending within the day
      // 2. Programs starting before the day but ending during the day (crossing midnight)
      // 3. Programs starting during the day but ending after (spanning to next day)
      const docs = await ProgramModel.find({
        startTime: { $lt: dateRange.end },    // Starts before day ends
        endTime: { $gt: dateRange.start },     // Ends after day starts
      })
        .sort({ channelId: 1, startTime: 1 })
        .select(projection as any)
        .lean()
        .exec() as ProgramDoc[];

      return docs.map((doc: ProgramDoc) => this.mapToDomain(doc));
    } catch (error) {
      logger.error('Error finding programs by date', { date, error });
      throw error;
    }
  }

  /**
   * Search programs for discovery/search use case with Mongo filters.
   */
  async search(params: {
    date: string;
    text?: string;
    category?: string;
    channelIds?: string[];
    limit: number;
    offset?: number;
    fields?: 'minimal' | 'full';
  }): Promise<{ items: Program[]; total: number }> {
    try {
      const dateRange = this.parseDateToRange(params.date);
      const query: any = {
        startTime: { $lt: dateRange.end },
        endTime: { $gt: dateRange.start },
      };

      if (params.channelIds?.length) {
        query.channelId = { $in: params.channelIds };
      }

      if (params.category) {
        query.category = new RegExp(params.category, 'i');
      }

      if (params.text) {
        const regex = new RegExp(params.text, 'i');
        query.$or = [{ title: regex }, { description: regex }];
      }

      const projection =
        params.fields === 'minimal'
          ? { description: 0, image: 0 }
          : undefined;

      const docs = await ProgramModel.find(query)
        .sort({ startTime: 1 })
        .skip(params.offset || 0)
        .limit(params.limit)
        .select(projection as any)
        .lean()
        .exec() as ProgramDoc[];

      const total = await ProgramModel.countDocuments(query).exec();

      return {
        items: docs.map((doc: ProgramDoc) => this.mapToDomain(doc)),
        total,
      };
    } catch (error) {
      logger.error('Error searching programs', { params, error });
      throw error;
    }
  }

  /**
   * Parse YYYYMMDD string to date range (start of day to end of day)
   */
  private parseDateToRange(dateStr: string): { start: Date; end: Date } {
    return DateUtils.getDayRangeYYYYMMDD(dateStr);
  }

  /**
   * Backfill computed fields for programs on a specific date
   */
  async backfillComputedFields(date: string): Promise<number> {
    try {
      const dateRange = this.parseDateToRange(date);
      const docs = await ProgramModel.find({
        startTime: { $gte: dateRange.start, $lt: dateRange.end },
      })
        .lean()
        .exec() as ProgramDoc[];

      if (!docs.length) return 0;

      const bulkOps = docs.map((doc) => {
        const startDate = new Date(doc.startTime as any);
        const endDate = new Date(doc.endTime as any);
        const dateStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
        const startUtc = startDate.toISOString();
        const endUtc = endDate.toISOString();
        const startMinutes = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
        let endMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
        if (endDate <= startDate) {
          endMinutes += 1440;
        }
        const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

        return {
          updateOne: {
            filter: { _id: (doc as any)._id },
            update: {
              $set: {
                date: doc.date || dateStr,
                startUtc,
                endUtc,
                startMinutes,
                endMinutes,
                durationMinutes,
              },
            },
          },
        };
      });

      const res = await ProgramModel.bulkWrite(bulkOps);
      return res.modifiedCount || 0;
    } catch (error) {
      logger.error('Error backfilling computed fields', { date, error });
      throw error;
    }
  }

  /**
   * Flexible title search within a rolling time window (default 48 h).
   * Case-insensitive regex on the title field; -1 h offset so ongoing programs are included.
   */
  async findByTitleApprox(titleFragment: string, windowHours = 48): Promise<Program[]> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 3_600_000); // -1 h for ongoing programs
      const windowEnd = new Date(now.getTime() + windowHours * 3_600_000);
      const escaped = titleFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');

      const docs = await ProgramModel.find({
        title: regex,
        startTime: { $lt: windowEnd },
        endTime: { $gt: windowStart },
      })
        .sort({ startTime: 1 })
        .limit(10)
        .select({ _id: 0, id: 1, channelId: 1, title: 1, startTime: 1, endTime: 1, category: 1 })
        .lean()
        .exec() as ProgramDoc[];

      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      logger.error('Error in findByTitleApprox', { titleFragment, error });
      throw error;
    }
  }

  /**
   * Return enriched metadata (tmdbId + image) for programs matching the given titles.
   * Used to skip TMDB API calls when a title was already enriched in a prior sync.
   */
  async findEnrichedByTitles(titles: string[]): Promise<Array<{
    title: string;
    tmdbId: number;
    image: string;
    description?: string;
    year?: string;
    rating?: string;
  }>> {
    if (!titles.length) return [];
    try {
      const normalizedTitles = Array.from(
        new Set(
          titles.flatMap((title) => buildProgramTitleAliases(title))
        )
      );
      const docs = await ProgramModel.find(
        {
          $and: [
            { tmdbId: { $exists: true, $ne: null } },
            { image: { $exists: true, $ne: '' } },
            {
              $or: [
                { title: { $in: titles } },
                { normalizedTitle: { $in: normalizedTitles } },
                { titleAliases: { $in: normalizedTitles } },
              ],
            },
          ],
        },
        { title: 1, normalizedTitle: 1, titleAliases: 1, tmdbId: 1, image: 1, description: 1, year: 1, rating: 1, genreTags: 1, _id: 0 }
      )
        .lean()
        .exec() as ProgramDoc[];

      return docs
        .filter((d) => typeof d.tmdbId === 'number' && d.image)
        .map((d) => ({
          title: String(d.title),
          tmdbId: d.tmdbId as number,
          image: String(d.image),
          description: d.description as string | undefined,
          year: (d as any).year as string | undefined,
          rating: (d as any).rating as string | undefined,
          genreTags: Array.isArray((d as any).genreTags) ? (d as any).genreTags as string[] : undefined,
        }));
    } catch (error) {
      logger.error('Error in findEnrichedByTitles', { error });
      return [];
    }
  }

  /**
   * Find current program for a set of channels in a single query.
   */
  async findNowPlaying(channelIds: string[], at: Date): Promise<Program[]> {
    if (channelIds.length === 0) return [];

    try {
      const docs = await ProgramModel.find({
        channelId: { $in: channelIds },
        startTime: { $lte: at },
        endTime: { $gt: at },
      })
        .sort({ channelId: 1, startTime: -1 })
        .lean()
        .exec();

      // Pick the most recent program per channel
      const selection = new Map<string, ProgramDoc>();
      for (const doc of docs) {
        if (!selection.has(doc.channelId)) {
          selection.set(doc.channelId, doc);
        }
      }

      return Array.from(selection.values()).map((doc) => this.mapToDomain(doc));
    } catch (error) {
      logger.error('Error finding now playing programs', { channelIds, at, error });
      throw error;
    }
  }

  /**
   * Map MongoDB document to domain entity
   */
  private mapToDomain(doc: IProgramDocument | ProgramDoc): Program {
    // Validate required fields are present
    if (!doc || !doc.id || !doc.channelId || !doc.title || !doc.startTime || !doc.endTime) {
      throw new Error(`Invalid program document encountered while mapping to domain: ${JSON.stringify(doc)}`);
    }

    const props: ProgramProps = {
      id: String(doc.id),
      channelId: String(doc.channelId),
      canonicalChannelId: String((doc as any).canonicalChannelId || doc.channelId),
      title: String(doc.title),
      subtitle: (doc as any).subtitle as string | undefined,
      normalizedTitle: (doc as any).normalizedTitle as string | undefined,
      titleAliases: Array.isArray((doc as any).titleAliases)
        ? ((doc as any).titleAliases as string[])
        : undefined,
      brandKey: (doc as any).brandKey as string | undefined,
      startTime: new Date(doc.startTime as any),
      endTime: new Date(doc.endTime as any),
      description: doc.description as string | undefined,
      image: doc.image as string | undefined,
      genre: doc.category as string | undefined,
      subgenre: (doc as any).subgenre as string | undefined,
      genreTags: Array.isArray((doc as any).genreTags) ? (doc as any).genreTags as string[] : undefined,
      year: (doc as any).year as string | undefined,
      rating: (doc as any).rating !== undefined && (doc as any).rating !== null ? String((doc as any).rating) : undefined,
      tmdbId: typeof (doc as any).tmdbId === 'number' ? (doc as any).tmdbId : undefined,
      mediaId: (doc as any).mediaId as string | undefined,
      sourceFeed: (doc as any).sourceFeed as string | undefined,
      sourceProgrammeId: (doc as any).sourceProgrammeId as string | undefined,
      sourceAssetCandidates: Array.isArray((doc as any).sourceAssetCandidates)
        ? ((doc as any).sourceAssetCandidates as Array<Record<string, unknown>>)
        : undefined,
      sourceProvenance: ((doc as any).sourceProvenance || undefined) as Record<string, unknown> | undefined,
      trustFlags: ((doc as any).trustFlags || undefined) as Record<string, unknown> | undefined,
      details: ((doc as any).details || undefined) as Record<string, unknown> | undefined,
    };

    return Program.create(props);
  }

  /**
   * Build a $set document that preserves existing TMDB-enriched fields.
   * image, tmdbId and rating are omitted when falsy so a previously stored
   * TMDB poster/metadata survives if this sync run's TMDB lookup failed.
   */
  private buildSetDoc(program: Program): Partial<IProgramDocument> {
    const normalizedTitle = program.normalizedTitle || normalizeTvToken(program.title, ' ');
    const titleAliases = program.titleAliases.length
      ? program.titleAliases
      : buildProgramTitleAliases(program.title);

    const doc: Partial<IProgramDocument> = {
      id: program.id,
      channelId: program.channelId,
      canonicalChannelId: program.canonicalChannelId,
      title: program.title,
      subtitle: program.subtitle,
      normalizedTitle,
      titleAliases,
      brandKey: program.brandKey || buildProgramBrandKey(program.title),
      startTime: program.startTime,
      endTime: program.endTime,
      description: program.description,
      category: program.genre,
      subgenre: program.subgenre,
      year: program.year,
      sourceFeed: program.sourceFeed,
      sourceProgrammeId: program.sourceProgrammeId,
      sourceAssetCandidates: program.sourceAssetCandidates,
      sourceProvenance: program.sourceProvenance,
      trustFlags: program.trustFlags,
      details: program.details,
    };
    // Only include enriched fields when the current sync produced a value,
    // so we never accidentally clear TMDB data with a failed enrichment run.
    if (program.image) doc.image = program.image;
    if (program.tmdbId) doc.tmdbId = program.tmdbId;
    if (program.mediaId) doc.mediaId = program.mediaId;
    if (program.rating) doc.rating = program.rating;
    if (program.genreTags.length) doc.genreTags = program.genreTags;
    return doc;
  }
}
