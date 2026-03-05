import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { createAuthGuard } from '../middlewares/authGuard';
import { AuthService } from '../../domain/services/AuthService';

/**
 * Chat endpoints (conversations and messages).
 */
export const createChatRoutes = (controller: ChatController, authService: AuthService): Router => {
  const router = Router();
  const authGuard = createAuthGuard(authService);

  router.use(authGuard);

  router.get('/conversations', asyncHandler(controller.getConversations.bind(controller)));
  router.get('/online-users', asyncHandler(controller.getOnlineUsers.bind(controller)));
  router.post('/conversations', asyncHandler(controller.createConversation.bind(controller)));
  router.get('/conversations/:id/messages', asyncHandler(controller.getMessages.bind(controller)));
  router.post('/conversations/:id/messages', asyncHandler(controller.sendMessage.bind(controller)));
  router.post('/conversations/:id/read', asyncHandler(controller.markConversationRead.bind(controller)));

  return router;
};
