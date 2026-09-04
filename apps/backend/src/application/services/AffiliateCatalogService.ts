import { AffiliateOffer } from '@/domain/entities/AffiliateOffer';
import { AffiliateMerchant } from '@/domain/entities/AffiliateMerchant';
import { AffiliateProgram } from '@/domain/entities/AffiliateProgram';
import { AffiliatePlacement } from '@/domain/entities/AffiliatePlacement';
import { AffiliateOfferCandidateFilter, IAffiliateOfferRepository } from '@/domain/repositories/IAffiliateOfferRepository';
import { IAffiliateMerchantRepository } from '@/domain/repositories/IAffiliateMerchantRepository';
import { IAffiliateProgramRepository } from '@/domain/repositories/IAffiliateProgramRepository';
import { IAffiliatePlacementRepository } from '@/domain/repositories/IAffiliatePlacementRepository';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { rankAffiliateOffers } from '@/domain/services/affiliateRanking';
import { isOfferValidNow } from '@/domain/services/affiliateOfferValidity';
import { AffiliateContext } from '../dto/AffiliateContext';
import { normalizeAffiliateText } from '../../shared/utils/affiliateText';
import { AFFILIATE_CACHE_TTL_SECONDS, AffiliateCacheKeys, cached } from '../../infrastructure/affiliate/AffiliateCacheKeys';

export interface AffiliateCandidate {
  offer: AffiliateOffer;
  merchant: AffiliateMerchant;
  program: AffiliateProgram;
}

export interface AffiliateCandidateOptions {
  category?: string;
  intent?: string;
  merchantIds?: string[];
  maxResults?: number;
}

/** Also used by AffiliateResolverService to re-cap a pinned+ranked merge — exported so both stay in lockstep. */
export const DEFAULT_MAX_RESULTS = 10;
export const HARD_MAX_RESULTS = 25;

function capResults(maxResults?: number): number {
  return Math.min(Math.max(1, maxResults || DEFAULT_MAX_RESULTS), HARD_MAX_RESULTS);
}

/**
 * Candidate selection + provider normalization + active-program + placement
 * eligibility — resolver flow steps 1–4 (see docs/affiliate-engine-architecture.md
 * §9). Powers both "what offers are eligible right now" (impression
 * rendering, `POST /v2/affiliate/resolve`) and, via `AffiliateResolverService`,
 * the redirect path. Read-mostly and cache-friendly by design; the redirect
 * path itself re-validates the specific offer/program live (see
 * `AffiliateResolverService`), so staleness here only ever affects which
 * offers *appear*, never whether a click safely redirects.
 */
export class AffiliateCatalogService {
  constructor(
    private readonly offerRepository: IAffiliateOfferRepository,
    private readonly merchantRepository: IAffiliateMerchantRepository,
    private readonly programRepository: IAffiliateProgramRepository,
    private readonly placementRepository: IAffiliatePlacementRepository,
    private readonly cache?: ICacheRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Resolves a placement key (canonical or legacy) to its active row, or null if unknown/disabled. */
  async resolvePlacement(placementKey: string): Promise<AffiliatePlacement | null> {
    const normalized = placementKey.toLowerCase().trim();
    const placement = await cached(
      this.cache,
      AffiliateCacheKeys.placementByKey(normalized),
      AFFILIATE_CACHE_TTL_SECONDS.placement,
      () => this.placementRepository.findByKey(normalized)
    );
    return placement && placement.enabled ? placement : null;
  }

  /** Free-text provider references ("Movistar+", "M+", ...) → canonical merchant ids. Unresolvable hints are silently dropped. */
  async resolveMerchantIds(providerKeys: string[]): Promise<string[]> {
    const ids = new Set<string>();
    for (const raw of providerKeys) {
      const normalized = normalizeAffiliateText(raw);
      if (!normalized) continue;
      const merchant = await cached(
        this.cache,
        AffiliateCacheKeys.merchantByAlias(normalized),
        AFFILIATE_CACHE_TTL_SECONDS.merchant,
        () => this.merchantRepository.findByAlias(raw)
      );
      if (merchant) ids.add(merchant.id);
    }
    return Array.from(ids);
  }

  async getMerchant(merchantId: string): Promise<AffiliateMerchant | null> {
    return cached(this.cache, AffiliateCacheKeys.merchantById(merchantId), AFFILIATE_CACHE_TTL_SECONDS.merchant, () =>
      this.merchantRepository.findById(merchantId)
    );
  }

  async getProgram(programId: string): Promise<AffiliateProgram | null> {
    return cached(this.cache, AffiliateCacheKeys.programById(programId), AFFILIATE_CACHE_TTL_SECONDS.program, () =>
      this.programRepository.findById(programId)
    );
  }

  /**
   * Candidate lookup → provider match → active program → placement
   * eligibility → neutral ranking (never commission) → cap. Returns
   * ready-to-display candidates; never an offer whose merchant/program isn't
   * active, so a disabled program disappears from listings immediately
   * (bounded by the offer-candidates cache TTL, not by staleness at the
   * merchant/program level).
   */
  async findEligibleCandidates(context: AffiliateContext, options: AffiliateCandidateOptions = {}): Promise<AffiliateCandidate[]> {
    const placement = await this.resolvePlacement(context.placement);
    if (!placement) return [];

    const intents = options.intent ? [options.intent] : undefined;
    // `options.merchantIds` distinguishes "no provider hint at all" (undefined — no filter) from
    // "a provider hint was given but resolved to nothing" ([] — show nothing, never silently widen
    // back out to every merchant).
    if (options.merchantIds !== undefined && options.merchantIds.length === 0) {
      return [];
    }
    const merchantIds = options.merchantIds && options.merchantIds.length > 0 ? [...options.merchantIds].sort() : undefined;

    const filter: AffiliateOfferCandidateFilter = {
      market: context.market,
      category: options.category,
      intents,
      merchantIds,
      asOf: this.now(),
    };

    const cacheKey = AffiliateCacheKeys.candidates(
      context.market,
      options.category || 'any',
      (intents || []).join(',') || 'any',
      (merchantIds || []).join(',') || 'any'
    );
    const offers =
      (await cached(this.cache, cacheKey, AFFILIATE_CACHE_TTL_SECONDS.candidates, () => this.offerRepository.findCandidates(filter))) ||
      [];

    const eligible: AffiliateOffer[] = offers.filter(
      (offer) => !offer.placements || offer.placements.length === 0 || offer.placements.includes(placement.key)
    );

    const candidates: AffiliateCandidate[] = [];
    for (const offer of eligible) {
      const [merchant, program] = await Promise.all([this.getMerchant(offer.merchantId), this.getProgram(offer.affiliateProgramId)]);
      if (!merchant || merchant.status !== 'active') continue;
      if (!program || program.status !== 'active') continue;
      candidates.push({ offer, merchant, program });
    }

    const ranked = rankAffiliateOffers(candidates, {
      intent: options.intent,
      placement: placement.key,
      contentType: context.contentType,
      contentId: context.contentId,
    });

    return ranked.slice(0, capResults(options.maxResults));
  }

  /**
   * Resolves a caller-chosen list of offer ids to display candidates, in the
   * order given — the editorial "pin an offer" path (see
   * docs/…/blog integration and `AffiliateResolveRequest.pinnedOfferIds`).
   * Still enforces every safety/eligibility check `findEligibleCandidates`
   * would (market match, active status, validity window, placement
   * eligibility, active merchant/program) — pinning an offer never bypasses
   * those, it only bypasses *ranking*. An id that fails any check, or that
   * doesn't exist, or a duplicate, is silently dropped rather than surfaced
   * as an error — a stale editorial pin must degrade to "not shown", never
   * break the page.
   */
  async getCandidatesByOfferIds(offerIds: string[], context: AffiliateContext): Promise<AffiliateCandidate[]> {
    if (!offerIds || offerIds.length === 0) return [];
    const placement = await this.resolvePlacement(context.placement);
    if (!placement) return [];

    const seen = new Set<string>();
    const candidates: AffiliateCandidate[] = [];
    for (const rawId of offerIds) {
      const id = String(rawId || '').trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);

      const offer = await this.offerRepository.findById(id);
      if (!offer) continue;
      if (offer.market !== context.market) continue;
      if (offer.status !== 'active' || !isOfferValidNow(offer.validity, this.now())) continue;
      if (offer.placements && offer.placements.length > 0 && !offer.placements.includes(placement.key)) continue;

      const [merchant, program] = await Promise.all([this.getMerchant(offer.merchantId), this.getProgram(offer.affiliateProgramId)]);
      if (!merchant || merchant.status !== 'active') continue;
      if (!program || program.status !== 'active') continue;

      candidates.push({ offer, merchant, program });
    }
    return candidates;
  }
}
