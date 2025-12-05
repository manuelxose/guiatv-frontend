import { Router } from 'express';
import { SSRController } from '../controllers/SSRController';
import { asyncHandler } from '../../shared/utils/asyncHandler';

/**
 * Routes intended for server-side rendered pages (e.g. now playing widgets).
 */
export const createSSRRoutes = (controller: SSRController): Router => {
  const router = Router();

  router.get('/now-playing', asyncHandler(controller.nowPlaying.bind(controller)));

  return router;
};
