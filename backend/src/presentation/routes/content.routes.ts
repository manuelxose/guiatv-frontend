import { Router } from 'express';
import { ContentController } from '../controllers/ContentController';

export const createContentRoutes = (
  controller: ContentController
): Router => {
  const router = Router();

  router.get('/batch', (req, res) => controller.getBatch(req, res));
  router.get('/:id', (req, res) => controller.getContent(req, res));

  return router;
};
