import express, { Application, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import cors from 'cors';
import { config } from './config';

/**
 * Crear y configurar la aplicación Express
 */
export function createApp(): Application {
  const app = express();

  // ===== MIDDLEWARES GLOBALES =====

  // CORS
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
  }));

  // Compresión de respuestas
  app.use(compression());

  // Parseo de JSON y URL-encoded
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging básico de requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });

  // ===== HEALTH CHECK =====
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    });
  });

  // ===== MONTAJE DE ROUTERS =====

  // Lazy-load de routers para optimizar tiempo de arranque
  app.use('/v1', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { default: v1Router } = await import('../api/v1/router');
      return v1Router(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.use('/v2', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { default: v2Router } = await import('../api/v2/router');
      return v2Router(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  // SSR / Servidor de estáticos (debe ir al final)
  app.use('*', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ssrHandler } = await import('../ssr/handler');
      return ssrHandler(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  // ===== MIDDLEWARE DE ERRORES =====

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Error en la aplicación:', err);

    // No enviar stack trace en producción
    const errorResponse: any = {
      error: 'Internal Server Error',
      message: config.isDevelopment ? err.message : 'Ha ocurrido un error',
    };

    if (config.isDevelopment && err.stack) {
      errorResponse.stack = err.stack;
    }

    res.status(500).json(errorResponse);
  });

  return app;
}
