// src/v2/presentation/routes/app.ts

import express, { Application } from 'express';
import path from 'path';
import { createV2Routes, RoutesDependencies } from './index';
import { createBlogRoutes } from './blog.routes';
import { createSitemapRoutes } from './sitemap.routes';
import { corsMiddleware } from '../middlewares/cors';
import { compressionMiddleware } from '../middlewares/compression';
import { requestLogger } from '../middlewares/requestLogger';
import { errorHandler } from '../middlewares/errorHandler';
import { notFoundHandler } from '../middlewares/notFoundHandler';

/**
 * Builds and configures the Express application with middlewares and v2 routes.
 *
 * @param dependencies - Controllers and shared dependencies injected from the container.
 */
export const createApp = (dependencies: RoutesDependencies): Application => {
  const app = express();

  // Evitar respuestas 304 por etag en datos dinámicos
  app.disable('etag');
  app.set('trust proxy', 1);

  // Sitemap — mounted before the no-store middleware so it can send its own Cache-Control headers
  app.use('/', createSitemapRoutes(dependencies.sitemapController));

  // Forzar que los datos de la API no se sirvan desde cache del navegador
  app.use((req, res, next) => {
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // Serve storage from configured local path when available.
  const storagePath = process.env.STORAGE_LOCAL_PATH
    ? path.resolve(process.env.STORAGE_LOCAL_PATH)
    : path.join(__dirname, '../../../storage');
  app.use('/storage', express.static(storagePath));

  // Middlewares globales
  app.use(corsMiddleware);
  app.use(compressionMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Rutas Blog (Legacy / separate from V2)
  app.use('/blog', createBlogRoutes(dependencies.blogController));

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
    void req;
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
