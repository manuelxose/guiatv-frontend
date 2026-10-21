import {
  AssuranceLevel,
  ContentKind,
  HistoricWork,
  ContentStatus,
  MatchMethod,
  ProvenanceSource,
  SlugRole,
  TitleKeyRow,
  TitleKeyState,
  TmdbRef,
} from '../services/contentIdentity';

export interface ProvenancedValue<T = unknown> {
  value: T;
  source: ProvenanceSource;
  updatedAt: Date;
}

export interface ContentEntityRecord {
  entityId: string;
  kind: ContentKind;
  status: ContentStatus;
  mergedInto?: string;
  title: string;
  normalizedTitle: string;
  originalTitle?: string;
  year?: number;
  externalIds: { tmdb?: TmdbRef };
  /** Denormalised from the entity's `canonical` row in `content_slugs`, which is the source of truth. */
  canonicalPath?: string;
  metadata: { synopsis?: ProvenancedValue<string>; genres?: ProvenancedValue<string[]>; images?: ProvenancedValue };
  matching: { method: MatchMethod; confidence: number; decidedAt: Date; decidedBy: string; assurance?: AssuranceLevel };
  indexability: { state: 'index' | 'noindex'; reasons: string[]; evaluatedAt?: Date };
  lifecycle?: { changedAt: Date; changedBy: string; reason: string };
  contentChangedAt?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentEntityInsert = Pick<
  ContentEntityRecord,
  'entityId' | 'kind' | 'title' | 'normalizedTitle' | 'originalTitle' | 'year' | 'externalIds' | 'matching'
> & { metadata?: ContentEntityRecord['metadata'] };

export type InsertResult<T, C extends string> =
  | { inserted: true; record: T }
  | { inserted: false; conflict: C; existing: T | null };

export interface EntityTransition {
  from: ContentStatus;
  to: ContentStatus;
  expectedVersion: number;
  mergedInto?: string;
  /** A person's identity decision recorded with the transition (`verifyEntity`); replaces `matching`. */
  matching?: ContentEntityRecord['matching'];
  by: string;
  reason: string;
}

export interface IContentEntityRepository {
  /** `tmdb_taken`: a live (candidate/active) entity already owns that TMDB id; `existing` is it. */
  insert(entity: ContentEntityInsert): Promise<InsertResult<ContentEntityRecord, 'tmdb_taken' | 'id_taken'>>;
  findById(entityId: string): Promise<ContentEntityRecord | null>;
  findByIds(entityIds: string[]): Promise<ContentEntityRecord[]>;
  findLiveByTmdbRefs(refs: TmdbRef[]): Promise<ContentEntityRecord[]>;
  findLiveByTmdb(ref: TmdbRef): Promise<ContentEntityRecord | null>;
  findByNormalizedTitle(normalizedTitle: string, kind?: ContentKind): Promise<ContentEntityRecord[]>;
  /** Sets the denormalised path once; true if set now or already equal. Never overwrites a different path. */
  setCanonicalPath(entityId: string, path: string): Promise<boolean>;
  /** Optimistic: applies only if status and version still match. Null on a lost race. */
  transition(entityId: string, change: EntityTransition): Promise<ContentEntityRecord | null>;
  /** Collapses merge chains: entities merged into `fromEntityId` now point at `toEntityId`. */
  repointMergedInto(fromEntityId: string, toEntityId: string): Promise<number>;
  /** Partial-write recovery: entities created before `createdBefore` that still have no canonical path. */
  findWithoutCanonicalPath(createdBefore: Date, limit: number): Promise<ContentEntityRecord[]>;
}

export interface SlugHistoryEntry {
  at: Date;
  by: string;
  action: 'create' | 'role_change' | 'reassign';
  fromRole?: SlugRole;
  toRole?: SlugRole;
  fromEntityId?: string;
  toEntityId?: string;
  note?: string;
}

export interface ContentSlugRecord {
  path: string;
  entityId: string;
  role: SlugRole;
  reason: string;
  createdBy: string;
  history: SlugHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentSlugInsert {
  path: string;
  entityId: string;
  role: SlugRole;
  reason: string;
  createdBy: string;
}

export interface IContentSlugRepository {
  findByPath(path: string): Promise<ContentSlugRecord | null>;
  findByPaths(paths: string[]): Promise<ContentSlugRecord[]>;
  findCanonical(entityId: string): Promise<ContentSlugRecord | null>;
  listByEntity(entityId: string): Promise<ContentSlugRecord[]>;
  /** Insert-only: `path_taken` never overwrites; `entity_has_canonical` enforces one canonical per entity. */
  insert(input: ContentSlugInsert): Promise<InsertResult<ContentSlugRecord, 'path_taken' | 'entity_has_canonical'>>;
  /** Role change for the same entity only; audited. */
  changeRole(path: string, change: { entityId: string; from: SlugRole; to: SlugRole; by: string; note?: string }): Promise<boolean>;
  /** Manual, reviewed reassignment of a non-canonical path to another entity; audited. */
  reassign(path: string, change: { fromEntityId: string; toEntityId: string; reviewedBy: string; note: string }): Promise<boolean>;
}

export interface TitleKeyRecord extends TitleKeyRow {
  firstSeenAt: Date;
  lastSeenAt: Date;
  decidedBy: string;
  review?: { by: string; at: Date; note?: string };
}

export interface IContentTitleKeyRepository {
  listByKey(key: string): Promise<TitleKeyRecord[]>;
  listByKeys(keys: string[]): Promise<TitleKeyRecord[]>;
  /** Moves `lastSeenAt` forward (never back) so the review queue sorts by recency. */
  touch(ids: string[], at: Date): Promise<void>;
  /** Insert-only: a concurrent or repeated insert returns the stored row unchanged. */
  insert(row: TitleKeyRow & { decidedBy: string }): Promise<InsertResult<TitleKeyRecord, 'exists'>>;
  /** Manual review: the only way a stored row's entity changes. Sets state verified, method manual. */
  review(id: string, change: { entityId: string; by: string; note?: string }): Promise<boolean>;
  /** Manual review: the title is not an entity. Unbinds a provisional candidate; never a verified row. */
  reject(id: string, change: { by: string; note?: string }): Promise<boolean>;
  /**
   * A provisional row whose entity can't be materialised (its TMDB work belongs to another entity):
   * unbinds it into the review queue (`manual_review`, `claim_conflict`). Only if it is still a
   * `candidate` bound to `entityId`; a verified row is never touched. True if the row was moved.
   */
  flagClaimConflict(id: string, change: { entityId: string; candidates: string[]; by: string }): Promise<boolean>;
  listReviewQueue(limit: number): Promise<TitleKeyRecord[]>;
  countByState(): Promise<Record<TitleKeyState, number>>;
}

/** Read-only evidence for ingestion (2D-2): TMDB catalogue rows and the slugs legacy pages answered. */
export interface CatalogEvidence {
  mediaId: string;
  tmdb?: TmdbRef;
  title: string;
  originalTitle?: string;
  year?: number;
}

export interface IIdentityEvidenceSource {
  catalogEntries(mediaIds: string[], tmdbIds: number[]): Promise<CatalogEvidence[]>;
  /** For each requested slug, the works whose legacy page could answer it (missing = none). */
  historicSlugOwners(slugs: string[]): Promise<ReadonlyMap<string, readonly HistoricWork[]>>;
}

export interface AiringEntityRef {
  airingId: string;
  entityId: string;
  canonicalPath?: string;
}

export interface IAiringEntityRefWriter {
  /** True only when `idx_tvread_entity_start` exists exactly as specified (built by hand, 2D-2 §I). */
  indexReady(): Promise<boolean>;
  apply(date: string, refs: AiringEntityRef[]): Promise<number>;
}
