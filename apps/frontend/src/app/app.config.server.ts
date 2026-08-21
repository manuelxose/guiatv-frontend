import { mergeApplicationConfig, ApplicationConfig, PLATFORM_ID } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { provideNoopAnimations } from '@angular/platform-browser/animations'; // 👈 IMPORTANTE
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const appBaseHref = process.env['APP_BASE_HREF'] || '/';
const internalApiOrigin = new URL(
  process.env['SSR_API_BASE_URL'] || process.env['API_ORIGIN'] || 'http://127.0.0.1:4000'
).origin;
const publicOrigin = process.env['PUBLIC_ORIGIN'] || 'https://guiaprogramaciontv.com';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: PLATFORM_ID, useValue: 'server' },
    { provide: APP_BASE_HREF, useValue: appBaseHref },
    // SSR talks directly to the private API origin while browsers use /v2 on
    // the public origin. Mapping them makes Angular's HTTP transfer cache
    // recognize both URLs as one request and prevents hydration refetches.
    {
      provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
      useValue: { [internalApiOrigin]: publicOrigin },
    },
    // 🛑 Desactivamos animaciones en el servidor para evitar el crash de injectRenderer2
    provideNoopAnimations(),
  ]
};

// Fusionamos la config del cliente (appConfig) con la del servidor (serverConfig)
// La del servidor tiene prioridad en los providers que coinciden.
export const config = mergeApplicationConfig(appConfig, serverConfig);
