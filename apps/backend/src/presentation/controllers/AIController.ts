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
import { logger } from '@/shared/utils/logger';

export class AIController {
  constructor(
    private readonly chatbotRecommend: ChatbotRecommend | null,
    private readonly cacheRepository: ICacheRepository,
    private readonly assistantMemoryService: AssistantMemoryService
  ) {}

  private getDailyLimit(subscription?: string): number {
    if (subscription === 'premium') {
      return Number(process.env.AI_CHATBOT_DAILY_LIMIT_PREMIUM || 200) || 200;
    }
    return Number(process.env.AI_CHATBOT_DAILY_LIMIT_PER_USER || 50) || 50;
  }

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

    const limit = this.getDailyLimit(req.user?.subscription);
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

  async chatStream(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const limit = this.getDailyLimit(req.user?.subscription);
    if (limit > 0 && this.cacheRepository.increment) {
      const key = `ai:chat:limit:${userId}:${DateUtils.getTodayYYYYMMDD()}`;
      const ttl = this.secondsUntilMidnight();
      const count = await this.cacheRepository.increment(key, ttl);
      if (count > limit) {
        throw new TooManyRequestsError('Daily AI chat limit reached');
      }
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    // Immediately signal connection is alive — prevents frontend "isThinking" freeze
    // during the heavy DB + catalog pre-fetch phase inside executeStream
    res.write('event: ping\ndata: {}\n\n');

    const conversationId = typeof req.body?.conversationId === 'string'
      ? req.body.conversationId
      : undefined;

    const t0 = Date.now();
    logger.info('[AIController] chatStream start', { userId, conversationId });

    try {
      const result = await this.chatbotRecommend.executeStream({
        userId,
        messages,
        conversationId,
      });
      logger.info('[AIController] executeStream resolved', { userId, kind: result.kind, elapsedMs: Date.now() - t0 });

      if (result.kind === 'direct') {
        res.write(`event: full\ndata: ${JSON.stringify(result.response)}\n\n`);
        res.write('event: done\ndata: {}\n\n');
        res.end();
        return;
      }

      // Stream text chunks — isolated try/catch so a mid-stream provider error
      // still allows finalize() to run and persist whatever text arrived
      let fullText = '';
      let chunkCount = 0;
      try {
        for await (const chunk of result.textStream) {
          fullText += chunk;
          chunkCount++;
          res.write(`event: text\ndata: ${JSON.stringify({ t: chunk })}\n\n`);
        }
      } catch (streamErr) {
        logger.warn('[AIController] text stream interrupted', {
          userId,
          chunkCount,
          partialLength: fullText.length,
          elapsedMs: Date.now() - t0,
          error: streamErr instanceof Error ? streamErr.message : 'unknown',
        });
        // Continue to finalize with whatever text arrived
      }
      logger.info('[AIController] text stream done', { userId, chunkCount, fullTextLength: fullText.length, elapsedMs: Date.now() - t0 });

      // Finalize: resolve recommendations, persist — isolated so errors send a safe fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalResponse: any;
      try {
        finalResponse = await result.finalize(fullText);
      } catch (finalizeErr) {
        logger.error('[AIController] finalize error', {
          userId,
          elapsedMs: Date.now() - t0,
          error: finalizeErr instanceof Error ? finalizeErr.message : 'unknown',
        });
        finalResponse = {
          text: fullText.trim() || 'No pude completar la respuesta ahora mismo.',
          recommendations: [],
          followUpSuggestions: ['¿Qué hay ahora en TV?', 'Reintentar'],
        };
      }

      res.write(`event: result\ndata: ${JSON.stringify(finalResponse)}\n\n`);
      res.write('event: done\ndata: {}\n\n');
      res.end();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stream error';
      logger.error('[AIController] chatStream error', { userId, elapsedMs: Date.now() - t0, message });
      if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
        // Always close the SSE stream so the frontend exits the reader loop
        res.write('event: done\ndata: {}\n\n');
        res.end();
      }
    }
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

  async updateMemory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('Authentication required', []);
    }

    const allowedFields = [
      'likedGenres', 'dislikedGenres',
      'preferredPlatforms', 'avoidedPlatforms',
      'preferredViewingContexts', 'preferredDurations',
      'favoriteFranchisesOrTitles', 'negativeSignals',
    ];

    const updates: Record<string, string[]> = {};
    for (const field of allowedFields) {
      if (Array.isArray(req.body?.[field])) {
        updates[field] = req.body[field]
          .filter((v: unknown) => typeof v === 'string')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0)
          .slice(0, 10);
      }
    }

    // Handle community preference (scalar string, not array)
    const community = typeof req.body?.preferredAutonomousCommunity === 'string'
      ? req.body.preferredAutonomousCommunity.trim()
      : undefined;

    if (Object.keys(updates).length === 0 && !community) {
      throw new ValidationError('At least one field must be provided', []);
    }

    if (community) {
      await this.assistantMemoryService.saveCommunityPreference({
        userId,
        preferredAutonomousCommunity: community,
        autonomicOptIn: true,
      });
    }

    const memory = Object.keys(updates).length > 0
      ? await this.assistantMemoryService.updateMemory(userId, updates)
      : await this.assistantMemoryService.getMemorySnapshot(userId);
    res.status(200).json(successResponse({ memory }));
  }

  private secondsUntilMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    return Math.max(60, Math.ceil((tomorrow.getTime() - now.getTime()) / 1000));
  }

  async listConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Authentication required', []);

    const archived = req.query?.archived === 'true' ? true
      : req.query?.archived === 'false' ? false
      : undefined;

    const data = await this.assistantMemoryService.listConversations(userId, { archived });
    res.status(200).json(successResponse(data));
  }

  async searchConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Authentication required', []);

    const query = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
    if (!query) throw new ValidationError('Query parameter "q" is required', []);

    const data = await this.assistantMemoryService.searchConversations(userId, query);
    res.status(200).json(successResponse(data));
  }

  async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Authentication required', []);

    const conversationId = req.params?.conversationId;
    if (!conversationId) throw new ValidationError('conversationId is required', []);

    const data = await this.assistantMemoryService.getConversation(userId, conversationId);
    if (!data) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    res.status(200).json(successResponse(data));
  }

  async updateConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Authentication required', []);

    const conversationId = req.params?.conversationId;
    if (!conversationId) throw new ValidationError('conversationId is required', []);

    const updates: { sessionTitle?: string; pinned?: boolean; archived?: boolean } = {};
    if (typeof req.body?.sessionTitle === 'string') updates.sessionTitle = req.body.sessionTitle;
    if (typeof req.body?.pinned === 'boolean') updates.pinned = req.body.pinned;
    if (typeof req.body?.archived === 'boolean') updates.archived = req.body.archived;

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('At least one field (sessionTitle, pinned, archived) is required', []);
    }

    const data = await this.assistantMemoryService.updateConversation(userId, conversationId, updates);
    if (!data) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    res.status(200).json(successResponse(data));
  }

  async deleteConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Authentication required', []);

    const conversationId = req.params?.conversationId;
    if (!conversationId) throw new ValidationError('conversationId is required', []);

    const deleted = await this.assistantMemoryService.deleteConversation(userId, conversationId);
    res.status(200).json(successResponse({ deleted }));
  }

  async trackMessageFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Authentication required', []);

    const conversationId = req.params?.conversationId;
    if (!conversationId) throw new ValidationError('conversationId is required', []);

    const messageIndex = Number(req.body?.messageIndex);
    if (!Number.isInteger(messageIndex) || messageIndex < 0) {
      throw new ValidationError('Valid messageIndex is required', []);
    }

    const rating = req.body?.rating;
    if (rating !== 'positive' && rating !== 'negative') {
      throw new ValidationError('rating must be "positive" or "negative"', []);
    }

    await this.assistantMemoryService.trackMessageFeedback(userId, conversationId, messageIndex, rating);
    res.status(200).json(successResponse({ saved: true }));
  }

  async createProgramReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Authentication required', []);

    const { title, type, channel, platform, startTime } = req.body || {};
    if (!title || typeof title !== 'string') {
      throw new ValidationError('title is required', []);
    }

    const created = await this.assistantMemoryService.createProgramReminder(userId, {
      title,
      type: typeof type === 'string' ? type : undefined,
      channel: typeof channel === 'string' ? channel : undefined,
      platform: typeof platform === 'string' ? platform : undefined,
      startTime: typeof startTime === 'string' ? startTime : undefined,
    });

    res.status(200).json(successResponse({ created }));
  }
}
