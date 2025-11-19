// src/v2/infrastructure/repositories/MongoProgramRepository.ts

import { Program, ProgramProps } from '@v2/domain/entities/Program';
import { ChannelId } from '@v2/domain/value-objects/ChannelId';
import { DateRange } from '@v2/domain/value-objects/DateRange';
import {
  IProgramRepository,
  ProgramFilters,
} from '@v2/domain/repositories/IProgramRepository';
import { ProgramModel, IProgramDocument } from '../database/models/Program.model';
import { logger } from '../../shared/utils/logger';

export class MongoProgramRepository implements IProgramRepository {
  /**
   * Find program by ID
   */
  async findById(id: string): Promise<Program | null> {
    try {
      const doc = await ProgramModel.findOne({ id }).exec();
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
        .exec();

      return (docs as IProgramDocument[]).map((doc: IProgramDocument) => this.mapToDomain(doc));
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

      const docs = await queryBuilder.exec();
      return (docs as IProgramDocument[]).map((doc: IProgramDocument) => this.mapToDomain(doc));
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
   * Map MongoDB document to domain entity
   */
  private mapToDomain(doc: IProgramDocument): Program {
    const props: ProgramProps = {
      id: doc.id,
      channelId: doc.channelId,
      title: doc.title,
      startTime: doc.startTime,
      endTime: doc.endTime,
      description: doc.description,
      image: doc.image,
      genre: doc.category,
      rating: doc.rating,
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
