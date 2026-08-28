export type CommercialRelationship =
  | 'affiliate_configured'
  | 'direct_commercial_link'
  | 'no_affiliate_available'
  | 'unknown'
  | 'manual_agreement_required';

export type OfferIntent =
  | 'cheapest'
  | 'football'
  | 'movies'
  | 'family'
  | 'no-contract'
  | 'premium';

export interface MonetizationOfferDTO {
  id: string;
  market: 'ES';
  provider: {
    id: string;
    name: string;
  };
  plan: {
    id: string;
    name: string;
  };
  pricing: {
    currency: 'EUR';
    monthlyAmount: number | null;
    annualAmount: number | null;
    monthlyLabel: string;
    annualLabel: string;
    activationFeeAmount: number | null;
    promotion?: {
      label: string;
      expiresAt?: string;
    };
  };
  features: {
    simultaneousStreams: string;
    maxResolution: string;
    downloads: boolean | null;
    ads: boolean | null;
    liveContent: boolean | null;
    sports: boolean;
    football: boolean;
    movies: boolean;
    series: boolean;
    family: boolean;
    fourK: boolean;
  };
  requirements: {
    commitmentMonths: number;
    fibreRequired: boolean;
    mobileRequired: boolean;
    device: string | null;
  };
  trialDays: number | null;
  bestFor: string;
  highlight: string;
  disclosure: string;
  verification: {
    lastVerifiedAt: string;
    sourceUrl: string;
    status: 'current' | 'stale' | 'needs_review';
  };
  outbound: {
    path: string;
    relationship: CommercialRelationship;
    label: string;
    isSponsored: boolean;
  };
  recommendation: {
    intents: OfferIntent[];
  };
}

export interface MonetizationOffersResponseDTO {
  items: MonetizationOfferDTO[];
  meta: {
    market: 'ES';
    total: number;
    generatedAt: string;
    disclosure: string;
  };
  filters: {
    intents: OfferIntent[];
    features: Array<'downloads' | 'live' | 'sports' | 'football' | 'family' | '4k'>;
  };
}

