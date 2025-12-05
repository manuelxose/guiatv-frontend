import { Program } from '../entities/Program';
import { ChannelId } from '../value-objects/ChannelId';
import { DateRange } from '../value-objects/DateRange';

export interface ProgramFilters {
  channelId?: string;
  dateRange?: DateRange;
  genre?: string;
  limit?: number;
  offset?: number;
}

export interface IProgramRepository {
  findById(id: string): Promise<Program | null>;
  findByChannel(channelId: ChannelId, dateRange: DateRange): Promise<Program[]>;
  findByDateRange(
    dateRange: DateRange,
    filters?: ProgramFilters
  ): Promise<Program[]>;
  findByDate(date: string, fields?: 'minimal' | 'full'): Promise<Program[]>; // YYYYMMDD format
  findNowPlaying(channelIds: string[], at: Date): Promise<Program[]>;
  search(params: {
    date: string;
    text?: string;
    category?: string;
    channelIds?: string[];
    limit: number;
    offset?: number;
    fields?: 'minimal' | 'full';
  }): Promise<{ items: Program[]; total: number }>;
  save(program: Program): Promise<void>;
  saveBatch(programs: Program[]): Promise<void>;
  deleteByDateRange(dateRange: DateRange): Promise<void>;
  backfillComputedFields(date: string): Promise<number>;
}
