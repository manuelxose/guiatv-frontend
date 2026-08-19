import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

/**
 * Broadcast reconciliation mappings + manual overrides.
 *
 * Stores the relationship `FootballMatch <-> EPG airing <-> channel` together
 * with the confidence and provenance. Manual overrides live here too and
 * survive subsequent syncs (they are upserted by `matchId + channelId`).
 */
export interface IFootballBroadcastMappingDocument {
  matchId: string;
  matchSlug: string;
  airingId?: string;
  channelId: string;
  channelName: string;
  availability: 'tv' | 'streaming' | 'both';
  provenance: 'airing' | 'reconciliation' | 'override';
  confidence: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

const FootballBroadcastMappingSchema = new Schema<IFootballBroadcastMappingDocument>(
  {
    matchId: { type: String, required: true, index: true },
    matchSlug: { type: String, required: true, index: true },
    airingId: { type: String, index: true },
    channelId: { type: String, required: true, index: true },
    channelName: { type: String, required: true, trim: true },
    availability: {
      type: String,
      enum: ['tv', 'streaming', 'both'],
      default: 'tv',
    },
    provenance: {
      type: String,
      enum: ['airing', 'reconciliation', 'override'],
      default: 'reconciliation',
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
  },
  { timestamps: true, collection: 'football_broadcast_mappings' }
);

FootballBroadcastMappingSchema.index({ matchId: 1, channelId: 1 }, { unique: true });

export const FootballBroadcastMappingModel =
  mongoose.model<IFootballBroadcastMappingDocument>(
    'FootballBroadcastMapping',
    FootballBroadcastMappingSchema
  );
