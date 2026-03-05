import { Router } from 'express';
import { LayoutController } from '../controllers/LayoutController';
import { asyncHandler } from '../middlewares/asyncHandler';

/**
 * Registers endpoints to retrieve layout/rendering information.
 */
export const createLayoutRoutes = (
  layoutController: LayoutController
): Router => {
  const router = Router();

  /**
   * GET /v2/layouts/:date
   * Query: channels (csv), timeSlot, fields
   */
  router.get(
    '/:date',
    asyncHandler(layoutController.getByDate.bind(layoutController))
  );

  return router;
};
