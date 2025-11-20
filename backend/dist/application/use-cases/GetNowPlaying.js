"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNowPlaying = void 0;
/**
 * Fetch all active channels and their current program in a single, efficient query.
 */
class GetNowPlaying {
    constructor(channelRepository, programRepository) {
        this.channelRepository = channelRepository;
        this.programRepository = programRepository;
    }
    async execute(at = new Date()) {
        const channels = await this.channelRepository.findAll({ isActive: true });
        const channelIds = channels.map((c) => c.id);
        const currentPrograms = await this.programRepository.findNowPlaying(channelIds, at);
        const programByChannel = new Map(currentPrograms.map((p) => [p.channelId, p]));
        return channels.map((channel) => ({
            channel,
            program: programByChannel.get(channel.id) ?? null,
        }));
    }
}
exports.GetNowPlaying = GetNowPlaying;
//# sourceMappingURL=GetNowPlaying.js.map