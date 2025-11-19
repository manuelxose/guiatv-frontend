// src/v2/presentation/routes/app.ts

import express, { Application } from 'express';
import { createV2Routes, RoutesDependencies } from './index';
import { corsMiddleware } from '../middlewares/cors';
import { compressionMiddleware } from '../middlewares/compression';
import { requestLogger } from '../middlewares/requestLogger';
import { errorHandler } from '../middlewares/errorHandler';
import { notFoundHandler } from '../middlewares/notFoundHandler';

export const createApp = (dependencies: RoutesDependencies): Application => {
  const app = express();

  // Middlewares globales
  app.use(corsMiddleware);
  app.use(compressionMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Rutas v2
  // Montar rutas v2 en /v2 y también como alias en la raíz '/' para compatibilidad con Hosting rewrites
  const v2Router = createV2Routes(dependencies);
  app.use('/v2', v2Router);
  app.use('/', v2Router);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (debe ser el último)
  app.use(errorHandler);

  return app;
};

export { RoutesDependencies };
