// src/v2/application/use-cases/GetAllChannels.ts

import { Channel, ChannelType } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { ChannelService } from '../../domain/services/ChannelService';

export interface GetAllChannelsRequest {
  type?: ChannelType;
  region?: string;
  isActive?: boolean;
}

export class GetAllChannels {
  constructor(
    private readonly channelRepository: IChannelRepository,
    private readonly cacheRepository: ICacheRepository,
    private readonly channelService: ChannelService
  ) {}

  async execute(request: GetAllChannelsRequest = {}): Promise<Channel[]> {
    const cacheKey = this.buildCacheKey(request);

    const cached = await this.cacheRepository.get<any[]>(cacheKey);
    if (cached) {
      return cached.map((c) => Channel.create(c));
    }

    const channels = await this.channelRepository.findAll(request);

    // Reference the injected ChannelService to avoid TS warning about an
    // unused constructor property. The service may be used in future
    // enhancements (filtering, enrichment, remote fetch fallback).
    void this.channelService;

    if (channels.length > 0) {
      await this.cacheRepository.set(
        cacheKey,
        channels.map((c) => c.toJSON()),
        600 // 10 min
      );
    }

    return channels;
  }

  private buildCacheKey(request: GetAllChannelsRequest): string {
    const parts = ['channels'];
    if (request.type) parts.push(request.type);
    if (request.region) parts.push(request.region);
    if (request.isActive !== undefined) parts.push(String(request.isActive));
    return parts.join(':');
  }
}
