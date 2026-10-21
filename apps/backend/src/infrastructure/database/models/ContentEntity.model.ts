import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import {
  ASSURANCE_LEVELS,
  CONTENT_KINDS,
  CONTENT_STATUSES,
  ENTITY_ID_PATTERN,
  ENTITY_MATCH_METHODS,
  mayBeIndexable,
  normalizeContentPath,
  PROVENANCE_SOURCES,
} from '@/domain/services/contentIdentity';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';

const strictSub = { _id: false, strict: 'throw' } as const;

const ProvenancedValueSchema = new Schema(
  {
    value: { type: Schema.Types.Mixed, required: true },
    source: { type: String, enum: PROVENANCE_SOURCES, required: true },
    updatedAt: { type: Date, required: true },
  },
  strictSub
);

const TmdbRefSchema = new Schema(
  {
    type: { type: String, enum: ['movie', 'tv'], required: true },
    id: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  strictSub
);

const isEntityId = (value: unknown) => value === undefined || value === null || ENTITY_ID_PATTERN.test(String(value));

const ContentEntitySchema = new Schema<ContentEntityRecord>(
  {
    entityId: { type: String, required: true, immutable: true, match: ENTITY_ID_PATTERN },
    kind: { type: String, enum: CONTENT_KINDS, required: true },
    status: { type: String, enum: CONTENT_STATUSES, required: true, default: 'candidate' },
    mergedInto: {
      type: String,
      required(this: { status?: string }) {
        return this.status === 'merged';
      },
      validate: [
        { validator: isEntityId, message: 'mergedInto must be an entity id' },
        {
          validator(this: { status?: string }) {
            return this.status === 'merged';
          },
          message: 'mergedInto is set only when status is merged',
        },
      ],
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    normalizedTitle: { type: String, required: true, trim: true, minlength: 1, maxlength: 300 },
    originalTitle: { type: String, trim: true, maxlength: 300 },
    year: { type: Number, min: 1888, max: 2100, validate: Number.isInteger },
    externalIds: { type: new Schema({ tmdb: TmdbRefSchema }, strictSub), default: () => ({}) },
    canonicalPath: {
      type: String,
      validate: {
        validator: (value: string) => {
          const check = normalizeContentPath(value);
          return check.ok && check.path === value;
        },
        message: 'canonicalPath must be a normalised content path',
      },
    },
    metadata: {
      type: new Schema(
        { synopsis: ProvenancedValueSchema, genres: ProvenancedValueSchema, images: ProvenancedValueSchema },
        strictSub
      ),
      default: () => ({}),
    },
    matching: {
      type: new Schema(
        {
          method: { type: String, enum: ENTITY_MATCH_METHODS, required: true },
          confidence: { type: Number, required: true, min: 0, max: 1 },
          decidedAt: { type: Date, required: true },
          decidedBy: { type: String, required: true, maxlength: 64 },
          assurance: { type: String, enum: ASSURANCE_LEVELS },
        },
        strictSub
      ),
      required: true,
    },
    indexability: {
      type: new Schema(
        {
          state: { type: String, enum: ['index', 'noindex'], required: true, default: 'noindex' },
          reasons: { type: [String], default: ['not_evaluated'] },
          evaluatedAt: { type: Date },
        },
        strictSub
      ),
      default: () => ({}),
      validate: {
        validator(this: ContentEntityRecord, value: ContentEntityRecord['indexability']) {
          return value?.state !== 'index' || mayBeIndexable(this);
        },
        message: 'only an active entity with a manual or verified TMDB identity may be indexed',
      },
    },
    lifecycle: {
      type: new Schema(
        {
          changedAt: { type: Date, required: true },
          changedBy: { type: String, required: true, maxlength: 64 },
          reason: { type: String, required: true, maxlength: 200 },
        },
        strictSub
      ),
    },
    certification: {
      type: new Schema(
        {
          attestationId: { type: String, required: true, maxlength: 64 },
          seq: { type: Number, required: true, min: 0, validate: Number.isInteger },
          hash: { type: String, required: true, match: /^[0-9a-f]{64}$/ },
          certifiedAt: { type: Date, required: true },
        },
        strictSub
      ),
    },
    contentChangedAt: { type: Date },
    version: { type: Number, required: true, default: 0, min: 0 },
  },
  {
    timestamps: true,
    collection: 'content_entities',
    strict: 'throw',
    // Inert until enabled: nothing is created on import or first use. Collections and indexes are
    // built only by `ensureMongoCollectionsAndIndexes` when CONTENT_ENTITIES_ENABLED is on.
    autoIndex: false,
    autoCreate: false,
  }
);

ContentEntitySchema.index({ entityId: 1 }, { name: 'uniq_entity_id', unique: true });
// One live entity per TMDB work. Merged/removed rows keep their TMDB id without colliding.
ContentEntitySchema.index(
  { 'externalIds.tmdb.type': 1, 'externalIds.tmdb.id': 1 },
  {
    name: 'uniq_entity_tmdb_live',
    unique: true,
    partialFilterExpression: {
      'externalIds.tmdb.id': { $type: 'number' },
      status: { $in: ['candidate', 'active'] },
    },
  }
);
// Collision checks and admin review; deliberately not unique (§E.3).
ContentEntitySchema.index({ normalizedTitle: 1, kind: 1 }, { name: 'idx_entity_title_kind' });
// Sitemap pagination by indexability (2D-8).
ContentEntitySchema.index(
  { 'indexability.state': 1, kind: 1, entityId: 1 },
  { name: 'idx_entity_indexability' }
);

export const ContentEntityModel = mongoose.model<ContentEntityRecord>('ContentEntity', ContentEntitySchema);
