import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import {
  CONTENT_KINDS,
  ENTITY_ID_PATTERN,
  MATCH_METHODS,
  TITLE_KEY_STATES,
} from '@/domain/services/contentIdentity';

export interface IContentTitleKeyDocument {
  _id: string;
  key: string;
  kind: (typeof CONTENT_KINDS)[number];
  discriminator: string;
  year?: number;
  entityId?: string;
  state: (typeof TITLE_KEY_STATES)[number];
  method: (typeof MATCH_METHODS)[number];
  confidence: number;
  candidates?: string[];
  reason?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  decidedBy: string;
  review?: { by: string; at: Date; note?: string };
}

const ContentTitleKeySchema = new Schema<IContentTitleKeyDocument>(
  {
    // `key|kind|discriminator` (titleKeyId), never the bare key.
    _id: { type: String, required: true, maxlength: 400 },
    key: { type: String, required: true, match: /^[a-z0-9_]+$/ },
    kind: { type: String, enum: CONTENT_KINDS, required: true },
    discriminator: { type: String, required: true, match: /^(\*|tmdb:(movie|tv):\d+|year:\d{4})$/ },
    year: { type: Number, min: 1888, max: 2100 },
    entityId: {
      type: String,
      match: ENTITY_ID_PATTERN,
      required(this: { state?: string }) {
        return this.state === 'verified' || this.state === 'candidate';
      },
      validate: {
        validator(this: { state?: string }) {
          return this.state === 'verified' || this.state === 'candidate';
        },
        message: 'verified/candidate rows need an entityId; ambiguous/manual_review rows must not have one',
      },
    },
    state: { type: String, enum: TITLE_KEY_STATES, required: true },
    method: { type: String, enum: MATCH_METHODS, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    candidates: { type: [{ type: String, match: ENTITY_ID_PATTERN }], default: undefined },
    reason: { type: String, maxlength: 64 },
    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    decidedBy: { type: String, required: true, maxlength: 64 },
    review: {
      type: new Schema(
        {
          by: { type: String, required: true, maxlength: 64 },
          at: { type: Date, required: true },
          note: { type: String, maxlength: 500 },
        },
        { _id: false, strict: 'throw' }
      ),
    },
  },
  {
    collection: 'content_title_keys',
    strict: 'throw',
    autoIndex: false,
    autoCreate: false,
  }
);

// Every discriminator of one title (candidate matching).
ContentTitleKeySchema.index({ key: 1, kind: 1 }, { name: 'idx_titlekey_key_kind' });
ContentTitleKeySchema.index(
  { entityId: 1 },
  { name: 'idx_titlekey_entity', partialFilterExpression: { entityId: { $type: 'string' } } }
);
// Review queue (ambiguity reporting).
ContentTitleKeySchema.index(
  { state: 1, lastSeenAt: -1 },
  { name: 'idx_titlekey_review', partialFilterExpression: { state: { $in: ['ambiguous', 'manual_review'] } } }
);

export const ContentTitleKeyModel = mongoose.model<IContentTitleKeyDocument>(
  'ContentTitleKey',
  ContentTitleKeySchema
);
