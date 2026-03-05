import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type AdminUserRole = 'admin' | 'editor' | 'user';
export type AdminUserStatus = 'active' | 'suspended';

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: AdminUsersPagination;
}

export interface AdminUsersQuery {
  search?: string;
  role?: AdminUserRole | 'all';
  status?: AdminUserStatus | 'all';
  page?: number;
  limit?: number;
}

export interface AdminUserUpdatePayload {
  role?: AdminUserRole;
  status?: AdminUserStatus;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly adminKey = environment.ANALYTICS_ADMIN_KEY || '';
  private readonly isBrowser = typeof window !== 'undefined';

  constructor(private http: HttpClient) {}

  getUsers(query: AdminUsersQuery = {}): Observable<AdminUsersResponse> {
    const params = this.serializeParams(query);
    const url = `${this.baseUrl}/admin/users${params ? `?${params}` : ''}`;

    return this.http
      .get<ApiResponse<AdminUsersResponse> | AdminUsersResponse>(url, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          if (this.isApiResponse(resp)) {
            return resp.data;
          }
          return resp as AdminUsersResponse;
        })
      );
  }

  updateUser(userId: string, payload: AdminUserUpdatePayload): Observable<AdminUser> {
    const url = `${this.baseUrl}/admin/users/${encodeURIComponent(userId)}`;
    return this.http
      .patch<ApiResponse<{ user: AdminUser }> | AdminUser>(url, payload, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          if (this.isApiResponse(resp)) {
            const data: any = resp.data;
            return data?.user || data;
          }
          return resp as AdminUser;
        })
      );
  }

  private serializeParams(query: AdminUsersQuery): string {
    const params: string[] = [];
    if (query.search) params.push(`search=${encodeURIComponent(query.search)}`);
    if (query.role && query.role !== 'all') params.push(`role=${encodeURIComponent(query.role)}`);
    if (query.status && query.status !== 'all') params.push(`status=${encodeURIComponent(query.status)}`);
    if (query.page) params.push(`page=${query.page}`);
    if (query.limit) params.push(`limit=${query.limit}`);
    return params.join('&');
  }

  private buildHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (this.adminKey) {
      headers['x-admin-key'] = this.adminKey;
    }
    return new HttpHeaders(headers);
  }

  private getToken(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem('gtv_id_token');
    } catch {
      return null;
    }
  }

  private isApiResponse(resp: unknown): resp is ApiResponse<unknown> {
    return (
      !!resp &&
      typeof resp === 'object' &&
      'success' in resp &&
      'data' in resp
    );
  }
}
