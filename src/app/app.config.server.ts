// Correct content for: src/app/app.config.server.ts

import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig as clientAppConfig } from './app.config'; // This imports your common/client app.config.ts

// This is the server-specific part of the configuration
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(), // ESSENTIAL for SSR
    // You can add other server-only providers here if needed
  ]
};

// Merge the client/common config with the server-specific config
export const appConfig = mergeApplicationConfig(clientAppConfig, serverConfig);