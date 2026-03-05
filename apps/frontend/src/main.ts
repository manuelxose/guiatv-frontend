/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Función de arranque encapsulada
function bootstrap() {
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error('Error al iniciar la aplicación:', err));
}

// Lógica para asegurar que el DOM está listo antes de hidratar
// Esto previene parpadeos y errores de "múltiples instancias" al usar SSR
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  bootstrap();
} else {
  document.addEventListener('DOMContentLoaded', bootstrap);
}