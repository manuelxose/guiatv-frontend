// src/v2/presentation/routes/admin.routes.ts

import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { strictRateLimit } from '../middlewares/rateLimit';

export const createAdminRoutes = (controller: AdminController): Router => {
  const router = Router();

  // TODO: Agregar middleware de autenticación para producción
  // router.use(authMiddleware);

  /**
   * POST /v2/admin/sync
   * Body: { date?: string, forceRefresh?: boolean }
   */
  router.post(
    '/sync',
    strictRateLimit,
    asyncHandler(controller.triggerSync.bind(controller))
  );

  /**
   * POST /v2/admin/precompute
   * Body: { date?: string }
   */
  router.post(
    '/precompute',
    strictRateLimit,
    asyncHandler(controller.triggerPrecompute.bind(controller))
  );

  /**
   * POST /v2/admin/cleanup
   * Body: { daysToKeep?: number }
   */
  router.post(
    '/cleanup',
    strictRateLimit,
    asyncHandler(controller.triggerCleanup.bind(controller))
  );

  /**
   * POST /v2/admin/cache/clear
   * Body: { pattern?: string }
   */
  router.post(
    '/cache/clear',
    strictRateLimit,
    asyncHandler(controller.clearCache.bind(controller))
  );

  /**
   * GET /v2/admin/health
   */
  router.get('/health', asyncHandler(controller.healthCheck.bind(controller)));

  return router;
};
