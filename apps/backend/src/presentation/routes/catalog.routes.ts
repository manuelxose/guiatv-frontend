import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController';
import { AuthService } from '@/domain/services/AuthService';
import { createOptionalAuthGuard } from '../middlewares/authGuard';
import { asyncHandler } from '@/shared/utils/asyncHandler';
import { catalogRateLimit } from '../middlewares/rateLimit';

export const createCatalogRoutes = (
  controller: CatalogController,
  authService: AuthService
): Router => {
  const router = Router();
  const optionalAuth = createOptionalAuthGuard(authService);

  router.use(catalogRateLimit);
  router.get('/platforms', asyncHandler(controller.getPlatforms.bind(controller)));
  router.get('/suggest', optionalAuth, asyncHandler(controller.suggest.bind(controller)));
  router.get('/:catalogId', optionalAuth, asyncHandler(controller.getDetail.bind(controller)));
  router.get('/', optionalAuth, asyncHandler(controller.getCatalog.bind(controller)));

  return router;
};
