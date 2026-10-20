import type { Model } from 'mongoose';
import type {
  ContentEntityInsert,
  ContentEntityRecord,
  ContentSlugInsert,
  ContentSlugRecord,
  EntityTransition,
  IContentEntityRepository,
  IContentSlugRepository,
  IContentTitleKeyRepository,
  InsertResult,
  TitleKeyRecord,
} from '@/domain/repositories/IContentIdentityRepository';
import { ContentKind, TITLE_KEY_STATES, TitleKeyRow, TitleKeyState, TmdbRef } from '@/domain/services/contentIdentity';
import { ContentEntityModel } from '../database/models/ContentEntity.model';
import { ContentSlugModel, IContentSlugDocument } from '../database/models/ContentSlug.model';
import { ContentTitleKeyModel, IContentTitleKeyDocument } from '../database/models/ContentTitleKey.model';

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
    return stripMongo(await ContentEntityModel.findOne({ entityId }).lean().exec());
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
    return toSlug(await ContentSlugModel.findById(path).lean<IContentSlugDocument>().exec());
  }

  async findCanonical(entityId: string): Promise<ContentSlugRecord | null> {
    return toSlug(await ContentSlugModel.findOne({ entityId, role: 'canonical' }).lean<IContentSlugDocument>().exec());
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
