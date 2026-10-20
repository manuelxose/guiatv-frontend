import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { ENTITY_ID_PATTERN, normalizeContentPath, SLUG_ROLES } from '@/domain/services/contentIdentity';
import type { SlugHistoryEntry } from '@/domain/repositories/IContentIdentityRepository';

export interface IContentSlugDocument {
  _id: string;
  entityId: string;
  role: (typeof SLUG_ROLES)[number];
  reason: string;
  createdBy: string;
  history: SlugHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const SlugHistorySchema = new Schema(
  {
    at: { type: Date, required: true },
    by: { type: String, required: true, maxlength: 64 },
    action: { type: String, enum: ['create', 'role_change', 'reassign'], required: true },
    fromRole: { type: String, enum: SLUG_ROLES },
    toRole: { type: String, enum: SLUG_ROLES },
    fromEntityId: { type: String, match: ENTITY_ID_PATTERN },
    toEntityId: { type: String, match: ENTITY_ID_PATTERN },
    note: { type: String, maxlength: 500 },
  },
  { _id: false, strict: 'throw' }
);

const ContentSlugSchema = new Schema<IContentSlugDocument>(
  {
    // The full normalised public path is the key: globally unique by construction.
    _id: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => {
          const check = normalizeContentPath(value);
          return check.ok && check.path === value;
        },
        message: 'path must be a normalised content path',
      },
    },
    entityId: { type: String, required: true, match: ENTITY_ID_PATTERN },
    role: { type: String, enum: SLUG_ROLES, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 64 },
    createdBy: { type: String, required: true, maxlength: 64 },
    history: { type: [SlugHistorySchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'content_slugs',
    strict: 'throw',
    autoIndex: false,
    autoCreate: false,
  }
);

ContentSlugSchema.index({ entityId: 1, role: 1 }, { name: 'idx_slug_entity_role' });
// Exactly one canonical path per entity.
ContentSlugSchema.index(
  { entityId: 1 },
  { name: 'uniq_slug_canonical_per_entity', unique: true, partialFilterExpression: { role: 'canonical' } }
);

export const ContentSlugModel = mongoose.model<IContentSlugDocument>('ContentSlug', ContentSlugSchema);
