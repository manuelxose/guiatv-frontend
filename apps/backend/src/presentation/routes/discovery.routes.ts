import { Router } from 'express';
import { DiscoveryController } from '../controllers/DiscoveryController';

/**
 * Discovery endpoints for home and search views.
 */
export const createDiscoveryRoutes = (
  controller: DiscoveryController
): Router => {
  const router = Router();

  router.get('/home', (req, res) => controller.home(req, res));
  router.get('/search', (req, res) => controller.search(req, res));

  return router;
};
