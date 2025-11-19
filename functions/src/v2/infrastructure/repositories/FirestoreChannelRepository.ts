import { Channel } from '../../domain/entities/Channel';
import {
  IChannelRepository,
  ChannelFilters,
} from '../../domain/repositories/IChannelRepository';
import { ChannelId } from '../../domain/value-objects/ChannelId';

// Firestore-backed repository removed during migration. This stub implements
// the same interface but throws an informative error at runtime. It exists
// only to avoid compile-time references to Firebase types.
export class FirestoreChannelRepository implements IChannelRepository {
  constructor() {
    // no-op constructor; actual implementation removed
  }

  async findById(_: ChannelId): Promise<Channel | null> {
    throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async findAll(_: ChannelFilters | undefined): Promise<Channel[]> {
    throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async findByNormalizedName(_: string): Promise<Channel | null> {
    throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async save(_: Channel): Promise<void> {
    throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }

  async delete(_: ChannelId): Promise<void> {
    throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
  }
}
