import { mergeApplicationConfig, ApplicationConfig, PLATFORM_ID } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { provideNoopAnimations } from '@angular/platform-browser/animations'; // 👈 IMPORTANTE
import { HttpBackend } from '@angular/common/http';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { InternalApiBackend } from './api/internal-api.backend';

const appBaseHref = process.env['APP_BASE_HREF'] || '/';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: PLATFORM_ID, useValue: 'server' },
    { provide: APP_BASE_HREF, useValue: appBaseHref },
    // Services call the same relative /v2 URLs as in the browser (same transfer-cache keys); this backend
    // sends the server's API reads to the internal origin instead of through public DNS and Cloudflare.
    { provide: HttpBackend, useClass: InternalApiBackend },
    // 🛑 Desactivamos animaciones en el servidor para evitar el crash de injectRenderer2
    provideNoopAnimations(),
  ]
};

// Fusionamos la config del cliente (appConfig) con la del servidor (serverConfig)
// La del servidor tiene prioridad en los providers que coinciden.
export const config = mergeApplicationConfig(appConfig, serverConfig);
