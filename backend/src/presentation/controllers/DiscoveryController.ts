import { Request, Response } from 'express';
import { GetDiscoveryHome } from '@/application/use-cases/GetDiscoveryHome';
import { SearchDiscoveryContent } from '@/application/use-cases/SearchDiscoveryContent';
import { successResponse } from '@/shared/types/ApiResponse';
import { ValidationError } from '@/shared/errors';

export class DiscoveryController {
  constructor(
    private readonly getDiscoveryHome: GetDiscoveryHome,
    private readonly searchDiscoveryContent: SearchDiscoveryContent
  ) {}

  async home(req: Request, res: Response): Promise<void> {
    const { date, country, channelTypes, timeSlot, fields } = req.query;

    const channelTypesArray = channelTypes
      ? String(channelTypes)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const { view, cached } = await this.getDiscoveryHome.execute({
      date: date as string,
      country: country as string,
      channelTypes: channelTypesArray,
      timeSlot: timeSlot as string,
      fields: fields as any,
    });

    res
      .status(200)
      .json(
        successResponse(view, {
          cached,
        })
      );
  }

  async search(req: Request, res: Response): Promise<void> {
    const { q, date, genre, platform, type, limit, country, channelTypes, page } =
      req.query;

    if (!q || String(q).trim() === '') {
      throw new ValidationError('Search query (q) is required');
    }

    const channelTypesArray = channelTypes
      ? String(channelTypes)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

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
      country: country as string,
      channelTypes: channelTypesArray,
    });

    res.status(200).json(
      successResponse(
        {
          items: result.items,
        },
        {
          total: result.meta.total,
          date: result.meta.date,
          page: result.meta.page,
          limit: result.meta.limit,
        }
      )
    );
  }
}
