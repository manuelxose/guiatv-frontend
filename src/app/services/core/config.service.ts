/**
 * Servicio de configuración de la aplicación
 * Ubicación: src/app/services/core/config.service.ts
 */

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  api: {
    firebase: {
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
  
  private config: AppConfig = {
    api: {
      firebase: {
        baseUrl: 'https://us-central1-guia-tv-8fe3c.cloudfunctions.net/app',
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
}