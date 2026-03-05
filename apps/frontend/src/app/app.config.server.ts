import { mergeApplicationConfig, ApplicationConfig, PLATFORM_ID } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { provideServerRendering } from '@angular/platform-server';
import { provideNoopAnimations } from '@angular/platform-browser/animations'; // 👈 IMPORTANTE
import { appConfig } from './app.config';

const appBaseHref = process.env['APP_BASE_HREF'] || '/';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: PLATFORM_ID, useValue: 'server' },
    { provide: APP_BASE_HREF, useValue: appBaseHref },
    // 🛑 Desactivamos animaciones en el servidor para evitar el crash de injectRenderer2
    provideNoopAnimations(),
  ]
};

// Fusionamos la config del cliente (appConfig) con la del servidor (serverConfig)
// La del servidor tiene prioridad en los providers que coinciden.
export const config = mergeApplicationConfig(appConfig, serverConfig);
