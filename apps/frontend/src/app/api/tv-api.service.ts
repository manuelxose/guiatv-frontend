import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import {
  ApiResponse,
  DateAlias,
  TvChannelSurfaceDTO,
  TvGuideSurfaceDTO,
  TvReadChannelsResponseDTO,
  TvReadItemResponseDTO,
  TvReadResponseDTO,
} from './models';
import { ApiCacheService } from './cache.service';

const DEFAULT_TTL = 30_000;

@Injectable({ providedIn: 'root' })
export class TvApiService {
  constructor(
    private client: ApiClientService,
    private cache: ApiCacheService
  ) {}

  getHealth(): Observable<ApiResponse<any>> {
    return this.client.get<ApiResponse<any>>('/health');
  }

  getTvRead(query: {
    view: 'now' | 'next' | 'night' | 'day' | 'search';
    date?: DateAlias;
    group?: string;
    category?: string;
    channelId?: string;
    q?: string;
    limit?: number;
    cursor?: string;
  }): Observable<ApiResponse<TvReadResponseDTO>> {
    const params: Record<string, any> = {
      view: query.view,
      date: query.date ?? 'today',
      group: query.group,
      category: query.category,
      channelId: query.channelId,
      q: query.q,
      limit: query.limit,
      cursor: query.cursor,
    };
    return this.cachedGet<ApiResponse<TvReadResponseDTO>>(
      `/tv/read:${JSON.stringify(params)}`,
      '/tv/read',
      params,
      this.resolveReadTtl(query.view)
    );
  }

  getTvReadChannels(
    date: DateAlias = 'today',
    group?: string
  ): Observable<ApiResponse<TvReadChannelsResponseDTO>> {
    const params: Record<string, any> = {
      date,
      group,
    };
    return this.cachedGet<ApiResponse<TvReadChannelsResponseDTO>>(
      `/tv/read/channels:${JSON.stringify(params)}`,
      '/tv/read/channels',
      params,
      60_000
    );
  }

  getTvReadChannelDetail(
    channelId: string,
    date: DateAlias = 'today',
    view: 'now' | 'next' | 'night' | 'day' = 'day'
  ): Observable<ApiResponse<TvReadResponseDTO>> {
    const params: Record<string, any> = {
      date,
      view,
    };
    return this.cachedGet<ApiResponse<TvReadResponseDTO>>(
      `/tv/read/channels/${channelId}:${JSON.stringify(params)}`,
      `/tv/read/channels/${channelId}`,
      params,
      view === 'now' ? 60_000 : 15 * 60_000
    );
  }

  getTvReadItem(airingId: string): Observable<ApiResponse<TvReadItemResponseDTO>> {
    return this.cachedGet<ApiResponse<TvReadItemResponseDTO>>(
      `/tv/read/items/${airingId}`,
      `/tv/read/items/${airingId}`,
      undefined,
      30 * 60_000
    );
  }

  getTvGuideSurface(params: {
    date?: DateAlias;
    group?: string;
    category?: string;
  }): Observable<ApiResponse<TvGuideSurfaceDTO>> {
    return this.cachedGet<ApiResponse<TvGuideSurfaceDTO>>(
      `/tv/surface/guide:${JSON.stringify(params)}`,
      '/tv/surface/guide',
      params,
      60_000
    );
  }

  getTvChannelSurface(
    channelId: string,
    date: DateAlias = 'today'
  ): Observable<ApiResponse<TvChannelSurfaceDTO>> {
    return this.cachedGet<ApiResponse<TvChannelSurfaceDTO>>(
      `/tv/surface/channels/${channelId}:${date}`,
      `/tv/surface/channels/${channelId}`,
      { date },
      60_000
    );
  }

  triggerSync(body: { date?: DateAlias; forceRefresh?: boolean; sourceUrl?: string }) {
    return this.client.post('/v2/admin/sync', body);
  }

  triggerPrecompute(body: { date?: DateAlias; fields?: 'minimal' | 'full' }) {
    return this.client.post('/v2/admin/precompute', body);
  }

  triggerPrecomputeWindow(body: { fields?: 'minimal' | 'full' }) {
    return this.client.post('/v2/admin/precompute-window', body);
  }

  triggerCacheClear(body: { pattern?: string }) {
    return this.client.post('/v2/admin/cache/clear', body);
  }

  private cachedGet<T>(
    cacheKey: string,
    path: string,
    params?: Record<string, any>,
    ttlMs: number = DEFAULT_TTL
  ): Observable<T> {
    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    return new Observable((subscriber) => {
      this.client.get<T>(path, params).subscribe({
        next: (resp) => {
          this.cache.set(cacheKey, resp, ttlMs);
          subscriber.next(resp);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err),
      });
    });
  }

  private resolveReadTtl(view: 'now' | 'next' | 'night' | 'day' | 'search'): number {
    if (view === 'now') return 60_000;
    if (view === 'next') return 120_000;
    if (view === 'search') return 30_000;
    return 15 * 60_000;
  }
}
