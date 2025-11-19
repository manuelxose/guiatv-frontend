import { Program } from '../../domain/entities/Program';
import {
  IProgramRepository,
  ProgramFilters,
} from '../../domain/repositories/IProgramRepository';
import { ChannelId } from '../../domain/value-objects/ChannelId';
import { DateRange } from '../../domain/value-objects/DateRange';

// Firestore-backed program repository removed during migration. Provide a
// runtime stub that implements the interface but throws, to avoid compile
// time dependency on Firebase types.
export class FirestoreProgramRepository implements IProgramRepository {
  constructor() {
    // noop
  }

  async findById(_: string): Promise<Program | null> {
    throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async findByChannel(_: ChannelId, __: DateRange): Promise<Program[]> {
    throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async findByDateRange(_: DateRange, __?: ProgramFilters): Promise<Program[]> {
    throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async save(_: Program): Promise<void> {
    throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async saveBatch(_: Program[]): Promise<void> {
    throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async deleteByDateRange(_: DateRange): Promise<void> {
    throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }
}
