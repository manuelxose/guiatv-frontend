import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { AuthService } from '@/domain/services/AuthService';
import { createAuthGuard } from '../middlewares/authGuard';
import { asyncHandler } from '@/shared/utils/asyncHandler';

export const createAIRoutes = (
  controller: AIController,
  authService: AuthService
): Router => {
  const router = Router();
  const authGuard = createAuthGuard(authService);

  router.post('/chat', authGuard, asyncHandler(controller.chat.bind(controller)));
  router.get(
    '/chat/history',
    authGuard,
    asyncHandler(controller.getHistory.bind(controller))
  );
  router.post(
    '/chat/history',
    authGuard,
    asyncHandler(controller.saveHistory.bind(controller))
  );
  router.delete(
    '/chat/history',
    authGuard,
    asyncHandler(controller.clearHistory.bind(controller))
  );

  return router;
};
