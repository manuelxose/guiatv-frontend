import { AffiliateContext } from './AffiliateContext';
import { AffiliateOfferCategory, AffiliateOfferPricing } from '../../domain/entities/AffiliateOffer';

/**
 * `POST /v2/affiliate/resolve` input. Mirrors the brief: context + optional
 * intent + optional provider keys + max results. Never accepts a
 * caller-supplied destination — only server-known context.
 */
export interface AffiliateResolveRequest {
  context: AffiliateContext;
  intent?: string;
  providerKeys?: string[];
  maxResults?: number;
  /** Restricts candidates to one AffiliateOffer.category (e.g. 'smart-tv') — keeps a mixed-topic
   * surface (a blog post about TVs vs one about streaming) from showing offers outside its topic. */
  category?: string;
  /** Editor-chosen offer ids to show first, ahead of automatic ranking (never bypasses market/
   * placement/active-state checks — see AffiliateCatalogService.getCandidatesByOfferIds). */
  pinnedOfferIds?: string[];
  /** false = only `pinnedOfferIds` are resolved, the automatic candidate search never runs.
   * Defaults to true — every existing caller keeps its current (automatic) behavior unchanged. */
  autoResolve?: boolean;
}

/**
 * One resolved, display-ready offer. Deliberately excludes any raw affiliate
 * URL, secret, or commission figure — the client only ever learns the
 * server-relative `outbound.path`.
 */
export interface AffiliateResolvedOfferDTO {
  offerId: string;
  merchant: {
    id: string;
    slug: string;
    name: string;
    logo?: string;
  };
  category: AffiliateOfferCategory;
  plan: { id: string; name: string };
  /** Present only for categories where a price is meaningful. */
  pricing?: AffiliateOfferPricing;
  display: {
    bestFor?: string;
    highlight?: string;
    disclosure: string;
  };
  cta: {
    label: string;
    sponsored: boolean;
  };
  outbound: { path: string };
  /** Safe-to-expose ranking signals only — never commission/payout. */
  relevance?: {
    matchedIntent: boolean;
    matchedPlacement: boolean;
    /** True when this offer was named in `AffiliateResolveRequest.pinnedOfferIds` rather than found by automatic ranking. */
    pinned?: boolean;
  };
}

export interface AffiliateResolveResponseDTO {
  items: AffiliateResolvedOfferDTO[];
  meta: {
    market: string;
    placement: string;
    total: number;
    generatedAt: string;
  };
}

/** `POST /v2/affiliate/impression` — one batched, sendBeacon-friendly call per rendered offer set. */
export interface AffiliateImpressionInput {
  offerId: string;
  placement: string;
  market: string;
  contentType?: string;
  contentId?: string;
  footballMatchId?: string;
  competitionId?: string;
  blogPostId?: string;
  page?: string;
}

export interface AffiliateImpressionRequest {
  context?: Pick<AffiliateContext, 'anonId' | 'sessionId'>;
  impressions: AffiliateImpressionInput[];
}
