import { Channel, ChannelProps } from '@/domain/entities/Channel';
import { ChannelId } from '@/domain/value-objects/ChannelId';
import {
  IChannelRepository,
  ChannelFilters,
} from '@/domain/repositories/IChannelRepository';
import { ChannelModel, IChannelDocument } from '../database/models/Channel.model';
import { logger } from '../../shared/utils/logger';
import { buildChannelIdentityMetadata } from '../../shared/utils/tvMetadata';

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

      if (filters?.isActive !== undefined) {
        query.active = filters.isActive;
      }

      const docs = await ChannelModel.find(query)
        .sort({ order: 1, name: 1 })
        .exec();

      return docs
        .map((doc: IChannelDocument) => this.mapToDomain(doc))
        .filter((channel) => {
          if (filters?.type && channel.type !== filters.type) {
            return false;
          }
          if (
            filters?.region &&
            String(channel.region || '').toLowerCase() !==
              String(filters.region).toLowerCase()
          ) {
            return false;
          }
          return true;
        });
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
      const safeNormalizedName = String(normalizedName || '').trim();
      if (!safeNormalizedName) {
        return null;
      }

      const doc = await ChannelModel.findOne({
        $or: [
          { normalizedName: safeNormalizedName },
          { aliases: safeNormalizedName },
          { sourceIds: safeNormalizedName },
          { id: safeNormalizedName },
        ],
      }).exec();

      if (doc) {
        return this.mapToDomain(doc);
      }

      // Backward-compatible fallback while old documents are still missing
      // normalized fields. Channel cardinality is low enough to scan safely.
      const fallbackDocs = await ChannelModel.find(
        {},
        'id name normalizedName aliases sourceIds logo type country countryCode region description active'
      )
        .lean()
        .exec();

      const fallback = fallbackDocs.find((entry: any) => {
        const metadata = buildChannelIdentityMetadata({
          name: entry?.name,
          sourceId:
            Array.isArray(entry?.sourceIds) && entry.sourceIds.length
              ? entry.sourceIds[0]
              : entry?.id,
          country: entry?.country,
          countryCode: entry?.countryCode,
          region: entry?.region,
        });

        return [
          entry?.id,
          entry?.normalizedName,
          ...(Array.isArray(entry?.aliases) ? entry.aliases : []),
          ...(Array.isArray(entry?.sourceIds) ? entry.sourceIds : []),
          ...metadata.aliases,
        ].some((candidate) => String(candidate || '').trim() === safeNormalizedName);
      });

      return fallback ? this.mapToDomain(fallback as IChannelDocument) : null;
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
    const metadata = buildChannelIdentityMetadata({
      name: doc.name,
      sourceId:
        Array.isArray(doc.sourceIds) && doc.sourceIds.length
          ? doc.sourceIds[0]
          : doc.id,
      country: doc.country,
      countryCode: doc.countryCode,
      region: doc.region,
    });

    const props: ChannelProps = {
      id: doc.id,
      name: doc.name,
      icon: doc.logo || null,
      type: metadata.inferredType,
      aliases: Array.from(
        new Set([
          ...(Array.isArray(doc.aliases) ? doc.aliases : []),
          ...metadata.aliases,
        ])
      ),
      sourceIds: Array.from(
        new Set([
          ...(Array.isArray(doc.sourceIds) ? doc.sourceIds : []),
          ...metadata.sourceIds,
        ])
      ),
      country: doc.country,
      countryCode: doc.countryCode,
      region:
        doc.region ||
        metadata.inferredRegion ||
        (metadata.inferredType === 'Autonomico' ? doc.country : undefined),
      description: doc.description,
      isActive: doc.active,
    };

    return Channel.create(props);
  }

  /**
   * Map domain entity to MongoDB document data
   */
  private mapToDocument(channel: Channel): Partial<IChannelDocument> {
    const metadata = buildChannelIdentityMetadata({
      name: channel.name,
      sourceId: channel.sourceIds[0] || channel.id,
      country: channel.country,
      countryCode: channel.countryCode,
      region: channel.region,
    });

    return {
      id: channel.id,
      name: channel.name,
      normalizedName: metadata.normalizedName || channel.normalizedName,
      aliases: channel.aliases.length ? channel.aliases : metadata.aliases,
      sourceIds: channel.sourceIds.length ? channel.sourceIds : metadata.sourceIds,
      logo: channel.icon || undefined,
      type: channel.type,
      category: channel.type,
      country: channel.country || channel.region,
      countryCode: channel.countryCode,
      region: channel.region,
      description: channel.description,
      active: channel.isActive,
      order: metadata.sortOrder,
    };
  }
}
