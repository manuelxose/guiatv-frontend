import { AffiliateMerchantCategory, AffiliateMerchantStatus } from '@/domain/entities/AffiliateMerchant';
import { AffiliateNetworkStatus, AffiliateNetworkTrackingType } from '@/domain/entities/AffiliateNetwork';
import {
  AffiliateProgramAttribution,
  AffiliateProgramCommission,
  AffiliateProgramStatus,
} from '@/domain/entities/AffiliateProgram';
import { CommercialRelationship } from './MonetizationDTO';
import {
  AffiliateOfferCategory,
  AffiliateOfferDestination,
  AffiliateOfferPricing,
  AffiliateOfferRequirements,
  AffiliateOfferStatus,
  AffiliateOfferTrial,
} from '@/domain/entities/AffiliateOffer';
import { AffiliateVerificationDisplayStatus } from '@/domain/services/affiliateVerificationStatus';

/** Every admin write carries who made it — resolved from the authenticated admin session, never client-supplied. */
export interface AffiliateAdminActor {
  adminId: string;
}

// ---------------------------------------------------------------------------
// Merchant
// ---------------------------------------------------------------------------

export interface MerchantAdminInput {
  name: string;
  canonicalProviderKey: string;
  aliases: string[];
  category: AffiliateMerchantCategory;
  logo?: string;
  officialUrl: string;
  markets: string[];
  status: AffiliateMerchantStatus;
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

export interface NetworkAdminInput {
  name: string;
  trackingType: AffiliateNetworkTrackingType;
  markets: string[];
  status: AffiliateNetworkStatus;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Program — never accepts or returns a secret value, only the env-var name
// (`attribution.secretRef`) and a derived configured/missing status.
// ---------------------------------------------------------------------------

export interface ProgramAdminInput {
  merchantId: string;
  networkId: string;
  market: string;
  externalProgramId?: string;
  relationship: CommercialRelationship;
  status: AffiliateProgramStatus;
  allowedHosts: string[];
  disclosure: string;
  commission?: AffiliateProgramCommission;
  attribution?: AffiliateProgramAttribution;
  verification: {
    source?: string;
    verifiedAt?: string;
    status: 'pending' | 'approved' | 'needs_review';
  };
}

export interface ProgramSecretView {
  secretRefName?: string;
  secretStatus: 'configured' | 'missing' | 'not_applicable';
}

// ---------------------------------------------------------------------------
// Offer
// ---------------------------------------------------------------------------

export interface OfferAdminInput {
  merchantId: string;
  affiliateProgramId: string;
  market: string;
  category: AffiliateOfferCategory;
  plan: { id: string; name: string };
  pricing: AffiliateOfferPricing;
  features: Record<string, unknown>;
  requirements: AffiliateOfferRequirements;
  trial: AffiliateOfferTrial;
  recommendationIntents: string[];
  placements?: string[];
  destination: AffiliateOfferDestination;
  validity: { validFrom?: string; validUntil?: string };
  status: AffiliateOfferStatus;
  verification: { source?: string; verifiedAt?: string; status: 'current' | 'stale' | 'needs_review' };
  display: { bestFor?: string; highlight?: string; disclosure: string };
}

export interface OfferAdminView {
  expired: boolean;
  verificationDisplay: AffiliateVerificationDisplayStatus;
  daysSinceVerified: number | null;
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

export interface PlacementAdminInput {
  key: string;
  page: string;
  description?: string;
  enabled: boolean;
  legacyKeys?: string[];
}

// ---------------------------------------------------------------------------
// Verification workflow (Programs + Offers merged into one review queue)
// ---------------------------------------------------------------------------

export interface VerificationQueueItem {
  entityType: 'program' | 'offer';
  entityId: string;
  merchantId: string;
  merchantName: string;
  label: string;
  market: string;
  sourceUrl?: string;
  verifiedAt?: string;
  daysSinceVerified: number | null;
  displayStatus: AffiliateVerificationDisplayStatus;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface AffiliateAdminAnalyticsQuery {
  from?: string;
  to?: string;
  limit?: number;
}

export interface AffiliateAdminAnalyticsCount {
  key: string;
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AffiliateAdminAnalyticsReport {
  range: { from: string; to: string };
  totals: { impressions: number; clicks: number; ctr: number };
  byMerchant: AffiliateAdminAnalyticsCount[];
  byPlacement: AffiliateAdminAnalyticsCount[];
  byOffer: AffiliateAdminAnalyticsCount[];
  topContent: Array<{ contentType?: string; contentId: string; clicks: number; impressions: number }>;
  note: string;
}
