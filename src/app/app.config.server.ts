import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideClientHydration } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // Desactivar animaciones en el servidor para evitar errores al procesar triggers
    provideNoopAnimations(),
    provideClientHydration(),
    { provide: APP_BASE_HREF, useValue: '/' },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
