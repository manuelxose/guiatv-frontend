import { Router } from 'express';
import { MonetizationController } from '../controllers/MonetizationController';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createMonetizationRoutes = (controller: MonetizationController): Router => {
  const router = Router();
  router.get('/offers', asyncHandler(controller.getOffers.bind(controller)));
  router.get('/go/:providerId/:offerId', asyncHandler(controller.go.bind(controller)));
  return router;
};

