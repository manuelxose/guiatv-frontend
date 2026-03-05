import { Router } from 'express';
import { SocialController } from '../controllers/SocialController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { createAuthGuard } from '../middlewares/authGuard';
import { AuthService } from '../../domain/services/AuthService';

/**
 * Social endpoints (feed, friends, follows, recommendations).
 */
export const createSocialRoutes = (controller: SocialController, authService: AuthService): Router => {
  const router = Router();
  const authGuard = createAuthGuard(authService);

  router.use(authGuard);

  router.get('/activities', asyncHandler(controller.getActivities.bind(controller)));
  router.get('/friends', asyncHandler(controller.getFriends.bind(controller)));
  router.post('/follow/:userId', asyncHandler(controller.toggleFollow.bind(controller)));
  router.post('/block/:userId', asyncHandler(controller.blockUser.bind(controller)));
  router.delete('/block/:userId', asyncHandler(controller.unblockUser.bind(controller)));
  router.get('/blocks', asyncHandler(controller.getBlocks.bind(controller)));
  router.post('/recommendations', asyncHandler(controller.addRecommendation.bind(controller)));
  router.get('/recommendations', asyncHandler(controller.getRecommendations.bind(controller)));
  router.post('/reports', asyncHandler(controller.createReport.bind(controller)));
  router.get('/reports/me', asyncHandler(controller.getMyReports.bind(controller)));

  return router;
};
