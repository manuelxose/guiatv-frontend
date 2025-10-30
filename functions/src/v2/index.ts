// src/v2/index.ts

import * as functions from 'firebase-functions';

let containerPromise: Promise<any> | null = null;

async function getOrCreateApp() {
  if (!containerPromise) {
    containerPromise = (async () => {
      try {
        const { Container } = await import('./config/container');
        const { createApp } = await import('./presentation/routes/app');

        const container = Container.getInstance();
        await container.initialize();

        const app = createApp({
          channelController: container.get('channelController'),
          programController: container.get('programController'),
          scheduleController: container.get('scheduleController'),
          adminController: container.get('adminController'),
        });

        return { app, container };
      } catch (error) {
        containerPromise = null;
        throw error;
      }
    })();
  }

  return containerPromise;
}

export const apiv2 = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
    minInstances: process.env.NODE_ENV === 'production' ? 1 : 0,
    maxInstances: 10,
  })
  .https.onRequest(async (req, res) => {
    try {
      const { app } = await getOrCreateApp();
      app(req, res);
    } catch (error) {
      console.error('Error handling request:', error);
      res.status(500).json({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  });
