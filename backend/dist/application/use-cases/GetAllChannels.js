"use strict";
// src/v2/application/use-cases/GetAllChannels.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllChannels = void 0;
const Channel_1 = require("../../domain/entities/Channel");
class GetAllChannels {
    constructor(channelRepository, cacheRepository, channelService) {
        this.channelRepository = channelRepository;
        this.cacheRepository = cacheRepository;
        this.channelService = channelService;
    }
    async execute(request = {}) {
        const cacheKey = this.buildCacheKey(request);
        const cached = await this.cacheRepository.get(cacheKey);
        if (cached) {
            return cached.map((c) => Channel_1.Channel.create(c));
        }
        const channels = await this.channelRepository.findAll(request);
        // Reference the injected ChannelService to avoid TS warning about an
        // unused constructor property. The service may be used in future
        // enhancements (filtering, enrichment, remote fetch fallback).
        void this.channelService;
        if (channels.length > 0) {
            await this.cacheRepository.set(cacheKey, channels.map((c) => c.toJSON()), 600 // 10 min
            );
        }
        return channels;
    }
    buildCacheKey(request) {
        const parts = ['channels'];
        if (request.type)
            parts.push(request.type);
        if (request.region)
            parts.push(request.region);
        if (request.isActive !== undefined)
            parts.push(String(request.isActive));
        return parts.join(':');
    }
}
exports.GetAllChannels = GetAllChannels;
//# sourceMappingURL=GetAllChannels.js.map