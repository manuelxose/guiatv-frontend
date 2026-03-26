import { Router } from 'express';
import { DiscoveryController } from '../controllers/DiscoveryController';
import { AuthService } from '@/domain/services/AuthService';
import { createAuthGuard } from '../middlewares/authGuard';
import { createOptionalAuthGuard } from '../middlewares/authGuard';
import { asyncHandler } from '@/shared/utils/asyncHandler';
import { discoveryRateLimit } from '../middlewares/rateLimit';

/**
 * Discovery endpoints for home and search views.
 */
export const createDiscoveryRoutes = (
  controller: DiscoveryController,
  authService: AuthService
): Router => {
  const router = Router();
  const authGuard = createAuthGuard(authService);
  const optionalAuth = createOptionalAuthGuard(authService);

  router.use(discoveryRateLimit);
  router.get('/home', optionalAuth, asyncHandler(controller.home.bind(controller)));
  router.get('/browse', optionalAuth, asyncHandler(controller.browse.bind(controller)));
  router.get('/search', optionalAuth, asyncHandler(controller.search.bind(controller)));
  router.get('/for-you', authGuard, asyncHandler(controller.forYou.bind(controller)));

  return router;
};
