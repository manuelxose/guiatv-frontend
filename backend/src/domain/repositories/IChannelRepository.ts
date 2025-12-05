// src/v2/domain/repositories/IChannelRepository.ts

import { Channel } from '../entities/Channel';
import { ChannelId } from '../value-objects/ChannelId';
import { ChannelType } from '../entities/Channel';

/**
 * Optional filters to retrieve subsets of channels.
 */
export interface ChannelFilters {
  type?: ChannelType;
  region?: string;
  isActive?: boolean;
}

/**
 * Abstraction over channel persistence for DI-friendly implementations.
 */
export interface IChannelRepository {
  /**
   * Looks up a channel by its value object identifier.
   */
  findById(id: ChannelId): Promise<Channel | null>;
  /**
   * Returns all channels honoring optional filters.
   */
  findAll(filters?: ChannelFilters): Promise<Channel[]>;
  /**
   * Finds a channel by its normalized slug-like name.
   */
  findByNormalizedName(normalizedName: string): Promise<Channel | null>;
  /**
   * Persists or updates a channel aggregate.
   */
  save(channel: Channel): Promise<void>;
  /**
   * Deletes a channel by identifier.
   */
  delete(id: ChannelId): Promise<void>;
}
