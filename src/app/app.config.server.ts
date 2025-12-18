import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideNoopAnimations } from '@angular/platform-browser/animations'; // 👈 IMPORTANTE
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // 🛑 Desactivamos animaciones en el servidor para evitar el crash de injectRenderer2
    provideNoopAnimations(),
  ]
};

// Fusionamos la config del cliente (appConfig) con la del servidor (serverConfig)
// La del servidor tiene prioridad en los providers que coinciden.
export const config = mergeApplicationConfig(appConfig, serverConfig);