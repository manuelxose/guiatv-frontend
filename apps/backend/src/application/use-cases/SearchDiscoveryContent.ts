import { DateUtils } from '@/shared/utils/dateUtils';
import { MediaCardDTO } from '../dto/MediaDTO';
import { MediaMapper } from '../mappers/MediaMapper';
import { IProgramRepository } from '@/domain/repositories/IProgramRepository';
import { IChannelRepository } from '@/domain/repositories/IChannelRepository';
import { Channel } from '@/domain/entities/Channel';

export interface DiscoverySearchRequest {
  q?: string;
  date?: string;
  genre?: string;
  platform?: string;
  type?: string;
  limit?: number;
  page?: number;
  country?: string;
  channelTypes?: string[];
}

export interface DiscoverySearchResponse {
  items: MediaCardDTO[];
  meta: {
    total: number;
    date: string;
    page: number;
    limit: number;
  };
}

/**
 * Performs search across programs to power the discovery results page.
 */
export class SearchDiscoveryContent {
  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly channelRepository: IChannelRepository
  ) {}

  /**
   * Executes the search with pagination and channel filtering.
   */
  async execute(
    request: DiscoverySearchRequest
  ): Promise<DiscoverySearchResponse> {
    const date =
      request.date && request.date.length
        ? DateUtils.parseDateAlias(request.date)
        : DateUtils.getTodayYYYYMMDD();

    const q = (request.q || '').trim().toLowerCase();
    const genre = (request.genre || '').trim().toLowerCase();
    const platform = (request.platform || '').trim().toUpperCase();
    const type = (request.type || '').trim().toLowerCase();
    const limit = Math.min(request.limit || 50, 200);
    const page = request.page && request.page > 0 ? request.page : 1;
    const offset = (page - 1) * limit;

    const { channelMap, channelIds } = await this.resolveChannels({
      channelTypes: request.channelTypes || (platform ? [platform] : undefined),
      country: request.country,
    });

    if (type && type !== 'program') {
      return {
        items: [],
        meta: { total: 0, date, page, limit },
      };
    }

    const { items, total } = await this.programRepository.search({
      date,
      text: q,
      category: genre,
      channelIds,
      limit,
      offset,
      fields: 'full',
    });

    const layouts = items.map((program) => {
      const channel = channelMap.get(program.channelId);
      return MediaMapper.fromProgram(program, channel, { now: new Date() });
    });

    return {
      items: layouts,
      meta: {
        total,
        date,
        page,
        limit,
      },
    };
  }

  private async resolveChannels(params: {
    channelTypes?: string[];
    country?: string;
  }): Promise<{ channelMap: Map<string, Channel>; channelIds: string[] }> {
    const typesFilter = params.channelTypes?.length
      ? params.channelTypes.map((t) => t.toUpperCase())
      : undefined;

    const channels = await this.channelRepository.findAll({
      isActive: true,
    });

    const filtered = channels.filter((ch) => {
      if (typesFilter && !typesFilter.includes((ch.type as any)?.toString().toUpperCase())) {
        return false;
      }
      if (params.country) {
        const c = params.country.toLowerCase();
        if (!ch.country || ch.country.toLowerCase() !== c) return false;
      }
      return true;
    });

    return {
      channelMap: new Map(filtered.map((c) => [c.id, c] as const)),
      channelIds: filtered.map((c) => c.id),
    };
  }
}
