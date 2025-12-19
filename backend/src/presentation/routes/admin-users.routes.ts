import { Router } from 'express';
import { AdminUsersController } from '../controllers/AdminUsersController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { analyticsAdminGuard } from '../middlewares/analyticsAdminGuard';

export const createAdminUsersRoutes = (
  controller: AdminUsersController
): Router => {
  const router = Router();

  router.get(
    '/',
    analyticsAdminGuard,
    asyncHandler(controller.listUsers.bind(controller))
  );
  router.patch(
    '/:id',
    analyticsAdminGuard,
    asyncHandler(controller.updateUser.bind(controller))
  );

  return router;
};
