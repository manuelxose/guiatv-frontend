// src/v2/presentation/routes/app.ts

import express, { Application } from 'express';
import path from 'path';
import fs from 'fs';
import { createV2Routes, RoutesDependencies } from './index';
import { corsMiddleware } from '../middlewares/cors';
import { compressionMiddleware } from '../middlewares/compression';
import { requestLogger } from '../middlewares/requestLogger';
import { errorHandler } from '../middlewares/errorHandler';
import { notFoundHandler } from '../middlewares/notFoundHandler';

export const createApp = (dependencies: RoutesDependencies): Application => {
  const app = express();

  // Evitar respuestas 304 por etag en datos dinámicos
  app.disable('etag');

  // Forzar que los datos de la API no se sirvan desde cache del navegador
  app.use((req, res, next) => {
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // Servir iconos/archivos desde /storage (carpeta raíz del proyecto)
  // __dirname en build apunta a dist/presentation/routes -> subir 3 niveles hasta /backend/storage
  const storagePath = path.join(__dirname, '../../../storage');
  console.log('📂 Serving storage from:', storagePath);
  console.log('📂 Directory exists:', fs.existsSync(storagePath));
  app.use('/storage', express.static(storagePath));

  // Middlewares globales
  app.use(corsMiddleware);
  app.use(compressionMiddleware);
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
   *     summary: API Health Check and Welcome Message
   *     description: Returns a welcome message and API version information
   *     tags:
   *       - General
   *     responses:
   *       200:
   *         description: Successful response
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
