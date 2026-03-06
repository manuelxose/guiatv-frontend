import { Router } from 'express';
import { ContentController } from '../controllers/ContentController';
import { AuthService } from '@/domain/services/AuthService';
import { createOptionalAuthGuard } from '../middlewares/authGuard';
import { asyncHandler } from '@/shared/utils/asyncHandler';

/**
 * Routes for content aggregation endpoints.
 */
export const createContentRoutes = (
  controller: ContentController,
  authService: AuthService
): Router => {
  const router = Router();
  const optionalAuth = createOptionalAuthGuard(authService);

  router.get('/batch', asyncHandler(controller.getBatch.bind(controller)));
  router.get(
    '/providers/:contentType/:tmdbId',
    asyncHandler(controller.getProvidersByTmdb.bind(controller))
  );
  router.get('/:id', optionalAuth, asyncHandler(controller.getContent.bind(controller)));

  return router;
};
