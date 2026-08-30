import { Router } from 'express';
import { AffiliateAdminController } from '../controllers/AffiliateAdminController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AuthService } from '../../domain/services/AuthService';
import { createAdminAccessGuard } from '../middlewares/adminAccessGuard';

/**
 * Phase 9 — Affiliate / Monetization admin surface. Every route sits behind
 * `createAdminAccessGuard` (the same guard `/v2/admin/*` and
 * `/v2/admin/users/*` already use), so ordinary merchant/program/offer
 * maintenance never needs a source-code change or an unauthenticated route.
 */
export const createAdminAffiliateRoutes = (controller: AffiliateAdminController, authService: AuthService): Router => {
  const router = Router();
  const adminGuard = createAdminAccessGuard(authService);
  router.use(adminGuard);

  router.get('/merchants', asyncHandler(controller.listMerchants.bind(controller)));
  router.get('/merchants/:id', asyncHandler(controller.getMerchant.bind(controller)));
  router.post('/merchants', asyncHandler(controller.createMerchant.bind(controller)));
  router.put('/merchants/:id', asyncHandler(controller.updateMerchant.bind(controller)));

  router.get('/networks', asyncHandler(controller.listNetworks.bind(controller)));
  router.get('/networks/:id', asyncHandler(controller.getNetwork.bind(controller)));
  router.post('/networks', asyncHandler(controller.createNetwork.bind(controller)));
  router.put('/networks/:id', asyncHandler(controller.updateNetwork.bind(controller)));

  router.get('/programs', asyncHandler(controller.listPrograms.bind(controller)));
  router.get('/programs/:id', asyncHandler(controller.getProgram.bind(controller)));
  router.post('/programs', asyncHandler(controller.createProgram.bind(controller)));
  router.put('/programs/:id', asyncHandler(controller.updateProgram.bind(controller)));

  router.get('/offers', asyncHandler(controller.listOffers.bind(controller)));
  router.get('/offers/:id', asyncHandler(controller.getOffer.bind(controller)));
  router.post('/offers', asyncHandler(controller.createOffer.bind(controller)));
  router.put('/offers/:id', asyncHandler(controller.updateOffer.bind(controller)));
  router.post('/offers/:id/deactivate', asyncHandler(controller.deactivateOffer.bind(controller)));

  router.get('/placements', asyncHandler(controller.listPlacements.bind(controller)));
  router.post('/placements', asyncHandler(controller.createPlacement.bind(controller)));
  router.put('/placements/:id', asyncHandler(controller.updatePlacement.bind(controller)));

  router.get('/verification', asyncHandler(controller.getVerificationQueue.bind(controller)));
  router.get('/analytics', asyncHandler(controller.getAnalyticsReport.bind(controller)));

  return router;
};
