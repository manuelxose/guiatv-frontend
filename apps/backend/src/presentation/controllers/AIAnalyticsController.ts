import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { AIAnalyticsService } from '@/application/services/AIAnalyticsService';
import { successResponse } from '@/shared/types/ApiResponse';
import { ValidationError } from '@/shared/errors';

export class AIAnalyticsController {
  constructor(private readonly analyticsService: AIAnalyticsService) {}

  async getOverview(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = await this.analyticsService.getOverview();
    res.status(200).json(successResponse(data));
  }

  async getTimeSeries(req: AuthenticatedRequest, res: Response): Promise<void> {
    const days = Number(req.query?.days) || 30;
    if (days < 1 || days > 365) {
      throw new ValidationError('days must be between 1 and 365', []);
    }
    const data = await this.analyticsService.getTimeSeries(days);
    res.status(200).json(successResponse(data));
  }
}
