// src/v2/presentation/routes/program.routes.ts

import { Router } from 'express';
import { ProgramController } from '../controllers/ProgramController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { cacheMiddleware } from '../middlewares/cache';

/**
 * Registers program endpoints used by clients and admin tools.
 */
export const createProgramRoutes = (controller: ProgramController): Router => {
  const router = Router();

  /**
   * GET /v2/programs
   * Query: date (YYYYMMDD | today | tomorrow | after_tomorrow), channels, timeSlot, fields, page, limit
   */
  router.get('/', cacheMiddleware(300), asyncHandler(controller.getProgramsHandler.bind(controller)));

  /**
   * GET /v2/programs/:id
   */
  router.get('/:id', asyncHandler(controller.getById.bind(controller)));

  return router;
};
