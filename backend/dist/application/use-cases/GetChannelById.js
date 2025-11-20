"use strict";
// src/v2/application/use-cases/GetChannelById.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetChannelById = void 0;
const Channel_1 = require("../../domain/entities/Channel");
const ChannelId_1 = require("../../domain/value-objects/ChannelId");
class GetChannelById {
    constructor(channelRepository, cacheRepository) {
        this.channelRepository = channelRepository;
        this.cacheRepository = cacheRepository;
    }
    async execute(channelId) {
        const cacheKey = `channel:${channelId}`;
        // Intentar desde caché
        const cached = await this.cacheRepository.get(cacheKey);
        if (cached) {
            return Channel_1.Channel.create(cached);
        }
        // Buscar en repositorio
        const channel = await this.channelRepository.findById(ChannelId_1.ChannelId.create(channelId));
        if (channel) {
            await this.cacheRepository.set(cacheKey, channel.toJSON(), 300); // 5 min
        }
        return channel;
    }
}
exports.GetChannelById = GetChannelById;
//# sourceMappingURL=GetChannelById.js.map