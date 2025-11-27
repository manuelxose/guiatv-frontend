/// <reference types="@angular/localize" />

// Import compiler to enable JIT compilation fallback for SSR
import '@angular/compiler';

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;