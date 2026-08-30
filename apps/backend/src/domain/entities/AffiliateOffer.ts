/**
 * A concrete, market-scoped plan/deal a merchant offers, resolved through one
 * AffiliateProgram. Field shape intentionally mirrors `MonetizationOfferDTO`
 * for the `streaming` category so the legacy facade can keep serializing the
 * exact same response shape while reading from this model underneath.
 */
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

export type AffiliateOfferStatus = 'active' | 'inactive' | 'expired' | 'draft';
export type AffiliateOfferVerificationStatus = 'current' | 'stale' | 'needs_review';

export type AffiliateDeepLinkStrategy =
  | 'direct_url'
  | 'url_template'
  | 'network_redirect'
  | 'tag_param'
  | 'api_generated';

export interface AffiliateOfferPricing {
  currency: string;
  monthlyAmount: number | null;
  annualAmount: number | null;
  monthlyLabel: string;
  annualLabel: string;
  activationFeeAmount: number | null;
  promotion?: {
    label: string;
    expiresAt?: string;
  };
}

export interface AffiliateOfferRequirements {
  commitmentMonths: number;
  fibreRequired: boolean;
  mobileRequired: boolean;
  device: string | null;
}

export interface AffiliateOfferTrial {
  days: number | null;
}

/**
 * Deep-link build instructions. `strategy` selects the adapter (see
 * infrastructure/affiliate/deeplink) that turns this + the resolved secret
 * into a final URL; `url` is the direct/static fallback destination.
 */
export interface AffiliateOfferDestination {
  strategy: AffiliateDeepLinkStrategy;
  url: string;
  template?: string;
  params?: Record<string, string>;
}

export interface AffiliateOfferValidity {
  validFrom?: Date;
  validUntil?: Date;
}

export interface AffiliateOfferVerification {
  source?: string;
  verifiedAt?: Date;
  status: AffiliateOfferVerificationStatus;
}

export interface AffiliateOfferDisplay {
  bestFor?: string;
  highlight?: string;
  disclosure: string;
}

export interface AffiliateOfferProps {
  merchantId: string;
  affiliateProgramId: string;
  market: string;
  category: AffiliateOfferCategory;
  plan: { id: string; name: string };
  pricing: AffiliateOfferPricing;
  /** Category-specific shape (e.g. the `streaming` profile mirrors MonetizationOfferDTO.features). */
  features: Record<string, unknown>;
  requirements: AffiliateOfferRequirements;
  trial: AffiliateOfferTrial;
  recommendationIntents: string[];
  /** Placement keys this offer is eligible for; empty/undefined = eligible on every enabled placement. */
  placements?: string[];
  destination: AffiliateOfferDestination;
  validity: AffiliateOfferValidity;
  status: AffiliateOfferStatus;
  verification: AffiliateOfferVerification;
  display: AffiliateOfferDisplay;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateOffer extends AffiliateOfferProps {
  id: string;
}
