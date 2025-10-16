/**
 * Tokens de inyección de dependencias
 * Ubicación: src/app/config/di-tokens.ts
 */

import { InjectionToken } from '@angular/core';
import { 
  IProgramDataProvider,
  IMovieProvider,
  IContentFilter,
  IDataTransformer,
  IInitializationManager,
  ICacheManager,
  ILogger,
  ITimeManager,
  IPosterProvider
} from '../interfaces';

export const PROGRAM_PROVIDER_TOKEN = new InjectionToken<IProgramDataProvider>('ProgramProvider');
export const MOVIE_PROVIDER_TOKEN = new InjectionToken<IMovieProvider>('MovieProvider');
export const CONTENT_FILTER_TOKEN = new InjectionToken<IContentFilter>('ContentFilter');
export const DATA_TRANSFORMER_TOKEN = new InjectionToken<IDataTransformer>('DataTransformer');
export const INITIALIZATION_MANAGER_TOKEN = new InjectionToken<IInitializationManager>('InitializationManager');
export const CACHE_MANAGER_TOKEN = new InjectionToken<ICacheManager<any>>('CacheManager');
export const LOGGER_TOKEN = new InjectionToken<ILogger>('Logger');
export const TIME_MANAGER_TOKEN = new InjectionToken<ITimeManager>('TIME_MANAGER_TOKEN');
export const POSTER_PROVIDER_TOKEN = new InjectionToken<IPosterProvider>('PosterProvider');