// src/v2/index.ts


let containerPromise: Promise<any> | null = null;

async function getOrCreateApp() {
  console.log('v2/index.ts: getOrCreateApp called');
  if (!containerPromise) {
    console.log('v2/index.ts: Creating new container promise');
    containerPromise = (async () => {
      try {
        console.log('v2/index.ts: Importing Container');
        const { Container } = await import('./config/container');
        console.log('v2/index.ts: Importing createApp');
        const { createApp } = await import('./presentation/routes/app');

        console.log('v2/index.ts: Getting Container instance');
        const container = Container.getInstance();
        // Add safety timeout for initialize to avoid hanging during cold start
        const initPromise = (async () => {
          const s = Date.now();
          try {
            console.log('v2/index.ts: Initializing container');
            await container.initialize();
            console.info('container.initialize completed', { ms: Date.now() - s });
          } catch (err) {
            console.error('container.initialize failed', err && (err as any).stack ? (err as any).stack : err);
            throw err;
          }
        })();
        const timeoutMs = Number(process.env.CONTAINER_INIT_TIMEOUT_MS) || 15000;
        await Promise.race([
          initPromise,
          new Promise((_, rej) => setTimeout(() => rej(new Error(`container.initialize timed out after ${timeoutMs}ms`)), timeoutMs)),
        ]);

        console.log('v2/index.ts: Creating app with controllers');
        const app = createApp({
          channelController: container.get('channelController'),
          programController: container.get('programController'),
          scheduleController: container.get('scheduleController'),
          adminController: container.get('adminController'),
        });

        console.log('v2/index.ts: App created successfully');
        return { app, container };
      } catch (error) {
        console.error('v2/index.ts: Error in getOrCreateApp', error);
        containerPromise = null;
        throw error;
      }
    })();
  }

  return containerPromise;
}

export const v2 = async (req: any, res: any) => {
  console.log('v2/index.ts: v2 handler called');
  try {
    console.log('v2/index.ts: Getting app');
    const { app } = await getOrCreateApp();
    console.log('v2/index.ts: Calling app handler');
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
};

// Backwards compatibility: keep `apiv2` name available
export const apiv2 = v2;
