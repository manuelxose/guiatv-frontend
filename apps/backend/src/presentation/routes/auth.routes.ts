import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { asyncHandler } from '../../shared/utils/asyncHandler';

/**
 * Authentication endpoints (Google + password login + session validation).
 */
export const createAuthRoutes = (controller: AuthController): Router => {
  const router = Router();

  router.post(
    '/google',
    asyncHandler(controller.loginWithGoogle.bind(controller))
  );
  router.post(
    '/login',
    asyncHandler(controller.loginWithPassword.bind(controller))
  );
  router.post(
    '/register',
    asyncHandler(controller.registerWithPassword.bind(controller))
  );
  router.get('/me', asyncHandler(controller.me.bind(controller)));
  router.post('/logout', asyncHandler(controller.logout.bind(controller)));

  return router;
};
