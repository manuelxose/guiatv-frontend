import { Program, ProgramProps } from '@/domain/entities/Program';
import { ChannelId } from '@/domain/value-objects/ChannelId';
import { DateRange } from '@/domain/value-objects/DateRange';
import {
  IProgramRepository,
  ProgramFilters,
} from '@/domain/repositories/IProgramRepository';
import { ProgramModel, IProgramDocument } from '../database/models/Program.model';
import { logger } from '../../shared/utils/logger';

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
        startTime: { $gte: dateRange.start, $lte: dateRange.end },
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
        startTime: { $gte: dateRange.start },
        endTime: { $lte: dateRange.end },
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
      rating: (doc as any).rating !== undefined && (doc as any).rating !== null ? String((doc as any).rating) : undefined,
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
      rating: (program as any).rating,
    };
  }
}
