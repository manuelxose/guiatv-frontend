import { Response } from 'express';
import { successResponse } from '@/shared/types/ApiResponse';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { IUserContentInteractionRepository } from '@/domain/repositories/IUserContentInteractionRepository';
import { NotFoundError, ValidationError } from '@/shared/errors';

export class InteractionController {
  constructor(
    private readonly interactionRepository: IUserContentInteractionRepository
  ) {}

  async upsert(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.requireUserId(req);
    const body = req.body || {};

    if (!body.contentId || !body.contentTitle || !body.contentType) {
      throw new ValidationError(
        'contentId, contentTitle and contentType are required',
        []
      );
    }

    const existing = await this.interactionRepository.findByUserAndContent(
      userId,
      String(body.contentId)
    );

    const interaction = await this.interactionRepository.upsert({
      userId,
      contentId: String(body.contentId),
      contentTitle: String(body.contentTitle),
      contentType: body.contentType,
      tmdbId:
        body.tmdbId !== undefined && body.tmdbId !== null
          ? Number(body.tmdbId)
          : existing?.tmdbId,
      genres: this.normalizeStringArray(body.genres, existing?.genres || []),
      rating:
        body.rating !== undefined && body.rating !== null
          ? Number(body.rating)
          : existing?.rating,
      status: body.status || existing?.status || 'pending',
      liked:
        body.liked !== undefined ? Boolean(body.liked) : existing?.liked,
      addedToList:
        body.addedToList !== undefined
          ? Boolean(body.addedToList)
          : existing?.addedToList,
      recommended:
        body.recommended !== undefined
          ? Boolean(body.recommended)
          : existing?.recommended,
      platform:
        body.platform !== undefined ? String(body.platform || '') : existing?.platform,
      watchedAt: body.watchedAt ? new Date(body.watchedAt) : existing?.watchedAt,
      createdAt: existing?.createdAt,
      updatedAt: new Date(),
    });

    res.status(200).json(successResponse({ interaction }));
  }

  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.requireUserId(req);
    const interactions = await this.interactionRepository.findByUser(userId, {
      status: req.query.status ? String(req.query.status) : undefined,
      contentType: req.query.contentType ? String(req.query.contentType) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      skip: req.query.skip ? Number(req.query.skip) : undefined,
    });

    res.status(200).json(successResponse({ interactions }));
  }

  async getOne(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.requireUserId(req);
    const interaction = await this.interactionRepository.findByUserAndContent(
      userId,
      String(req.params.contentId)
    );

    res.status(200).json(successResponse({ interaction }));
  }

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.requireUserId(req);
    const deleted = await this.interactionRepository.delete(
      userId,
      String(req.params.contentId)
    );

    if (!deleted) {
      throw new NotFoundError('Interaction', String(req.params.contentId));
    }

    res.status(200).json(successResponse({ deleted: true }));
  }

  private requireUserId(req: AuthenticatedRequest): string {
    if (!req.user?.id) {
      throw new NotFoundError('User', 'current');
    }
    return req.user.id;
  }

  private normalizeStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
      return fallback;
    }

    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 20);
  }
}
