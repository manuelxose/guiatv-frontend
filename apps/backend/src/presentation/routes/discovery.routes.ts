import { Router } from 'express';
import { DiscoveryController } from '../controllers/DiscoveryController';
import { AuthService } from '@/domain/services/AuthService';
import { createAuthGuard } from '../middlewares/authGuard';
import { asyncHandler } from '@/shared/utils/asyncHandler';

/**
 * Discovery endpoints for home and search views.
 */
export const createDiscoveryRoutes = (
  controller: DiscoveryController,
  authService: AuthService
): Router => {
  const router = Router();
  const authGuard = createAuthGuard(authService);

  router.get('/home', asyncHandler(controller.home.bind(controller)));
  router.get('/search', asyncHandler(controller.search.bind(controller)));
  router.get('/for-you', authGuard, asyncHandler(controller.forYou.bind(controller)));

  return router;
};
