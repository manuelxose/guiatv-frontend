// src/v2/application/mappers/ChannelMapper.ts

import { Channel } from '../../domain/entities/Channel';
import { ChannelDTO } from '../dto/ChannelDTO';

export class ChannelMapper {
  static toDTO(channel: Channel): ChannelDTO {
    return {
      id: channel.id,
      name: channel.name,
      normalizedName: channel.normalizedName,
      icon: channel.icon,
      type: channel.type,
      region: channel.region,
      isActive: channel.isActive,
    };
  }

  static toDTOList(channels: Channel[]): ChannelDTO[] {
    return channels.map((c) => this.toDTO(c));
  }

  static toDomain(dto: ChannelDTO): Channel {
    return Channel.create({
      id: dto.id,
      name: dto.name,
      icon: dto.icon,
      type: dto.type as any,
      region: dto.region,
      isActive: dto.isActive,
    });
  }
}
