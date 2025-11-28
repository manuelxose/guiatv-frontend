/**
 * Bootstrap principal de la aplicación standalone
 */

/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Arranque principal
bootstrapApplication(AppComponent, appConfig).catch((err) => {
  console.error('Error al iniciar la aplicación:', err);
});

// Filtro de logs en desarrollo: solo mostramos etiquetas relevantes
if (!environment.production && typeof window !== 'undefined') {
  const allowedPrefixes = [
    '[HomeData]',
    '[ProgramListComponent]',
    '[ProgramListFacade]',
    '[ApiProgramProvider]',
    '[BannerComponent]',
    '[ContentPage]'
  ];
  const originalLog = console.log.bind(console);
  console.log = (...args: any[]) => {
    const text = typeof args[0] === 'string' ? args[0] : '';
    if (allowedPrefixes.some((p) => text.startsWith(p))) {
      originalLog(...args);
    }
  };
}
