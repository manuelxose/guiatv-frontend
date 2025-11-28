import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createAuthRoutes = (controller: AuthController): Router => {
  const router = Router();

  router.post(
    '/google',
    asyncHandler(controller.loginWithGoogle.bind(controller))
  );
  router.get('/me', asyncHandler(controller.me.bind(controller)));
  router.post('/logout', asyncHandler(controller.logout.bind(controller)));

  return router;
};
