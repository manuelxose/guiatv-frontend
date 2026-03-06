import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ProviderChipDTO {
  id: number;
  name: string;
  logoUrl?: string;
  type: 'flatrate' | 'rent' | 'buy' | 'free';
  price?: string;
  deepLink?: string;
}

export interface ContentProvidersDTO {
  flatrate?: ProviderChipDTO[];
  rent?: ProviderChipDTO[];
  buy?: ProviderChipDTO[];
  free?: ProviderChipDTO[];
  tmdbLink?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class StreamingProvidersService {
  private readonly baseUrl = environment.API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  getProviders(contentId: string): Observable<ContentProvidersDTO> {
    if (!contentId) {
      return of({});
    }

    return this.http
      .get<ApiResponse<{ whereToWatch?: ContentProvidersDTO }>>(
        `${this.baseUrl}/content/${contentId}`
      )
      .pipe(
        map((resp) => resp?.data?.whereToWatch || {}),
        catchError(() => of({}))
      );
  }

  getProvidersByTmdb(
    tmdbId: number,
    contentType: 'movie' | 'tv'
  ): Observable<ContentProvidersDTO> {
    if (!tmdbId) {
      return of({});
    }

    return this.http
      .get<ApiResponse<{ whereToWatch?: ContentProvidersDTO }>>(
        `${this.baseUrl}/content/providers/${contentType}/${tmdbId}`
      )
      .pipe(
        map((resp) => resp?.data?.whereToWatch || {}),
        catchError(() => of({}))
      );
  }

  getLocalLogoPath(providerName: string): string {
    const initials = encodeURIComponent(
      String(providerName || '?')
        .trim()
        .slice(0, 2)
        .toUpperCase()
    );
    return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' rx='14' fill='%230f172a'/><text x='50%25' y='56%25' font-size='20' text-anchor='middle' fill='white' font-family='Arial'>${initials}</text></svg>`;
  }

  getProviderColor(providerName: string): string {
    const colors: Record<string, string> = {
      Netflix: '#e50914',
      'Prime Video': '#00a8e1',
      'Disney+': '#113ccf',
      Max: '#0b5cff',
      'Movistar+': '#00c6ff',
      SkyShowtime: '#1d9bf0',
      'Apple TV+': '#a3a3a3',
      Filmin: '#00d1b2',
      'RTVE Play': '#f59e0b',
      ATRESplayer: '#f97316',
      Mitele: '#ec4899',
      'Pluto TV': '#9333ea',
    };

    return colors[providerName] || '#475569';
  }
}
