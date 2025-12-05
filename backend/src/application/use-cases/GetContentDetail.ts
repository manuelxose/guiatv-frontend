import { IProgramRepository } from '@/domain/repositories/IProgramRepository';
import { IChannelRepository } from '@/domain/repositories/IChannelRepository';
import { NotFoundError } from '@/shared/errors';
import { MediaCardDTO, MediaDetailDTO } from '../dto/MediaDTO';
import { MediaMapper } from '../mappers/MediaMapper';
import { ChannelId } from '@/domain/value-objects/ChannelId';
import { DateRange } from '@/domain/value-objects/DateRange';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { Channel } from '@/domain/entities/Channel';

export interface GetContentDetailRequest {
  id: string;
  expand?: string[];
}

export interface GetContentDetailResponse {
  item: MediaDetailDTO;
}

/**
 * Returns an enriched media detail card with optional related and schedule expansions.
 */
export class GetContentDetail {
  private readonly ttlSeconds =
    Number(process.env.CONTENT_DETAIL_CACHE_TTL_SEC || 1800) || 1800;

  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly channelRepository: IChannelRepository,
    private readonly cacheRepository: ICacheRepository
  ) {}

  /**
   * Loads the content detail using cache when possible.
   */
  async execute(
    request: GetContentDetailRequest
  ): Promise<GetContentDetailResponse> {
    const expand = (request.expand || []).map((e) => e.toLowerCase()).sort();
    const cacheKey = `bff:content:${request.id}:${expand.join('|') || 'base'}`;
    const cached = await this.cacheRepository.get<GetContentDetailResponse>(
      cacheKey
    );
    if (cached) return cached;

    const program = await this.programRepository.findById(request.id);
    if (!program) {
      throw new NotFoundError('Program', request.id);
    }

    const channel = await this.channelRepository.findById(
      ChannelId.create(program.channelId)
    );

    const related = expand.includes('related')
      ? await this.loadRelated(program.id, program.date, program.channelId, channel)
      : undefined;

    const schedule = expand.includes('schedule')
      ? await this.loadSchedule(program.date, program.channelId, channel)
      : undefined;

    const item = MediaMapper.toDetail(
      program,
      channel,
      related,
      schedule,
      {
        vodProviders: this.extractVodProviders(program),
        socialMetrics: this.extractSocialMetrics(program),
      }
    );

    const response: GetContentDetailResponse = { item };
    await this.cacheRepository.set(cacheKey, response, this.ttlSeconds);
    return response;
  }

  private async loadRelated(
    programId: string,
    date: string,
    channelId: string,
    channel: Channel | null
  ): Promise<MediaCardDTO[]> {
    const sameDay = await this.programRepository.findByDate(date, 'minimal');

    return sameDay
      .filter(
        (program) =>
          program.channelId === channelId &&
          program.id !== programId &&
          program.startTime > new Date()
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 8)
      .map((program) => MediaMapper.fromProgram(program, channel));
  }

  private async loadSchedule(
    date: string,
    channelId: string,
    channel: Channel | null
  ): Promise<MediaCardDTO[]> {
    const range = DateRange.fromString(date);
    const programs = await this.programRepository.findByChannel(
      ChannelId.create(channelId),
      range
    );

    return programs
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map((program) => MediaMapper.fromProgram(program, channel));
  }

  private extractVodProviders(program: any) {
    const details = program?.details || {};
    const raw = details.vodProviders || details.whereToWatch || [];
    if (!Array.isArray(raw)) return undefined;
    return raw
      .map((p) => ({
        provider: p.provider || p.name || p.id,
        link: p.link || p.url,
        price: p.price || p.type || p.tier,
      }))
      .filter((p) => p.provider);
  }

  private extractSocialMetrics(program: any) {
    const details = program?.details || {};
    const social = details.socialMetrics || details.social || {};
    const average =
      social.average ??
      social.friendsRating ??
      (typeof program.rating === 'number' ? program.rating : undefined);

    return {
      friendsRating: social.friendsRating ?? average ?? null,
      topReview: social.topReview || null,
      ratingCount: social.ratingCount || social.count || undefined,
      average: average ?? undefined,
    };
  }
}
