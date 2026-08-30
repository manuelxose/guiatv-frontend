import { AffiliateMerchant, AffiliateMerchantProps, AffiliateMerchantStatus } from '../entities/AffiliateMerchant';

export interface AffiliateMerchantFilter {
  status?: AffiliateMerchantStatus;
  category?: string;
  market?: string;
}

export type AffiliateMerchantUpsertInput = Omit<AffiliateMerchantProps, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IAffiliateMerchantRepository {
  findById(id: string): Promise<AffiliateMerchant | null>;
  findBySlug(slug: string): Promise<AffiliateMerchant | null>;
  findByCanonicalProviderKey(canonicalProviderKey: string): Promise<AffiliateMerchant | null>;
  /**
   * Resolves free-text provider references ("Movistar+", "M+", "Movistar Plus")
   * to their canonical merchant by normalizing (lowercase, accent-strip, trim)
   * and matching against `slug`, `canonicalProviderKey`, and `aliases`.
   */
  findByAlias(text: string): Promise<AffiliateMerchant | null>;
  /** Administrative listing, optionally filtered. */
  list(filter?: AffiliateMerchantFilter): Promise<AffiliateMerchant[]>;
  /** Idempotent upsert keyed by slug — used by the migration/seed path. */
  upsertBySlug(merchant: AffiliateMerchantUpsertInput): Promise<AffiliateMerchant>;
  /** Real single-document insert for the admin UI — rejects a duplicate slug rather than merging. */
  create(merchant: AffiliateMerchantUpsertInput): Promise<AffiliateMerchant>;
  /** Real single-document partial update by id — never touches `slug`. Returns null if the id doesn't exist. */
  updateById(id: string, patch: Partial<Omit<AffiliateMerchantProps, 'slug'>>): Promise<AffiliateMerchant | null>;
}
