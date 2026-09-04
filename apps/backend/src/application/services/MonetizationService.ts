import { randomUUID } from 'crypto';
import { MONETIZATION_INTENTS, MONETIZATION_OFFERS, MonetizationOfferConfig } from '../data/monetizationOffers';
import { MonetizationOfferDTO, MonetizationOffersResponseDTO, OfferIntent } from '../dto/MonetizationDTO';
import { AnalyticsService } from './AnalyticsService';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';
import { AffiliateOffer } from '@/domain/entities/AffiliateOffer';
import { AffiliateMerchant } from '@/domain/entities/AffiliateMerchant';
import { AffiliateProgram } from '@/domain/entities/AffiliateProgram';
import { IAffiliateOfferRepository } from '@/domain/repositories/IAffiliateOfferRepository';
import { IAffiliateMerchantRepository } from '@/domain/repositories/IAffiliateMerchantRepository';
import { IAffiliateProgramRepository } from '@/domain/repositories/IAffiliateProgramRepository';

const PLACEMENTS = new Set(['comparison-card', 'comparison-table', 'comparison-selection', 'content-detail', 'provider-summary']);

export interface MonetizationQuery {
  market?: string;
  intent?: OfferIntent;
  maxMonthlyPrice?: number;
  features?: Array<'downloads' | 'live' | 'sports' | 'football' | 'family' | '4k'>;
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'provider';
}

interface MonetizationServiceOptions {
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
  /** Static fallback list — only source when no Mongo repositories are wired, or when the
   * Affiliate Engine store is unreachable/empty (see loadOfferConfigs). */
  offers?: MonetizationOfferConfig[];
  offerRepository?: IAffiliateOfferRepository;
  merchantRepository?: IAffiliateMerchantRepository;
  programRepository?: IAffiliateProgramRepository;
}

/**
 * Phase 10 final migration: this is now a facade over the Mongo-backed
 * Affiliate Engine (see docs/affiliate-engine-architecture.md §19 M1). When
 * `offerRepository`/`merchantRepository`/`programRepository` are wired
 * (container.ts passes the same repositories `AffiliateResolverService`
 * uses), `listOffers`/`resolveOutbound` read live `AffiliateOffer` documents
 * reshaped into the exact same `MonetizationOfferConfig` shape — the static
 * `MONETIZATION_OFFERS` array is no longer the runtime source, only the
 * seed/migration/test fixture and the last-resort fallback used if the
 * Mongo store is unreachable or (not yet seeded) empty, so a redirect can
 * never 500 out.
 */
export class MonetizationService {
  private readonly env: NodeJS.ProcessEnv;
  private readonly now: () => Date;
  private readonly staticOffers: MonetizationOfferConfig[];
  private readonly offerRepository?: IAffiliateOfferRepository;
  private readonly merchantRepository?: IAffiliateMerchantRepository;
  private readonly programRepository?: IAffiliateProgramRepository;

  constructor(
    private readonly analyticsService?: AnalyticsService,
    options: MonetizationServiceOptions = {}
  ) {
    this.env = options.env ?? process.env;
    this.now = options.now ?? (() => new Date());
    this.staticOffers = options.offers ?? MONETIZATION_OFFERS;
    this.offerRepository = options.offerRepository;
    this.merchantRepository = options.merchantRepository;
    this.programRepository = options.programRepository;
  }

  async listOffers(query: MonetizationQuery = {}): Promise<MonetizationOffersResponseDTO> {
    if (query.market && query.market !== 'ES') {
      throw new ValidationError('Unsupported offer market', [{ field: 'market', message: 'Only ES is supported', value: query.market }]);
    }

    const offers = await this.loadOfferConfigs();
    let items = offers.map((config) => this.toPublicOffer(config));
    if (query.intent === 'no-contract') {
      items = items.filter((item) => item.requirements.commitmentMonths === 0);
    } else if (query.intent) {
      items = items.filter((item) => item.recommendation.intents.includes(query.intent as OfferIntent));
    }
    if (Number.isFinite(query.maxMonthlyPrice)) {
      items = items.filter((item) => item.pricing.monthlyAmount !== null && item.pricing.monthlyAmount <= Number(query.maxMonthlyPrice));
    }
    for (const feature of query.features ?? []) {
      items = items.filter((item) => this.hasFeature(item, feature));
    }

    items.sort(this.comparator(query.sort ?? (query.intent ? 'recommended' : 'provider'), query.intent));

    return {
      items,
      meta: {
        market: 'ES',
        total: items.length,
        generatedAt: this.now().toISOString(),
        disclosure: 'Las recomendaciones se ordenan por utilidad y prestaciones, nunca por comisión. Los precios pueden cambiar; revisa las condiciones del proveedor.',
      },
      filters: {
        intents: MONETIZATION_INTENTS,
        features: ['downloads', 'live', 'sports', 'football', 'family', '4k'],
      },
    };
  }

  async resolveOutbound(providerId: string, offerId: string, placement: string) {
    if (!PLACEMENTS.has(placement)) {
      throw new ValidationError('Invalid affiliate placement', [{ field: 'placement', message: 'Placement is not allowed', value: placement }]);
    }
    const offers = await this.loadOfferConfigs();
    const config = offers.find((item) => item.provider.id === providerId && item.id === offerId);
    if (!config) throw new NotFoundError('Offer', `${providerId}/${offerId}`);

    const affiliateUrl = this.env[config.affiliateEnvKey];
    const safeAffiliateUrl = affiliateUrl && this.isAllowedDestination(affiliateUrl, config.allowedHosts)
      ? affiliateUrl
      : undefined;
    const destinationUrl = safeAffiliateUrl ?? config.destinationUrl;
    if (!this.isAllowedDestination(destinationUrl, config.allowedHosts)) {
      throw new ValidationError('Offer destination is not safe');
    }
    const relationship = safeAffiliateUrl ? 'affiliate_configured' as const : config.defaultRelationship;

    return {
      destinationUrl,
      relationship,
      rel: relationship === 'affiliate_configured' ? 'sponsored noopener noreferrer' : 'noopener noreferrer',
      disclosure: relationship === 'affiliate_configured'
        ? 'Enlace afiliado: GuíaTV puede recibir una comisión sin coste adicional para ti.'
        : config.disclosure,
    };
  }

  async trackAndResolveOutbound(providerId: string, offerId: string, placement: string) {
    const resolved = await this.resolveOutbound(providerId, offerId, placement);
    if (this.analyticsService) {
      const clickId = randomUUID();
      try {
        await this.analyticsService.trackEvent({
          eventId: clickId,
          sessionId: `monetization:${clickId}`,
          anonId: `monetization:${clickId}`,
          type: 'affiliate_click',
          name: 'affiliate_click',
          path: `/v2/monetization/go/${providerId}/${offerId}`,
          occurredAt: this.now(),
          data: {
            providerId,
            offerId,
            placement,
            relationship: resolved.relationship,
            destinationHost: new URL(resolved.destinationUrl).hostname,
          },
        });
      } catch (error) {
        logger.warn('Affiliate click tracking failed; continuing with outbound redirect', {
          providerId,
          offerId,
          placement,
          reason: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    }
    return resolved;
  }

  /**
   * Resolves the current offer list: Mongo-backed Affiliate Engine when
   * repositories are wired, static array otherwise (unit tests / no DI) —
   * and as a safe degrade if the store errors or (not yet seeded) is empty,
   * so a comparison-page load or a redirect can never hard-fail on this.
   */
  private async loadOfferConfigs(): Promise<MonetizationOfferConfig[]> {
    if (!this.offerRepository || !this.merchantRepository || !this.programRepository) {
      return this.staticOffers;
    }
    try {
      const offers = await this.offerRepository.findValidOffers('ES');
      const configs = await this.toOfferConfigs(offers);
      if (configs.length === 0) {
        logger.warn('Affiliate Engine store returned zero active streaming offers; falling back to static monetizationOffers.ts');
        return this.staticOffers;
      }
      return configs;
    } catch (error) {
      logger.error('Affiliate Engine store read failed; falling back to static monetizationOffers.ts', error as Error);
      return this.staticOffers;
    }
  }

  /** Reshapes `streaming`-category `AffiliateOffer` documents into the legacy `MonetizationOfferConfig`
   * shape the rest of this service (and the untouched `streaming-comparison` frontend/DTO) already expect. */
  private async toOfferConfigs(offers: AffiliateOffer[]): Promise<MonetizationOfferConfig[]> {
    const merchantCache = new Map<string, AffiliateMerchant | null>();
    const programCache = new Map<string, AffiliateProgram | null>();
    const configs: MonetizationOfferConfig[] = [];

    for (const offer of offers) {
      if (offer.category !== 'streaming') continue;

      if (!merchantCache.has(offer.merchantId)) {
        merchantCache.set(offer.merchantId, await this.merchantRepository!.findById(offer.merchantId));
      }
      const merchant = merchantCache.get(offer.merchantId) ?? null;
      if (!merchant || merchant.status !== 'active') continue;

      if (!programCache.has(offer.affiliateProgramId)) {
        programCache.set(offer.affiliateProgramId, await this.programRepository!.findById(offer.affiliateProgramId));
      }
      const program = programCache.get(offer.affiliateProgramId) ?? null;
      if (!program || program.status !== 'active') continue;

      configs.push({
        id: `${merchant.slug}-${offer.plan.id}`,
        market: 'ES',
        provider: { id: merchant.slug, name: merchant.name },
        plan: offer.plan,
        pricing: { ...offer.pricing, currency: 'EUR' },
        features: offer.features as MonetizationOfferDTO['features'],
        requirements: offer.requirements,
        trialDays: offer.trial.days,
        bestFor: offer.display.bestFor ?? '',
        highlight: offer.display.highlight ?? '',
        disclosure: offer.display.disclosure,
        recommendation: { intents: offer.recommendationIntents as OfferIntent[] },
        destinationUrl: offer.destination.url,
        allowedHosts: program.allowedHosts,
        affiliateEnvKey: program.attribution?.secretRef ?? '',
        defaultRelationship: program.relationship,
        verifiedAt: (offer.verification.verifiedAt ?? offer.updatedAt).toISOString().slice(0, 10),
        sourceUrl: offer.verification.source ?? '',
        verificationStatus: offer.verification.status,
      });
    }

    return configs;
  }

  private toPublicOffer(config: MonetizationOfferConfig): MonetizationOfferDTO {
    const relationship = this.getRelationship(config);
    return {
      id: config.id,
      market: config.market,
      provider: config.provider,
      plan: config.plan,
      pricing: config.pricing,
      features: config.features,
      requirements: config.requirements,
      trialDays: config.trialDays,
      bestFor: config.bestFor,
      highlight: config.highlight,
      disclosure: relationship === 'affiliate_configured'
        ? 'Enlace afiliado: GuíaTV puede recibir una comisión sin coste adicional para ti.'
        : config.disclosure,
      verification: {
        lastVerifiedAt: config.verifiedAt,
        sourceUrl: config.sourceUrl,
        status: config.verificationStatus ?? this.getFreshness(config.verifiedAt),
      },
      outbound: {
        path: `/v2/monetization/go/${config.provider.id}/${config.id}`,
        relationship,
        label:
          relationship === 'affiliate_configured'
            ? `Ver oferta en ${config.provider.name}`
            : `Consultar ${config.provider.name}`,
        isSponsored: relationship === 'affiliate_configured',
      },
      recommendation: config.recommendation,
    };
  }

  private getRelationship(config: MonetizationOfferConfig) {
    const affiliateUrl = this.env[config.affiliateEnvKey];
    return affiliateUrl && this.isAllowedDestination(affiliateUrl, config.allowedHosts)
      ? 'affiliate_configured' as const
      : config.defaultRelationship;
  }

  private getFreshness(verifiedAt: string): 'current' | 'stale' {
    const age = this.now().getTime() - new Date(`${verifiedAt}T00:00:00.000Z`).getTime();
    return age <= 120 * 24 * 60 * 60 * 1000 ? 'current' : 'stale';
  }

  private isAllowedDestination(rawUrl: string, allowedHosts: string[]): boolean {
    try {
      const url = new URL(rawUrl);
      return url.protocol === 'https:' && allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }

  private hasFeature(item: MonetizationOfferDTO, feature: NonNullable<MonetizationQuery['features']>[number]): boolean {
    const mapping = {
      downloads: item.features.downloads === true,
      live: item.features.liveContent === true,
      sports: item.features.sports,
      football: item.features.football,
      family: item.features.family,
      '4k': item.features.fourK,
    };
    return mapping[feature];
  }

  private comparator(sort: NonNullable<MonetizationQuery['sort']>, intent?: OfferIntent) {
    return (left: MonetizationOfferDTO, right: MonetizationOfferDTO): number => {
      if (sort === 'price-asc' || (sort === 'recommended' && intent === 'cheapest')) {
        return this.priceForSort(left) - this.priceForSort(right) || left.provider.name.localeCompare(right.provider.name);
      }
      if (sort === 'price-desc') return this.priceForSort(right) - this.priceForSort(left);
      if (sort === 'recommended' && intent) {
        return this.intentScore(right, intent) - this.intentScore(left, intent) || left.provider.name.localeCompare(right.provider.name);
      }
      return left.provider.name.localeCompare(right.provider.name);
    };
  }

  private priceForSort(item: MonetizationOfferDTO): number {
    return item.pricing.monthlyAmount ?? Number.POSITIVE_INFINITY;
  }

  private intentScore(item: MonetizationOfferDTO, intent: OfferIntent): number {
    const scores: Record<OfferIntent, number> = {
      cheapest: -(item.pricing.monthlyAmount ?? 999),
      football: Number(item.features.football) * 5 + Number(item.features.liveContent),
      movies: Number(item.features.movies) * 3 + Number(item.features.fourK) + Number(item.features.downloads === true),
      family: Number(item.features.family) * 3 + Number(item.features.downloads === true) + Number(item.features.ads === false),
      'no-contract': item.requirements.commitmentMonths === 0 ? 5 : 0,
      premium: Number(item.features.fourK) * 3 + Number(item.features.ads === false) + Number(item.features.downloads === true),
    };
    return scores[intent];
  }
}
