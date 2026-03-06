import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type CatalogAvailability =
  | 'live'
  | 'streaming'
  | 'free'
  | 'flatrate'
  | 'rent'
  | 'buy';
export type CatalogSort = 'personalized' | 'popular' | 'rating' | 'airtime' | 'recent';
export type CatalogContentType = 'movie' | 'series' | 'program';

export interface CatalogPlatform {
  key: string;
  name: string;
  tmdbProviderId: number;
  color: string;
  logoUrl?: string;
  supportedAvailability: CatalogAvailability[];
}

export interface CatalogProvider {
  id: number;
  name: string;
  logoUrl: string;
  type: 'flatrate' | 'rent' | 'buy' | 'free';
  deepLink?: string;
  price?: string;
}

export interface CatalogUserInteraction {
  status?: 'seen' | 'watching' | 'pending' | 'dropped' | string;
  rating?: number;
  liked?: boolean;
  inWatchlist: boolean;
  lists: string[];
  watchedAt?: string;
}

export interface CatalogItem {
  catalogId: string;
  source: 'program' | 'tmdb';
  contentType: CatalogContentType;
  title: string;
  subtitle?: string;
  synopsis?: string;
  image?: string;
  backdrop?: string;
  genres: string[];
  tmdbId?: number;
  rating?: number;
  releaseYear?: number;
  durationMinutes?: number;
  start?: string;
  end?: string;
  liveNow?: boolean;
  primaryPlatforms: string[];
  whereToWatch?: {
    flatrate: CatalogProvider[];
    rent: CatalogProvider[];
    buy: CatalogProvider[];
    free: CatalogProvider[];
    tmdbLink: string;
  };
  channel?: {
    id: string;
    name: string;
    icon?: string;
  };
  airings?: Array<{
    channelId: string;
    channelName: string;
    channelIcon?: string;
    start: string;
    end: string;
  }>;
  userInteraction?: CatalogUserInteraction;
  cast?: Array<{ name: string; character?: string; profile?: string }>;
  director?: string;
  related?: CatalogItem[];
  socialSummary?: {
    friendsWhoWatched: number;
    avgFriendRating?: number;
  };
}

export interface CatalogSuggestion {
  catalogId: string;
  source: 'program' | 'tmdb';
  contentType: CatalogContentType;
  title: string;
  subtitle?: string;
  image?: string;
  primaryPlatforms: string[];
}

export interface CatalogQuery {
  q?: string;
  types?: CatalogContentType[];
  genres?: string[];
  platforms?: string[];
  availability?: CatalogAvailability[];
  date?: string;
  timeSlot?: string;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
}

export interface CatalogResponse {
  items: CatalogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  availableGenres: string[];
  availablePlatforms: CatalogPlatform[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly baseUrl = environment.API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  query(params: CatalogQuery = {}): Observable<CatalogResponse> {
    let httpParams = new HttpParams();
    Object.entries({
      q: params.q,
      types: params.types?.join(','),
      genres: params.genres?.join(','),
      platforms: params.platforms?.join(','),
      availability: params.availability?.join(','),
      date: params.date,
      timeSlot: params.timeSlot,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http
      .get<ApiResponse<CatalogResponse>>(`${this.baseUrl}/catalog`, {
        params: httpParams,
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((resp) => resp?.data || this.emptyResponse()),
        catchError(() => of(this.emptyResponse()))
      );
  }

  getDetail(catalogId: string): Observable<CatalogItem | null> {
    if (!catalogId) {
      return of(null);
    }

    return this.http
      .get<ApiResponse<CatalogItem>>(
        `${this.baseUrl}/catalog/${encodeURIComponent(catalogId)}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map((resp) => resp?.data || null),
        catchError(() => of(null))
      );
  }

  getPlatforms(): Observable<CatalogPlatform[]> {
    return this.http
      .get<ApiResponse<{ items: CatalogPlatform[] }>>(`${this.baseUrl}/catalog/platforms`)
      .pipe(
        map((resp) => resp?.data?.items || []),
        catchError(() => of([]))
      );
  }

  suggest(q: string, limit = 8): Observable<CatalogSuggestion[]> {
    if (!String(q || '').trim()) {
      return of([]);
    }

    return this.http
      .get<ApiResponse<{ items: CatalogSuggestion[] }>>(
        `${this.baseUrl}/catalog/suggest`,
        {
          params: new HttpParams().set('q', String(q).trim()).set('limit', String(limit)),
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(
        map((resp) => resp?.data?.items || []),
        catchError(() => of([]))
      );
  }

  getForYou(limit = 12): Observable<any[]> {
    return this.http
      .get<ApiResponse<{ items: any[] }>>(`${this.baseUrl}/discovery/for-you`, {
        params: new HttpParams().set('limit', String(limit)),
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((resp) => resp?.data?.items || []),
        catchError(() => of([]))
      );
  }

  private emptyResponse(): CatalogResponse {
    return {
      items: [],
      meta: { page: 1, limit: 24, total: 0, hasMore: false },
      availableGenres: [],
      availablePlatforms: [],
    };
  }

  private getAuthHeaders(): HttpHeaders {
    if (!this.isBrowser) {
      return new HttpHeaders();
    }

    const token = localStorage.getItem('gtv_id_token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}

