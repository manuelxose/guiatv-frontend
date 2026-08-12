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

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminSchedulesService {
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly adminKey = environment.ANALYTICS_ADMIN_KEY || '';
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

  private buildHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.adminKey) headers['x-admin-key'] = this.adminKey;
    return new HttpHeaders(headers);
  }

  private getToken(): string | null {
    if (!this.isBrowser) return null;
    try { return localStorage.getItem('gtv_id_token'); } catch { return null; }
  }
}
