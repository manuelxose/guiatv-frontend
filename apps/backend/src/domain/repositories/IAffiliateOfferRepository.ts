import { AffiliateOffer, AffiliateOfferProps, AffiliateOfferStatus } from '../entities/AffiliateOffer';

export interface AffiliateOfferCandidateFilter {
  category?: string;
  market: string;
  intents?: string[];
  merchantIds?: string[];
  /** Only offers valid `asOf` this instant (defaults to now) — see findValidOffers. */
  asOf?: Date;
}

export interface AffiliateOfferAdminFilter {
  merchantId?: string;
  affiliateProgramId?: string;
  market?: string;
  status?: AffiliateOfferStatus;
  category?: string;
  limit?: number;
  skip?: number;
}

export type AffiliateOfferUpsertInput = Omit<AffiliateOfferProps, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IAffiliateOfferRepository {
  findById(id: string): Promise<AffiliateOffer | null>;
  /** All offers for one merchant, optionally scoped to a market. */
  findByMerchant(merchantId: string, market?: string): Promise<AffiliateOffer[]>;
  /** All offers resolving through one commercial program. */
  findByAffiliateProgram(affiliateProgramId: string): Promise<AffiliateOffer[]>;
  /** Offers matching one or more recommendation intents, market-scoped. */
  findByIntent(intent: string, market: string): Promise<AffiliateOffer[]>;
  /**
   * Offers eligible for a placement: `enabled` placements have already been
   * verified by the caller via IAffiliatePlacementRepository — this narrows
   * to offers whose `placements` allowlist includes the key (or has none,
   * meaning "eligible everywhere"), still market/validity/status scoped.
   */
  findByPlacement(placementKey: string, market: string): Promise<AffiliateOffer[]>;
  /** Category + market + intent candidate lookup — the resolver's first step. */
  findCandidates(filter: AffiliateOfferCandidateFilter): Promise<AffiliateOffer[]>;
  /** `active` offers whose validity window includes `asOf` (defaults to now). */
  findValidOffers(market: string, asOf?: Date): Promise<AffiliateOffer[]>;
  /** Administrative listing, optionally filtered/paginated. */
  list(filter?: AffiliateOfferAdminFilter): Promise<AffiliateOffer[]>;
  /** Idempotent upsert keyed by (merchantId, affiliateProgramId, market, plan.id) — used by the migration/seed path. */
  upsertByMerchantProgramPlan(offer: AffiliateOfferUpsertInput): Promise<AffiliateOffer>;
  /** Real single-document insert for the admin UI — rejects a duplicate (merchantId, affiliateProgramId, market, plan.id) rather than merging. */
  create(offer: AffiliateOfferUpsertInput): Promise<AffiliateOffer>;
  /** Real single-document partial update by id. Returns null if the id doesn't exist. */
  updateById(id: string, patch: Partial<AffiliateOfferProps>): Promise<AffiliateOffer | null>;
  /** Administrative count matching the same filter shape as `list`, for pagination. */
  count(filter?: AffiliateOfferAdminFilter): Promise<number>;
}
