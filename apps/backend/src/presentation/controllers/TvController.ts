import { Request, Response } from 'express';
import { successResponse } from '@/shared/types/ApiResponse';
import {
  normalizeTvReadView,
  TvReadQueryService,
} from '@/application/services/TvReadQueryService';
import { TvSurfaceService } from '@/application/services/TvSurfaceService';

export class TvController {
  constructor(
    private readonly tvReadQueryService: TvReadQueryService,
    private readonly tvSurfaceService: TvSurfaceService
  ) {}

  async read(req: Request, res: Response): Promise<void> {
    const result = await this.tvReadQueryService.query({
      view: normalizeTvReadView(req.query.view),
      date: req.query.date ? String(req.query.date) : undefined,
      group: req.query.group ? String(req.query.group) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      sport: req.query.sport ? String(req.query.sport) : undefined,
      channelId: req.query.channelId ? String(req.query.channelId) : undefined,
      q: req.query.q ? String(req.query.q) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor ? String(req.query.cursor) : undefined,
    });

    res.status(200).json(successResponse(result, result.meta));
  }

  async readChannels(req: Request, res: Response): Promise<void> {
    const date = req.query.date ? String(req.query.date) : 'today';
    const group = req.query.group ? String(req.query.group) : undefined;
    const result = await this.tvReadQueryService.getChannels(date, group);
    res.status(200).json(successResponse(result, result.meta));
  }

  async readChannelDetail(req: Request, res: Response): Promise<void> {
    const result = await this.tvReadQueryService.getChannelDetail(
      String(req.params.channelId),
      req.query.date ? String(req.query.date) : 'today',
      normalizeTvReadView(req.query.view)
    );
    res.status(200).json(successResponse(result, result.meta));
  }

  async readItem(req: Request, res: Response): Promise<void> {
    const result = await this.tvReadQueryService.getItem(String(req.params.airingId));
    res.status(200).json(successResponse(result, result.meta));
  }

  async guideSurface(req: Request, res: Response): Promise<void> {
    const result = await this.tvSurfaceService.getGuideSurface({
      date: req.query.date ? String(req.query.date) : undefined,
      group: req.query.group ? String(req.query.group) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      sport: req.query.sport ? String(req.query.sport) : undefined,
    });

    res.status(200).json(successResponse(result, result.meta));
  }

  async channelSurface(req: Request, res: Response): Promise<void> {
    const result = await this.tvSurfaceService.getChannelSurface(
      String(req.params.channelId),
      req.query.date ? String(req.query.date) : undefined
    );

    res.status(200).json(successResponse(result, result.meta));
  }
}
