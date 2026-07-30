import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { createRateLimiter } from '../middlewares/rateLimit';

/**
 * Authentication endpoints (Google + password login + session validation).
 */
export const createAuthRoutes = (controller: AuthController): Router => {
  const router = Router();
  const authRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many auth requests, please try again later',
  });
  const passwordRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many password reset attempts, please try later',
  });

  router.post(
    '/google',
    authRateLimit,
    asyncHandler(controller.loginWithGoogle.bind(controller))
  );
  router.post(
    '/login',
    authRateLimit,
    asyncHandler(controller.loginWithPassword.bind(controller))
  );
  router.post(
    '/register',
    authRateLimit,
    asyncHandler(controller.registerWithPassword.bind(controller))
  );
  router.post('/refresh', authRateLimit, asyncHandler(controller.refresh.bind(controller)));
  router.get('/me', asyncHandler(controller.me.bind(controller)));
  router.get('/sessions', asyncHandler(controller.sessions.bind(controller)));
  router.delete('/sessions/:id', asyncHandler(controller.revokeSession.bind(controller)));
  router.post('/logout', asyncHandler(controller.logout.bind(controller)));
  router.post('/logout-all', asyncHandler(controller.logoutAll.bind(controller)));
  router.post(
    '/password/forgot',
    passwordRateLimit,
    asyncHandler(controller.forgotPassword.bind(controller))
  );
  router.post(
    '/password/reset',
    passwordRateLimit,
    asyncHandler(controller.resetPassword.bind(controller))
  );
  router.patch(
    '/password',
    passwordRateLimit,
    asyncHandler(controller.changePassword.bind(controller))
  );

  return router;
};
