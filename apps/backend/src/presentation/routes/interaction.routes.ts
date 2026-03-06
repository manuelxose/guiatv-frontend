import { Router } from 'express';
import { InteractionController } from '../controllers/InteractionController';
import { AuthService } from '@/domain/services/AuthService';
import { createAuthGuard } from '../middlewares/authGuard';
import { asyncHandler } from '@/shared/utils/asyncHandler';

export const createInteractionRoutes = (
  controller: InteractionController,
  authService: AuthService
): Router => {
  const router = Router();
  const authGuard = createAuthGuard(authService);

  router.use(authGuard);
  router.post('/', asyncHandler(controller.upsert.bind(controller)));
  router.get('/', asyncHandler(controller.getAll.bind(controller)));
  router.get('/:contentId', asyncHandler(controller.getOne.bind(controller)));
  router.delete('/:contentId', asyncHandler(controller.remove.bind(controller)));

  return router;
};
