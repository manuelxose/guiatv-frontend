import { AffiliateProgram, AffiliateProgramProps, AffiliateProgramStatus } from '../entities/AffiliateProgram';

export interface AffiliateProgramFilter {
  merchantId?: string;
  networkId?: string;
  market?: string;
  status?: AffiliateProgramStatus;
  externalProgramId?: string;
}

export type AffiliateProgramUpsertInput = Omit<AffiliateProgramProps, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IAffiliateProgramRepository {
  findById(id: string): Promise<AffiliateProgram | null>;
  /** Active programs for a merchant in a market — never returns a paused/inactive/pending row. */
  findActiveForMerchant(merchantId: string, market: string): Promise<AffiliateProgram[]>;
  /** Administrative listing, optionally filtered. */
  list(filter?: AffiliateProgramFilter): Promise<AffiliateProgram[]>;
  /** Idempotent upsert keyed by (merchantId, networkId, market) — used by the migration/seed path. */
  upsertByMerchantNetworkMarket(program: AffiliateProgramUpsertInput): Promise<AffiliateProgram>;
  /** Real single-document insert for the admin UI — rejects a duplicate (merchantId, networkId, market) rather than merging. */
  create(program: AffiliateProgramUpsertInput): Promise<AffiliateProgram>;
  /** Real single-document partial update by id. Returns null if the id doesn't exist. */
  updateById(id: string, patch: Partial<AffiliateProgramProps>): Promise<AffiliateProgram | null>;
}
