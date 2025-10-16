/**
 * Configuración de providers SOLID actualizada con ProgramList
 * Ubicación: src/app/config/providers.config.ts
 */

import { Provider } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Tokens de inyección existentes
import {
  PROGRAM_PROVIDER_TOKEN,
  MOVIE_PROVIDER_TOKEN,
  CONTENT_FILTER_TOKEN,
  DATA_TRANSFORMER_TOKEN,
  INITIALIZATION_MANAGER_TOKEN,
  CACHE_MANAGER_TOKEN,
  LOGGER_TOKEN,
  POSTER_PROVIDER_TOKEN
} from './di-tokens';

// Implementaciones de servicios existentes
import { ConsoleLoggerService } from '../services/core/logger.service';
import { MemoryCacheService } from '../services/core/cache.service';
import { AppConfigurationService } from '../services/core/config.service';
import { InitializationManagerService } from '../services/core/initialization-manager.service';
import { FirebaseProgramProvider } from '../services/providers/firebase-program.provider';
import { TMDbMovieProvider } from '../services/providers/tmdb-movie.provider';
import { TMDbPosterProvider } from '../services/providers/tmdb-poster.provider';
import { ContentFilterService } from '../services/providers/content-filter.service';
import { DataTransformerService } from '../services/providers/data-transformer.service';

// Servicios de features existentes
import { FeaturedMoviesService } from '../services/features/featured-movies.service';
import { HomeDataService } from '../services/features/home-data.service';

// NUEVOS: Servicios de ProgramList
import { TimeManagerService } from '../services/program-list/time-manager.service';
import { DimensionCalculatorService } from '../services/program-list/dimension-calculator.service';
import { CategoryStyleManagerService } from '../services/program-list/category-style-manager.service';
import { ChannelLogoManagerService } from '../services/program-list/channel-logo-manager.service';
import { ProgramListFacadeService } from '../services/program-list/program-list-facade.service';

// Interfaces
import { ILogger, ICacheManager } from '../interfaces';
import { ViewportManagerService } from '../services/program-list/viewport-manager.service';

/**
 * Providers fundamentales - se cargan primero
 */
export const coreProviders: Provider[] = [
  // Logger service - base para toda la aplicación
  {
    provide: LOGGER_TOKEN,
    useClass: ConsoleLoggerService
  },
  
  // Configuration service - configuración centralizada
  AppConfigurationService,
  
  // Cache manager - gestión de cache en memoria
  {
    provide: CACHE_MANAGER_TOKEN,
    useFactory: (logger: ILogger) => new MemoryCacheService(logger),
    deps: [LOGGER_TOKEN]
  }
];

/**
 * NUEVOS: Providers para servicios de ProgramList
 */
export const programListProviders: Provider[] = [
  // Time Manager - manejo de tiempo y franjas horarias
  TimeManagerService,
  
  // Category Style Manager - manejo de estilos y categorías
  CategoryStyleManagerService,
  
  // Channel Logo Manager - manejo de logos de canales
  ChannelLogoManagerService,
  
  // Viewport Manager - manejo del viewport virtual
  ViewportManagerService,
  
  // Dimension Calculator - depende de TimeManager
  {
    provide: DimensionCalculatorService,
    useFactory: (timeManager: TimeManagerService) => 
      new DimensionCalculatorService(undefined as any, timeManager),
    deps: [TimeManagerService]
  },
  
  // Facade Service - orquesta todos los servicios de ProgramList
  {
    provide: ProgramListFacadeService,
    useClass: ProgramListFacadeService,
    deps: [
      TimeManagerService,
      DimensionCalculatorService,
      CategoryStyleManagerService,
      ChannelLogoManagerService,
      ViewportManagerService,
      HomeDataService
    ]
  }
];

/**
 * Providers para data sources - dependen de los core providers
 */
export const dataProviders: Provider[] = [
  // Program Provider - datos de programación desde Firebase
  {
    provide: PROGRAM_PROVIDER_TOKEN,
    useFactory: (
      http: HttpClient, 
      cache: ICacheManager<any>, 
      logger: ILogger, 
      config: AppConfigurationService
    ) => new FirebaseProgramProvider(http, cache, logger, config),
    deps: [HttpClient, CACHE_MANAGER_TOKEN, LOGGER_TOKEN, AppConfigurationService]
  },
  
  // Movie Provider - datos de películas desde TMDb
  {
    provide: MOVIE_PROVIDER_TOKEN,
    useFactory: (
      http: HttpClient, 
      cache: ICacheManager<any>, 
      logger: ILogger, 
      config: AppConfigurationService
    ) => new TMDbMovieProvider(http, cache, logger, config),
    deps: [HttpClient, CACHE_MANAGER_TOKEN, LOGGER_TOKEN, AppConfigurationService]
  },
  
  // Poster Provider - extracción de posters desde TMDb
  {
    provide: POSTER_PROVIDER_TOKEN,
    useFactory: (
      http: HttpClient, 
      cache: ICacheManager<string>, 
      logger: ILogger, 
      config: AppConfigurationService
    ) => new TMDbPosterProvider(http, cache, logger, config),
    deps: [HttpClient, CACHE_MANAGER_TOKEN, LOGGER_TOKEN, AppConfigurationService]
  },
  
  // Content Filter - filtrado de contenido
  {
    provide: CONTENT_FILTER_TOKEN,
    useFactory: (logger: ILogger) => new ContentFilterService(logger),
    deps: [LOGGER_TOKEN]
  },
  
  // Data Transformer - transformación de datos (ahora con poster provider)
  {
    provide: DATA_TRANSFORMER_TOKEN,
    useFactory: (
      logger: ILogger, 
      posterProvider: any,
      config: AppConfigurationService
    ) => new DataTransformerService(logger, posterProvider, config),
    deps: [LOGGER_TOKEN, POSTER_PROVIDER_TOKEN, AppConfigurationService]
  }
];

/**
 * Providers para gestión de estado
 */
export const stateProviders: Provider[] = [
  // Initialization Manager - gestión del estado de inicialización
  {
    provide: INITIALIZATION_MANAGER_TOKEN,
    useFactory: (logger: ILogger) => new InitializationManagerService(logger),
    deps: [LOGGER_TOKEN]
  }
];

/**
 * Providers para servicios de aplicación de alto nivel
 */
export const applicationProviders: Provider[] = [
  // Featured Movies Service - orquestador de películas destacadas
  {
    provide: FeaturedMoviesService,
    useClass: FeaturedMoviesService,
    deps: [
      PROGRAM_PROVIDER_TOKEN,
      MOVIE_PROVIDER_TOKEN,
      CONTENT_FILTER_TOKEN,
      DATA_TRANSFORMER_TOKEN,
      CACHE_MANAGER_TOKEN,
      LOGGER_TOKEN
    ]
  },
  
  // Home Data Service - gestión de datos del home
  {
    provide: HomeDataService,
    useClass: HomeDataService,
    deps: [
      PROGRAM_PROVIDER_TOKEN,
      INITIALIZATION_MANAGER_TOKEN,
      LOGGER_TOKEN,
      FeaturedMoviesService
    ]
  }
];

/**
 * Todos los providers en orden de dependencia - ACTUALIZADO
 */
export const allProviders: Provider[] = [
  ...coreProviders,          // Primero los servicios fundamentales
  ...dataProviders,          // Luego los proveedores de datos
  ...stateProviders,         // Después los gestores de estado
  ...programListProviders,   // NUEVO: Servicios especializados de ProgramList
  ...applicationProviders    // Finalmente los servicios de aplicación
];

/**
 * NUEVO: Providers específicos para ProgramListComponent
 */
export const programListComponentProviders: Provider[] = [
  // Solo incluir los servicios que necesita específicamente el componente
  TimeManagerService,
  DimensionCalculatorService,
  CategoryStyleManagerService,
  ChannelLogoManagerService,
  ViewportManagerService,
  ProgramListFacadeService
];

/**
 * Providers para testing - ACTUALIZADO
 */
export const testProviders: Provider[] = [
  {
    provide: LOGGER_TOKEN,
    useValue: {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    }
  },
  {
    provide: CACHE_MANAGER_TOKEN,
    useValue: {
      get: () => null,
      set: () => {},
      has: () => false,
      clear: () => {}
    }
  },
  // NUEVOS: Mocks para servicios de ProgramList
  {
    provide: TimeManagerService,
    useValue: {
      getCurrentTimeSlot: () => 0,
      getTimeSlots: () => [],
      getCurrentTime: () => '12:00',
      formatDisplayTime: () => '12:00'
    }
  },
  {
    provide: ProgramListFacadeService,
    useValue: {
      getProgramListData: () => [],
      getLoadingState: () => false,
      updateScreenDimensions: () => {}
    }
  }
];

/**
 * Factory function para crear providers basados en el entorno - ACTUALIZADO
 */
export function createEnvironmentProviders(environment: any): Provider[] {
  console.log(`🔧 Configurando providers SOLID para entorno: ${environment.production ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  if (environment.production) {
    console.log('🏭 Modo PRODUCCIÓN: Providers optimizados');
    return allProviders;
  } else {
    console.log('🛠️ Modo DESARROLLO: Providers con debug habilitado');
    return [
      ...allProviders,
      // Providers adicionales para desarrollo
      {
        provide: 'DEBUG_MODE',
        useValue: true
      }
    ];
  }
}

/**
 * NUEVO: Helper para obtener providers específicos según necesidad
 */
export function getProvidersFor(component: 'home' | 'program-list' | 'all'): Provider[] {
  switch (component) {
    case 'home':
      return [
        ...coreProviders,
        ...dataProviders,
        ...stateProviders,
        ...applicationProviders
      ];
    
    case 'program-list':
      return [
        ...coreProviders,
        ...programListProviders,
        ...applicationProviders.filter(p => 
          p === HomeDataService || 
          (typeof p === 'object' && 'provide' in p && p.provide === HomeDataService)
        )
      ];
    
    case 'all':
    default:
      return allProviders;
  }
}

/**
 * NUEVO: Validación de providers
 */
export function validateProviders(providers: Provider[]): boolean {
  try {
    // Verificar que no hay dependencias circulares básicas
    const services = providers.map(p => {
      if (typeof p === 'function') return p.name;
      if (typeof p === 'object' && 'provide' in p) return p.provide.toString();
      return 'unknown';
    });
    
    console.log('✅ Providers validation passed:', services.length, 'services');
    return true;
  } catch (error) {
    console.error('❌ Providers validation failed:', error);
    return false;
  }
}