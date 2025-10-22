// src/v2/presentation/routes/health.routes.ts

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createHealthRoutes = (): Router => {
  const router = Router();

  /**
   * GET /v2/health
   */
  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime)}s`,
        version: process.env.API_VERSION || '2.0.0',
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
      });
    })
  );

  return router;
};
