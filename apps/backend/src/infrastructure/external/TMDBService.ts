import axios, { AxiosInstance } from 'axios';
import https from 'node:https';
import { logger } from '../../shared/utils/logger';
import type { StreamingProvidersService, WatchProvidersResult } from './StreamingProvidersService';

export interface TMDBResult {
  id: number;
  title: string;
  name?: string;
  original_title: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
}

export interface TMDBDetailResult extends TMDBResult {
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  episode_run_time?: number[];
  credits?: {
    cast?: Array<{
      name: string;
      character?: string;
      profile_path?: string | null;
    }>;
    crew?: Array<{
      name: string;
      job?: string;
      department?: string;
    }>;
  };
}

export interface TMDBPagedResponse<T> {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
}

export interface TMDBDiscoverOptions {
  page?: number;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'first_air_date.desc';
  withWatchProviders?: number[];
  withGenres?: number[];
  region?: string;
  includeAdult?: boolean;
  watchMonetizationTypes?: Array<'flatrate' | 'free' | 'rent' | 'buy'>;
}

export class TMDBService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly logger = logger.child('TMDBService');
  private readonly apiKey: string;
  private readonly http: AxiosInstance;
  private readonly cache = new Map<string, TMDBResult | null>();
  private readonly detailCache = new Map<string, TMDBDetailResult | null>();
  private readonly listCache = new Map<string, { expiresAt: number; value: unknown }>();
  private readonly listCacheTtlMs =
    (Number(process.env.TMDB_LIST_CACHE_TTL_MIN || 10) || 10) * 60 * 1000;
  private streamingProvidersService?: StreamingProvidersService;

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    const allowSelfSigned =
      process.env.TMDB_ALLOW_SELF_SIGNED === '1' ||
      process.env.TMDB_ALLOW_SELF_SIGNED?.toLowerCase() === 'true' ||
      process.env.NODE_ENV !== 'production'; // default to permissive in non-prod to dodge corp proxies

    this.http = axios.create({
      baseURL: this.baseUrl,
      httpsAgent: allowSelfSigned
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      // Reuse connections to avoid repeated TLS handshakes
      timeout: 8000,
    });

    if (allowSelfSigned) {
      this.logger.warn(
        'TMDB self-signed certificate acceptance enabled via TMDB_ALLOW_SELF_SIGNED'
      );
    }
  }

  private getCacheKey(type: 'movie' | 'series', query: string, year?: number) {
    return `${type}:${query}:${year ?? ''}`.toLowerCase();
  }

  private getDetailCacheKey(type: 'movie' | 'tv', tmdbId: number): string {
    return `${type}:${tmdbId}`;
  }

  attachStreamingProvidersService(service: StreamingProvidersService): void {
    this.streamingProvidersService = service;
  }

  async searchMovie(query: string, year?: number): Promise<TMDBResult | null> {
    const cacheKey = this.getCacheKey('movie', query, year);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) ?? null;
    }

    try {
      const params: any = {
        query,
        language: 'es-ES',
        page: 1,
        include_adult: false,
      };
      
      if (year) {
        params.year = year;
      }

      const response = await this.http.get('/search/movie', { params });

      const results = response.data.results;
      if (results && results.length > 0) {
        const result = results[0] as TMDBResult;
        this.cache.set(cacheKey, result);
        return result;
      }
      
      this.cache.set(cacheKey, null);
      return null;
    } catch (error) {
      this.cache.set(cacheKey, null);
      this.logger.warn(`Failed to search movie: ${query}`, { error: (error as Error).message });
      return null;
    }
  }

  async searchSeries(query: string): Promise<TMDBResult | null> {
    const cacheKey = this.getCacheKey('series', query);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) ?? null;
    }

    try {
      const response = await this.http.get('/search/tv', {
        params: {
          query,
          language: 'es-ES',
          page: 1,
          include_adult: false,
        },
      });

      const results = response.data.results;
      if (results && results.length > 0) {
        const result = results[0] as TMDBResult;
        this.cache.set(cacheKey, result);
        return result;
      }
      
      this.cache.set(cacheKey, null);
      return null;
    } catch (error) {
      this.cache.set(cacheKey, null);
      this.logger.warn(`Failed to search series: ${query}`, { error: (error as Error).message });
      return null;
    }
  }

  async searchMovies(
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<TMDBResult[]> {
    return this.searchList('/search/movie', query, options);
  }

  async searchTV(
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<TMDBResult[]> {
    return this.searchList('/search/tv', query, options);
  }

  async discoverMovies(
    options?: TMDBDiscoverOptions
  ): Promise<TMDBPagedResponse<TMDBResult>> {
    return this.discover('/discover/movie', options);
  }

  async discoverTV(
    options?: TMDBDiscoverOptions
  ): Promise<TMDBPagedResponse<TMDBResult>> {
    return this.discover('/discover/tv', options);
  }

  async getMovieById(tmdbId: number): Promise<TMDBDetailResult | null> {
    return this.getById('movie', tmdbId);
  }

  async getTVById(tmdbId: number): Promise<TMDBDetailResult | null> {
    return this.getById('tv', tmdbId);
  }

  async getMovieWatchProviders(tmdbId: number): Promise<WatchProvidersResult | null> {
    if (!this.streamingProvidersService) {
      return null;
    }

    return this.streamingProvidersService.getMovieProviders(tmdbId);
  }

  async getTVWatchProviders(tmdbId: number): Promise<WatchProvidersResult | null> {
    if (!this.streamingProvidersService) {
      return null;
    }

    return this.streamingProvidersService.getTVProviders(tmdbId);
  }

  getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string | undefined {
    if (!path) return undefined;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  private async getById(
    type: 'movie' | 'tv',
    tmdbId: number
  ): Promise<TMDBDetailResult | null> {
    const cacheKey = this.getDetailCacheKey(type, tmdbId);
    if (this.detailCache.has(cacheKey)) {
      return this.detailCache.get(cacheKey) ?? null;
    }

    try {
      const response = await this.http.get(`/${type}/${tmdbId}`, {
        params: {
          language: 'es-ES',
          append_to_response: 'credits',
        },
      });

      const result = response.data as TMDBDetailResult;
      this.detailCache.set(cacheKey, result);
      return result;
    } catch (error) {
      this.detailCache.set(cacheKey, null);
      this.logger.warn(`Failed to get ${type} by id: ${tmdbId}`, {
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async searchList(
    path: '/search/movie' | '/search/tv',
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<TMDBResult[]> {
    const normalizedQuery = String(query || '').trim();
    if (!normalizedQuery) {
      return [];
    }

    const cacheKey = `list:${path}:${normalizedQuery}:${Number(options?.page || 1)}:${Number(options?.limit || 20)}`;
    const cached = this.getListCache<TMDBResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.http.get(path, {
        params: {
          query: normalizedQuery,
          language: 'es-ES',
          page: Number(options?.page || 1),
          include_adult: false,
        },
      });

      const results = Array.isArray(response.data?.results)
        ? response.data.results.slice(0, Math.max(1, Number(options?.limit || 20)))
        : [];

      this.setListCache(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.warn(`Failed to search list on ${path}: ${normalizedQuery}`, {
        error: (error as Error).message,
      });
      this.setListCache(cacheKey, []);
      return [];
    }
  }

  private async discover(
    path: '/discover/movie' | '/discover/tv',
    options?: TMDBDiscoverOptions
  ): Promise<TMDBPagedResponse<TMDBResult>> {
    const page = Math.max(1, Number(options?.page || 1));
    const cacheKey = `discover:${path}:${JSON.stringify({
      page,
      sortBy: options?.sortBy || '',
      withWatchProviders: options?.withWatchProviders || [],
      withGenres: options?.withGenres || [],
      region: options?.region || 'ES',
      includeAdult: Boolean(options?.includeAdult),
      watchMonetizationTypes: options?.watchMonetizationTypes || [],
    })}`;
    const cached = this.getListCache<TMDBPagedResponse<TMDBResult>>(cacheKey);
    if (cached) {
      return cached;
    }

    const params: Record<string, string | number | boolean> = {
      language: 'es-ES',
      page,
      watch_region: String(options?.region || 'ES'),
      include_adult: Boolean(options?.includeAdult),
      sort_by: options?.sortBy || 'popularity.desc',
    };

    if (options?.withWatchProviders?.length) {
      params['with_watch_providers'] = options.withWatchProviders.join('|');
    }
    if (options?.withGenres?.length) {
      params['with_genres'] = options.withGenres.join(',');
    }
    if (options?.watchMonetizationTypes?.length) {
      params['with_watch_monetization_types'] =
        options.watchMonetizationTypes.join('|');
    }

    try {
      const response = await this.http.get(path, { params });
      const result: TMDBPagedResponse<TMDBResult> = {
        page: Number(response.data?.page || page),
        total_pages: Number(response.data?.total_pages || 0),
        total_results: Number(response.data?.total_results || 0),
        results: Array.isArray(response.data?.results)
          ? response.data.results
          : [],
      };

      this.setListCache(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.warn(`Failed to discover content on ${path}`, {
        error: (error as Error).message,
      });
      const empty: TMDBPagedResponse<TMDBResult> = {
        page,
        total_pages: 0,
        total_results: 0,
        results: [],
      };
      this.setListCache(cacheKey, empty);
      return empty;
    }
  }

  private getListCache<T>(key: string): T | null {
    const hit = this.listCache.get(key);
    if (!hit) {
      return null;
    }

    if (hit.expiresAt <= Date.now()) {
      this.listCache.delete(key);
      return null;
    }

    return hit.value as T;
  }

  private setListCache<T>(key: string, value: T): void {
    this.listCache.set(key, {
      value,
      expiresAt: Date.now() + this.listCacheTtlMs,
    });
  }
}
