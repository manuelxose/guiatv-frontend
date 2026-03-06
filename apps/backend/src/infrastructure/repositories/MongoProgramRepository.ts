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
        query.category = filters.genre;
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
      const data = this.mapToDocument(program);

      await ProgramModel.findOneAndUpdate(
        { id: program.id },
        data,
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
          update: this.mapToDocument(program),
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
   * Find programs by specific date (YYYYMMDD format)
   * INCLUDES programs that started before this day but are still airing (crossing midnight)
   */
  async findByDate(date: string, fields: 'minimal' | 'full' = 'full'): Promise<Program[]> {
    try {
      const dateRange = this.parseDateToRange(date);

      const projection =
        fields === 'minimal'
          ? {description: 0, image: 0}
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
      title: String(doc.title),
      startTime: new Date(doc.startTime as any),
      endTime: new Date(doc.endTime as any),
      description: doc.description as string | undefined,
      image: doc.image as string | undefined,
      genre: doc.category as string | undefined,
      subgenre: (doc as any).subgenre as string | undefined,
      year: (doc as any).year as string | undefined,
      rating: (doc as any).rating !== undefined && (doc as any).rating !== null ? String((doc as any).rating) : undefined,
      tmdbId: typeof (doc as any).tmdbId === 'number' ? (doc as any).tmdbId : undefined,
      details: ((doc as any).details || undefined) as Record<string, unknown> | undefined,
    };

    return Program.create(props);
  }

  /**
   * Map domain entity to MongoDB document data
   */
  private mapToDocument(program: Program): Partial<IProgramDocument> {
    return {
      id: program.id,
      channelId: program.channelId,
      title: program.title,
      startTime: program.startTime,
      endTime: program.endTime,
      description: program.description,
      image: program.image,
      category: program.genre,
      subgenre: program.subgenre,
      year: program.year,
      rating: program.rating,
      tmdbId: program.tmdbId,
      details: program.details,
    };
  }
}
