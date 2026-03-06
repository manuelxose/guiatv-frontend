import { Response } from 'express';
import { successResponse } from '@/shared/types/ApiResponse';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { ChatbotRecommend } from '@/application/use-cases/ChatbotRecommend';
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
    private readonly cacheRepository: ICacheRepository
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
    });

    res.status(200).json(successResponse(data));
  }

  private secondsUntilMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    return Math.max(60, Math.ceil((tomorrow.getTime() - now.getTime()) / 1000));
  }
}
