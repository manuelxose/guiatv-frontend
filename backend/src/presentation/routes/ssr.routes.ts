import { Router } from 'express';
import { SSRController } from '../controllers/SSRController';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createSSRRoutes = (controller: SSRController): Router => {
  const router = Router();

  router.get('/now-playing', asyncHandler(controller.nowPlaying.bind(controller)));

  return router;
};
