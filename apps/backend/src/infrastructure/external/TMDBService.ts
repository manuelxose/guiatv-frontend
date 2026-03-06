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

export class TMDBService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly logger = logger.child('TMDBService');
  private readonly apiKey: string;
  private readonly http: AxiosInstance;
  private readonly cache = new Map<string, TMDBResult | null>();
  private readonly detailCache = new Map<string, TMDBDetailResult | null>();
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
}
