import { Channel, ChannelProps } from '@/domain/entities/Channel';
import { ChannelId } from '@/domain/value-objects/ChannelId';
import {
  IChannelRepository,
  ChannelFilters,
} from '@/domain/repositories/IChannelRepository';
import { ChannelModel, IChannelDocument } from '../database/models/Channel.model';
import { logger } from '../../shared/utils/logger';

export class MongoChannelRepository implements IChannelRepository {
  /**
   * Find channel by ID
   */
  async findById(id: ChannelId): Promise<Channel | null> {
    try {
      const doc = await ChannelModel.findOne({ id: id.value }).exec();
      return doc ? this.mapToDomain(doc) : null;
    } catch (error) {
      logger.error('Error finding channel by ID', { id: id.value, error });
      throw error;
    }
  }

  /**
   * Find all channels with optional filters
   */
  async findAll(filters?: ChannelFilters): Promise<Channel[]> {
    try {
      const query: any = {};

      if (filters?.type) {
        query.type = filters.type;
      }

      if (filters?.region) {
        query.region = filters.region;
      }

      if (filters?.isActive !== undefined) {
        query.active = filters.isActive;
      }

      const docs = await ChannelModel.find(query)
        .sort({ order: 1, name: 1 })
        .exec();

      return docs.map((doc: IChannelDocument) => this.mapToDomain(doc));
    } catch (error) {
      logger.error('Error finding channels', { filters, error });
      throw error;
    }
  }

  /**
   * Find channel by normalized name
   */
  async findByNormalizedName(normalizedName: string): Promise<Channel | null> {
    try {
      // Since normalizedName is computed, we need to fetch all and filter
      // For better performance, consider storing normalizedName in the database
      const docs = await ChannelModel.find().exec();
      
      for (const doc of docs) {
        const channel = this.mapToDomain(doc);
        if (channel.normalizedName === normalizedName) {
          return channel;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding channel by normalized name', { normalizedName, error });
      throw error;
    }
  }

  /**
   * Save (create or update) a channel
   */
  async save(channel: Channel): Promise<void> {
    try {
      const data = this.mapToDocument(channel);

      await ChannelModel.findOneAndUpdate(
        { id: channel.id },
        data,
        { upsert: true, new: true }
      ).exec();

      logger.debug('Channel saved', { channelId: channel.id });
    } catch (error) {
      logger.error('Error saving channel', { channelId: channel.id, error });
      throw error;
    }
  }

  /**
   * Delete a channel
   */
  async delete(id: ChannelId): Promise<void> {
    try {
      await ChannelModel.deleteOne({ id: id.value }).exec();
      logger.debug('Channel deleted', { channelId: id.value });
    } catch (error) {
      logger.error('Error deleting channel', { channelId: id.value, error });
      throw error;
    }
  }

  /**
   * Map MongoDB document to domain entity
   */
  private mapToDomain(doc: IChannelDocument): Channel {
    const props: ChannelProps = {
      id: doc.id,
      name: doc.name,
      icon: doc.logo || null,
      type: (doc.category as any) || 'TDT', // Map category to type
      region: doc.country,
      isActive: doc.active,
    };

    return Channel.create(props);
  }

  /**
   * Map domain entity to MongoDB document data
   */
  private mapToDocument(channel: Channel): Partial<IChannelDocument> {
    return {
      id: channel.id,
      name: channel.name,
      logo: channel.icon || undefined,
      category: channel.type,
      country: channel.region,
      active: channel.isActive,
      order: 0, // Default order, can be customized
    };
  }
}
