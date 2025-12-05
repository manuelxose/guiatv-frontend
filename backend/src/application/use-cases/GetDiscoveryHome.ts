import { GetPrograms, GetProgramsResponse } from './GetPrograms';
import { GetNowPlaying } from './GetNowPlaying';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { DateUtils } from '@/shared/utils/dateUtils';
import { HomeViewDTO, MediaCardDTO } from '../dto/MediaDTO';
import { MediaMapper } from '../mappers/MediaMapper';
import { ProgramLayoutDTO } from '../services/ProgramLayoutBuilder';
import { BlogService } from '@/infrastructure/external/BlogService';

export interface GetDiscoveryHomeRequest {
  date?: string;
  country?: string;
  channelTypes?: string[];
  timeSlot?: string;
  fields?: 'minimal' | 'full';
}

type ChannelMeta = GetProgramsResponse['channels'][number];

export class GetDiscoveryHome {
  private readonly ttlSeconds =
    Number(process.env.DISCOVERY_HOME_CACHE_TTL_SEC || 120) || 120;

  constructor(
    private readonly getPrograms: GetPrograms,
    private readonly getNowPlaying: GetNowPlaying,
    private readonly cacheRepository: ICacheRepository,
    private readonly blogService?: BlogService
  ) {}

  async execute(
    request: GetDiscoveryHomeRequest = {}
  ): Promise<{ view: HomeViewDTO; cached: boolean }> {
    const date =
      request.date && request.date.length
        ? DateUtils.parseDateAlias(request.date)
        : DateUtils.getTodayYYYYMMDD();

    const cacheKey = this.buildCacheKey(date, request);
    const cached = await this.cacheRepository.get<HomeViewDTO>(cacheKey);
    if (cached) {
      return {
        view: {
          ...cached,
          generatedAt: cached.generatedAt || new Date().toISOString(),
        },
        cached: true,
      };
    }

    const programsResponse = await this.getPrograms.execute({
      date,
      fields: request.fields ?? 'full',
      limit: 1200,
      country: request.country,
      channelTypes: request.channelTypes,
      timeSlot: request.timeSlot,
    });

    const channelMap = new Map(
      programsResponse.channels.map((channel) => [channel.id, channel] as const)
    );

    const now = new Date();
    const hero = this.pickHero(programsResponse.programs, channelMap, now);
    const whatToWatch = this.buildWhatToWatch(
      programsResponse.programs,
      channelMap,
      now
    );
    const liveNow = await this.buildLiveNow(channelMap, now);
    const blogHighlights = await this.blogService?.getHighlights(4);

    const response: HomeViewDTO = {
      hero,
      whatToWatch: { title: 'Qué ver hoy', items: whatToWatch },
      liveNow: { title: 'En directo', items: liveNow },
      blogHighlights: blogHighlights || [],
      generatedAt: new Date().toISOString(),
    };

    await this.cacheRepository.set(cacheKey, response, this.ttlSeconds);
    return { view: response, cached: false };
  }

  private async buildLiveNow(
    channelMap: Map<string, ChannelMeta>,
    now: Date
  ): Promise<MediaCardDTO[]> {
    const results = await this.getNowPlaying.execute(now);
    return results
      .filter(({ program }) => !!program)
      .map(({ program, channel }) =>
        MediaMapper.fromProgram(program!, channel, { now })
      );
  }

  private pickHero(
    programs: ProgramLayoutDTO[],
    channelMap: Map<string, ChannelMeta>,
    now: Date
  ): MediaCardDTO[] {
    const scored = programs
      .filter((p) => p.image || p.description)
      .map((program) => ({
        program,
        score: this.scoreProgram(program, now),
      }))
      .sort((a, b) => b.score - a.score);

    const unique = new Map<string, MediaCardDTO>();
    for (const { program } of scored) {
      if (unique.size >= 8) break;
      const card = MediaMapper.fromProgramLayout(program, channelMap, now);
      unique.set(card.id, card);
    }

    return Array.from(unique.values());
  }

  private buildWhatToWatch(
    programs: ProgramLayoutDTO[],
    channelMap: Map<string, ChannelMeta>,
    now: Date
  ): MediaCardDTO[] {
    const nowMs = now.getTime();
    const windowEnd = nowMs + 1000 * 60 * 60 * 6; // 6h hacia adelante

    const upcoming = programs
      .map((program) => ({
        program,
        start: new Date(program.start).getTime(),
        score: this.scoreProgram(program, now),
      }))
      .filter(({ start }) => !Number.isNaN(start) && start >= nowMs - 20 * 60000)
      .filter(({ start }) => start <= windowEnd)
      .sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return b.score - a.score;
      });

    const fallback = programs
      .map((program) => ({
        program,
        score: this.scoreProgram(program, now),
      }))
      .sort((a, b) => b.score - a.score);

    const candidates = upcoming.length ? upcoming : fallback;

    const picked = new Map<string, MediaCardDTO>();
    for (const { program } of candidates) {
      if (picked.size >= 12) break;
      const card = MediaMapper.fromProgramLayout(program, channelMap, now);
      picked.set(card.id, card);
    }

    return Array.from(picked.values());
  }

  private scoreProgram(program: ProgramLayoutDTO, now: Date): number {
    let score = 0;

    if (program.image) score += 20;
    if (program.description) {
      score += Math.min(program.description.length / 40, 10);
    }
    if (program.category) score += 5;
    if (program.rating) score += 2;

    const start = new Date(program.start).getHours();
    if (start >= 20 || start < 2) score += 6; // prime time
    if (program.timeSlotIndex != null && program.timeSlotIndex >= 6) score += 4;

    const nowMs = now.getTime();
    const startMs = new Date(program.start).getTime();
    if (!Number.isNaN(startMs)) {
      const diffHours = Math.abs(startMs - nowMs) / (1000 * 60 * 60);
      score += Math.max(0, 6 - diffHours);
    }

    return score;
  }

  private buildCacheKey(
    date: string,
    request: GetDiscoveryHomeRequest
  ): string {
    const types = (request.channelTypes || []).map((t) => t.toUpperCase()).join('|');
    return [
      'bff:discovery:home',
      date,
      request.country || 'all',
      types || 'all',
      request.timeSlot || 'any',
      request.fields || 'full',
    ].join(':');
  }
}
