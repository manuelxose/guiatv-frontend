/// <reference types="@angular/localize" />

// Import compiler to enable JIT compilation fallback for SSR
import '@angular/compiler';

import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
