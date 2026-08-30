import { Request, Response } from 'express';
import { AffiliateResolverService } from '../../application/services/AffiliateResolverService';
import { AffiliateCatalogService } from '../../application/services/AffiliateCatalogService';
import { AffiliateAnalyticsService } from '../../application/services/AffiliateAnalyticsService';
import { AffiliateImpressionInput, AffiliateResolveRequest } from '../../application/dto/AffiliateResolveDTO';
import { IAffiliateOfferRepository } from '@/domain/repositories/IAffiliateOfferRepository';
import { successResponse } from '../../shared/types/ApiResponse';
import { ValidationError } from '../../shared/errors';

const MAX_IMPRESSIONS_PER_BATCH = 25;

/**
 * Generic Affiliate Engine surface. Deliberately has no knowledge of any
 * specific provider/network — every branch here is on context shape
 * (missing field, malformed payload), never on a provider identity.
 */
export class AffiliateController {
  constructor(
    private readonly resolverService: AffiliateResolverService,
    private readonly catalogService: AffiliateCatalogService,
    private readonly offerRepository: IAffiliateOfferRepository,
    private readonly analytics: AffiliateAnalyticsService
  ) {}

  /** POST /v2/affiliate/resolve */
  async resolve(req: Request, res: Response): Promise<void> {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!body.context || typeof body.context !== 'object') {
      throw new ValidationError('Invalid resolve request', [{ field: 'context', message: 'context is required' }]);
    }

    const request: AffiliateResolveRequest = {
      context: body.context as AffiliateResolveRequest['context'],
      intent: this.optionalString(body.intent),
      providerKeys: this.optionalStringArray(body.providerKeys),
      maxResults: this.optionalPositiveInt(body.maxResults),
      category: this.optionalString(body.category),
      pinnedOfferIds: this.optionalStringArray(body.pinnedOfferIds),
      autoResolve: typeof body.autoResolve === 'boolean' ? body.autoResolve : undefined,
    };

    const result = await this.resolverService.resolveOffers(request);
    res.status(200).json(successResponse(result));
  }

  /** GET /v2/affiliate/go/:offerId — the only place the browser learns a real outbound destination. */
  async go(req: Request, res: Response): Promise<void> {
    const offerId = String(req.params.offerId || '');
    const resolved = await this.resolverService.resolveRedirect(offerId, {
      market: this.optionalString(req.query.market),
      placement: this.optionalString(req.query.placement),
      contentType: this.optionalString(req.query.contentType),
      contentId: this.optionalString(req.query.contentId),
      providerKey: this.optionalString(req.query.providerKey),
      footballMatchId: this.optionalString(req.query.footballMatchId),
      competitionId: this.optionalString(req.query.competitionId),
      blogPostId: this.optionalString(req.query.blogPostId),
      anonId: this.optionalString(req.query.anonId),
      sessionId: this.optionalString(req.query.sessionId),
    });

    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    res.redirect(302, resolved.destinationUrl);
  }

  /** POST /v2/affiliate/impression — batched, sendBeacon-friendly impression beacon. Never fails on a malformed individual entry. */
  async impression(req: Request, res: Response): Promise<void> {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const rawImpressions = Array.isArray(body.impressions) ? body.impressions : [];
    if (rawImpressions.length === 0) {
      throw new ValidationError('Invalid impression payload', [{ field: 'impressions', message: 'impressions must be a non-empty array' }]);
    }

    const contextInput = (body.context ?? {}) as Record<string, unknown>;
    const identity = {
      anonId: this.optionalString(contextInput.anonId),
      sessionId: this.optionalString(contextInput.sessionId),
    };

    await Promise.all(
      rawImpressions.slice(0, MAX_IMPRESSIONS_PER_BATCH).map((raw) => this.trackOneImpression(raw as Record<string, unknown>, identity))
    );

    res.status(204).end();
  }

  private async trackOneImpression(
    raw: Record<string, unknown>,
    identity: { anonId?: string; sessionId?: string }
  ): Promise<void> {
    const offerId = this.optionalString(raw.offerId);
    const placementKey = this.optionalString(raw.placement);
    const market = this.optionalString(raw.market);
    if (!offerId || !placementKey || !market) return; // malformed entry — skip, never fail the whole beacon

    const [offer, placement] = await Promise.all([this.offerRepository.findById(offerId), this.catalogService.resolvePlacement(placementKey)]);
    if (!offer || !placement) return;

    const impression: AffiliateImpressionInput & { merchantId: string; programId: string } = {
      offerId: offer.id,
      merchantId: offer.merchantId,
      programId: offer.affiliateProgramId,
      placement: placement.key,
      market,
      contentType: this.optionalString(raw.contentType),
      contentId: this.optionalString(raw.contentId),
      footballMatchId: this.optionalString(raw.footballMatchId),
      competitionId: this.optionalString(raw.competitionId),
      blogPostId: this.optionalString(raw.blogPostId),
      page: this.optionalString(raw.page),
    };

    await this.analytics.trackImpression(impression, identity);
  }

  private optionalString(input: unknown): string | undefined {
    return typeof input === 'string' && input.trim() ? input.trim() : undefined;
  }

  private optionalStringArray(input: unknown): string[] | undefined {
    if (!Array.isArray(input)) return undefined;
    const values = input.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    return values.length > 0 ? values : undefined;
  }

  private optionalPositiveInt(input: unknown): number | undefined {
    const value = Number(input);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
  }
}
