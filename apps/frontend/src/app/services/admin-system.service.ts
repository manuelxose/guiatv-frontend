import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { HealthResponse } from './admin-schedules.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminSystemService {
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly isBrowser = typeof window !== 'undefined';

  constructor(private http: HttpClient) {}

  getHealth(): Observable<HealthResponse> {
    return this.http
      .get<ApiResponse<HealthResponse>>(`${this.baseUrl}/admin/health`, {
        headers: this.buildHeaders(),
      })
      .pipe(map((resp) => resp.data));
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
