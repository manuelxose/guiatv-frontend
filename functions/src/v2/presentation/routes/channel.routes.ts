// src/v2/presentation/routes/channel.routes.ts

import { Router } from 'express';
import { ChannelController } from '../controllers/ChannelController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateChannelIdParam } from '../middlewares/validator';

export const createChannelRoutes = (controller: ChannelController): Router => {
  const router = Router();

  /**
   * GET /v2/channels
   * Query params: type, region, isActive
   */
  router.get('/', asyncHandler(controller.getAll.bind(controller)));

  /**
   * GET /v2/channels/:id
   */
  router.get(
    '/:id',
    validateChannelIdParam,
    asyncHandler(controller.getById.bind(controller))
  );

  return router;
};
