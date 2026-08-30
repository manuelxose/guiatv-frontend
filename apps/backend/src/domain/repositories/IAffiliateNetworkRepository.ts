import { AffiliateNetwork, AffiliateNetworkProps, AffiliateNetworkStatus } from '../entities/AffiliateNetwork';

export interface AffiliateNetworkFilter {
  status?: AffiliateNetworkStatus;
  market?: string;
}

export type AffiliateNetworkUpsertInput = Omit<AffiliateNetworkProps, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IAffiliateNetworkRepository {
  findById(id: string): Promise<AffiliateNetwork | null>;
  findBySlug(slug: string): Promise<AffiliateNetwork | null>;
  /** Administrative listing, optionally filtered. */
  list(filter?: AffiliateNetworkFilter): Promise<AffiliateNetwork[]>;
  /** Idempotent upsert keyed by slug — used by the migration/seed path. */
  upsertBySlug(network: AffiliateNetworkUpsertInput): Promise<AffiliateNetwork>;
  /** Real single-document insert for the admin UI — rejects a duplicate slug rather than merging. */
  create(network: AffiliateNetworkUpsertInput): Promise<AffiliateNetwork>;
  /** Real single-document partial update by id — never touches `slug`. Returns null if the id doesn't exist. */
  updateById(id: string, patch: Partial<Omit<AffiliateNetworkProps, 'slug'>>): Promise<AffiliateNetwork | null>;
}
