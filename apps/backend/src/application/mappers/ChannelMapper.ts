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
  static toMetaDTO(channel: Channel): Pick<ChannelDTO, 'id' | 'name' | 'icon' | 'type' | 'country' | 'countryCode' | 'description'> {
    return {
      id: channel.id,
      name: channel.name,
      icon: channel.icon,
      type: (channel.type as any)?.toString().toUpperCase(),
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
      region: dto.region,
      description: dto.description,
      isActive: dto.isActive,
    });
  }
}
