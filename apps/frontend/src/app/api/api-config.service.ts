import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Minimal config service for API base URLs.
 * The base is the relative "/v2" on both platforms, so server and browser issue identical URLs (same
 * transfer-cache keys, no internal origin in rendered HTML). On the server, InternalApiBackend sends
 * those requests to the internal API.
 */
@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  private readonly baseUrl: string;

  constructor() {
    let base: string = (environment as any).API_BASE_URL?.trim() || '/v2';

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
}
