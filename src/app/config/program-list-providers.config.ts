/**
 * Configuración de providers para ProgramList siguiendo SOLID
 * Ubicación: src/app/config/program-list-providers.config.ts
 */

import { Provider } from '@angular/core';
import { InjectionToken } from '@angular/core';

// Interfaces


// Implementaciones
import { TimeManagerService } from '../services/program-list/time-manager.service';
import { DimensionCalculatorService } from '../services/program-list/dimension-calculator.service';
import { CategoryStyleManagerService } from '../services/program-list/category-style-manager.service';
import { ChannelLogoManagerService } from '../services/program-list/channel-logo-manager.service';
import { ViewportManagerService } from '../services/program-list/viewport-manager.service';
import { ProgramListFacadeService } from '../services/program-list/program-list-facade.service';
import { ITimeManager, IDimensionCalculator, ICategoryStyleManager, IChannelLogoManager, IViewportManager } from '../interfaces';

// ===============================================
// TOKENS DE INYECCIÓN DE DEPENDENCIAS
// ===============================================

export const TIME_MANAGER_TOKEN = new InjectionToken<ITimeManager>('TimeManager');
export const DIMENSION_CALCULATOR_TOKEN = new InjectionToken<IDimensionCalculator>('DimensionCalculator');
export const CATEGORY_STYLE_MANAGER_TOKEN = new InjectionToken<ICategoryStyleManager>('CategoryStyleManager');
export const CHANNEL_LOGO_MANAGER_TOKEN = new InjectionToken<IChannelLogoManager>('ChannelLogoManager');
export const VIEWPORT_MANAGER_TOKEN = new InjectionToken<IViewportManager>('ViewportManager');

// ===============================================
// PROVIDERS BÁSICOS
// ===============================================

/**
 * Providers para servicios básicos de ProgramList
 */
export const programListCoreProviders: Provider[] = [
  // Time Manager - manejo de tiempo y franjas horarias
  {
    provide: TIME_MANAGER_TOKEN,
    useClass: TimeManagerService
  },
  
  // Category Style Manager - manejo de estilos y categorías
  {
    provide: CATEGORY_STYLE_MANAGER_TOKEN,
    useClass: CategoryStyleManagerService
  },
  
  // Channel Logo Manager - manejo de logos de canales
  {
    provide: CHANNEL_LOGO_MANAGER_TOKEN,
    useClass: ChannelLogoManagerService
  },
  
  // Viewport Manager - manejo del viewport virtual
  {
    provide: VIEWPORT_MANAGER_TOKEN,
    useClass: ViewportManagerService
  }
];

/**
 * Providers para servicios que dependen de otros
 */
export const programListDependentProviders: Provider[] = [
  // Dimension Calculator - depende de TimeManager
  {
    provide: DIMENSION_CALCULATOR_TOKEN,
    useFactory: (timeManager: ITimeManager) => 
      new DimensionCalculatorService(
        // PLATFORM_ID se inyecta automáticamente
        undefined as any, // será inyectado por Angular
        timeManager
      ),
    deps: [TIME_MANAGER_TOKEN]
  }
];

/**
 * Providers para servicios de alto nivel
 */
export const programListFacadeProviders: Provider[] = [
  // Facade Service - orquesta todos los servicios
  {
    provide: ProgramListFacadeService,
    useClass: ProgramListFacadeService,
    deps: [
      TimeManagerService,
      DimensionCalculatorService,
      CategoryStyleManagerService,
      ChannelLogoManagerService,
      ViewportManagerService,
      // HomeDataService se inyecta automáticamente
    ]
  }
];

/**
 * Todos los providers de ProgramList en orden de dependencia
 */
export const allProgramListProviders: Provider[] = [
  ...programListCoreProviders,
  ...programListDependentProviders,
  ...programListFacadeProviders
];

/**
 * Factory para crear providers específicos según configuración
 */
export function createProgramListProviders(config?: any): Provider[] {
  const providers = [...allProgramListProviders];
  
  // Añadir providers condicionales según configuración
  if (config?.enableAdvancedFeatures) {
    // Añadir providers adicionales si es necesario
  }
  
  if (config?.enableDebugMode) {
    // Añadir providers de debug si es necesario
  }
  
  return providers;
}

/**
 * Providers para testing
 */
export const programListTestProviders: Provider[] = [
  {
    provide: TIME_MANAGER_TOKEN,
    useValue: {
      getCurrentTimeSlot: () => 0,
      getTimeSlots: () => [],
      getCurrentTime: () => '12:00',
      parseTimeToMinutes: () => 0,
      calculateTimePosition: () => 0,
      generateHoursForSlot: () => []
    }
  },
  {
    provide: DIMENSION_CALCULATOR_TOKEN,
    useValue: {
      calculateProgramWidth: () => '100px',
      calculateLeftPosition: () => '0px',
      updateScreenDimensions: () => {},
      getColumnWidth: () => 180,
      getScreenWidthInRem: () => 18
    }
  },
  {
    provide: CATEGORY_STYLE_MANAGER_TOKEN,
    useValue: {
      getCategoryBadgeClasses: () => 'test-class',
      getCategoryDisplayName: () => 'Test',
      getDayButtonClasses: () => 'test-class',
      getTimeSlotButtonClasses: () => 'test-class'
    }
  },
  {
    provide: CHANNEL_LOGO_MANAGER_TOKEN,
    useValue: {
      getChannelLogoUrl: () => '',
      handleLogoError: () => {},
      handleLogoLoad: () => {},
      clearCache: () => {}
    }
  },
  {
    provide: VIEWPORT_MANAGER_TOKEN,
    useValue: {
      setupUniqueViewport: () => {},
      ensureViewportUniqueness: () => true,
      cleanupViewport: () => {},
      isViewportReady: () => true
    }
  }
];

/**
 * Configuración específica para diferentes entornos
 */
export const programListEnvironmentProviders = {
  development: [
    ...allProgramListProviders,
    // Providers específicos para desarrollo
  ],
  
  production: [
    ...allProgramListProviders,
    // Providers específicos para producción
  ],
  
  testing: [
    ...programListTestProviders
  ]
};

/**
 * Helper para obtener providers según el entorno
 */
export function getProgramListProvidersForEnvironment(environment: 'development' | 'production' | 'testing'): Provider[] {
  return programListEnvironmentProviders[environment] || allProgramListProviders;
}