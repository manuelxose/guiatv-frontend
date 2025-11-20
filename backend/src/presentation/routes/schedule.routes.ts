// src/v2/presentation/routes/schedule.routes.ts

import { Router } from 'express';
import { ScheduleController } from '../controllers/ScheduleController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateDateParam } from '../middlewares/validator';

export const createScheduleRoutes = (
  controller: ScheduleController
): Router => {
  const router = Router();

  /**
   * GET /v2/schedules/:date
   * Params: date (YYYYMMDD | today | tomorrow | after_tomorrow)
   */
  router.get(
    '/:date',
    validateDateParam,
    asyncHandler(controller.getByDate.bind(controller))
  );

  /**
   * GET /v2/schedules/:date/channels
   * Params: date
   * Returns: Summary of channels with program counts
   */
  router.get(
    '/:date/channels',
    validateDateParam,
    asyncHandler(controller.getChannelsSummary.bind(controller))
  );

  return router;
};
