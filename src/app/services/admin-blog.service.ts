import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AdminBlogCategory {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

export interface AdminBlogSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface AdminBlogPost {
  id?: string;
  date?: string;
  modified?: string;
  slug: string;
  status?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  categories?: number[];
  categories_name?: AdminBlogCategory[];
  featured_image?: {
    source_url?: string;
    caption?: string;
  };
  seo?: AdminBlogSeo;
}

export interface AdminBlogCreatePayload {
  title: string;
  slug?: string;
  status?: 'draft' | 'publish';
  excerpt?: string;
  content?: string;
  categories?: string[] | string;
  coverImage?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[] | string;
  ogImage?: string;
  canonicalUrl?: string;
  publishedAt?: string;
}

export interface AdminBlogListParams {
  limit?: number;
  status?: 'all' | 'draft' | 'publish';
  search?: string;
  categories?: string[];
  slug?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminBlogService {
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly adminKey = environment.ANALYTICS_ADMIN_KEY || '';

  constructor(private http: HttpClient) {}

  getPosts(params: AdminBlogListParams = {}): Observable<AdminBlogPost[]> {
    const query = this.serializeParams(params);
    const url = `${this.baseUrl}/blog${query ? `?${query}` : ''}`;

    return this.http
      .get<AdminBlogPost[] | ApiResponse<AdminBlogPost[]>>(url, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          if (Array.isArray(resp)) return resp;
          const data: any = resp.data;
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.posts)) return data.posts;
          return [];
        })
      );
  }

  createPost(payload: AdminBlogCreatePayload): Observable<AdminBlogPost> {
    const url = `${this.baseUrl}/blog`;
    return this.http
      .post<ApiResponse<{ post: AdminBlogPost }> | AdminBlogPost>(url, payload, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          if (this.isApiResponse(resp)) {
            const data: any = resp.data;
            return data?.post || data;
          }
          return resp as AdminBlogPost;
        })
      );
  }

  getCategories(): Observable<AdminBlogCategory[]> {
    const url = `${this.baseUrl}/blog/categories`;
    return this.http
      .get<AdminBlogCategory[] | ApiResponse<AdminBlogCategory[]>>(url, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((resp) => {
          if (Array.isArray(resp)) return resp;
          const data: any = resp.data;
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.categories)) return data.categories;
          return [];
        })
      );
  }

  private serializeParams(params: AdminBlogListParams): string {
    const query: string[] = [];
    if (params.limit) query.push(`limit=${params.limit}`);
    if (params.status) query.push(`status=${encodeURIComponent(params.status)}`);
    if (params.search) query.push(`search=${encodeURIComponent(params.search)}`);
    if (params.slug) query.push(`slug=${encodeURIComponent(params.slug)}`);
    if (params.categories?.length) {
      query.push(`categories=${encodeURIComponent(params.categories.join(','))}`);
    }
    return query.join('&');
  }

  private buildHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    if (this.adminKey) {
      headers['x-admin-key'] = this.adminKey;
    }
    return new HttpHeaders(headers);
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
