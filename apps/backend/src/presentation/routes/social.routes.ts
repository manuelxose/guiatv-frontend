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
  router.post('/recommendations', asyncHandler(controller.addRecommendation.bind(controller)));
  router.get('/recommendations', asyncHandler(controller.getRecommendations.bind(controller)));

  return router;
};
