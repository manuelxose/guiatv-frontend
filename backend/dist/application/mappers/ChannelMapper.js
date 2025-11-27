"use strict";
// src/v2/application/mappers/ChannelMapper.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMapper = void 0;
const Channel_1 = require("../../domain/entities/Channel");
class ChannelMapper {
    static toDTO(channel) {
        return {
            id: channel.id,
            name: channel.name,
            normalizedName: channel.normalizedName,
            icon: channel.icon,
            type: channel.type,
            country: channel.country,
            countryCode: channel.countryCode,
            region: channel.region,
            isActive: channel.isActive,
        };
    }
    static toDTOList(channels) {
        return channels.map((c) => this.toDTO(c));
    }
    static toMetaDTO(channel) {
        return {
            id: channel.id,
            name: channel.name,
            icon: channel.icon,
            type: channel.type?.toString().toUpperCase(),
            country: channel.country,
            countryCode: channel.countryCode,
        };
    }
    static toDomain(dto) {
        return Channel_1.Channel.create({
            id: dto.id,
            name: dto.name,
            icon: dto.icon,
            type: dto.type,
            region: dto.region,
            isActive: dto.isActive,
        });
    }
}
exports.ChannelMapper = ChannelMapper;
//# sourceMappingURL=ChannelMapper.js.map