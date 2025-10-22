// src/v2/domain/services/ChannelService.ts

import { Channel, ChannelType } from '../entities/Channel';
import { IChannelRepository } from '../repositories/IChannelRepository';

export class ChannelService {
  constructor(private readonly channelRepository: IChannelRepository) {}

  async getActiveChannelsByType(type: ChannelType): Promise<Channel[]> {
    const channels = await this.channelRepository.findAll({
      type,
      isActive: true,
    });

    return this.sortChannelsByRelevance(channels);
  }

  async findChannelByIdOrName(idOrName: string): Promise<Channel | null> {
    // Intentar primero por ID
    let channel = await this.channelRepository.findById({
      value: idOrName,
    } as any);

    // Si no existe, intentar por nombre normalizado
    if (!channel) {
      channel = await this.channelRepository.findByNormalizedName(
        this.normalizeChannelName(idOrName)
      );
    }

    return channel;
  }

  private sortChannelsByRelevance(channels: Channel[]): Channel[] {
    const typeOrder = { TDT: 1, Movistar: 2, Cable: 3, Autonomico: 4 };

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
