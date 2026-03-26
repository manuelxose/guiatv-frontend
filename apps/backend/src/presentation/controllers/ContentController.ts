import { Request, Response } from 'express';
import { GetContentDetail } from '@/application/use-cases/GetContentDetail';
import { GetContentBatch } from '@/application/use-cases/GetContentBatch';
import { successResponse } from '@/shared/types/ApiResponse';
import { ValidationError } from '@/shared/errors';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { StreamingProvidersService } from '@/infrastructure/external/StreamingProvidersService';
import { parseCatalogId } from '@/application/services/CatalogIdentity';
import { CatalogService } from '@/application/services/CatalogService';

/**
 * Controller that returns media content cards and batches.
 */
export class ContentController {
  constructor(
    private readonly getContentDetail: GetContentDetail,
    private readonly getContentBatch: GetContentBatch,
    private readonly streamingProvidersService: StreamingProvidersService,
    private readonly catalogService: CatalogService
  ) {}

  /**
   * Returns detailed content information by id.
   */
  async getContent(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const parsed = parseCatalogId(id);
    if (parsed) {
      const result = await this.catalogService.getDetail(
        id,
        (req as AuthenticatedRequest).user?.id
      );

      res.status(200).json(successResponse(result));
      return;
    }

    const programId = id;
    const { expand } = req.query;

    const expandList = expand
      ? String(expand)
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const result = await this.getContentDetail.execute({
      programId,
      userId: (req as AuthenticatedRequest).user?.id,
      expand: expandList,
    });

    res.status(200).json(successResponse(result));
  }

  async getProvidersByTmdb(req: Request, res: Response): Promise<void> {
    const tmdbId = Number(req.params.tmdbId);
    const contentType = String(req.params.contentType || '').toLowerCase();

    if (!tmdbId || (contentType !== 'movie' && contentType !== 'tv')) {
      throw new ValidationError('Invalid contentType or tmdbId');
    }

    const providers =
      contentType === 'movie'
        ? await this.streamingProvidersService.getMovieProviders(tmdbId)
        : await this.streamingProvidersService.getTVProviders(tmdbId);

    res.status(200).json(
      successResponse({
        whereToWatch: providers
          ? {
              flatrate: providers.flatrate.map((provider) => ({
                id: provider.providerId,
                name: provider.providerName,
                logoUrl: provider.logoPath
                  ? this.streamingProvidersService.getLogoUrl(provider.logoPath)
                  : '',
                type: 'flatrate',
                deepLink: providers.link || undefined,
              })),
              rent: providers.rent.map((provider) => ({
                id: provider.providerId,
                name: provider.providerName,
                logoUrl: provider.logoPath
                  ? this.streamingProvidersService.getLogoUrl(provider.logoPath)
                  : '',
                type: 'rent',
                deepLink: providers.link || undefined,
              })),
              buy: providers.buy.map((provider) => ({
                id: provider.providerId,
                name: provider.providerName,
                logoUrl: provider.logoPath
                  ? this.streamingProvidersService.getLogoUrl(provider.logoPath)
                  : '',
                type: 'buy',
                deepLink: providers.link || undefined,
              })),
              free: providers.free.map((provider) => ({
                id: provider.providerId,
                name: provider.providerName,
                logoUrl: provider.logoPath
                  ? this.streamingProvidersService.getLogoUrl(provider.logoPath)
                  : '',
                type: 'free',
                deepLink: providers.link || undefined,
              })),
              tmdbLink: providers.link,
            }
          : {
              flatrate: [],
              rent: [],
              buy: [],
              free: [],
              tmdbLink: '',
            },
      })
    );
  }

  /**
   * Retrieves a batch of content items specified by comma-separated IDs.
   */
  async getBatch(req: Request, res: Response): Promise<void> {
    const idsParam = req.query.ids as string | undefined;
    if (!idsParam) {
      throw new ValidationError('ids parameter is required (comma separated)');
    }

    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const catalogIds = ids.filter((id) => Boolean(parseCatalogId(id)));
    if (catalogIds.length === ids.length) {
      const items = await Promise.all(
        ids.map((id) =>
          this.catalogService.getDetail(id, (req as AuthenticatedRequest).user?.id)
        )
      );
      res.status(200).json(successResponse({ items }));
      return;
    }

    const result = await this.getContentBatch.execute({ ids });

    res.status(200).json(successResponse(result));
  }
}
