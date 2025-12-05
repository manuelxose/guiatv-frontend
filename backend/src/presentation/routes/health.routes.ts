// src/v2/presentation/routes/health.routes.ts

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { successResponse } from '../../shared/types/ApiResponse';

/**
 * Simple health-check routes used by uptime monitors and load balancers.
 */
export const createHealthRoutes = (): Router => {
  const router = Router();

  /**
   * @openapi
   * /v2/health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check
   *     description: Verifica que el servidor esté respondiendo
   *     responses:
   *       200:
   *         description: Servidor saludable
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 uptime:
   *                   type: string
   *                 version:
   *                   type: string
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      void req;
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      res.status(200).json(
        successResponse(
          {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime)}s`,
            version: process.env.API_VERSION || '2.0.0',
            memory: {
              rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
              heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
              heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            },
          },
          { cached: false }
        )
      );
    })
  );

  return router;
};
