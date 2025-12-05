// src/v2/domain/services/ChannelService.ts

import { Channel, ChannelType } from '../entities/Channel';
import { IChannelRepository } from '../repositories/IChannelRepository';
import { ChannelId } from '../value-objects/ChannelId';

/**
 * Domain service with helpers to search and order channels.
 */
export class ChannelService {
  constructor(private readonly channelRepository: IChannelRepository) {}

  /**
   * Returns active channels of a given type ordered by relevance.
   *
   * @param type - Distribution type to filter by.
   */
  async getActiveChannelsByType(type: ChannelType): Promise<Channel[]> {
    const channels = await this.channelRepository.findAll({
      type,
      isActive: true,
    });

    return this.sortChannelsByRelevance(channels);
  }

  /**
   * Finds a channel either by ID or by its normalized name.
   *
   * @param idOrName - Identifier or human-readable name.
   */
  async findChannelByIdOrName(idOrName: string): Promise<Channel | null> {
    const channelId = ChannelId.create(idOrName);
    let channel = await this.channelRepository.findById(channelId);

    if (!channel) {
      channel = await this.channelRepository.findByNormalizedName(
        this.normalizeChannelName(idOrName)
      );
    }

    return channel;
  }

  private sortChannelsByRelevance(channels: Channel[]): Channel[] {
    const typeOrder: Record<ChannelType, number> = {
      TDT: 1,
      Movistar: 2,
      Cable: 3,
      Autonomico: 4,
      OTT: 5,
    };

    return channels.sort((a, b) => {
      const orderDiff = typeOrder[a.type] - typeOrder[b.type];
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
  }

  private normalizeChannelName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
