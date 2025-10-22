// src/v2/index.ts

import * as functions from 'firebase-functions';
import { Container } from './config/container';
import { createApp } from './presentation/routes/app';
import { logger } from './shared/utils/logger';
import { appConfig } from './config/app.config';

// Singleton del container
let container: Container | null = null;

/**
 * Inicializa el container de dependencias
 */
async function initializeContainer(): Promise<Container> {
  if (container) {
    return container;
  }

  container = Container.getInstance();
  await container.initialize();
  return container;
}

/**
 * Crea la aplicación Express con todas las dependencias
 */
async function createExpressApp() {
  try {
    const containerInstance = await initializeContainer();

    const app = createApp({
      channelController: containerInstance.get('channelController'),
      programController: containerInstance.get('programController'),
      scheduleController: containerInstance.get('scheduleController'),
      adminController: containerInstance.get('adminController'),
    });

    logger.info('Express app created successfully', {
      version: appConfig.apiVersion,
      env: appConfig.env,
    });

    return app;
  } catch (error) {
    logger.error('Failed to create Express app', error as Error);
    throw error;
  }
}

/**
 * Cloud Function HTTP para API v2
 */
export const apiv2 = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
    minInstances: appConfig.env === 'production' ? 1 : 0, // Keep warm en prod
    maxInstances: 10,
  })
  .https.onRequest(async (req, res) => {
    try {
      const app = await createExpressApp();
      app(req, res);
    } catch (error) {
      logger.error('Error handling request', error as Error);
      res.status(500).json({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  });

/**
 * Cleanup cuando la función se destruye (útil para desarrollo)
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, cleaning up...');
  if (container) {
    await container.cleanup();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, cleaning up...');
  if (container) {
    await container.cleanup();
  }
  process.exit(0);
});
