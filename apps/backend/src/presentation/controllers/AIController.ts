import { Response } from 'express';
import { successResponse } from '@/shared/types/ApiResponse';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { ChatbotRecommend } from '@/application/use-cases/ChatbotRecommend';
import { AssistantMemoryService } from '@/application/services/AssistantMemoryService';
import {
  ServiceUnavailableError,
  TooManyRequestsError,
  ValidationError,
} from '@/shared/errors';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { DateUtils } from '@/shared/utils/dateUtils';

export class AIController {
  constructor(
    private readonly chatbotRecommend: ChatbotRecommend | null,
    private readonly cacheRepository: ICacheRepository,
    private readonly assistantMemoryService: AssistantMemoryService
  ) {}

  async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!this.chatbotRecommend) {
      throw new ServiceUnavailableError('AI chatbot is disabled');
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('Authentication required', []);
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) {
      throw new ValidationError('messages array is required', []);
    }

    const limit = Number(process.env.AI_CHATBOT_DAILY_LIMIT_PER_USER || 50) || 50;
    if (limit > 0 && this.cacheRepository.increment) {
      const key = `ai:chat:limit:${userId}:${DateUtils.getTodayYYYYMMDD()}`;
      const ttl = this.secondsUntilMidnight();
      const count = await this.cacheRepository.increment(key, ttl);
      if (count > limit) {
        throw new TooManyRequestsError('Daily AI chat limit reached');
      }
    }

    const data = await this.chatbotRecommend.execute({
      userId,
      messages,
      conversationId:
        typeof req.body?.conversationId === 'string'
          ? req.body.conversationId
          : undefined,
    });

    res.status(200).json(successResponse(data));
  }

  async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('Authentication required', []);
    }

    const data = await this.assistantMemoryService.getHistory(
      userId,
      typeof req.query?.conversationId === 'string'
        ? req.query.conversationId
        : undefined
    );

    res.status(200).json(successResponse(data));
  }

  async saveHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('Authentication required', []);
    }

    if (Array.isArray(req.body?.messages)) {
      const conversationId = await this.assistantMemoryService.saveClientMessages({
        userId,
        conversationId:
          typeof req.body?.conversationId === 'string'
            ? req.body.conversationId
            : undefined,
        messages: req.body.messages,
      });

      res.status(200).json(successResponse({ conversationId, saved: true }));
      return;
    }

    if (req.body?.action && req.body?.recommendation) {
      const memory = await this.assistantMemoryService.trackRecommendationAction({
        userId,
        conversationId:
          typeof req.body?.conversationId === 'string'
            ? req.body.conversationId
            : undefined,
        action: req.body.action,
        recommendation: req.body.recommendation,
      });

      res.status(200).json(successResponse({ saved: true, memory }));
      return;
    }

    throw new ValidationError('messages or recommendation action is required', []);
  }

  async clearHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('Authentication required', []);
    }

    const cleared = await this.assistantMemoryService.clearHistory(
      userId,
      typeof req.query?.conversationId === 'string'
        ? req.query.conversationId
        : undefined
    );

    res.status(200).json(successResponse({ cleared }));
  }

  private secondsUntilMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    return Math.max(60, Math.ceil((tomorrow.getTime() - now.getTime()) / 1000));
  }
}
