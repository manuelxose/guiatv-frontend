import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { ENTITY_ID_PATTERN, normalizeContentPath } from '@/domain/services/contentIdentity';

/** Optional persistent-identity references (2D-1). Absent on every existing row; nothing writes them yet. */
export interface TVReadAiringEntityRef {
  entityId?: string;
  canonicalPath?: string;
}

/** Valid when both are absent, or entityId is an entity id and canonicalPath (if present) a normalised path. */
export function isValidAiringEntityRef(program: unknown): boolean {
  const { entityId, canonicalPath } = (program || {}) as TVReadAiringEntityRef;
  if (entityId === undefined) return canonicalPath === undefined;
  if (typeof entityId !== 'string' || !ENTITY_ID_PATTERN.test(entityId)) return false;
  if (canonicalPath === undefined) return true;
  const check = normalizeContentPath(canonicalPath);
  return check.ok && check.path === canonicalPath;
}

export interface ITVReadAiringDocument {
  id: string;
  date: string;
  viewDate: string;
  channel: Record<string, any>;
  program: Record<string, any> & TVReadAiringEntityRef;
  airing: Record<string, any>;
  assets: Record<string, any>;
  availability: Record<string, any>;
  sourceProvenance: Record<string, any>;
  timingContext: Record<string, any>;
  relevance: Record<string, any>;
  trustDecision?: Record<string, any>;
  searchTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TVReadAiringSchema = new Schema<ITVReadAiringDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    viewDate: { type: String, required: true, index: true },
    channel: { type: Schema.Types.Mixed as any, required: true },
    program: {
      type: Schema.Types.Mixed as any,
      required: true,
      validate: { validator: isValidAiringEntityRef, message: 'invalid program.entityId / program.canonicalPath' },
    },
    airing: { type: Schema.Types.Mixed as any, required: true },
    assets: { type: Schema.Types.Mixed as any, required: true },
    availability: { type: Schema.Types.Mixed as any, required: true },
    sourceProvenance: { type: Schema.Types.Mixed as any, required: true },
    timingContext: { type: Schema.Types.Mixed as any, required: true },
    relevance: { type: Schema.Types.Mixed as any, required: true },
    trustDecision: { type: Schema.Types.Mixed as any },
    searchTokens: { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
    collection: 'tv_read_airings',
  }
);

TVReadAiringSchema.index(
  { date: 1, 'channel.group': 1, 'airing.timeSlotKey': 1, 'channel.sortOrder': 1 },
  { name: 'idx_tvread_date_group_timeslot_sort' }
);
TVReadAiringSchema.index(
  { date: 1, 'channel.group': 1, 'channel.sortOrder': 1, 'airing.start': 1 },
  { name: 'idx_tvread_date_group_sort_start' }
);
TVReadAiringSchema.index(
  { date: 1, 'channel.sortOrder': 1, 'airing.start': 1 },
  { name: 'idx_tvread_date_sort_start' }
);
TVReadAiringSchema.index(
  { date: 1, 'airing.partOfDay': 1, 'channel.sortOrder': 1, 'airing.start': 1 },
  { name: 'idx_tvread_date_partofday_sort_start' }
);
TVReadAiringSchema.index(
  { date: 1, 'airing.start': 1, 'airing.end': 1 },
  { name: 'idx_tvread_date_airing_window' }
);
TVReadAiringSchema.index(
  { 'channel.id': 1, date: 1, 'airing.start': 1 },
  { name: 'idx_tvread_channel_date_start' }
);
TVReadAiringSchema.index(
  { 'program.brandKey': 1, date: 1, 'airing.start': 1 },
  { name: 'idx_tvread_brand_date_start' }
);
TVReadAiringSchema.index(
  { searchTokens: 1, date: 1 },
  { name: 'idx_tvread_search_tokens' }
);
TVReadAiringSchema.index(
  { 'program.sportFacet': 1, date: 1, 'airing.start': 1 },
  { name: 'idx_tvread_sport_date_start' }
);
TVReadAiringSchema.index(
  { 'program.editorialCategory': 1, date: 1, 'airing.start': 1 },
  { name: 'idx_tvread_category_date_start' }
);
// Detail pages resolve "current/next airing" for a known TMDB id (movie/series
// detail view). Without this index that lookup fell back to loading every
// airing for the day and filtering in process — a 20k+ document scan on the
// critical path of every single TMDB-identity detail page.
TVReadAiringSchema.index(
  { 'program.tmdbId': 1, date: 1 },
  { name: 'idx_tvread_tmdbid_date', sparse: true }
);

/**
 * "Next airings of this entity" and the airingStats roll-up (2C §D.4). Deliberately NOT registered
 * on the schema: boot `createIndexes()` and mongoose `autoIndex` would build it on the live 786k-row
 * collection during startup. 2D-2 builds it off-peak first (report §C), then registers it here;
 * boot never drops indexes, so the hand-built index survives restarts in between.
 * Partial: only rows that carry an entityId are indexed, so the index starts empty.
 */
export const TV_READ_AIRING_ENTITY_INDEX = {
  key: { 'program.entityId': 1, 'airing.start': 1 },
  options: {
    name: 'idx_tvread_entity_start',
    // `$exists`, not `$type: 'string'`: the planner does not match an equality lookup to a
    // `$type` partial filter (verified on 8.0, see the 2D-1 test), so `$type` would never be used.
    partialFilterExpression: { 'program.entityId': { $exists: true } },
  },
} as const;

export const TVReadAiringModel = mongoose.model<ITVReadAiringDocument>(
  'TVReadAiring',
  TVReadAiringSchema
);
