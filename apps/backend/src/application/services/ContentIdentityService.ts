import type {
  ContentEntityInsert,
  ContentEntityRecord,
  IContentEntityRepository,
  IContentSlugRepository,
  IContentTitleKeyRepository,
  TitleKeyRecord,
} from '@/domain/repositories/IContentIdentityRepository';
import {
  canTransition,
  ContentStatus,
  decideTitleMatch,
  newEntityId,
  normalizeContentPath,
  TitleMatchDecision,
  TitleMatchInput,
  titleIdentityKey,
} from '@/domain/services/contentIdentity';
import { isContentEntitiesEnabled } from '@/shared/config/contentEntities';
import {
  MongoContentEntityRepository,
  MongoContentSlugRepository,
  MongoContentTitleKeyRepository,
} from '@/infrastructure/repositories/MongoContentIdentityRepositories';

export class ContentIdentityError extends Error {
  constructor(readonly code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = 'ContentIdentityError';
  }
}

export type PathResolution =
  | { status: 'invalid' }
  | { status: 'not_found' }
  | { status: 'gone'; entityId: string }
  | { status: 'canonical'; entity: ContentEntityRecord }
  /** `location` is always the current canonical path of an active entity: one hop, no chains. */
  | { status: 'redirect'; location: string; entityId: string }
  | { status: 'integrity_error'; detail: string };

export type RedirectResult = 'created' | 'exists' | 'path_taken' | 'target_not_canonical' | 'would_loop';

/** Service actors and automation names: a review signed with one of these is not a person's decision. */
const AUTOMATED_REVIEWERS = new Set([
  'ingest', 'system', 'auto', 'automatic', 'automated', 'review', 'reviewer', 'admin', 'administrator', 'root', 'bot',
  'cron', 'script', 'ci', 'test', 'default', 'anonymous', 'unknown', 'none', 'null', 'undefined', 'claude', 'codex',
]);

/**
 * Review decisions name a real person; there is no default reviewer and no automatic approval.
 * Returns the name to store: NFKC (full-width and compatibility forms folded), trimmed, inner
 * whitespace collapsed. Refuses blanks, names without a letter, and any name whose whole value or
 * any word of it is an automation name, ignoring case ("System", "AUTO ", "cron-job", "ci_bot").
 */
export function normalizeReviewerName(reviewer: unknown): string {
  const name = String(reviewer ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  const lower = name.toLowerCase();
  if (
    !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._@'-]{1,63}$/u.test(name) ||
    !/\p{L}/u.test(name) ||
    AUTOMATED_REVIEWERS.has(lower) ||
    lower.split(/[ ._@'-]+/).some((word) => AUTOMATED_REVIEWERS.has(word))
  ) {
    throw new ContentIdentityError('reviewer_required', "a review needs the reviewer's name");
  }
  return name;
}

function normalizedOrThrow(path: string): string {
  const check = normalizeContentPath(path);
  if (!check.ok) throw new ContentIdentityError('invalid_path', `${path}: ${check.reason}`);
  return check.path;
}

/**
 * Consistency without transactions (production Mongo is a standalone server). Every operation is
 * an ordered sequence of single-document writes, each guarded by a unique index or a conditional
 * filter, so a crash between steps leaves a state the same call can resume from:
 *   create:   entity (candidate) -> canonical slug -> entity.canonicalPath
 *   merge:    entity.status=merged -> demote old canonical slug -> collapse merge chains
 * The slug registry is the source of truth; `entity.canonicalPath` is a cache repaired from it.
 */
export class ContentIdentityService {
  constructor(
    private readonly entities: IContentEntityRepository,
    private readonly slugs: IContentSlugRepository,
    private readonly titleKeys: IContentTitleKeyRepository,
    private readonly actor = 'ingest'
  ) {}

  /**
   * Creates an entity and allocates the first free candidate path as its canonical. Idempotent
   * for TMDB works: a concurrent creator of the same TMDB id gets the winner's entity.
   */
  async createEntity(
    input: Omit<ContentEntityInsert, 'entityId'>,
    candidatePaths: string[]
  ): Promise<{ entity: ContentEntityRecord; path: string | null }> {
    const paths = candidatePaths.map(normalizedOrThrow);
    const entity = await this.ensureEntity(input);
    const path = await this.allocateCanonicalPath(entity.entityId, paths);
    return { entity: (await this.entities.findById(entity.entityId)) ?? entity, path };
  }

  /**
   * Inserts an entity without a path. With `entityId` (an id a title key already claimed, 2D-2) the
   * insert is idempotent: if that id exists, the stored entity is returned. A live entity that
   * already owns the TMDB id wins over a new one, so callers must use the returned entity's id.
   */
  async ensureEntity(input: Omit<ContentEntityInsert, 'entityId'>, entityId?: string): Promise<ContentEntityRecord> {
    let result = await this.entities.insert({ ...input, entityId: entityId ?? newEntityId() });
    if (!result.inserted && result.conflict === 'id_taken') {
      if (entityId) {
        const existing = await this.entities.findById(entityId);
        if (existing) return existing;
      }
      result = await this.entities.insert({ ...input, entityId: newEntityId() });
    }
    if (!result.inserted && !result.existing) {
      throw new ContentIdentityError(result.conflict, 'entity insert conflicted and no existing entity was found');
    }
    return result.inserted ? result.record : (result.existing as ContentEntityRecord);
  }

  /**
   * Gives an entity its canonical path, or repairs a half-finished allocation. Never takes a
   * path from another entity; returns null when every candidate is taken (the entity stays
   * pathless, unresolvable, and listed by `findIncomplete`).
   */
  async allocateCanonicalPath(entityId: string, candidatePaths: string[]): Promise<string | null> {
    const existing = await this.slugs.findCanonical(entityId);
    if (existing) return this.syncCanonicalPath(entityId, existing.path);

    for (const path of candidatePaths.map(normalizedOrThrow)) {
      const res = await this.slugs.insert({ path, entityId, role: 'canonical', reason: 'initial', createdBy: this.actor });
      if (res.inserted) return this.syncCanonicalPath(entityId, path);
      if (res.conflict === 'entity_has_canonical' && res.existing) return this.syncCanonicalPath(entityId, res.existing.path);
      // path_taken: by another entity, or by this one as redirect/gone. Neither is reused automatically.
    }
    return null;
  }

  private async syncCanonicalPath(entityId: string, path: string): Promise<string> {
    if (!(await this.entities.setCanonicalPath(entityId, path))) {
      throw new ContentIdentityError('canonical_mismatch', `${entityId} caches a canonical path other than ${path}`);
    }
    return path;
  }

  /** Entities a crash left without a canonical path; resume each with `allocateCanonicalPath`. */
  findIncomplete(olderThanMs = 5 * 60_000, limit = 500): Promise<ContentEntityRecord[]> {
    return this.entities.findWithoutCanonicalPath(new Date(Date.now() - olderThanMs), limit);
  }

  async addRedirect(path: string, entityId: string, reason: string): Promise<RedirectResult> {
    const normalized = normalizedOrThrow(path);
    const [entity, canonical] = await Promise.all([this.entities.findById(entityId), this.slugs.findCanonical(entityId)]);
    if (!entity || entity.status !== 'active' || !canonical) return 'target_not_canonical';
    if (canonical.path === normalized) return 'would_loop';
    const res = await this.slugs.insert({ path: normalized, entityId, role: 'redirect', reason, createdBy: this.actor });
    if (res.inserted) return 'created';
    return res.existing?.entityId === entityId && res.existing.role === 'redirect' ? 'exists' : 'path_taken';
  }

  async resolvePath(path: string): Promise<PathResolution> {
    const check = normalizeContentPath(path);
    if (!check.ok) return { status: 'invalid' };
    const slug = await this.slugs.findByPath(check.path);
    if (!slug) return { status: 'not_found' };
    const entity = await this.entities.findById(slug.entityId);
    if (!entity) return { status: 'integrity_error', detail: `slug ${slug.path} -> missing ${slug.entityId}` };
    if (slug.role === 'gone' || entity.status === 'removed') return { status: 'gone', entityId: entity.entityId };

    const target = entity.status === 'merged' ? await this.entities.findById(entity.mergedInto as string) : entity;
    if (entity.status === 'merged' && target?.status !== 'active') {
      return { status: 'integrity_error', detail: `${entity.entityId} merged into non-active ${entity.mergedInto}` };
    }
    if (!target || target.status !== 'active' || !target.canonicalPath) return { status: 'not_found' };
    if (target.canonicalPath === check.path) return { status: 'canonical', entity: target };
    return { status: 'redirect', location: target.canonicalPath, entityId: target.entityId };
  }

  /**
   * Lifecycle change with optimistic concurrency. A merge is resumable: calling it again for an
   * entity already merged into the same target re-runs the follow-up steps only.
   */
  async transition(
    entityId: string,
    to: ContentStatus,
    opts: { reason: string; mergedInto?: string }
  ): Promise<ContentEntityRecord> {
    const entity = await this.entities.findById(entityId);
    if (!entity) throw new ContentIdentityError('not_found', entityId);
    const resumingMerge = to === 'merged' && entity.status === 'merged' && entity.mergedInto === opts.mergedInto;

    if (to === 'merged') {
      const target = opts.mergedInto ? await this.entities.findById(opts.mergedInto) : null;
      if (!target || target.entityId === entityId || target.status !== 'active') {
        throw new ContentIdentityError('bad_merge_target', `${entityId} -> ${opts.mergedInto}`);
      }
    }
    let updated = entity;
    if (!resumingMerge) {
      if (!canTransition(entity.status, to)) {
        throw new ContentIdentityError('invalid_transition', `${entity.status} -> ${to}`);
      }
      const res = await this.entities.transition(entityId, {
        from: entity.status,
        to,
        expectedVersion: entity.version,
        mergedInto: opts.mergedInto,
        by: this.actor,
        reason: opts.reason,
      });
      if (!res) throw new ContentIdentityError('concurrent_modification', entityId);
      updated = res;
    }
    if (to === 'merged') {
      const canonical = await this.slugs.findCanonical(entityId);
      if (canonical) {
        await this.slugs.changeRole(canonical.path, {
          entityId,
          from: 'canonical',
          to: 'redirect',
          by: this.actor,
          note: `merged into ${opts.mergedInto}`,
        });
      }
      await this.entities.repointMergedInto(entityId, opts.mergedInto as string);
    }
    return updated;
  }

  /** Reads only: what the title would map to. Persist with `recordTitleDecision`. */
  async matchTitle(input: TitleMatchInput): Promise<TitleMatchDecision> {
    const key = titleIdentityKey(input.title);
    if (!key) return decideTitleMatch(input, []);
    const [rows, tmdbEntity] = await Promise.all([
      this.titleKeys.listByKey(key),
      input.tmdb ? this.entities.findLiveByTmdb(input.tmdb) : Promise.resolve(null),
    ]);
    return decideTitleMatch(input, rows, tmdbEntity);
  }

  /**
   * Stores a new row from `bind` / `create` (with the created entity) / `review`. Insert-only: if
   * another writer stored the same row first, its row is returned and must be used.
   */
  async recordTitleDecision(decision: TitleMatchDecision, createdEntityId?: string): Promise<TitleKeyRecord | null> {
    if (decision.decision !== 'bind' && decision.decision !== 'create' && decision.decision !== 'review') return null;
    const row = decision.decision === 'create' ? { ...decision.row, entityId: createdEntityId } : decision.row;
    if (decision.decision === 'create' && !createdEntityId) {
      throw new ContentIdentityError('missing_entity', `create decision for ${row.id} needs the created entity id`);
    }
    const res = await this.titleKeys.insert({ ...row, decidedBy: this.actor });
    return res.inserted ? res.record : res.existing;
  }

  /** Manual resolution of an ambiguous / manual_review row, or a reviewed re-point. */
  async reviewTitleKey(id: string, entityId: string, reviewer: string, note?: string): Promise<boolean> {
    const by = normalizeReviewerName(reviewer);
    const entity = await this.entities.findById(entityId);
    if (!entity || (entity.status !== 'active' && entity.status !== 'candidate')) {
      throw new ContentIdentityError('bad_review_target', entityId);
    }
    return this.titleKeys.review(id, { entityId, by, note });
  }

  /** Manual review: the title is not an entity (a slot, a container, a wrong provisional binding). */
  async rejectTitleKey(id: string, reviewer: string, note?: string): Promise<boolean> {
    return this.titleKeys.reject(id, { by: normalizeReviewerName(reviewer), note });
  }

  reviewQueue(limit = 100) {
    return Promise.all([this.titleKeys.countByState(), this.titleKeys.listReviewQueue(limit)]).then(
      ([counts, rows]) => ({ counts, rows })
    );
  }
}

/** Null while CONTENT_ENTITIES_ENABLED is off: callers (2D-2+) must keep the legacy path. */
export function createContentIdentityService(
  env: NodeJS.ProcessEnv = process.env,
  actor?: string
): ContentIdentityService | null {
  if (!isContentEntitiesEnabled(env)) return null;
  return new ContentIdentityService(
    new MongoContentEntityRepository(),
    new MongoContentSlugRepository(),
    new MongoContentTitleKeyRepository(),
    actor
  );
}
