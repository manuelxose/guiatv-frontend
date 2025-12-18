/**
 * Configuración principal de la aplicación standalone con SOLID - ACTUALIZADA
 * Ubicación: src/app/app.config.ts
 */

import { ApplicationConfig, Provider } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
// Importamos withEventReplay para que si el usuario hace clic antes de cargar JS, se guarde el evento
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';

// Rutas de la aplicación
import { routes } from './app.routes';

// Configuración SOLID de providers - ACTUALIZADA
import { allProviders } from './config/providers.config';

// Environment para configuración condicional
import { environment } from '../environments/environment';

/**
 * Configuración principal de la aplicación con arquitectura SOLID COMPLETA
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Providers básicos de Angular para standalone
    provideRouter(routes),
    
    // Habilitar animaciones en el cliente
    provideAnimations(),
    
    // ✅ CRÍTICO PARA SSR: Habilitar Hidratación
    // Esto hace que Angular "reutilice" el HTML del servidor en lugar de borrarlo.
    // withEventReplay() asegura que los clics del usuario durante la carga no se pierdan.
    provideClientHydration(withEventReplay()),
    
    // Fetch API es requerida para SSR moderno
    provideHttpClient(withFetch()),

    // Providers SOLID para toda la aplicación
    ...allProviders,

    // Providers condicionales según el entorno
    ...getEnvironmentProviders(environment),

    // Providers de validación en desarrollo
    ...getValidationProviders(environment),
  ],
};

/**
 * Providers específicos según el entorno
 */
function getEnvironmentProviders(env: any): Provider[] {
  const providers: Provider[] = [];

  if (env.production) {
    console.log('🏭 SOLID App - Configurando providers para PRODUCCIÓN');
    providers.push({
      provide: 'ENVIRONMENT_MODE',
      useValue: 'production',
    });
  } else {
    console.log('🛠️ SOLID App - Configurando providers para DESARROLLO');
    providers.push(
      { provide: 'ENVIRONMENT_MODE', useValue: 'development' },
      { provide: 'DEBUG_ENABLED', useValue: true }
    );
  }

  return providers;
}

/**
 * Providers de validación (solo en desarrollo)
 */
function getValidationProviders(env: any): Provider[] {
  if (env.production) {
    return [];
  }
  return [
    { provide: 'SOLID_VALIDATION', useValue: true },
  ];
}

/**
 * Función para exponer debug info en desarrollo
 */
if (!environment.production && typeof window !== 'undefined') {
  (window as any).SOLID_DEBUG = {
    providers: allProviders,
    environment: environment,
    getProviderCount: () => allProviders.length,
    getProviderTypes: () => {
      return allProviders.map((p) => {
        if (typeof p === 'function') return `Class: ${p.name}`;
        if (typeof p === 'object' && 'provide' in p) {
          return `Token: ${p.provide.toString()}`;
        }
        return 'Unknown provider type';
      });
    },
  };
  console.log('🛠️ SOLID Debug tools available at window.SOLID_DEBUG');
}