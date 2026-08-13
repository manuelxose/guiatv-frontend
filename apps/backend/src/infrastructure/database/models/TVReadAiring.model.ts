import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface ITVReadAiringDocument {
  id: string;
  date: string;
  viewDate: string;
  channel: Record<string, any>;
  program: Record<string, any>;
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
    program: { type: Schema.Types.Mixed as any, required: true },
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

export const TVReadAiringModel = mongoose.model<ITVReadAiringDocument>(
  'TVReadAiring',
  TVReadAiringSchema
);
