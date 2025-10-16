/**
 * Bootstrap principal de la aplicación standalone con SOLID
 * Ubicación: src/main.ts
 */

/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Inicializar aplicación con configuración SOLID
bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('🚀 Aplicación iniciada con arquitectura SOLID');
    console.log('✅ SSR y standalone components configurados');
  })
  .catch((err) => {
    console.error('❌ Error al iniciar la aplicación:', err);
  });