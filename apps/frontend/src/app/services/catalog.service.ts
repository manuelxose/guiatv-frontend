import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, concat, of } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
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

export interface CatalogRequestState<T> {
  data: T;
  unavailable: boolean;
  stale: boolean;
  status?: number;
  updatedAt?: string;
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
  slug?: string;
  detailPath?: string;
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
  slug?: string;
  detailPath?: string;
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

interface CatalogCacheEntry<T> {
  data: T;
  updatedAt: number;
  expiresAt: number;
}

interface CooldownEntry {
  until: number;
  status?: number;
}

export const FALLBACK_CATALOG_PLATFORMS: CatalogPlatform[] = [
  { key: 'netflix', name: 'Netflix', tmdbProviderId: 8, color: '#E50914', supportedAvailability: ['streaming', 'flatrate'] },
  { key: 'prime-video', name: 'Prime Video', tmdbProviderId: 119, color: '#00A8E1', supportedAvailability: ['streaming', 'flatrate', 'rent', 'buy'] },
  { key: 'disney-plus', name: 'Disney+', tmdbProviderId: 337, color: '#113CCF', supportedAvailability: ['streaming', 'flatrate'] },
  { key: 'max', name: 'Max', tmdbProviderId: 1899, color: '#6A4CFF', supportedAvailability: ['streaming', 'flatrate'] },
  { key: 'movistar-plus', name: 'Movistar+', tmdbProviderId: 149, color: '#00B7FF', supportedAvailability: ['streaming', 'flatrate', 'live'] },
  { key: 'skyshowtime', name: 'SkyShowtime', tmdbProviderId: 1773, color: '#123FEE', supportedAvailability: ['streaming', 'flatrate'] },
  { key: 'apple-tv-plus', name: 'Apple TV+', tmdbProviderId: 350, color: '#A7A7A7', supportedAvailability: ['streaming', 'flatrate', 'rent', 'buy'] },
  { key: 'filmin', name: 'Filmin', tmdbProviderId: 63, color: '#00AEEF', supportedAvailability: ['streaming', 'flatrate'] },
  { key: 'rtve-play', name: 'RTVE Play', tmdbProviderId: 541, color: '#FFE100', supportedAvailability: ['free', 'streaming'] },
  { key: 'atresplayer', name: 'ATRESplayer', tmdbProviderId: 677, color: '#FF6A00', supportedAvailability: ['streaming', 'flatrate'] },
  { key: 'mitele', name: 'Mitele', tmdbProviderId: 633, color: '#2AD1FF', supportedAvailability: ['streaming', 'flatrate'] },
  { key: 'pluto-tv', name: 'Pluto TV', tmdbProviderId: 300, color: '#FFEA00', supportedAvailability: ['free', 'streaming'] },
  { key: 'rakuten-tv', name: 'Rakuten TV', tmdbProviderId: 35, color: '#C2002F', supportedAvailability: ['rent', 'buy', 'streaming'] },
];

export const FALLBACK_CATALOG_GENRES: string[] = [
  'Cine',
  'Series',
  'Acción',
  'Drama',
  'Comedia',
  'Terror',
  'Ciencia ficción',
  'Documental',
  'Deportes',
  'Infantil',
  'Suspense',
  'Romance',
];

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly cache = new Map<string, CatalogCacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Observable<CatalogRequestState<unknown>>>();
  private readonly cooldowns = new Map<string, CooldownEntry>();
  private readonly ttlByKind = {
    platforms: 10 * 60 * 1000,
    query: 60 * 1000,
    forYou: 60 * 1000,
    suggest: 30 * 1000,
    detail: 10 * 60 * 1000,
  } as const;
  private readonly rateLimitCooldownMs = 30 * 1000;
  private readonly serverCooldownMs = 20 * 1000;

  constructor(private readonly http: HttpClient) {}

  query(params: CatalogQuery = {}): Observable<CatalogResponse> {
    return this.queryState(params).pipe(map((result) => result.data));
  }

  queryState(params: CatalogQuery = {}): Observable<CatalogRequestState<CatalogResponse>> {
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

    return this.requestState<CatalogResponse>({
      key: this.buildCacheKey('query', this.normalizeQuery(params)),
      ttlMs: this.ttlByKind.query,
      fallbackData: this.emptyResponse(),
      requestFactory: () =>
        this.http
          .get<ApiResponse<CatalogResponse>>(`${this.baseUrl}/catalog`, {
            params: httpParams,
            headers: this.getAuthHeaders(),
          })
          .pipe(map((resp) => resp?.data || this.emptyResponse())),
    });
  }

  getDetail(catalogId: string): Observable<CatalogItem | null> {
    if (!catalogId) {
      return of(null);
    }

    return this.requestState<CatalogItem | null>({
      key: this.buildCacheKey('detail', catalogId),
      ttlMs: this.ttlByKind.detail,
      fallbackData: null,
      requestFactory: () =>
        this.http
          .get<ApiResponse<CatalogItem>>(
            `${this.baseUrl}/catalog/${encodeURIComponent(catalogId)}`,
            { headers: this.getAuthHeaders() }
          )
          .pipe(map((resp) => resp?.data || null)),
    }).pipe(map((state) => state.data));
  }

  getPlatforms(): Observable<CatalogPlatform[]> {
    return this.getPlatformsState().pipe(map((result) => result.data));
  }

  getPlatformsState(): Observable<CatalogRequestState<CatalogPlatform[]>> {
    return this.requestState<CatalogPlatform[]>({
      key: this.buildCacheKey('platforms', 'es'),
      ttlMs: this.ttlByKind.platforms,
      fallbackData: [...FALLBACK_CATALOG_PLATFORMS],
      requestFactory: () =>
        this.http
          .get<ApiResponse<{ items: CatalogPlatform[] }>>(`${this.baseUrl}/catalog/platforms`)
          .pipe(map((resp) => resp?.data?.items || [])),
    });
  }

  suggest(q: string, limit = 8): Observable<CatalogSuggestion[]> {
    if (!String(q || '').trim()) {
      return of([]);
    }

    return this.requestState<CatalogSuggestion[]>({
      key: this.buildCacheKey('suggest', `${String(q).trim().toLowerCase()}|${limit}`),
      ttlMs: this.ttlByKind.suggest,
      fallbackData: [],
      requestFactory: () =>
        this.http
          .get<ApiResponse<{ items: CatalogSuggestion[] }>>(
            `${this.baseUrl}/catalog/suggest`,
            {
              params: new HttpParams().set('q', String(q).trim()).set('limit', String(limit)),
              headers: this.getAuthHeaders(),
            }
          )
          .pipe(map((resp) => resp?.data?.items || [])),
    }).pipe(map((state) => state.data));
  }

  getBySlug(contentType: CatalogContentType, slug: string): Observable<CatalogItem | null> {
    if (!contentType || !slug) {
      return of(null);
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    return this.requestState<CatalogItem | null>({
      key: this.buildCacheKey('detail', `slug:${contentType}:${normalizedSlug}`),
      ttlMs: this.ttlByKind.detail,
      fallbackData: null,
      requestFactory: () =>
        this.http
          .get<ApiResponse<CatalogItem>>(
            `${this.baseUrl}/catalog/slug/${encodeURIComponent(contentType)}/${encodeURIComponent(normalizedSlug)}`,
            { headers: this.getAuthHeaders() }
          )
          .pipe(map((resp) => resp?.data || null)),
    }).pipe(map((state) => state.data));
  }

  getForYou(limit = 12): Observable<any[]> {
    return this.getForYouState(limit).pipe(map((result) => result.data));
  }

  getForYouState(limit = 12): Observable<CatalogRequestState<any[]>> {
    return this.requestState<any[]>({
      key: this.buildCacheKey('forYou', `limit:${limit}`),
      ttlMs: this.ttlByKind.forYou,
      fallbackData: [],
      requestFactory: () =>
        this.http
          .get<ApiResponse<{ items: any[] }>>(`${this.baseUrl}/discovery/for-you`, {
            params: new HttpParams().set('limit', String(limit)),
            headers: this.getAuthHeaders(),
          })
          .pipe(map((resp) => resp?.data?.items || [])),
    });
  }

  private emptyResponse(): CatalogResponse {
    return {
      items: [],
      meta: { page: 1, limit: 24, total: 0, hasMore: false },
      availableGenres: [...FALLBACK_CATALOG_GENRES],
      availablePlatforms: [...FALLBACK_CATALOG_PLATFORMS],
    };
  }

  private requestState<T>(options: {
    key: string;
    ttlMs: number;
    fallbackData: T;
    requestFactory: () => Observable<T>;
  }): Observable<CatalogRequestState<T>> {
    const now = Date.now();
    const cached = this.cache.get(options.key) as CatalogCacheEntry<T> | undefined;
    const cooldown = this.cooldowns.get(options.key);

    if (cached && cached.expiresAt > now) {
      return of(this.toState(cached.data, false, false, undefined, cached.updatedAt));
    }

    if (cooldown && cooldown.until > now && !this.inFlight.has(options.key)) {
      return of(
        cached
          ? this.toState(cached.data, false, true, cooldown.status, cached.updatedAt)
          : this.toState(options.fallbackData, true, false, cooldown.status)
      );
    }

    const pending = this.inFlight.get(options.key) as
      | Observable<CatalogRequestState<T>>
      | undefined;
    if (pending) {
      return cached
        ? concat(
            of(this.toState(cached.data, false, true, undefined, cached.updatedAt)),
            pending
          )
        : pending;
    }

    const request$ = options.requestFactory().pipe(
      map((data) => {
        const updatedAt = Date.now();
        this.cache.set(options.key, {
          data,
          updatedAt,
          expiresAt: updatedAt + options.ttlMs,
        });
        this.cooldowns.delete(options.key);
        return this.toState(data, false, false, undefined, updatedAt);
      }),
      catchError((error: HttpErrorResponse) => {
        this.registerCooldown(options.key, error.status);
        return of(
          cached
            ? this.toState(cached.data, false, true, error.status, cached.updatedAt)
            : this.toState(options.fallbackData, true, false, error.status)
        );
      }),
      finalize(() => this.inFlight.delete(options.key)),
      shareReplay(1)
    );

    this.inFlight.set(options.key, request$ as Observable<CatalogRequestState<unknown>>);

    return cached
      ? concat(
          of(this.toState(cached.data, false, true, undefined, cached.updatedAt)),
          request$
        )
      : request$;
  }

  private normalizeQuery(params: CatalogQuery): string {
    return JSON.stringify({
      q: String(params.q || '').trim().toLowerCase(),
      types: this.normalizeKeyArray(params.types),
      genres: this.normalizeKeyArray(params.genres),
      platforms: this.normalizeKeyArray(params.platforms),
      availability: this.normalizeKeyArray(params.availability),
      date: String(params.date || '').trim(),
      timeSlot: String(params.timeSlot || '').trim(),
      sort: String(params.sort || '').trim(),
      page: Number(params.page || 1),
      limit: Number(params.limit || 24),
    });
  }

  private normalizeKeyArray(values?: readonly string[]): string[] {
    return [...(values || [])]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, 'es'));
  }

  private buildCacheKey(
    kind: 'query' | 'platforms' | 'suggest' | 'forYou' | 'detail',
    value: string
  ): string {
    return `${kind}:${this.getAuthScope()}:${value}`;
  }

  private getAuthScope(): string {
    if (!this.isBrowser) {
      return 'anon';
    }

    const token = localStorage.getItem('gtv_id_token');
    if (!token) {
      return 'anon';
    }

    try {
      const [, payload] = token.split('.');
      if (!payload) {
        return `token:${token.slice(-16)}`;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        Math.ceil(normalizedPayload.length / 4) * 4,
        '='
      );
      const decoded = JSON.parse(atob(paddedPayload));
      return String(decoded?.sub || decoded?.userId || decoded?.id || `token:${token.slice(-16)}`);
    } catch {
      return `token:${token.slice(-16)}`;
    }
  }

  private registerCooldown(key: string, status?: number): void {
    if (!status || (status !== 429 && status < 500)) {
      return;
    }

    const cooldownMs = status === 429 ? this.rateLimitCooldownMs : this.serverCooldownMs;
    this.cooldowns.set(key, {
      until: Date.now() + cooldownMs,
      status,
    });
  }

  private toState<T>(
    data: T,
    unavailable: boolean,
    stale: boolean,
    status?: number,
    updatedAt?: number
  ): CatalogRequestState<T> {
    return {
      data,
      unavailable,
      stale,
      status,
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : undefined,
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
