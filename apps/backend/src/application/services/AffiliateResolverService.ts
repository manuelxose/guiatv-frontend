import { randomUUID } from 'crypto';
import { IAffiliateOfferRepository } from '@/domain/repositories/IAffiliateOfferRepository';
import { IAffiliateMerchantRepository } from '@/domain/repositories/IAffiliateMerchantRepository';
import { IAffiliateProgramRepository } from '@/domain/repositories/IAffiliateProgramRepository';
import { IAffiliatePlacementRepository } from '@/domain/repositories/IAffiliatePlacementRepository';
import { IAffiliateNetworkRepository } from '@/domain/repositories/IAffiliateNetworkRepository';
import { isOfferValidNow } from '@/domain/services/affiliateOfferValidity';
import { AffiliateContext, assertAffiliateContext, buildAffiliateContext } from '../dto/AffiliateContext';
import { AffiliateResolveRequest, AffiliateResolveResponseDTO, AffiliateResolvedOfferDTO } from '../dto/AffiliateResolveDTO';
import { CommercialRelationship } from '../dto/MonetizationDTO';
import { AffiliateCandidate, AffiliateCatalogService, DEFAULT_MAX_RESULTS, HARD_MAX_RESULTS } from './AffiliateCatalogService';
import { AffiliateAnalyticsService } from './AffiliateAnalyticsService';
import { validateAffiliateDestination } from './AffiliateDestinationValidator';
import { DeepLinkStrategyRegistry } from '../../infrastructure/affiliate/deeplink/DeepLinkStrategyRegistry';
import { DeepLinkStrategyUnavailableError } from '../../infrastructure/affiliate/deeplink/types';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';

export interface AffiliateRedirectResult {
  destinationUrl: string;
  clickId: string;
  relationship: CommercialRelationship;
}

interface AffiliateResolverServiceOptions {
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
}

/**
 * Owns the full generic resolution pipeline:
 *
 *   AffiliateContext → candidate selection → merchant/provider normalization
 *   → active program → eligible offer → placement rules → deep-link strategy
 *   → safe redirect → analytics
 *
 * `resolveOffers` (candidate/listing path, backs `POST /v2/affiliate/resolve`)
 * goes through `AffiliateCatalogService`'s cache. `resolveRedirect` (the
 * safety-critical `GET /v2/affiliate/go/:offerId` path) always reads
 * merchant/program/placement live — per docs/affiliate-engine-architecture.md
 * §18, resolution-time state is never cached, only what's shown in a list is.
 * This service never imports a concrete deep-link adapter or names a
 * network/provider — it only calls through `DeepLinkStrategyRegistry`.
 */
export class AffiliateResolverService {
  private readonly env: NodeJS.ProcessEnv;
  private readonly now: () => Date;

  constructor(
    private readonly catalogService: AffiliateCatalogService,
    private readonly offerRepository: IAffiliateOfferRepository,
    private readonly merchantRepository: IAffiliateMerchantRepository,
    private readonly programRepository: IAffiliateProgramRepository,
    private readonly placementRepository: IAffiliatePlacementRepository,
    private readonly networkRepository: IAffiliateNetworkRepository,
    private readonly deepLinkRegistry: DeepLinkStrategyRegistry,
    private readonly analytics: AffiliateAnalyticsService,
    options: AffiliateResolverServiceOptions = {}
  ) {
    this.env = options.env ?? process.env;
    this.now = options.now ?? (() => new Date());
  }

  /** `POST /v2/affiliate/resolve` — candidate offers for a context, never a raw affiliate URL. */
  async resolveOffers(request: AffiliateResolveRequest): Promise<AffiliateResolveResponseDTO> {
    assertAffiliateContext(request.context);
    const context = buildAffiliateContext(request.context);

    const providerHints = [context.providerKey, ...(request.providerKeys || [])].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    );
    const merchantIds = providerHints.length > 0 ? await this.catalogService.resolveMerchantIds(providerHints) : undefined;

    const pinnedOfferIds = (request.pinnedOfferIds || []).filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    );
    const pinned =
      pinnedOfferIds.length > 0 ? await this.catalogService.getCandidatesByOfferIds(pinnedOfferIds, context) : [];

    const ranked =
      request.autoResolve === false
        ? []
        : await this.catalogService.findEligibleCandidates(context, {
            category: request.category,
            intent: request.intent,
            merchantIds,
            maxResults: request.maxResults,
          });

    // Pins go first, in the editor's chosen order; ranked results fill the rest, never duplicating a pin.
    const pinnedIds = new Set(pinned.map((candidate) => candidate.offer.id));
    const cap = Math.min(Math.max(1, request.maxResults || DEFAULT_MAX_RESULTS), HARD_MAX_RESULTS);
    const candidates: AffiliateCandidate[] = [...pinned, ...ranked.filter((candidate) => !pinnedIds.has(candidate.offer.id))].slice(
      0,
      cap
    );

    const placement = await this.catalogService.resolvePlacement(context.placement);
    const placementKey = placement?.key ?? context.placement;

    const items: AffiliateResolvedOfferDTO[] = candidates.map(({ offer, merchant, program }) => {
      const secretConfigured = Boolean(program.attribution?.secretRef && this.env[program.attribution.secretRef]);
      const relationship: CommercialRelationship = secretConfigured ? 'affiliate_configured' : program.relationship;
      const sponsored = relationship === 'affiliate_configured';
      const hasPrice = offer.pricing.monthlyAmount !== null || offer.pricing.annualAmount !== null;

      const outboundParams = new URLSearchParams({ placement: placementKey, market: context.market });
      if (context.contentType) outboundParams.set('contentType', context.contentType);
      if (context.contentId) outboundParams.set('contentId', context.contentId);
      if (context.footballMatchId) outboundParams.set('footballMatchId', context.footballMatchId);
      if (context.competitionId) outboundParams.set('competitionId', context.competitionId);
      if (context.blogPostId) outboundParams.set('blogPostId', context.blogPostId);

      return {
        offerId: offer.id,
        merchant: { id: merchant.id, slug: merchant.slug, name: merchant.name, logo: merchant.logo },
        category: offer.category,
        plan: offer.plan,
        pricing: hasPrice ? offer.pricing : undefined,
        display: {
          bestFor: offer.display.bestFor,
          highlight: offer.display.highlight,
          disclosure: sponsored ? program.disclosure : offer.display.disclosure,
        },
        cta: { label: sponsored ? 'Ver oferta' : 'Ir al proveedor', sponsored },
        outbound: { path: `/v2/affiliate/go/${offer.id}?${outboundParams.toString()}` },
        relevance: {
          matchedIntent: Boolean(request.intent && offer.recommendationIntents.includes(request.intent)),
          matchedPlacement: Boolean(offer.placements && offer.placements.includes(placementKey)),
          pinned: pinnedIds.has(offer.id),
        },
      };
    });

    return {
      items,
      meta: { market: context.market, placement: placementKey, total: items.length, generatedAt: this.now().toISOString() },
    };
  }

  /**
   * `GET /v2/affiliate/go/:offerId` — validates offer/market/placement/destination,
   * resolves tracking configuration, generates a clickId, emits analytics, and
   * returns the single safe destination URL to redirect to. Never trusts a
   * client-supplied destination; the browser only ever names an offer id.
   */
  async resolveRedirect(offerId: string, contextInput: Partial<AffiliateContext>): Promise<AffiliateRedirectResult> {
    assertAffiliateContext(contextInput);
    const context = buildAffiliateContext(contextInput);

    const offer = await this.offerRepository.findById(offerId);
    if (!offer || offer.status !== 'active' || !isOfferValidNow(offer.validity, this.now())) {
      await this.trackError(context, { offerId, reason: 'offer_not_found_or_expired' });
      throw new NotFoundError('AffiliateOffer', offerId);
    }

    if (offer.market !== context.market) {
      await this.trackError(context, { offerId, reason: 'market_mismatch' });
      throw new ValidationError('Offer is not available in this market', [
        { field: 'market', message: 'market mismatch', value: context.market },
      ]);
    }

    const placement = await this.placementRepository.findByKey(context.placement);
    if (!placement || !placement.enabled) {
      await this.trackError(context, { offerId, reason: 'unsupported_placement' });
      throw new ValidationError('Unsupported affiliate placement', [
        { field: 'placement', message: 'placement is not allowed', value: context.placement },
      ]);
    }
    if (offer.placements && offer.placements.length > 0 && !offer.placements.includes(placement.key)) {
      await this.trackError(context, { offerId, placement: placement.key, reason: 'offer_not_eligible_for_placement' });
      throw new ValidationError('Offer is not eligible for this placement', [
        { field: 'placement', message: 'offer not eligible for placement', value: placement.key },
      ]);
    }

    const merchant = await this.merchantRepository.findById(offer.merchantId);
    const program = await this.programRepository.findById(offer.affiliateProgramId);
    if (!merchant || merchant.status !== 'active' || !program || program.status !== 'active' || program.market !== offer.market) {
      await this.trackError(context, { offerId, placement: placement.key, merchantId: offer.merchantId, reason: 'inactive_program' });
      throw new NotFoundError('AffiliateProgram', offer.affiliateProgramId);
    }

    const network = await this.networkRepository.findById(program.networkId);
    if (!network) {
      await this.trackError(context, {
        offerId,
        placement: placement.key,
        merchantId: merchant.id,
        reason: 'network_not_found',
      });
      throw new NotFoundError('AffiliateNetwork', program.networkId);
    }

    const clickId = randomUUID();
    const secret = program.attribution?.secretRef ? this.env[program.attribution.secretRef] : undefined;

    let built: { url: string; relationship: CommercialRelationship };
    try {
      const adapter = this.deepLinkRegistry.get(offer.destination.strategy);
      if (!adapter) throw new DeepLinkStrategyUnavailableError('unknown_strategy', `No adapter registered for '${offer.destination.strategy}'`);
      built = adapter.build({ offer, program, network, merchant, secret, clickId, context });
    } catch (error) {
      // Tracking/affiliate configuration failure must never break navigation — degrade to the
      // offer's own static destination instead of throwing a fatal error.
      const reason = error instanceof DeepLinkStrategyUnavailableError ? error.reason : 'strategy_build_failed';
      logger.warn('Affiliate deep-link strategy failed; degrading to direct destination', { offerId, reason });
      built = { url: offer.destination.url, relationship: program.relationship };
    }

    let safety = validateAffiliateDestination(built.url, program.allowedHosts);
    if (!safety.safe && built.url !== offer.destination.url) {
      const fallback = validateAffiliateDestination(offer.destination.url, program.allowedHosts);
      if (fallback.safe) {
        built = { url: offer.destination.url, relationship: program.relationship };
        safety = fallback;
      }
    }
    if (!safety.safe) {
      await this.trackError(context, {
        offerId,
        placement: placement.key,
        merchantId: merchant.id,
        programId: program.id,
        reason: `unsafe_destination:${safety.reason}`,
      });
      throw new ValidationError('Offer destination is not safe');
    }

    const eventBase = {
      merchantId: merchant.id,
      programId: program.id,
      offerId: offer.id,
      placement: placement.key,
      market: context.market,
      contentType: context.contentType,
      contentId: context.contentId,
      providerKey: context.providerKey,
      footballMatchId: context.footballMatchId,
      competitionId: context.competitionId,
      blogPostId: context.blogPostId,
      clickId,
      relationship: built.relationship,
    };
    await Promise.all([
      this.analytics.trackClick(eventBase, context),
      this.analytics.trackRedirect({ ...eventBase, destinationHost: safety.hostname!, strategy: offer.destination.strategy }, context),
    ]);

    return { destinationUrl: built.url, clickId, relationship: built.relationship };
  }

  private async trackError(
    context: AffiliateContext,
    payload: { offerId?: string; placement?: string; merchantId?: string; programId?: string; reason: string }
  ): Promise<void> {
    await this.analytics.trackError(
      {
        offerId: payload.offerId,
        merchantId: payload.merchantId,
        placement: payload.placement ?? context.placement,
        market: context.market,
        contentType: context.contentType,
        contentId: context.contentId,
        providerKey: context.providerKey,
        footballMatchId: context.footballMatchId,
        competitionId: context.competitionId,
        blogPostId: context.blogPostId,
        reason: payload.reason,
      },
      context
    );
  }
}
