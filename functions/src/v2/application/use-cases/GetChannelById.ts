// src/v2/application/use-cases/GetChannelById.ts

import { Channel } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { ChannelId } from '../../domain/value-objects/ChannelId';

export class GetChannelById {
  constructor(
    private readonly channelRepository: IChannelRepository,
    private readonly cacheRepository: ICacheRepository
  ) {}

  async execute(channelId: string): Promise<Channel | null> {
    const cacheKey = `channel:${channelId}`;

    // Intentar desde caché
    const cached = await this.cacheRepository.get<any>(cacheKey);
    if (cached) {
      return Channel.create(cached);
    }

    // Buscar en repositorio
    const channel = await this.channelRepository.findById(
      ChannelId.create(channelId)
    );

    if (channel) {
      await this.cacheRepository.set(cacheKey, channel.toJSON(), 300); // 5 min
    }

    return channel;
  }
}
