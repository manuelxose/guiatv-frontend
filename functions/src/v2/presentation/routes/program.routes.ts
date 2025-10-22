// src/v2/presentation/routes/program.routes.ts

import { Router } from 'express';
import { ProgramController } from '../controllers/ProgramController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  validateDateParam,
  validateChannelIdParam,
  validatePaginationQuery,
  validateTimeQuery,
} from '../middlewares/validator';

export const createProgramRoutes = (controller: ProgramController): Router => {
  const router = Router();

  /**
   * GET /v2/programs/date/:date
   * Params: date (YYYYMMDD | today | tomorrow | after_tomorrow)
   * Query: channelId, genre, limit, offset
   */
  router.get(
    '/date/:date',
    validateDateParam,
    validatePaginationQuery,
    asyncHandler(controller.getByDate.bind(controller))
  );

  /**
   * GET /v2/programs/channel/:channelId
   * Params: channelId
   * Query: date, fromTime, toTime
   */
  router.get(
    '/channel/:channelId',
    validateChannelIdParam,
    validateTimeQuery,
    asyncHandler(controller.getByChannel.bind(controller))
  );

  return router;
};
