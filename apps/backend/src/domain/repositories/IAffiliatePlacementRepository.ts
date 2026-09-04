import { AffiliatePlacement, AffiliatePlacementProps } from '../entities/AffiliatePlacement';

export type AffiliatePlacementUpsertInput = Omit<AffiliatePlacementProps, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IAffiliatePlacementRepository {
  /** Resolves a key directly, or a legacy key via `legacyKeys`. */
  findByKey(key: string): Promise<AffiliatePlacement | null>;
  findById(id: string): Promise<AffiliatePlacement | null>;
  listActive(): Promise<AffiliatePlacement[]>;
  list(): Promise<AffiliatePlacement[]>;
  /** Idempotent upsert keyed by `key` — used by the migration/seed path. */
  upsertByKey(placement: AffiliatePlacementUpsertInput): Promise<AffiliatePlacement>;
  /** Real single-document insert for the admin UI — rejects a duplicate key rather than merging. */
  create(placement: AffiliatePlacementUpsertInput): Promise<AffiliatePlacement>;
  /** Real single-document partial update by id — never touches `key`. Returns null if the id doesn't exist. */
  updateById(id: string, patch: Partial<Omit<AffiliatePlacementProps, 'key'>>): Promise<AffiliatePlacement | null>;
}
