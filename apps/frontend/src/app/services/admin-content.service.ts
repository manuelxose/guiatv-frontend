import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AdminContentChannel {
  id: string;
  name: string;
  icon?: string;
  type: string;
  group?: string;
  country?: string;
  region?: string;
  isActive: boolean;
}

export interface AdminContentProgram {
  id: string;
  channelId: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  genre?: string;
  image?: string;
}

export interface AdminContentProgramsResponse {
  programs: AdminContentProgram[];
  total?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminContentService {
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly isBrowser = typeof window !== 'undefined';

  constructor(private http: HttpClient) {}

  getChannels(): Observable<AdminContentChannel[]> {
    return this.http
      .get<ApiResponse<any> | any[]>(`${this.baseUrl}/tv/read/channels`, {
        params: { date: 'today' },
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          if (Array.isArray(resp)) return resp;
          const payload: any = (resp as ApiResponse<any>).data;
          const items = Array.isArray(payload?.channels) ? payload.channels : [];
          return items.map((entry: any) => ({
            id: String(entry?.channel?.id || ''),
            name: String(entry?.channel?.name || entry?.channel?.id || ''),
            icon: entry?.channel?.icon || undefined,
            type: String(entry?.channel?.type || entry?.channel?.group || 'TV'),
            group: entry?.channel?.group || undefined,
            country: entry?.channel?.country || entry?.channel?.countryCode || undefined,
            region: entry?.channel?.region || undefined,
            isActive: true,
          }));
        })
      );
  }

  getPrograms(params: {
    date?: string;
    page?: number;
    limit?: number;
    fields?: 'minimal' | 'full';
  } = {}): Observable<AdminContentProgramsResponse> {
    const query = this.serializeParams({
      view: 'day',
      date: params.date || 'today',
      limit: params.limit,
      cursor:
        typeof params.page === 'number' && typeof params.limit === 'number'
          ? Math.max(0, (params.page - 1) * params.limit)
          : undefined,
    });
    return this.http
      .get<ApiResponse<any> | any>(`${this.baseUrl}/tv/read${query ? `?${query}` : ''}`, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          const payload: any = resp?.data || resp;
          const items = Array.isArray(payload?.items) ? payload.items : [];
          const programs = items.map((item: any) => ({
            id: String(item?.id || ''),
            channelId: String(item?.channel?.id || ''),
            title: String(item?.program?.title || ''),
            startTime: String(item?.airing?.start || ''),
            endTime: String(item?.airing?.end || ''),
            description: item?.program?.description || undefined,
            genre: item?.program?.editorialCategory || item?.program?.genre || undefined,
            image:
              item?.assets?.poster?.url ||
              ((item?.assets?.primary?.kind === 'poster' || item?.assets?.primary?.kind === 'backdrop')
                ? item?.assets?.primary?.url
                : undefined),
          }));
          const total = payload?.meta?.total || resp?.meta?.total || programs.length;
          return { programs, total };
        })
      );
  }

  private serializeParams(params: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== '') {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    return parts.join('&');
  }

  private buildHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  private getToken(): string | null {
    if (!this.isBrowser) return null;
    try { return localStorage.getItem('gtv_id_token'); } catch { return null; }
  }
}
