import { Router } from 'express';
import { ListsPublicController } from '../controllers/ListsPublicController';
import { asyncHandler } from '../../shared/utils/asyncHandler';

/**
 * Public (unauthenticated) endpoint for browsing community lists.
 */
export const createListsPublicRoutes = (): Router => {
  const router = Router();
  const controller = new ListsPublicController();

  router.get('/', asyncHandler(controller.getPublicLists.bind(controller)));

  return router;
};
