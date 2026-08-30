/**
 * Frontend types for the generic Affiliate Engine (Phase 4 — UI foundation).
 * Ubicación: src/app/interfaces/affiliate.interface.ts
 *
 * Mirrors the wire shapes served by `POST /v2/affiliate/resolve` and
 * `POST /v2/affiliate/impression` (see
 * apps/backend/src/application/dto/AffiliateResolveDTO.ts and
 * apps/backend/src/application/dto/AffiliateContext.ts). Deliberately does
 * NOT mirror backend-only internals (resolver stages, deep-link strategies,
 * commission/secret fields) — the client never sees them and never needs to.
 */

/**
 * Canonical placement keys named in
 * docs/affiliate-engine-architecture.md §5 (`AffiliatePlacement` config
 * collection). Kept as a union for editor autocomplete only — the resolver
 * is always the source of truth, so an unrecognized string is still valid
 * (`(string & {})`) and simply resolves to nothing if the key is unknown.
 */
export type AffiliatePlacementKey =
  | 'home'
  | 'epg-program-card'
  | 'epg-program-detail'
  | 'channel-page'
  | 'catalog-card'
  | 'catalog-detail'
  | 'where-to-watch'
  | 'search-result'
  | 'chatbot-answer'
  | 'football-match'
  | 'football-competition'
  | 'football-home'
  | 'blog-inline'
  | 'blog-footer'
  | 'streaming-comparison'
  | 'provider-summary'
  | (string & {});

/** A placement key + the page it renders on, for analytics context only. */
export type AffiliatePlacement = AffiliatePlacementKey;

/**
 * Context threaded from a call site into `AffiliateService.resolve*`.
 * Every field beyond `market`/`placement` is optional — a caller attaches
 * only what its surface actually knows. Never collect more than the surface
 * needs; there is no generic user-identifying field here beyond the
 * anonymous session identifiers already used by `AnalyticsService`.
 */
export interface AffiliateContext {
  /** ISO market code, e.g. 'ES'. */
  market: string;
  placement: AffiliatePlacement;
  pageType?: string;
  contentType?: string;
  contentId?: string;
  /** Free-text provider reference from the calling surface ("Movistar+", "M+", ...). */
  providerKey?: string;
  programId?: string;
  channelId?: string;
  catalogId?: string;
  movieId?: string;
  seriesId?: string;
  footballMatchId?: string;
  competitionId?: string;
  teamIds?: string[];
  blogPostId?: string;
  searchQuery?: string;
  chatbotConversationId?: string;
  /** Path the user arrived from, for analytics only. */
  referrerPath?: string;
}

export type AffiliateOfferCategory =
  | 'streaming'
  | 'smart-tv'
  | 'device'
  | 'ticketing'
  | 'event'
  | 'retail'
  | 'vpn'
  | 'other'
  | (string & {});

export interface AffiliateOfferPricing {
  currency: string;
  monthlyAmount: number | null;
  annualAmount: number | null;
  monthlyLabel: string;
  annualLabel: string;
  activationFeeAmount: number | null;
  promotion?: { label: string; expiresAt?: string };
}

/** Slim merchant summary — only what a card/CTA needs to render. */
export interface AffiliateMerchant {
  id: string;
  slug: string;
  name: string;
  logo?: string;
}

/**
 * Presentation contract for a CTA: everything `AffiliateCTAComponent` needs
 * to render a label and its sponsored state, independent of a full offer
 * (a secondary "Ver más ofertas" CTA has one of these without an offer).
 */
export interface AffiliateCTA {
  label: string;
  sponsored: boolean;
  disabled?: boolean;
}

/** Consistent, non-deceptive disclosure copy — see AffiliateDisclosureComponent. */
export interface AffiliateDisclosure {
  text: string;
  sponsored: boolean;
}

/**
 * One resolved, display-ready offer. Deliberately excludes any raw affiliate
 * URL, secret, or commission figure — `outbound.path` is the only thing the
 * client ever holds, and it is passed straight to `AffiliateService.buildOutboundUrl`.
 */
export interface AffiliateResolvedOffer {
  offerId: string;
  merchant: AffiliateMerchant;
  category: AffiliateOfferCategory;
  plan: { id: string; name: string };
  /** Present only for categories where a price is meaningful. */
  pricing?: AffiliateOfferPricing;
  display: {
    bestFor?: string;
    highlight?: string;
    disclosure: string;
  };
  cta: AffiliateCTA;
  outbound: { path: string };
  relevance?: {
    matchedIntent: boolean;
    matchedPlacement: boolean;
    /** True when this offer was named in `AffiliateResolveOptions.pinnedOfferIds` rather than found by automatic ranking. */
    pinned?: boolean;
  };
}

export interface AffiliateResolveMeta {
  market: string;
  placement: string;
  total: number;
  generatedAt: string;
}

/** One rendered offer's impression, batched by `AffiliateService.trackImpressions`. */
export interface AffiliateImpressionInput {
  offerId: string;
  placement: AffiliatePlacement;
  market: string;
  contentType?: string;
  contentId?: string;
  footballMatchId?: string;
  competitionId?: string;
  blogPostId?: string;
  page?: string;
}
