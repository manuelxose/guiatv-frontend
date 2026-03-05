import axios, { AxiosInstance } from 'axios';
import https from 'node:https';
import { logger } from '../../shared/utils/logger';

export interface TMDBResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

export class TMDBService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly logger = logger.child('TMDBService');
  private readonly apiKey: string;
  private readonly http: AxiosInstance;
  private readonly cache = new Map<string, TMDBResult | null>();

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

  getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string | undefined {
    if (!path) return undefined;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}
