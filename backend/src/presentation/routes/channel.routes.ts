// src/v2/presentation/routes/channel.routes.ts

import { Router } from 'express';
import { ChannelController } from '../controllers/ChannelController';
import { ProgramController } from '../controllers/ProgramController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateChannelIdParam } from '../middlewares/validator';
import { cacheMiddleware } from '../middlewares/cache';

export const createChannelRoutes = (
  controller: ChannelController,
  programController?: ProgramController
): Router => {
  const router = Router();

  /**
   * GET /v2/channels
   * Query params: type, region, isActive
   */
  router.get('/', cacheMiddleware(30), asyncHandler(controller.getAll.bind(controller)));

  /**
   * GET /v2/channels/:id
   */
  router.get(
    '/:id',
    validateChannelIdParam,
    asyncHandler(controller.getById.bind(controller))
  );

  /**
   * GET /v2/channels/:id/programs
   */
  if (programController) {
    router.get(
      '/:id/programs',
      validateChannelIdParam,
      cacheMiddleware(120),
      asyncHandler(programController.getByChannel.bind(programController))
    );
  }

  return router;
};
