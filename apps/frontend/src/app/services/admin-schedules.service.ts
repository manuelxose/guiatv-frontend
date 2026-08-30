import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SyncOptions {
  date?: string;
  forceRefresh?: boolean;
  sourceUrl?: string;
  async?: boolean;
}

export interface PrecomputeOptions {
  date?: string;
  fields?: 'minimal' | 'full';
  async?: boolean;
}

export interface CleanupOptions {
  daysToKeep?: number;
  async?: boolean;
}

export interface ResetOptions {
  sourceUrl?: string;
  fields?: 'minimal' | 'full';
  async?: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: string;
  version: string;
  memory: { rss: string; heapUsed: string; heapTotal: string };
  services: { cache: { status: string; details?: any } };
}

export interface AdminChannel {
  id: string;
  name: string;
  icon?: string;
  type: string;
  country?: string;
  region?: string;
  isActive: boolean;
}

export interface EpgOverview {
  generatedAt: string;
  totalChannels: number;
  activeChannels: number;
  freeChannels: number;
  payChannels: number;
  channelsWithCurrentEpg: number;
  channelsMissingEpg: number;
  staleChannels: number;
  currentCoveragePercent: number;
  lastScheduleUpdate?: string;
}
export interface EpgChannelDiagnostic { id: string; name: string; access: string; active: boolean; sources: string[]; externalIds: string[]; aliasesCount: number; epgStatus: 'current' | 'stale' | 'missing'; lastScheduleUpdate?: string; nextScheduleAt?: string; }
export interface EpgChannelPage { page: number; limit: number; total: number; items: EpgChannelDiagnostic[]; }
export interface AdminProviderStatus { id: string; displayName: string; domain: string; configured: boolean; enabled: boolean; health: string; capabilities: string[]; }

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminSchedulesService {
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly isBrowser = typeof window !== 'undefined';

  constructor(private http: HttpClient) {}

  triggerSync(opts: SyncOptions = {}): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/sync`, opts, { headers: this.buildHeaders() });
  }

  triggerPrecompute(opts: PrecomputeOptions = {}): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/precompute`, opts, { headers: this.buildHeaders() });
  }

  triggerPrecomputeWindow(opts: Omit<PrecomputeOptions, 'date'> = {}): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/precompute-window`, opts, { headers: this.buildHeaders() });
  }

  triggerCleanup(opts: CleanupOptions = {}): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/cleanup`, opts, { headers: this.buildHeaders() });
  }

  triggerReset(opts: ResetOptions = {}): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/reset`, opts, { headers: this.buildHeaders() });
  }

  getHealth(): Observable<HealthResponse> {
    return this.http
      .get<ApiResponse<HealthResponse>>(
        `${this.baseUrl}/admin/health`,
        { headers: this.buildHeaders() }
      )
      .pipe(map((resp) => resp.data));
  }

  getChannels(): Observable<AdminChannel[]> {
    return this.http
      .get<ApiResponse<any> | any[]>(`${this.baseUrl}/tv/read/channels`, {
        params: { date: 'today' },
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          const payload: any = Array.isArray(resp) ? resp : (resp as ApiResponse<any>).data;
          const items = Array.isArray(payload) ? payload : payload?.channels || [];
          return items.map((entry: any) => ({
            id: String(entry?.channel?.id || ''),
            name: String(entry?.channel?.name || entry?.channel?.id || ''),
            icon: entry?.channel?.icon || undefined,
            type: String(entry?.channel?.type || entry?.channel?.group || 'TV'),
            country: entry?.channel?.country || entry?.channel?.countryCode || undefined,
            region: entry?.channel?.region || undefined,
            isActive: true,
          }));
        })
      );
  }

  getEpgOverview(): Observable<EpgOverview> {
    return this.http.get<ApiResponse<EpgOverview>>(`${this.baseUrl}/admin/epg/overview`, { headers: this.buildHeaders() })
      .pipe(map((response) => response.data));
  }

  getEpgChannels(params: { page?: number; limit?: number; search?: string; access?: string; status?: string } = {}): Observable<EpgChannelPage> {
    const query: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query[key] = String(value); });
    return this.http.get<ApiResponse<EpgChannelPage>>(`${this.baseUrl}/admin/epg/channels`, { headers: this.buildHeaders(), params: query }).pipe(map((response) => response.data));
  }

  getProviders(): Observable<AdminProviderStatus[]> {
    return this.http.get<ApiResponse<AdminProviderStatus[]>>(`${this.baseUrl}/admin/providers`, { headers: this.buildHeaders() }).pipe(map((response) => response.data));
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
