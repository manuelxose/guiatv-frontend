import { Request, Response } from 'express';
import { successResponse } from '@/shared/types/ApiResponse';
import { CatalogService } from '@/application/services/CatalogService';
import { AuthenticatedRequest } from '../middlewares/authGuard';

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  async getCatalog(req: Request, res: Response): Promise<void> {
    const query = req.query;
    const result = await this.catalogService.query({
      userId: (req as AuthenticatedRequest).user?.id,
      q: query.q ? String(query.q) : undefined,
      types: this.parseList(query.types),
      genres: this.parseList(query.genres),
      platforms: this.parseList(query.platforms),
      availability: this.parseList(query.availability),
      date: query.date ? String(query.date) : undefined,
      timeSlot: query.timeSlot ? String(query.timeSlot) : undefined,
      sort: query.sort ? String(query.sort) : undefined,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });

    res.status(200).json(successResponse(result));
  }

  async getDetail(req: Request, res: Response): Promise<void> {
    const { catalogId } = req.params;
    const result = await this.catalogService.getDetail(
      catalogId,
      (req as AuthenticatedRequest).user?.id
    );

    res.status(200).json(successResponse(result));
  }

  async getPlatforms(_req: Request, res: Response): Promise<void> {
    res.status(200).json(
      successResponse({
        items: this.catalogService.getPlatforms(),
      })
    );
  }

  async suggest(req: Request, res: Response): Promise<void> {
    const q = String(req.query.q || '').trim();
    const limit = req.query.limit ? Number(req.query.limit) : 8;
    const items = await this.catalogService.suggest(
      q,
      (req as AuthenticatedRequest).user?.id,
      limit
    );

    res.status(200).json(successResponse({ items }));
  }

  private parseList(input: unknown): string[] | undefined {
    if (input === undefined || input === null) {
      return undefined;
    }

    return String(input)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

