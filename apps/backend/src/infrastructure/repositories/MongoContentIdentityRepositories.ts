import type { Model } from 'mongoose';
import type {
  AiringEntityRef,
  CatalogEvidence,
  ContentEntityInsert,
  ContentEntityRecord,
  ContentSlugInsert,
  ContentSlugRecord,
  EntityTransition,
  IAiringEntityRefWriter,
  IContentAttestationRepository,
  IContentEntityRepository,
  IContentSlugRepository,
  IContentTitleKeyRepository,
  IIdentityEvidenceSource,
  InsertResult,
  TitleKeyRecord,
} from '@/domain/repositories/IContentIdentityRepository';
import {
  ContentKind,
  HistoricWork,
  legacyCatalogSlugs,
  TITLE_KEY_STATES,
  titleIdentityKey,
  TitleKeyRow,
  TitleKeyState,
  TmdbRef,
} from '@/domain/services/contentIdentity';
import { MAX_CHAIN, type AttestationRecord } from '@/domain/services/contentCertification';
import { ContentAttestationModel } from '../database/models/ContentAttestation.model';
import { ContentEntityModel } from '../database/models/ContentEntity.model';
import { ContentSlugModel, IContentSlugDocument } from '../database/models/ContentSlug.model';
import { ContentTitleKeyModel, IContentTitleKeyDocument } from '../database/models/ContentTitleKey.model';
import { MediaCatalogModel } from '../database/models/MediaCatalogEntry.model';
import { TVProgramBrandModel } from '../database/models/TVProgramBrand.model';
import { TV_READ_AIRING_ENTITY_INDEX, TVReadAiringModel } from '../database/models/TVReadAiring.model';

const DUPLICATE_KEY_ERROR_CODE = 11000;

export class ContentIdentityNotReadyError extends Error {
  constructor(collection: string, missing: string[]) {
    super(`${collection} is missing indexes [${missing.join(', ')}]; refusing to write without uniqueness guarantees`);
    this.name = 'ContentIdentityNotReadyError';
  }
}

const readyModels = new WeakSet<Model<any>>();

/**
 * Writes run only once every schema index exists. Mongo would otherwise create a missing
 * collection implicitly on first insert, without the unique indexes this design relies on.
 * Reads need no guard: a missing collection reads as empty.
 */
async function assertIndexed(model: Model<any>): Promise<void> {
  if (readyModels.has(model)) return;
  const toCreate = await model
    .diffIndexes()
    .then((diff) => diff.toCreate.map((spec: any) => spec?.name ?? JSON.stringify(spec)))
    .catch(() => ['<collection missing>']);
  if (toCreate.length) throw new ContentIdentityNotReadyError(model.collection.name, toCreate);
  readyModels.add(model);
}

function duplicateKeyPattern(error: unknown): Record<string, unknown> | null {
  const e = error as { code?: number; keyPattern?: Record<string, unknown> };
  return e?.code === DUPLICATE_KEY_ERROR_CODE ? e.keyPattern ?? {} : null;
}

/** `$in` lists stay well under the 16 MB command limit and keep each query's plan cheap. */
const IN_CHUNK = 1000;
async function inChunks<T, R>(values: T[], run: (chunk: T[]) => Promise<R[]>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < values.length; i += IN_CHUNK) out.push(...(await run(values.slice(i, i + IN_CHUNK))));
  return out;
}

const stripMongo = <T>(doc: any): T => {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return rest as T;
};

export class MongoContentEntityRepository implements IContentEntityRepository {
  async insert(
    entity: ContentEntityInsert
  ): Promise<InsertResult<ContentEntityRecord, 'tmdb_taken' | 'id_taken'>> {
    await assertIndexed(ContentEntityModel);
    try {
      const doc = await ContentEntityModel.create({ ...entity, status: 'candidate', version: 0 });
      return { inserted: true, record: stripMongo(doc.toObject()) };
    } catch (error) {
      const pattern = duplicateKeyPattern(error);
      if (!pattern) throw error;
      if ('entityId' in pattern) return { inserted: false, conflict: 'id_taken', existing: null };
      const tmdb = entity.externalIds.tmdb as TmdbRef;
      return { inserted: false, conflict: 'tmdb_taken', existing: await this.findLiveByTmdb(tmdb) };
    }
  }

  async findById(entityId: string): Promise<ContentEntityRecord | null> {
    const rows = await ContentEntityModel.find({ entityId }).limit(2).maxTimeMS(2000).lean().exec();
    if (rows.length > 1) throw new Error('Conflicting entity ownership');
    return stripMongo(rows[0] ?? null);
  }

  async findByIds(entityIds: string[]): Promise<ContentEntityRecord[]> {
    return inChunks([...new Set(entityIds)], async (chunk) =>
      (await ContentEntityModel.find({ entityId: { $in: chunk } }).lean().exec()).map((d) => stripMongo<ContentEntityRecord>(d))
    );
  }

  async findLiveByTmdbRefs(refs: TmdbRef[]): Promise<ContentEntityRecord[]> {
    const byType = (type: TmdbRef['type']) => [...new Set(refs.filter((r) => r.type === type).map((r) => r.id))];
    const out: ContentEntityRecord[] = [];
    for (const type of ['movie', 'tv'] as const) {
      out.push(
        ...(await inChunks(byType(type), async (ids) =>
          (
            await ContentEntityModel.find({
              'externalIds.tmdb.type': type,
              'externalIds.tmdb.id': { $in: ids },
              status: { $in: ['candidate', 'active'] },
            })
              .lean()
              .exec()
          ).map((d) => stripMongo<ContentEntityRecord>(d))
        ))
      );
    }
    return out;
  }

  async findLiveByTmdb(ref: TmdbRef): Promise<ContentEntityRecord | null> {
    const doc = await ContentEntityModel.findOne({
      'externalIds.tmdb.type': ref.type,
      'externalIds.tmdb.id': ref.id,
      status: { $in: ['candidate', 'active'] },
    })
      .lean()
      .exec();
    return stripMongo(doc);
  }

  async findByNormalizedTitle(normalizedTitle: string, kind?: ContentKind): Promise<ContentEntityRecord[]> {
    const docs = await ContentEntityModel.find(kind ? { normalizedTitle, kind } : { normalizedTitle })
      .lean()
      .exec();
    return docs.map((doc) => stripMongo<ContentEntityRecord>(doc));
  }

  async setCanonicalPath(entityId: string, path: string): Promise<boolean> {
    await assertIndexed(ContentEntityModel);
    const res = await ContentEntityModel.updateOne(
      { entityId, canonicalPath: { $exists: false } },
      { $set: { canonicalPath: path }, $inc: { version: 1 } },
      { runValidators: true }
    ).exec();
    if (res.modifiedCount === 1) return true;
    return (await this.findById(entityId))?.canonicalPath === path;
  }

  async transition(entityId: string, change: EntityTransition): Promise<ContentEntityRecord | null> {
    await assertIndexed(ContentEntityModel);
    const set: Record<string, unknown> = {
      status: change.to,
      lifecycle: { changedAt: new Date(), changedBy: change.by, reason: change.reason },
    };
    if (change.mergedInto) set.mergedInto = change.mergedInto;
    if (change.matching) set.matching = change.matching;
    const doc = await ContentEntityModel.findOneAndUpdate(
      { entityId, status: change.from, version: change.expectedVersion },
      { $set: set, $inc: { version: 1 } },
      // Document validators read `this.status`, which a query update doesn't have; the service
      // checks the transition table and the merge target before calling this.
      { new: true }
    )
      .lean()
      .exec();
    return stripMongo(doc);
  }

  async certify(
    entityId: string,
    change: { expectedVersion: number; matching: ContentEntityRecord['matching']; certification: NonNullable<ContentEntityRecord['certification']>; by: string; reason: string }
  ): Promise<ContentEntityRecord | null> {
    await assertIndexed(ContentEntityModel);
    const doc = await ContentEntityModel.findOneAndUpdate(
      // Only an independently supported candidate that still owns a canonical path can be certified.
      { entityId, status: 'candidate', version: change.expectedVersion, 'matching.assurance': 'independently_supported', canonicalPath: { $exists: true }, certification: { $exists: false } },
      { $set: { status: 'active', matching: change.matching, certification: change.certification, lifecycle: { changedAt: new Date(), changedBy: change.by, reason: change.reason } }, $inc: { version: 1 } },
      { new: true }
    ).lean().exec();
    return stripMongo(doc);
  }

  async revokeCertification(
    entityId: string,
    change: { expectedVersion: number; attestationId: string; matching: ContentEntityRecord['matching']; by: string; reason: string }
  ): Promise<ContentEntityRecord | null> {
    await assertIndexed(ContentEntityModel);
    const doc = await ContentEntityModel.findOneAndUpdate(
      { entityId, status: 'active', version: change.expectedVersion, 'matching.method': 'ai_attested', 'certification.attestationId': change.attestationId },
      { $set: { status: 'candidate', matching: change.matching, lifecycle: { changedAt: new Date(), changedBy: change.by, reason: change.reason } }, $unset: { certification: '' }, $inc: { version: 1 } },
      { new: true }
    ).lean().exec();
    return stripMongo(doc);
  }

  async replaceMetadata(
    entityId: string,
    change: { expectedVersion: number; metadata: ContentEntityRecord['metadata']; originalTitle?: string }
  ): Promise<ContentEntityRecord | null> {
    await assertIndexed(ContentEntityModel);
    // Query update: schema validators do not run (like `certify`/`transition`); `planEnrichment` is what validates the copy (type, id, title, year, image path shape).
    const now = new Date();
    const filter = { entityId, status: { $in: ['candidate', 'active'] }, version: change.expectedVersion };
    const set: Record<string, unknown> = { metadata: change.metadata, contentChangedAt: now };
    // The identity's original title is only ever filled in, never rewritten.
    const apply = (extra: Record<string, unknown>, query: Record<string, unknown>) =>
      ContentEntityModel.findOneAndUpdate(query, { $set: { ...set, ...extra }, $inc: { version: 1 } }, { new: true }).lean().exec();
    const doc = change.originalTitle
      ? (await apply({ originalTitle: change.originalTitle }, { ...filter, originalTitle: { $exists: false } })) ?? (await apply({}, filter))
      : await apply({}, filter);
    return stripMongo(doc);
  }

  async repointMergedInto(fromEntityId: string, toEntityId: string): Promise<number> {
    await assertIndexed(ContentEntityModel);
    const res = await ContentEntityModel.updateMany(
      { status: 'merged', mergedInto: fromEntityId },
      { $set: { mergedInto: toEntityId }, $inc: { version: 1 } }
    ).exec();
    return res.modifiedCount;
  }

  async findWithoutCanonicalPath(createdBefore: Date, limit: number): Promise<ContentEntityRecord[]> {
    // ponytail: unindexed scan; fine for a repair job on a collection bounded at ~10^5 rows.
    // Add a partial index on { createdAt } if this runs on a hot path.
    const docs = await ContentEntityModel.find({
      canonicalPath: { $exists: false },
      status: { $in: ['candidate', 'active'] },
      createdAt: { $lt: createdBefore },
    })
      .limit(Math.max(1, limit))
      .lean()
      .exec();
    return docs.map((doc) => stripMongo<ContentEntityRecord>(doc));
  }
}

const toSlug = (doc: IContentSlugDocument | null): ContentSlugRecord | null => {
  if (!doc) return null;
  const { _id, ...rest } = doc as IContentSlugDocument & { __v?: number };
  delete (rest as { __v?: number }).__v;
  return { path: _id, ...(rest as Omit<ContentSlugRecord, 'path'>) };
};

export class MongoContentSlugRepository implements IContentSlugRepository {
  async findByPath(path: string): Promise<ContentSlugRecord | null> {
    return toSlug(await ContentSlugModel.findById(path).maxTimeMS(2000).lean<IContentSlugDocument>().exec());
  }

  async findByPaths(paths: string[]): Promise<ContentSlugRecord[]> {
    return inChunks([...new Set(paths)], async (chunk) =>
      (await ContentSlugModel.find({ _id: { $in: chunk } }).lean<IContentSlugDocument[]>().exec()).map(
        (doc) => toSlug(doc) as ContentSlugRecord
      )
    );
  }

  async findCanonical(entityId: string): Promise<ContentSlugRecord | null> {
    const rows = await ContentSlugModel.find({ entityId, role: 'canonical' }).limit(2).maxTimeMS(2000).lean<IContentSlugDocument[]>().exec();
    if (rows.length > 1) throw new Error('Conflicting canonical ownership');
    return toSlug(rows[0] ?? null);
  }

  async listByEntity(entityId: string): Promise<ContentSlugRecord[]> {
    const docs = await ContentSlugModel.find({ entityId }).lean<IContentSlugDocument[]>().exec();
    return docs.map((doc) => toSlug(doc) as ContentSlugRecord);
  }

  async insert(
    input: ContentSlugInsert
  ): Promise<InsertResult<ContentSlugRecord, 'path_taken' | 'entity_has_canonical'>> {
    await assertIndexed(ContentSlugModel);
    try {
      const doc = await ContentSlugModel.create({
        _id: input.path,
        entityId: input.entityId,
        role: input.role,
        reason: input.reason,
        createdBy: input.createdBy,
        history: [{ at: new Date(), by: input.createdBy, action: 'create', toRole: input.role }],
      });
      return { inserted: true, record: toSlug(doc.toObject()) as ContentSlugRecord };
    } catch (error) {
      const pattern = duplicateKeyPattern(error);
      if (!pattern) throw error;
      if ('entityId' in pattern) {
        return { inserted: false, conflict: 'entity_has_canonical', existing: await this.findCanonical(input.entityId) };
      }
      return { inserted: false, conflict: 'path_taken', existing: await this.findByPath(input.path) };
    }
  }

  async changeRole(
    path: string,
    change: { entityId: string; from: ContentSlugRecord['role']; to: ContentSlugRecord['role']; by: string; note?: string }
  ): Promise<boolean> {
    await assertIndexed(ContentSlugModel);
    const res = await ContentSlugModel.updateOne(
      { _id: path, entityId: change.entityId, role: change.from },
      {
        $set: { role: change.to },
        $push: { history: { at: new Date(), by: change.by, action: 'role_change', fromRole: change.from, toRole: change.to, note: change.note } },
      }
    ).exec();
    return res.modifiedCount === 1;
  }

  async reassign(
    path: string,
    change: { fromEntityId: string; toEntityId: string; reviewedBy: string; note: string }
  ): Promise<boolean> {
    await assertIndexed(ContentSlugModel);
    const res = await ContentSlugModel.updateOne(
      { _id: path, entityId: change.fromEntityId, role: { $ne: 'canonical' } },
      {
        $set: { entityId: change.toEntityId },
        $push: {
          history: {
            at: new Date(),
            by: change.reviewedBy,
            action: 'reassign',
            fromEntityId: change.fromEntityId,
            toEntityId: change.toEntityId,
            note: change.note,
          },
        },
      }
    ).exec();
    return res.modifiedCount === 1;
  }
}

const toTitleKey = (doc: IContentTitleKeyDocument | null): TitleKeyRecord | null => {
  if (!doc) return null;
  const { _id, ...rest } = doc as IContentTitleKeyDocument & { __v?: number };
  delete (rest as { __v?: number }).__v;
  return { id: _id, ...(rest as Omit<TitleKeyRecord, 'id'>) };
};

export class MongoContentTitleKeyRepository implements IContentTitleKeyRepository {
  async listByKey(key: string): Promise<TitleKeyRecord[]> {
    const docs = await ContentTitleKeyModel.find({ key }).lean<IContentTitleKeyDocument[]>().exec();
    return docs.map((doc) => toTitleKey(doc) as TitleKeyRecord);
  }

  async listByKeys(keys: string[]): Promise<TitleKeyRecord[]> {
    return inChunks([...new Set(keys)], async (chunk) =>
      (await ContentTitleKeyModel.find({ key: { $in: chunk } }).lean<IContentTitleKeyDocument[]>().exec()).map(
        (doc) => toTitleKey(doc) as TitleKeyRecord
      )
    );
  }

  async touch(ids: string[], at: Date): Promise<void> {
    if (!ids.length) return;
    await assertIndexed(ContentTitleKeyModel);
    await inChunks(ids, async (chunk) => {
      await ContentTitleKeyModel.updateMany({ _id: { $in: chunk } }, { $max: { lastSeenAt: at } }).exec();
      return [];
    });
  }

  async insert(row: TitleKeyRow & { decidedBy: string }): Promise<InsertResult<TitleKeyRecord, 'exists'>> {
    await assertIndexed(ContentTitleKeyModel);
    const now = new Date();
    const { id, ...fields } = row;
    try {
      const doc = await ContentTitleKeyModel.create({ _id: id, ...fields, firstSeenAt: now, lastSeenAt: now });
      return { inserted: true, record: toTitleKey(doc.toObject()) as TitleKeyRecord };
    } catch (error) {
      if (!duplicateKeyPattern(error)) throw error;
      return {
        inserted: false,
        conflict: 'exists',
        existing: toTitleKey(await ContentTitleKeyModel.findById(id).lean<IContentTitleKeyDocument>().exec()),
      };
    }
  }

  async review(id: string, change: { entityId: string; by: string; note?: string }): Promise<boolean> {
    await assertIndexed(ContentTitleKeyModel);
    const res = await ContentTitleKeyModel.updateOne(
      { _id: id },
      {
        $set: {
          entityId: change.entityId,
          state: 'verified',
          method: 'manual',
          confidence: 1,
          decidedBy: change.by,
          review: { by: change.by, at: new Date(), note: change.note },
        },
        $unset: { candidates: 1, reason: 1 },
      }
    ).exec();
    return res.modifiedCount === 1;
  }

  async reject(id: string, change: { by: string; note?: string }): Promise<boolean> {
    await assertIndexed(ContentTitleKeyModel);
    const res = await ContentTitleKeyModel.updateOne(
      { _id: id, state: { $in: ['candidate', 'ambiguous', 'manual_review'] } },
      {
        $set: { state: 'rejected', decidedBy: change.by, review: { by: change.by, at: new Date(), note: change.note } },
        $unset: { entityId: 1 },
      }
    ).exec();
    return res.modifiedCount === 1;
  }

  async flagClaimConflict(id: string, change: { entityId: string; candidates: string[]; by: string }): Promise<boolean> {
    await assertIndexed(ContentTitleKeyModel);
    const res = await ContentTitleKeyModel.updateOne(
      { _id: id, state: 'candidate', entityId: change.entityId },
      {
        $set: { state: 'manual_review', reason: 'claim_conflict', candidates: change.candidates, decidedBy: change.by },
        $unset: { entityId: 1 },
      }
    ).exec();
    return res.modifiedCount === 1;
  }

  async listReviewQueue(limit: number): Promise<TitleKeyRecord[]> {
    const docs = await ContentTitleKeyModel.find({ state: { $in: ['ambiguous', 'manual_review'] } })
      .sort({ lastSeenAt: -1 })
      .limit(Math.max(1, limit))
      .lean<IContentTitleKeyDocument[]>()
      .exec();
    return docs.map((doc) => toTitleKey(doc) as TitleKeyRecord);
  }

  async countByState(): Promise<Record<TitleKeyState, number>> {
    const rows = await ContentTitleKeyModel.aggregate<{ _id: TitleKeyState; n: number }>([
      { $group: { _id: '$state', n: { $sum: 1 } } },
    ]).exec();
    const counts = Object.fromEntries(TITLE_KEY_STATES.map((state) => [state, 0])) as Record<TitleKeyState, number>;
    for (const row of rows) counts[row._id] = row.n;
    return counts;
  }
}

const parseYear = (value: unknown): number | undefined => {
  const year = Number.parseInt(String(value ?? ''), 10);
  return year >= 1888 && year <= 2100 ? year : undefined;
};

/** One legacy-title scan at a time per process: parallel rebuilds queue instead of each holding a scan. */
let historicScan: Promise<unknown> = Promise.resolve();

export class MongoIdentityEvidenceSource implements IIdentityEvidenceSource {
  async catalogEntries(mediaIds: string[], tmdbIds: number[]): Promise<CatalogEvidence[]> {
    const ids = [...new Set(mediaIds)].filter((id) => /^[0-9a-f]{24}$/i.test(id));
    const or: Record<string, unknown>[] = [];
    if (ids.length) or.push({ _id: { $in: ids } });
    if (tmdbIds.length) or.push({ tmdbId: { $in: [...new Set(tmdbIds)] } });
    if (!or.length) return [];
    const docs = await MediaCatalogModel.find({ $or: or }, { tmdbId: 1, tmdbType: 1, title: 1, originalTitle: 1, year: 1 })
      .lean()
      .exec();
    return docs.map((doc: any) => ({
      mediaId: String(doc._id),
      tmdb: doc.tmdbId && doc.tmdbType ? { type: doc.tmdbType, id: doc.tmdbId } : undefined,
      title: doc.title,
      originalTitle: doc.originalTitle,
      year: parseYear(doc.year),
    }));
  }

  /**
   * Streams every brand title (~150k in production) and catalogue title (~17k) and keeps only the
   * works that answer a requested slug, so memory is bounded by the request, not by the
   * collections (2D-2 §O.4: a full in-memory index held 110 MB of heap at that scale).
   * ponytail: one full scan per call (~1 s at 168k titles). Upgrade path: store the legacy slugs on
   * tv_program_brands with an index and query them by `$in`.
   */
  historicSlugOwners(slugs: string[]): Promise<ReadonlyMap<string, readonly HistoricWork[]>> {
    const run = historicScan.then(() => this.scanHistoric(new Set(slugs)));
    historicScan = run.catch(() => undefined);
    return run;
  }

  private async scanHistoric(wanted: ReadonlySet<string>): Promise<Map<string, HistoricWork[]>> {
    const map = new Map<string, HistoricWork[]>();
    if (!wanted.size) return map;
    const add = (titles: Array<string | undefined>, work: Omit<HistoricWork, 'keys'> = {}) => {
      const slugs = titles.flatMap((t) => (t ? legacyCatalogSlugs(t) : [])).filter((slug) => wanted.has(slug));
      if (!slugs.length) return;
      const keys = new Set(titles.map((t) => titleIdentityKey(t)).filter((k): k is string => Boolean(k)));
      for (const slug of new Set(slugs)) map.set(slug, [...(map.get(slug) ?? []), { keys, ...work }]);
    };
    for await (const doc of TVProgramBrandModel.find({}, { _id: 0, title: 1 }).lean().batchSize(1000).cursor()) {
      add([(doc as any).title]);
    }
    const catalog = MediaCatalogModel.find({}, { _id: 0, title: 1, originalTitle: 1, tmdbId: 1, tmdbType: 1, year: 1 }).lean().batchSize(1000);
    for await (const doc of catalog.cursor()) {
      const d = doc as any;
      add([d.title, d.originalTitle], {
        tmdb: d.tmdbId && (d.tmdbType === 'movie' || d.tmdbType === 'tv') ? { type: d.tmdbType, id: d.tmdbId } : undefined,
        year: parseYear(d.year),
      });
    }
    return map;
  }
}

export class MongoAiringEntityRefWriter implements IAiringEntityRefWriter {
  async indexReady(): Promise<boolean> {
    const spec = TV_READ_AIRING_ENTITY_INDEX;
    const live = (await TVReadAiringModel.collection.indexes()).find((i) => i.name === spec.options.name);
    return Boolean(
      live &&
        JSON.stringify(live.key) === JSON.stringify(spec.key) &&
        JSON.stringify(live.partialFilterExpression) === JSON.stringify(spec.options.partialFilterExpression)
    );
  }

  async apply(date: string, refs: AiringEntityRef[]): Promise<number> {
    let modified = 0;
    for (let i = 0; i < refs.length; i += IN_CHUNK) {
      const res = await TVReadAiringModel.bulkWrite(
        refs.slice(i, i + IN_CHUNK).map((ref) => ({
          updateOne: {
            filter: { id: ref.airingId, date },
            update: ref.canonicalPath
              ? { $set: { 'program.entityId': ref.entityId, 'program.canonicalPath': ref.canonicalPath } }
              : { $set: { 'program.entityId': ref.entityId }, $unset: { 'program.canonicalPath': 1 as const } },
          },
        })),
        { ordered: false }
      );
      modified += res.modifiedCount;
    }
    return modified;
  }
}

/** Read-only projection of the whole registry for the canonical audit (a slug row's path is its `_id`). */
export async function readRegistryRows() {
  const entities = await ContentEntityModel.find({}, { entityId: 1, kind: 1, status: 1, canonicalPath: 1, mergedInto: 1, _id: 0 }).limit(200_000).lean();
  const slugs = await ContentSlugModel.find({}, { entityId: 1, role: 1 }).limit(500_000).lean();
  return { entities, slugs: slugs.map((s) => ({ path: String(s._id), entityId: s.entityId, role: s.role })) };
}

export class MongoContentAttestationRepository implements IContentAttestationRepository {
  async insert(record: AttestationRecord): Promise<InsertResult<AttestationRecord, 'seq_taken' | 'exists'>> {
    await assertIndexed(ContentAttestationModel);
    try {
      await ContentAttestationModel.create({
        entityId: record.entityId, seq: record.seq, type: record.body.type, attestationId: record.body.attestationId,
        prevHash: record.prevHash, hash: record.hash, body: record.body,
      });
      return { inserted: true, record };
    } catch (error) {
      if (!duplicateKeyPattern(error)) throw error;
      const chain = await this.listForEntity(record.entityId);
      const same = chain.find((r) => r.body.type === record.body.type && r.body.attestationId === record.body.attestationId);
      return same ? { inserted: false, conflict: 'exists', existing: same } : { inserted: false, conflict: 'seq_taken', existing: null };
    }
  }

  async listForEntity(entityId: string): Promise<AttestationRecord[]> {
    const docs = await ContentAttestationModel.find({ entityId }).sort({ seq: 1 }).limit(MAX_CHAIN + 1).maxTimeMS(2000).lean().exec();
    return docs.map((d) => ({ entityId: d.entityId, seq: d.seq, prevHash: d.prevHash, hash: d.hash, body: d.body }));
  }
}
