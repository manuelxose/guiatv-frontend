// src/v2/application/mappers/ChannelMapper.ts

import { Channel } from '../../domain/entities/Channel';
import { ChannelDTO } from '../dto/ChannelDTO';

/**
 * Transforms channel entities into transport-friendly DTOs and back.
 */
export class ChannelMapper {
  /**
   * Maps a single domain entity to a DTO.
   */
  static toDTO(channel: Channel): ChannelDTO {
    return {
      id: channel.id,
      name: channel.name,
      normalizedName: channel.normalizedName,
      icon: channel.icon,
      type: channel.type,
      aliases: channel.aliases,
      sourceIds: channel.sourceIds,
      country: channel.country,
      countryCode: channel.countryCode,
      region: channel.region,
      description: channel.description,
      isActive: channel.isActive,
    };
  }

  /**
   * Maps a list of channel entities into DTOs.
   */
  static toDTOList(channels: Channel[]): ChannelDTO[] {
    return channels.map((c) => this.toDTO(c));
  }

  /**
   * Lightweight DTO used for metadata sections where full normalization is not needed.
   */
  static toMetaDTO(channel: Channel): Pick<ChannelDTO, 'id' | 'name' | 'normalizedName' | 'icon' | 'type' | 'aliases' | 'sourceIds' | 'country' | 'countryCode' | 'description'> {
    return {
      id: channel.id,
      name: channel.name,
      normalizedName: channel.normalizedName,
      icon: channel.icon,
      type: (channel.type as any)?.toString().toUpperCase(),
      aliases: channel.aliases,
      sourceIds: channel.sourceIds,
      country: channel.country,
      countryCode: channel.countryCode,
      description: channel.description,
    };
  }

  /**
   * Rebuilds a domain entity from a DTO.
   */
  static toDomain(dto: ChannelDTO): Channel {
    return Channel.create({
      id: dto.id,
      name: dto.name,
      icon: dto.icon,
      type: dto.type as any,
      aliases: dto.aliases,
      sourceIds: dto.sourceIds,
      country: dto.country,
      countryCode: dto.countryCode,
      region: dto.region,
      description: dto.description,
      isActive: dto.isActive,
    });
  }
}
