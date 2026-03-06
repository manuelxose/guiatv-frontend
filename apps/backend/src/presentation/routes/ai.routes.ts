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

  return router;
};
