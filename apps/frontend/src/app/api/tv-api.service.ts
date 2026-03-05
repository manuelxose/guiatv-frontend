import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import {
  ApiResponse,
  ChannelMetaDTO,
  LayoutsQuery,
  LayoutsResponse,
  NowPlayingResponse,
  ProgramResponse,
  ProgramsQuery,
  ProgramsResponse,
  ScheduleChannelsSummary,
  ScheduleResponse,
  DateAlias,
} from './models';
import { ApiCacheService } from './cache.service';

const DEFAULT_TTL = 30_000; // 30s for most GETs

@Injectable({ providedIn: 'root' })
export class TvApiService {
  constructor(
    private client: ApiClientService,
    private cache: ApiCacheService
  ) {}

  getHealth(): Observable<ApiResponse<any>> {
    return this.client.get<ApiResponse<any>>('/health');
  }

  getChannels(): Observable<ApiResponse<{ channels: ChannelMetaDTO[] }>> {
    return this.client.get('/channels');
  }

  getPrograms(query: ProgramsQuery): Observable<ApiResponse<ProgramsResponse>> {
    this.assertDate(query.date);
    const params: Record<string, any> = {
      date: query.date,
      fields: query.fields ?? 'full',
      limit: query.limit ?? 5000,
      page: query.page,
      channels: query.channels,
      timeSlot: query.timeSlot,
      country: query.country,
      channelTypes: query.channelTypes,
    };
    return this.client.get('/programs', params);
  }

  getProgram(id: string): Observable<ApiResponse<ProgramResponse>> {
    return this.client.get(`/programs/${id}`);
  }

  getLayouts(
    date: DateAlias,
    query?: LayoutsQuery
  ): Observable<ApiResponse<LayoutsResponse>> {
    this.assertDate(date);
    const params: Record<string, any> = {
      fields: query?.fields ?? 'full',
      channels: query?.channels,
      timeSlot: query?.timeSlot,
      channelTypes: query?.channelTypes,
    };
    const cacheKey = `layouts:${date}:${JSON.stringify(params)}`;
    const cached = this.cache.get<ApiResponse<LayoutsResponse>>(cacheKey);
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    return new Observable((subscriber) => {
      this.client.get<ApiResponse<LayoutsResponse>>(`/layouts/${date}`, params).subscribe({
        next: (resp) => {
          this.cache.set(cacheKey, resp, DEFAULT_TTL);
          subscriber.next(resp);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err),
      });
    });
  }

  getSchedule(date: DateAlias): Observable<ApiResponse<ScheduleResponse>> {
    this.assertDate(date);
    return this.client.get(`/schedules/${date}`);
  }

  getScheduleChannels(
    date: DateAlias
  ): Observable<ApiResponse<ScheduleChannelsSummary>> {
    this.assertDate(date);
    return this.client.get(`/schedules/${date}/channels`);
  }

  getNowPlaying(): Observable<ApiResponse<NowPlayingResponse>> {
    const cacheKey = 'now-playing';
    const cached = this.cache.get<ApiResponse<NowPlayingResponse>>(cacheKey);
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    return new Observable((subscriber) => {
      this.client.get<ApiResponse<NowPlayingResponse>>('/ssr/now-playing').subscribe({
        next: (resp) => {
          this.cache.set(cacheKey, resp, 15_000); // shorter TTL
          subscriber.next(resp);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err),
      });
    });
  }

  /**
   * Placeholder helpers for admin endpoints. They are declared but not wired to UI yet.
   */
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

  private assertDate(date: DateAlias) {
    if (!date) {
      throw new Error('[TvApiService] date is required');
    }
  }
}
