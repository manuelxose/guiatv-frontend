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
  const v2Router = createV2Routes(dependencies);
  app.use('/v2', v2Router);

  // Root route for compatibility and health check
  /**
   * @openapi
   * /:
   *   get:
   *     tags:
   *       - General
   *     summary: Bienvenida a la API
   *     description: Retorna información básica y versión de la API
   *     responses:
   *       200:
   *         description: Bienvenida
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Welcome to Guía TV API
   *                     version:
   *                       type: string
   *                       example: 2.0.0
   *                     docs:
   *                       type: string
   *                       example: /v2/docs
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Welcome to Guía TV API',
        version: process.env.API_VERSION || '2.0.0',
        docs: '/v2/docs',
      },
    });
  });

  // Alias v2 routes at root for backward compatibility (e.g. /health)
  app.use('/', v2Router);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (debe ser el último)
  app.use(errorHandler);

  return app;
};

export { RoutesDependencies };
