import { DateUtils } from '@/shared/utils/dateUtils';
import { CatalogQueryResultDTO } from '../dto/CatalogDTO';
import { CatalogService } from '../services/CatalogService';
import { TvReadQueryService } from '../services/TvReadQueryService';

export interface DiscoverySearchRequest {
  q?: string;
  date?: string;
  genre?: string;
  platform?: string;
  type?: string;
  limit?: number;
  page?: number;
}

export class SearchDiscoveryContent {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly tvReadQueryService: TvReadQueryService
  ) {}

  async execute(
    request: DiscoverySearchRequest
  ): Promise<CatalogQueryResultDTO> {
    const date =
      request.date && request.date.length
        ? DateUtils.parseDateAlias(request.date)
        : DateUtils.getTodayYYYYMMDD();
    const q = String(request.q || '').trim();
    const limit = Math.min(Math.max(1, request.limit || 24), 60);
    const page = request.page && request.page > 0 ? request.page : 1;
    const type = String(request.type || '').trim().toLowerCase();
    const genre = String(request.genre || '').trim();
    const platform = String(request.platform || '').trim();

    const includeTv = !type || type === 'program' || type === 'tv' || type === 'all';
    const includeStreaming = !type || type === 'movie' || type === 'series' || type === 'all';

    const [tvResult, streamingResult] = await Promise.all([
      includeTv && q
        ? this.tvReadQueryService.query({
            view: 'search',
            date,
            q,
            limit: 48,
          })
        : Promise.resolve({ items: [] } as any),
      includeStreaming
        ? this.catalogService.query({
            q: q || undefined,
            types:
              type === 'movie' || type === 'series'
                ? [type]
                : ['movie', 'series'],
            genres: genre ? [genre] : undefined,
            platforms: platform ? [platform] : undefined,
            limit: 48,
            page: 1,
            sort: q ? 'popular' : 'recent',
          })
        : Promise.resolve({
            items: [],
            meta: { total: 0, page: 1, limit: 48, hasMore: false },
            availableGenres: [],
            availablePlatforms: this.catalogService.getPlatforms(),
          }),
    ]);

    const tvItems = (tvResult.items || [])
      .map((item: any) => this.catalogService.mapTvReadItemToCatalogItem(item))
      .filter(() => !platform)
      .filter((item: any) => (genre ? item.genres.includes(genre) : true));

    const merged = [...tvItems, ...(streamingResult.items || [])]
      .sort((left, right) => this.score(right, q) - this.score(left, q))
      .slice((page - 1) * limit, (page - 1) * limit + limit);

    const allItems = [...tvItems, ...(streamingResult.items || [])];
    return {
      items: merged,
      meta: {
        total: allItems.length,
        page,
        limit,
        hasMore: page * limit < allItems.length,
      },
      availableGenres: Array.from(
        new Set(
          allItems.flatMap((item) => item.genres).map((entry) => String(entry || '').trim())
        )
      ).filter(Boolean),
      availablePlatforms: streamingResult.availablePlatforms || this.catalogService.getPlatforms(),
    };
  }

  private score(item: { title: string; liveNow?: boolean; image?: string; rating?: number }, q: string): number {
    let score = 0;
    const normalizedTitle = this.normalize(item.title);
    const normalizedQuery = this.normalize(q);

    if (normalizedQuery && normalizedTitle === normalizedQuery) {
      score += 100;
    } else if (normalizedQuery && normalizedTitle.includes(normalizedQuery)) {
      score += 40;
    }

    if (item.liveNow) score += 20;
    if (item.image) score += 10;
    if (typeof item.rating === 'number') score += Math.min(item.rating, 10);

    return score;
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
