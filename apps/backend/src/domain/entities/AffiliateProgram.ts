import { CommercialRelationship } from '../../application/dto/MonetizationDTO';

/**
 * A merchant's commercial relationship with GuíaTV in one market through one
 * network. Never stores API keys/tokens/credentials — only a `secretRef`
 * naming the environment variable (or secret-manager key) that holds the
 * actual affiliate URL/token, resolved at request time only, same pattern as
 * today's `MonetizationOfferConfig.affiliateEnvKey`.
 */
export type AffiliateProgramStatus = 'active' | 'inactive' | 'pending';
export type AffiliateProgramVerificationStatus = 'pending' | 'approved' | 'needs_review';

export interface AffiliateProgramCommission {
  type?: 'cpa' | 'cps' | 'cpl' | 'flat' | 'none' | (string & {});
  value?: number;
  currency?: string;
  notes?: string;
}

export interface AffiliateProgramAttribution {
  cookieDays?: number;
  clickIdParam?: string;
  /** Name of the env var / secret-manager key holding the affiliate URL or token. Never the value itself. */
  secretRef?: string;
}

export interface AffiliateProgramVerification {
  source?: string;
  verifiedAt?: Date;
  status: AffiliateProgramVerificationStatus;
}

export interface AffiliateProgramProps {
  merchantId: string;
  networkId: string;
  market: string;
  externalProgramId?: string;
  relationship: CommercialRelationship;
  status: AffiliateProgramStatus;
  /** Hostnames a resolved destination URL for this program is allowed to redirect to. */
  allowedHosts: string[];
  disclosure: string;
  commission?: AffiliateProgramCommission;
  attribution?: AffiliateProgramAttribution;
  verification: AffiliateProgramVerification;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateProgram extends AffiliateProgramProps {
  id: string;
}
