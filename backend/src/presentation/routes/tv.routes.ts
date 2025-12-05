import { Router } from 'express';
import { TvController } from '../controllers/TvController';

export const createTvRoutes = (controller: TvController): Router => {
  const router = Router();

  router.get('/now', (req, res) => controller.now(req, res));
  router.get('/schedule', (req, res) => controller.schedule(req, res));

  return router;
};
