import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

/**
 * Minimal config service for API base URLs.
 * Keeps defaults aligned with backend README and uses 127.0.0.1 on SSR
 * to avoid localhost IPv6 resolution issues on this host.
 * Uses relative "/v2" in browser to allow proxying.
 */
@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  private readonly baseUrl: string;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    const isBrowser = isPlatformBrowser(platformId);
    const envBase = (environment as any).API_BASE_URL?.trim();
    const envSsrBase = (environment as any).SSR_API_BASE_URL?.trim();

    // In SSR, always use an absolute URL to the backend API to avoid
    // self-referencing requests that loop back into the SSR server.
    let base: string;
    if (isBrowser) {
      base = envBase || '/v2';
    } else {
      base =
        envSsrBase ||
        (envBase && /^https?:\/\//.test(envBase) ? envBase : '') ||
        this.resolveServerBaseUrl();
    }

    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!base.startsWith('http') && !base.startsWith('/')) {
      base = `/${base}`;
    }

    this.baseUrl = base;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  /**
   * Base host without the /v2 suffix, useful for assets like /storage/channel_icons/*.webp
   */
  getAssetBaseUrl(): string {
    // If base is absolute (http...), strip trailing /v2
    if (this.baseUrl.startsWith('http')) {
      if (this.baseUrl.endsWith('/v2')) {
        return this.baseUrl.slice(0, -3) || '';
      }
      return this.baseUrl;
    }

    // If base is relative (/v2), use window origin when available
    if (this.baseUrl.startsWith('/')) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const path = this.baseUrl.endsWith('/v2')
        ? this.baseUrl.slice(0, -3)
        : this.baseUrl;
      return `${origin}${path}`;
    }

    return this.baseUrl;
  }

  private resolveServerBaseUrl(): string {
    // Allow the SSR process to point at a specific backend (env-driven), then
    // fall back to the local default.
    const envSsr = (typeof process !== 'undefined' && process.env?.SSR_API_BASE_URL) || '';
    const envOrigin = (typeof process !== 'undefined' && process.env?.API_ORIGIN) || '';
    const base = envSsr || envOrigin || 'http://127.0.0.1:4000';
    return base.endsWith('/v2') ? base : `${base.replace(/\/$/, '')}/v2`;
  }
}
