import axios, { AxiosInstance } from 'axios';
import https from 'node:https';
import { TMDBService } from './TMDBService';
import type { ICacheRepository } from '@/domain/repositories/ICacheRepository';

export interface StreamingProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
  displayPriority: number;
}

export interface WatchProvidersResult {
  tmdbId: number;
  contentType: 'movie' | 'tv';
  country: 'ES';
  flatrate: StreamingProvider[];
  rent: StreamingProvider[];
  buy: StreamingProvider[];
  free: StreamingProvider[];
  link: string;
  fetchedAt: Date;
}

export class StreamingProvidersService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly country = (
    process.env.STREAMING_PROVIDERS_COUNTRY || 'ES'
  ).toUpperCase() as 'ES';
  private readonly cache = new Map<
    string,
    { expiresAt: number; value: WatchProvidersResult | null }
  >();
  private readonly cacheTTL =
    (Number(process.env.STREAMING_PROVIDERS_CACHE_TTL_HOURS || 24) || 24) *
    60 *
    60 *
    1000;
  private readonly persistentCacheTTLSeconds =
    (Number(process.env.STREAMING_PROVIDERS_CACHE_TTL_HOURS || 24) || 24) * 60 * 60;
  private readonly http: AxiosInstance;

  constructor(
    private readonly apiKey: string,
    private readonly tmdbService: TMDBService,
    private readonly persistentCache?: ICacheRepository | null
  ) {
    const allowSelfSigned =
      process.env.TMDB_ALLOW_SELF_SIGNED === '1' ||
      process.env.TMDB_ALLOW_SELF_SIGNED?.toLowerCase() === 'true' ||
      process.env.NODE_ENV !== 'production';

    this.http = axios.create({
      baseURL: this.baseUrl,
      httpsAgent: allowSelfSigned
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      timeout: 8000,
    });
  }

  async getMovieProviders(tmdbId: number): Promise<WatchProvidersResult | null> {
    return this.getProviders(tmdbId, 'movie');
  }

  async getTVProviders(tmdbId: number): Promise<WatchProvidersResult | null> {
    return this.getProviders(tmdbId, 'tv');
  }

  async resolveAndGetProviders(
    title: string,
    year?: number,
    type: 'movie' | 'tv' = 'movie'
  ): Promise<WatchProvidersResult | null> {
    const tmdbResult =
      type === 'movie'
        ? await this.tmdbService.searchMovie(title, year)
        : await this.tmdbService.searchSeries(title);

    if (!tmdbResult?.id) {
      return null;
    }

    return type === 'movie'
      ? this.getMovieProviders(tmdbResult.id)
      : this.getTVProviders(tmdbResult.id);
  }

  getLogoUrl(
    logoPath: string,
    size: 'w45' | 'w92' | 'w154' = 'w92'
  ): string {
    return `https://image.tmdb.org/t/p/${size}${logoPath}`;
  }

  private async getProviders(
    tmdbId: number,
    contentType: 'movie' | 'tv'
  ): Promise<WatchProvidersResult | null> {
    const cacheKey = `${contentType}:${tmdbId}:${this.country}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const persistentKey = `streaming-providers:${cacheKey}`;
    if (this.persistentCache) {
      try {
        const persisted =
          await this.persistentCache.get<{ value: WatchProvidersResult | null }>(
            persistentKey
          );
        if (persisted) {
          this.cache.set(cacheKey, {
            value: persisted.value,
            expiresAt: Date.now() + this.cacheTTL,
          });
          return persisted.value;
        }
      } catch {
        // Persistent cache failures must not block provider resolution.
      }
    }

    try {
      const response = await this.http.get(
        `/${contentType}/${tmdbId}/watch/providers`
      );
      const result = response.data?.results?.[this.country];

      if (!result) {
        this.cache.set(cacheKey, {
          value: null,
          expiresAt: Date.now() + this.cacheTTL,
        });
        return null;
      }

      const mapped: WatchProvidersResult = {
        tmdbId,
        contentType,
        country: this.country,
        flatrate: this.mapProviders(result.flatrate),
        rent: this.mapProviders(result.rent),
        buy: this.mapProviders(result.buy),
        free: this.mapProviders(result.free),
        link: String(result.link || ''),
        fetchedAt: new Date(),
      };

      this.cache.set(cacheKey, {
        value: mapped,
        expiresAt: Date.now() + this.cacheTTL,
      });
      if (this.persistentCache) {
        this.persistentCache
          .set(
            persistentKey,
            { value: mapped },
            this.persistentCacheTTLSeconds
          )
          .catch(() => {});
      }

      return mapped;
    } catch {
      this.cache.set(cacheKey, {
        value: null,
        expiresAt: Date.now() + this.cacheTTL,
      });
      if (this.persistentCache) {
        this.persistentCache
          .set(
            persistentKey,
            { value: null },
            this.persistentCacheTTLSeconds
          )
          .catch(() => {});
      }
      return null;
    }
  }

  private mapProviders(input: any[] | undefined): StreamingProvider[] {
    if (!Array.isArray(input)) {
      return [];
    }

    return input.map((provider) => ({
      providerId: Number(provider.provider_id),
      providerName: this.normalizeProviderName(String(provider.provider_name || '')),
      logoPath: String(provider.logo_path || ''),
      displayPriority: Number(provider.display_priority || 0),
    }));
  }

  private normalizeProviderName(name: string): string {
    const map: Record<string, string> = {
      Netflix: 'Netflix',
      'Amazon Prime Video': 'Prime Video',
      'Disney Plus': 'Disney+',
      Max: 'Max',
      'HBO Max': 'Max',
      'Movistar Plus+': 'Movistar+',
      SkyShowtime: 'SkyShowtime',
      'Apple TV Plus': 'Apple TV+',
      Filmin: 'Filmin',
      'RTVE Play': 'RTVE Play',
      'Atresplayer Premium': 'ATRESplayer',
      Atresplayer: 'ATRESplayer',
      'Mitele Plus': 'Mitele',
      'Pluto TV': 'Pluto TV',
      'Rakuten TV': 'Rakuten TV',
    };

    return map[name] || name;
  }
}
