import { Request, Response } from 'express';
import { GetDiscoveryHome } from '@/application/use-cases/GetDiscoveryHome';
import { SearchDiscoveryContent } from '@/application/use-cases/SearchDiscoveryContent';
import { successResponse } from '@/shared/types/ApiResponse';
import { ValidationError } from '@/shared/errors';
import { GetPersonalizedRecommendations } from '@/application/use-cases/GetPersonalizedRecommendations';
import { GetDiscoveryBrowse } from '@/application/use-cases/GetDiscoveryBrowse';
import { AuthenticatedRequest } from '../middlewares/authGuard';

/**
 * Controller for discovery experiences such as home feed and search.
 */
export class DiscoveryController {
  constructor(
    private readonly getDiscoveryHome: GetDiscoveryHome,
    private readonly searchDiscoveryContent: SearchDiscoveryContent,
    private readonly getPersonalizedRecommendations: GetPersonalizedRecommendations,
    private readonly getDiscoveryBrowse: GetDiscoveryBrowse
  ) {}

  /**
   * Builds the discovery home view with curated sections.
   */
  async home(req: Request, res: Response): Promise<void> {
    const { view, cached } = await this.getDiscoveryHome.execute({
      date: req.query.date as string,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    res
      .status(200)
      .json(
        successResponse(view, {
          cached,
        })
      );
  }

  /**
   * Performs full-text search across discovery content.
   */
  async search(req: Request, res: Response): Promise<void> {
    const { q, date, genre, platform, type, limit, page } = req.query;

    if (!q || String(q).trim() === '') {
      throw new ValidationError('Search query (q) is required');
    }

    const limitNumber = limit ? parseInt(limit as string, 10) : undefined;
    const pageNumber = page ? parseInt(page as string, 10) : undefined;

    const result = await this.searchDiscoveryContent.execute({
      q: q as string,
      date: date as string,
      genre: genre as string,
      platform: platform as string,
      type: type as string,
      limit: limitNumber,
      page: pageNumber,
    });

    res.status(200).json(successResponse(result, result.meta));
  }

  async browse(req: Request, res: Response): Promise<void> {
    const { q, genre, platform, availability, sort, limit, page, type } =
      req.query;
    const contentType = String(type || '').toLowerCase();

    if (contentType !== 'movie' && contentType !== 'series') {
      throw new ValidationError('type must be movie or series');
    }

    const limitNumber = limit ? parseInt(limit as string, 10) : undefined;
    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const genres = genre
      ? String(genre)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;
    const platforms = platform
      ? String(platform)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;
    const availabilityFilters = availability
      ? String(availability)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;

    const { view, cached } = await this.getDiscoveryBrowse.execute({
      userId: (req as AuthenticatedRequest).user?.id,
      contentType,
      q: q as string,
      genres,
      platforms,
      availability: availabilityFilters,
      sort: sort as string,
      limit: limitNumber,
      page: pageNumber,
    });

    res.status(200).json(successResponse(view, { cached, ...view.meta }));
  }

  async forYou(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new ValidationError('Authentication required');
    }

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const excludeIds = req.query.excludeIds
      ? String(req.query.excludeIds)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;

    const items = await this.getPersonalizedRecommendations.execute({
      userId: req.user.id,
      limit,
      context: (req.query.context as any) || 'home',
      excludeIds,
    });

    res.status(200).json(successResponse({ items }));
  }
}
