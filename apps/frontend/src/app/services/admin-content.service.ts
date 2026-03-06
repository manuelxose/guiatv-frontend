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
      .get<ApiResponse<any> | any[]>(`${this.baseUrl}/channels`, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          if (Array.isArray(resp)) return resp;
          const data: any = (resp as ApiResponse<any>).data;
          return Array.isArray(data) ? data : data?.channels || [];
        })
      );
  }

  getPrograms(params: {
    date?: string;
    page?: number;
    limit?: number;
    fields?: 'minimal' | 'full';
  } = {}): Observable<AdminContentProgramsResponse> {
    const query = this.serializeParams(params);
    return this.http
      .get<ApiResponse<any> | any>(`${this.baseUrl}/programs${query ? `?${query}` : ''}`, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          const data: any = resp?.data || resp;
          const programs = Array.isArray(data) ? data : data?.programs || [];
          return { programs, total: data?.total || programs.length };
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
