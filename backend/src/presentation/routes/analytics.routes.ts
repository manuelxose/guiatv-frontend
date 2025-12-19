import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { analyticsAdminGuard } from '../middlewares/analyticsAdminGuard';

export const createAnalyticsRoutes = (
  controller: AnalyticsController
): Router => {
  const router = Router();

  router.post(
    '/session/start',
    asyncHandler(controller.startSession.bind(controller))
  );
  router.post(
    '/session/heartbeat',
    asyncHandler(controller.heartbeatSession.bind(controller))
  );
  router.post(
    '/session/end',
    asyncHandler(controller.endSession.bind(controller))
  );
  router.post('/event', asyncHandler(controller.trackEvent.bind(controller)));

  router.get(
    '/live',
    analyticsAdminGuard,
    asyncHandler(controller.getLive.bind(controller))
  );
  router.get(
    '/overview',
    analyticsAdminGuard,
    asyncHandler(controller.getOverview.bind(controller))
  );
  router.get(
    '/events',
    analyticsAdminGuard,
    asyncHandler(controller.getEvents.bind(controller))
  );

  return router;
};
