import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import {
  CatalogContentType,
  CatalogItemDTO,
  CatalogPlatformDTO,
  CatalogQueryResultDTO,
} from '../dto/CatalogDTO';
import { TvReadQueryService } from '../services/TvReadQueryService';
import { CatalogService } from '../services/CatalogService';

export interface DiscoveryBrowseRequest {
  userId?: string;
  contentType: 'movie' | 'series';
  q?: string;
  genres?: string[];
  platforms?: string[];
  availability?: string[];
  sort?: string;
  page?: number;
  limit?: number;
}

export interface DiscoveryBrowseViewDTO {
  contentType: 'movie' | 'series';
  items: CatalogItemDTO[];
  liveItems: CatalogItemDTO[];
  availableGenres: string[];
  availablePlatforms: CatalogPlatformDTO[];
  meta: CatalogQueryResultDTO['meta'];
  generatedAt: string;
}

export class GetDiscoveryBrowse {
  private readonly ttlSeconds =
    Number(process.env.DISCOVERY_BROWSE_CACHE_TTL_SEC || 60) || 60;

  constructor(
    private readonly cacheRepository: ICacheRepository,
    private readonly tvReadQueryService: TvReadQueryService,
    private readonly catalogService: CatalogService
  ) {}

  async execute(
    request: DiscoveryBrowseRequest
  ): Promise<{ view: DiscoveryBrowseViewDTO; cached: boolean }> {
    const contentType =
      request.contentType === 'series' ? 'series' : 'movie';
    const cacheKey = [
      'surface:discovery:browse',
      contentType,
      request.userId || 'anon',
      JSON.stringify({
        q: request.q || '',
        genres: request.genres || [],
        platforms: request.platforms || [],
        availability: request.availability || [],
        sort: request.sort || 'popular',
        page: request.page || 1,
        limit: request.limit || 24,
      }),
    ].join(':');

    const cached = await this.cacheRepository.get<DiscoveryBrowseViewDTO>(
      cacheKey
    );
    if (cached) {
      return {
        view: {
          ...cached,
          generatedAt: cached.generatedAt || new Date().toISOString(),
        },
        cached: true,
      };
    }

    const tvCategory = contentType === 'series' ? 'Series' : 'Cine';
    const [catalogResult, liveResult] = await Promise.all([
      this.catalogService.query({
        userId: request.userId,
        q: request.q,
        types: [contentType as CatalogContentType],
        genres: request.genres,
        platforms: request.platforms,
        availability: request.availability,
        sort: request.sort,
        page: request.page,
        limit: request.limit,
      }),
      this.tvReadQueryService.query({
        view: 'now',
        date: 'today',
        category: tvCategory,
        limit: 8,
      }),
    ]);

    const view: DiscoveryBrowseViewDTO = {
      contentType,
      items: catalogResult.items,
      liveItems: liveResult.items
        .filter((item) => item.airing.liveNow)
        .slice(0, 8)
        .map((item) => this.catalogService.mapTvReadItemToCatalogItem(item)),
      availableGenres: catalogResult.availableGenres,
      availablePlatforms: catalogResult.availablePlatforms.length
        ? catalogResult.availablePlatforms
        : this.catalogService.getPlatforms(),
      meta: catalogResult.meta,
      generatedAt: new Date().toISOString(),
    };

    await this.cacheRepository.set(cacheKey, view, this.ttlSeconds);
    return { view, cached: false };
  }
}
