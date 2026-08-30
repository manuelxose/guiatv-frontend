import { Router } from 'express';
import { AffiliateController } from '../controllers/AffiliateController';
import { asyncHandler } from '../../shared/utils/asyncHandler';

/**
 * Generic Affiliate Engine surface (Phase 3). Additive alongside the legacy
 * `/v2/monetization/*` routes, which remain mounted and unchanged.
 */
export const createAffiliateRoutes = (controller: AffiliateController): Router => {
  const router = Router();
  router.post('/resolve', asyncHandler(controller.resolve.bind(controller)));
  router.get('/go/:offerId', asyncHandler(controller.go.bind(controller)));
  router.post('/impression', asyncHandler(controller.impression.bind(controller)));
  return router;
};
