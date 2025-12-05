import { IChannelRepository } from '@/domain/repositories/IChannelRepository';
import { IProgramRepository } from '@/domain/repositories/IProgramRepository';
import { Channel } from '@/domain/entities/Channel';
import { Program } from '@/domain/entities/Program';

export interface NowPlayingResult {
  channel: Channel;
  program: Program | null;
}

/**
 * Fetch all active channels and their current program in a single, efficient query.
 */
export class GetNowPlaying {
 constructor(
    private readonly channelRepository: IChannelRepository,
    private readonly programRepository: IProgramRepository
  ) {}

  /**
   * Resolves the current airing program for each active channel at a specific time.
   */
  async execute(at: Date = new Date()): Promise<NowPlayingResult[]> {
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
