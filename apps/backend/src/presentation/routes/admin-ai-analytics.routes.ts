import { Router } from 'express';
import { AIAnalyticsController } from '../controllers/AIAnalyticsController';
import { AuthService } from '@/domain/services/AuthService';
import { createAdminAccessGuard } from '../middlewares/adminAccessGuard';
import { asyncHandler } from '@/shared/utils/asyncHandler';

export const createAdminAIAnalyticsRoutes = (
  controller: AIAnalyticsController,
  authService: AuthService
): Router => {
  const router = Router();
  const adminGuard = createAdminAccessGuard(authService);

  router.get('/overview', adminGuard, asyncHandler(controller.getOverview.bind(controller)));
  router.get('/timeseries', adminGuard, asyncHandler(controller.getTimeSeries.bind(controller)));

  return router;
};
