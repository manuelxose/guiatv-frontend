/**
 * Servicio de configuración de la aplicación
 * Ubicación: src/app/services/core/config.service.ts
 */

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  api: {
    backend: {
      baseUrl: string;
      timeout: number;
    };
    tmdb: {
      baseUrl: string;
      apiKey: string;
      language: string;
    };
  };
  cache: {
    defaultTTL: number;
    maxSize: number;
    enablePersistence: boolean;
  };
  ui: {
    maxFeaturedMovies: number;
    autoRefreshInterval: number;
    enableAnimations: boolean;
  };
  features: {
    enableMovies: boolean;
    enableSeries: boolean;
    enableTMDbFallback: boolean;
    enableOfflineMode: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AppConfigurationService {
  
  private config: AppConfig;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    const isBrowser = isPlatformBrowser(this.platformId);
    const envBaseUrl = (environment as any).API_BASE_URL?.trim();
    const envSsrBaseUrl = (environment as any).SSR_API_BASE_URL?.trim();
    
    // Respect explicit environment base URL always.
    let baseUrl = envBaseUrl;
    
    // Fallbacks only when not provided
    if (!baseUrl || (!isBrowser && !/^https?:\/\//.test(baseUrl))) {
      // Browser: use relative path to allow proxying.
      // Server: always use loopback IPv4 to avoid localhost -> ::1 socket failures.
      baseUrl = isBrowser ? '/v2' : envSsrBaseUrl || this.resolveServerBaseUrl();
    }

    // Normalize trailing slash and ensure leading slash for relative URLs
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    if (!baseUrl.startsWith('http') && !baseUrl.startsWith('/')) {
      baseUrl = `/${baseUrl}`;
    }

    this.config = {
      api: {
        backend: {
          baseUrl: baseUrl,
          timeout: 10000
        },
        tmdb: {
          baseUrl: 'https://api.themoviedb.org/3',
          apiKey: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
          language: 'es-ES'
        }
      },
      cache: {
        defaultTTL: 5 * 60 * 1000, // 5 minutos
        maxSize: 100,
        enablePersistence: !environment.production
      },
      ui: {
        maxFeaturedMovies: 10,
        autoRefreshInterval: 5 * 60 * 1000,
        enableAnimations: !environment.production
      },
      features: {
        enableMovies: true,
        enableSeries: true,
        enableTMDbFallback: true,
        enableOfflineMode: false
      }
    };
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { 
      ...this.config, 
      ...this.mergeDeep(this.config, newConfig) 
    };
  }

  getApiConfig() {
    return this.config.api;
  }

  getCacheConfig() {
    return this.config.cache;
  }

  getUIConfig() {
    return this.config.ui;
  }

  getFeatureConfig() {
    return this.config.features;
  }

  private mergeDeep(target: any, source: any): any {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  private resolveServerBaseUrl(): string {
    return 'http://127.0.0.1:4000/v2';
  }
}
