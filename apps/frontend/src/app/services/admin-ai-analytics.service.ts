import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AIAnalyticsOverview {
  totalConversations: number;
  totalMessages: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  avgMessagesPerConversation: number;
  topGenres: { genre: string; count: number }[];
  topPlatforms: { platform: string; count: number }[];
  subscriptionBreakdown: { free: number; premium: number };
  feedbackSummary: { positive: number; negative: number };
}

export interface AIAnalyticsTimeSeries {
  date: string;
  conversations: number;
  messages: number;
}
export interface AIFailureDiagnostic { requestId: string; outcome: 'partial' | 'fallback' | 'failed'; grounding: string[]; failureReason?: string; latencyMs: number; createdAt: string; }

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class AdminAIAnalyticsService {
  private readonly baseUrl = environment.API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  getOverview(): Observable<AIAnalyticsOverview | null> {
    return this.http
      .get<ApiResponse<AIAnalyticsOverview>>(
        `${this.baseUrl}/admin/ai-analytics/overview`,
        { headers: this.headers() }
      )
      .pipe(
        map((r) => r?.data || null),
        catchError(() => of(null))
      );
  }

  getTimeSeries(days = 30): Observable<AIAnalyticsTimeSeries[]> {
    return this.http
      .get<ApiResponse<AIAnalyticsTimeSeries[]>>(
        `${this.baseUrl}/admin/ai-analytics/timeseries`,
        { headers: this.headers(), params: { days: String(days) } }
      )
      .pipe(
        map((r) => r?.data || []),
        catchError(() => of([]))
      );
  }

  getFailures(limit = 50): Observable<AIFailureDiagnostic[]> {
    return this.http.get<ApiResponse<AIFailureDiagnostic[]>>(`${this.baseUrl}/admin/ai-analytics/failures`, { headers: this.headers(), params: { limit: String(limit) } }).pipe(map((r) => r?.data || []), catchError(() => of([])));
  }

  private headers(): HttpHeaders {
    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('gtv_id_token')
        : null;
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
