import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { AuthService } from '@/domain/services/AuthService';
import { createAuthGuard } from '../middlewares/authGuard';
import { asyncHandler } from '@/shared/utils/asyncHandler';
import { aiRateLimit } from '../middlewares/rateLimit';

export const createAIRoutes = (
  controller: AIController,
  authService: AuthService
): Router => {
  const router = Router();
  const authGuard = createAuthGuard(authService);

  router.post('/chat', authGuard, aiRateLimit, asyncHandler(controller.chat.bind(controller)));
  router.post('/chat/stream', authGuard, aiRateLimit, asyncHandler(controller.chatStream.bind(controller)));
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
  router.patch(
    '/memory',
    authGuard,
    asyncHandler(controller.updateMemory.bind(controller))
  );

  // Conversation management
  router.get(
    '/conversations',
    authGuard,
    asyncHandler(controller.listConversations.bind(controller))
  );
  router.get(
    '/conversations/search',
    authGuard,
    asyncHandler(controller.searchConversations.bind(controller))
  );
  router.get(
    '/conversations/:conversationId',
    authGuard,
    asyncHandler(controller.getConversation.bind(controller))
  );
  router.patch(
    '/conversations/:conversationId',
    authGuard,
    asyncHandler(controller.updateConversation.bind(controller))
  );
  router.delete(
    '/conversations/:conversationId',
    authGuard,
    asyncHandler(controller.deleteConversation.bind(controller))
  );
  router.post(
    '/conversations/:conversationId/feedback',
    authGuard,
    asyncHandler(controller.trackMessageFeedback.bind(controller))
  );
  router.post(
    '/reminders',
    authGuard,
    asyncHandler(controller.createProgramReminder.bind(controller))
  );

  return router;
};
