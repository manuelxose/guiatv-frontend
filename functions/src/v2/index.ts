import { Request, Response } from 'express';

export const v2 = async (req: Request, res: Response) => {
  try {
    // Lazy-load heavy modules to avoid initialization-time work
    await Promise.all([import('./presentation/routes/app'), import('./config/container')]);

    // Do not call container.initialize() automatically here to avoid long startup during cold load.
    // Consumers can initialize when they need to perform heavy operations.
    // const container = containerModule.createContainer();
    // await container.initialize();

    // If you need to create an express app for processing, do it here (lazy)
    // const app = appModule.createApp(container);

    res.status(200).json({ status: 'ok', message: 'v2 with imports' });
  } catch (e) {
    console.error('Error in v2 handler', e);
    res.status(500).json({ status: 'error', message: 'Error in v2 handler' });
  }
};

export const apiv2 = v2;
