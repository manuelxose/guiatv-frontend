import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { l1Cache } from '@/infrastructure/cache/L1Cache';
import { DateUtils } from '@/shared/utils/dateUtils';
import {
  CatalogItemDTO,
  CatalogPlatformDTO,
  CatalogQueryResultDTO,
} from '../dto/CatalogDTO';
import { TvReadQueryService } from '../services/TvReadQueryService';
import { CatalogService } from '../services/CatalogService';
import { GetPersonalizedRecommendations } from './GetPersonalizedRecommendations';
import { TvReadResponseDTO } from '../dto/TvReadDTO';

export interface DiscoveryHomeViewDTO {
  personalized: CatalogItemDTO[];
  platformItems: CatalogItemDTO[];
  freeItems: CatalogItemDTO[];
  liveItems: CatalogItemDTO[];
  tonightItems: CatalogItemDTO[];
  trendingItems: CatalogItemDTO[];
  platforms: CatalogPlatformDTO[];
  generatedAt: string;
}

export interface GetDiscoveryHomeRequest {
  date?: string;
  userId?: string;
}

export class GetDiscoveryHome {
  private readonly ttlSeconds =
    Number(process.env.DISCOVERY_HOME_CACHE_TTL_SEC || 120) || 120;
  private readonly hotCacheTtlMs =
    Number(process.env.DISCOVERY_HOME_L1_CACHE_TTL_MS || 30_000) || 30_000;
  private readonly segmentTimeoutMs =
    Number(process.env.DISCOVERY_HOME_SEGMENT_TIMEOUT_MS || 2500) || 2500;

  constructor(
    private readonly cacheRepository: ICacheRepository,
    private readonly tvReadQueryService: TvReadQueryService,
    private readonly catalogService: CatalogService,
    private readonly getPersonalizedRecommendations: GetPersonalizedRecommendations
  ) {}

  async execute(
    request: GetDiscoveryHomeRequest = {}
  ): Promise<{ view: DiscoveryHomeViewDTO; cached: boolean }> {
    const date =
      request.date && request.date.length
        ? DateUtils.parseDateAlias(request.date)
        : DateUtils.getTodayYYYYMMDD();

    const cacheKey = ['surface:discovery:home', date, request.userId || 'anon'].join(':');
    const hotCached = l1Cache.get(cacheKey) as DiscoveryHomeViewDTO | undefined;
    if (hotCached) {
      return {
        view: {
          ...hotCached,
          generatedAt: hotCached.generatedAt || new Date().toISOString(),
        },
        cached: true,
      };
    }

    const cached = await this.cacheRepository.get<DiscoveryHomeViewDTO>(cacheKey);
    if (cached) {
      l1Cache.set(cacheKey, cached, this.hotCacheTtlMs);
      return {
        view: {
          ...cached,
          generatedAt: cached.generatedAt || new Date().toISOString(),
        },
        cached: true,
      };
    }

    const [liveNow, tonight, trending, freeItems, personalized] = await Promise.all([
      this.withTimeout(
        this.tvReadQueryService.query({
          view: 'now',
          date,
          limit: 12,
        }),
        Math.min(this.segmentTimeoutMs, 1500),
        this.emptyTvReadResult()
      ),
      this.withTimeout(
        this.tvReadQueryService.query({
          view: 'night',
          date,
          limit: 12,
        }),
        Math.min(this.segmentTimeoutMs, 1500),
        this.emptyTvReadResult()
      ),
      this.withTimeout(
        this.catalogService.query({
          userId: request.userId,
          types: ['movie', 'series'],
          availability: ['streaming'],
          sort: 'popular',
          limit: 12,
          page: 1,
        }),
        this.segmentTimeoutMs,
        this.emptyCatalogResult()
      ),
      this.withTimeout(
        this.catalogService.query({
          userId: request.userId,
          types: ['movie', 'series'],
          availability: ['free'],
          sort: 'popular',
          limit: 12,
          page: 1,
        }),
        this.segmentTimeoutMs,
        this.emptyCatalogResult()
      ),
      request.userId
        ? this.withTimeout(
            this.getPersonalizedRecommendations.execute({
              userId: request.userId,
              context: 'home',
              limit: 12,
            }),
            this.segmentTimeoutMs,
            []
          )
        : Promise.resolve([]),
    ]);

    const liveItems = liveNow.items
      .filter((item) => item.airing.liveNow)
      .slice(0, 12)
      .map((item) => this.catalogService.mapTvReadItemToCatalogItem(item));
    const tonightItems = tonight.items
      .slice(0, 12)
      .map((item) => this.catalogService.mapTvReadItemToCatalogItem(item));
    const platforms = this.catalogService.getPlatforms();

    const platformItems = this.selectPlatformItems(trending.items, platforms);
    const view: DiscoveryHomeViewDTO = {
      personalized: personalized.map((entry) => entry.item).slice(0, 12),
      platformItems,
      freeItems: freeItems.items.slice(0, 12),
      liveItems,
      tonightItems,
      trendingItems: trending.items.slice(0, 12),
      platforms,
      generatedAt: new Date().toISOString(),
    };

    await this.cacheRepository.set(cacheKey, view, this.ttlSeconds);
    l1Cache.set(cacheKey, view, this.hotCacheTtlMs);
    return { view, cached: false };
  }

  private selectPlatformItems(
    items: CatalogItemDTO[],
    platforms: CatalogPlatformDTO[]
  ): CatalogItemDTO[] {
    if (!items.length) {
      return [];
    }

    const topPlatformNames = new Set(platforms.slice(0, 6).map((platform) => platform.name));
    const preferred = items.filter((item) =>
      item.primaryPlatforms.some((platform) => topPlatformNames.has(platform))
    );

    return (preferred.length ? preferred : items).slice(0, 12);
  }

  private emptyTvReadResult(): TvReadResponseDTO {
    return {
      date: DateUtils.getTodayYYYYMMDD(),
      view: 'day',
      items: [],
      channels: [],
      filters: {},
      meta: {
        total: 0,
        limit: 12,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private emptyCatalogResult(): CatalogQueryResultDTO {
    return {
      items: [],
      meta: {
        page: 1,
        limit: 12,
        total: 0,
        hasMore: false,
      },
      availableGenres: [],
      availablePlatforms: this.catalogService.getPlatforms(),
    };
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallback: T
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    return new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), timeoutMs);
      promise
        .then((value) => {
          if (timer) {
            clearTimeout(timer);
          }
          resolve(value);
        })
        .catch(() => {
          if (timer) {
            clearTimeout(timer);
          }
          resolve(fallback);
        });
    });
  }
}
