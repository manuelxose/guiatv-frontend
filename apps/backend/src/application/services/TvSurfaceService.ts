import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import {
  isFeaturedTvReadItem,
  TvReadQueryService,
} from './TvReadQueryService';
import { TvReadChannelSummaryDTO, TvReadItemDTO } from '../dto/TvReadDTO';

function sortTvItems(left: TvReadItemDTO, right: TvReadItemDTO): number {
  return (
    left.channel.sortOrder - right.channel.sortOrder ||
    new Date(left.airing.start).getTime() - new Date(right.airing.start).getTime()
  );
}

function hasVisualAsset(item: TvReadItemDTO): boolean {
  return Boolean(item.assets?.poster?.url || item.assets?.backdrop?.url);
}

function pickPreferredCurrentItem(
  current: TvReadItemDTO | undefined,
  candidate: TvReadItemDTO
): TvReadItemDTO {
  if (!current) {
    return candidate;
  }

  if (hasVisualAsset(current) !== hasVisualAsset(candidate)) {
    return hasVisualAsset(candidate) ? candidate : current;
  }

  if (Boolean(current.program.tmdbId) !== Boolean(candidate.program.tmdbId)) {
    return candidate.program.tmdbId ? candidate : current;
  }

  const currentScore = Number(current.relevance?.score || 0);
  const candidateScore = Number(candidate.relevance?.score || 0);
  if (currentScore !== candidateScore) {
    return candidateScore > currentScore ? candidate : current;
  }

  const currentStart = new Date(current.airing.start).getTime();
  const candidateStart = new Date(candidate.airing.start).getTime();
  return candidateStart < currentStart ? candidate : current;
}

export interface TvGuideSurfaceDTO {
  date: string;
  filters: {
    group?: string;
    category?: string;
  };
  nowItems: TvReadItemDTO[];
  nextItems: TvReadItemDTO[];
  nightItems: TvReadItemDTO[];
  channels: TvReadChannelSummaryDTO[];
  meta: {
    totalChannels: number;
    totalItems: number;
    generatedAt: string;
    cached?: boolean;
  };
}

export interface TvChannelSurfaceDTO {
  date: string;
  channel: TvReadChannelSummaryDTO['channel'] | null;
  current?: TvReadItemDTO;
  next?: TvReadItemDTO;
  tonightItems: TvReadItemDTO[];
  scheduleItems: TvReadItemDTO[];
  relatedChannels: TvReadChannelSummaryDTO[];
  meta: {
    totalItems: number;
    generatedAt: string;
    cached?: boolean;
  };
}

export class TvSurfaceService {
  constructor(
    private readonly tvReadQueryService: TvReadQueryService,
    private readonly cacheRepository: ICacheRepository
  ) {}

  async getGuideSurface(params: {
    date?: string;
    group?: string;
    category?: string;
  }): Promise<TvGuideSurfaceDTO> {
    const cacheKey = `tv:surface:guide:${params.date || 'today'}:${params.group || 'all'}:${params.category || 'all'}`;
    const cached = await this.cacheRepository.get<TvGuideSurfaceDTO>(cacheKey);
    if (cached) {
      return {
        ...cached,
        meta: { ...cached.meta, cached: true },
      };
    }

    const day = await this.tvReadQueryService.query({
      view: 'day',
      date: params.date,
      group: params.group,
      category: params.category,
      limit: 5000,
    });

    const nowItems = this.buildCurrentItems(day.items);
    const nextItems = this.buildNextItems(day.items);
    const nightItems = day.items
      .filter((item) => item.airing.partOfDay === 'noche' && isFeaturedTvReadItem(item))
      .slice(0, 120);
    const surface: TvGuideSurfaceDTO = {
      date: day.date,
      filters: {
        group: params.group,
        category: params.category,
      },
      nowItems,
      nextItems,
      nightItems,
      channels: day.channels,
      meta: {
        totalChannels: day.channels.length,
        totalItems: day.items.length,
        generatedAt: new Date().toISOString(),
      },
    };

    await this.cacheRepository.set(cacheKey, surface, 60);
    return surface;
  }

  async getChannelSurface(channelId: string, date?: string): Promise<TvChannelSurfaceDTO> {
    const cacheKey = `tv:surface:channel:${channelId}:${date || 'today'}`;
    const cached = await this.cacheRepository.get<TvChannelSurfaceDTO>(cacheKey);
    if (cached) {
      const hydrated = this.hydrateChannelSurface(cached);
      return {
        ...hydrated,
        meta: { ...hydrated.meta, cached: true },
      };
    }

    const response = await this.tvReadQueryService.getChannelDetail(channelId, date || 'today', 'day');
    const channel = response.channels[0]?.channel || response.items[0]?.channel || null;
    const relatedSource = channel
      ? await this.tvReadQueryService.getChannels(date || 'today', channel.group)
      : { channels: [] };
    const current = this.buildCurrentItems(response.items)[0];
    const next = this.buildNextItems(response.items)[0];
    const tonightItems = response.items
      .filter((item) => item.airing.partOfDay === 'noche' && isFeaturedTvReadItem(item))
      .slice(0, 12);
    const relatedChannels = (relatedSource.channels || [])
      .filter((entry) => entry.channel.id !== channelId)
      .slice(0, 8);

    const surface: TvChannelSurfaceDTO = {
      date: response.date,
      channel,
      current,
      next,
      tonightItems,
      scheduleItems: response.items,
      relatedChannels,
      meta: {
        totalItems: response.items.length,
        generatedAt: new Date().toISOString(),
      },
    };

    await this.cacheRepository.set(cacheKey, surface, 60);
    return surface;
  }

  private buildNextItems(items: TvReadItemDTO[]): TvReadItemDTO[] {
    const now = Date.now();
    const nextByChannel = new Map<string, TvReadItemDTO>();

    items.forEach((item) => {
      if (!isFeaturedTvReadItem(item)) {
        return;
      }
      const start = new Date(item.airing.start).getTime();
      if (start <= now) return;

      const current = nextByChannel.get(item.channel.id);
      if (!current || start < new Date(current.airing.start).getTime()) {
        nextByChannel.set(item.channel.id, item);
      }
    });

    return Array.from(nextByChannel.values()).sort(sortTvItems);
  }

  private buildCurrentItems(items: TvReadItemDTO[]): TvReadItemDTO[] {
    const currentByChannel = new Map<string, TvReadItemDTO>();

    items.forEach((item) => {
      if (!item.airing.liveNow || !isFeaturedTvReadItem(item)) {
        return;
      }

      const current = currentByChannel.get(item.channel.id);
      currentByChannel.set(item.channel.id, pickPreferredCurrentItem(current, item));
    });

    return Array.from(currentByChannel.values()).sort(sortTvItems);
  }

  private hydrateChannelSurface(surface: TvChannelSurfaceDTO): TvChannelSurfaceDTO {
    const current = this.buildCurrentItems(surface.scheduleItems)[0];
    const next = this.buildNextItems(surface.scheduleItems)[0];
    const tonightItems = surface.scheduleItems
      .filter((item) => item.airing.partOfDay === 'noche' && isFeaturedTvReadItem(item))
      .slice(0, 12);

    return {
      ...surface,
      current,
      next,
      tonightItems,
    };
  }
}
