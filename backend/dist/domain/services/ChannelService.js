"use strict";
// src/v2/domain/services/ChannelService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelService = void 0;
class ChannelService {
    constructor(channelRepository) {
        this.channelRepository = channelRepository;
    }
    async getActiveChannelsByType(type) {
        const channels = await this.channelRepository.findAll({
            type,
            isActive: true,
        });
        return this.sortChannelsByRelevance(channels);
    }
    async findChannelByIdOrName(idOrName) {
        // Intentar primero por ID
        let channel = await this.channelRepository.findById({
            value: idOrName,
        });
        // Si no existe, intentar por nombre normalizado
        if (!channel) {
            channel = await this.channelRepository.findByNormalizedName(this.normalizeChannelName(idOrName));
        }
        return channel;
    }
    sortChannelsByRelevance(channels) {
        const typeOrder = { TDT: 1, Movistar: 2, Cable: 3, Autonomico: 4 };
        return channels.sort((a, b) => {
            const orderDiff = typeOrder[a.type] - typeOrder[b.type];
            if (orderDiff !== 0)
                return orderDiff;
            return a.name.localeCompare(b.name);
        });
    }
    normalizeChannelName(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
}
exports.ChannelService = ChannelService;
//# sourceMappingURL=ChannelService.js.map