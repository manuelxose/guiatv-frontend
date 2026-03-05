import { Router } from 'express';
import { SitemapController } from '../controllers/SitemapController';

export const createSitemapRoutes = (controller: SitemapController): Router => {
  const router = Router();

  router.get('/sitemap.xml', (req, res, next) => {
    void controller.getSitemap(req, res, next);
  });

  return router;
};
