// src/v2/domain/repositories/IChannelRepository.ts

import { Channel } from '../entities/Channel';
import { ChannelId } from '../value-objects/ChannelId';
import { ChannelType } from '../entities/Channel';

export interface ChannelFilters {
  type?: ChannelType;
  region?: string;
  isActive?: boolean;
}

export interface IChannelRepository {
  findById(id: ChannelId): Promise<Channel | null>;
  findAll(filters?: ChannelFilters): Promise<Channel[]>;
  findByNormalizedName(normalizedName: string): Promise<Channel | null>;
  save(channel: Channel): Promise<void>;
  delete(id: ChannelId): Promise<void>;
}
