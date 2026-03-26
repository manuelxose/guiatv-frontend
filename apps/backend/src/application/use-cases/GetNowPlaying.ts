import { IChannelRepository } from '@/domain/repositories/IChannelRepository';
import { IProgramRepository } from '@/domain/repositories/IProgramRepository';
import { Channel } from '@/domain/entities/Channel';
import { Program } from '@/domain/entities/Program';
import { l1Cache } from '@/infrastructure/cache/L1Cache';

export interface NowPlayingResult {
  channel: Channel;
  program: Program | null;
}

const NOW_PLAYING_TTL_MS = 30_000; // 30 seconds

/**
 * Fetch all active channels and their current program in a single, efficient query.
 * Results are cached in L1 (in-process) for 30 s to reduce Mongo load on high-traffic endpoints.
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
    // Key is aligned to 30-second windows so concurrent requests share the same slot.
    const windowKey = `nowplaying:${Math.floor(at.getTime() / NOW_PLAYING_TTL_MS)}`;
    const cached = l1Cache.get(windowKey) as NowPlayingResult[] | undefined;
    if (cached) return cached;

    const channels = await this.channelRepository.findAll({ isActive: true });
    const channelIds = channels.map((c) => c.id);

    const currentPrograms = await this.programRepository.findNowPlaying(channelIds, at);
    const programByChannel = new Map(currentPrograms.map((p) => [p.channelId, p]));

    const result = channels.map((channel) => ({
      channel,
      program: programByChannel.get(channel.id) ?? null,
    }));

    l1Cache.set(windowKey, result, NOW_PLAYING_TTL_MS);
    return result;
  }
}
