// Require mongoose at runtime to avoid depending on ambient types during build
import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

/**
 * Channel document interface for MongoDB
 */
export interface IChannelDocument {
  id: string;
  name: string;
  normalizedName?: string;
  aliases?: string[];
  sourceIds?: string[];
  logo?: string;
  type?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  language?: string;
  category?: string;
  url?: string;
  description?: string;
  distribution?: string;
  access?: string;
  operator?: string;
  providers?: string[];
  contentFacets?: string[];
  market?: Record<string, any>;
  quality?: Record<string, any>;
  capabilities?: Record<string, any>;
  provenance?: Record<string, any>;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Channel schema definition
 */
const ChannelSchema = new Schema<IChannelDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      trim: true,
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    sourceIds: {
      type: [String],
      default: [],
      index: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      trim: true,
      index: true,
    },
    countryCode: {
      type: String,
      trim: true,
      index: true,
    },
    region: {
      type: String,
      trim: true,
      index: true,
    },
    language: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    distribution: { type: String, default: 'unknown', index: true },
    access: { type: String, default: 'unknown', index: true },
    operator: { type: String, default: 'unknown', index: true },
    providers: { type: [String], default: [], index: true },
    contentFacets: { type: [String], default: [], index: true },
    market: {
      type: Schema.Types.Mixed,
      default: { country: 'unknown', countryCode: 'unknown', region: 'unknown', scope: 'unknown' },
    },
    quality: {
      type: Schema.Types.Mixed,
      default: { resolution: 'unknown', timeshift: 'unknown' },
    },
    capabilities: {
      type: Schema.Types.Mixed,
      default: { linear: 'unknown', catchup: 'unknown', streaming: 'unknown' },
    },
    provenance: {
      type: Schema.Types.Mixed,
      default: { classification: 'unknown', sourceIds: [] },
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'channels',
  }
);

// Compound indexes for common queries
ChannelSchema.index({ country: 1, active: 1, order: 1 });
ChannelSchema.index({ active: 1, order: 1 });
ChannelSchema.index({ normalizedName: 1, active: 1 });
ChannelSchema.index({ aliases: 1, active: 1 });
ChannelSchema.index({ sourceIds: 1, active: 1 });

/**
 * Channel model
 */
export const ChannelModel = mongoose.model<IChannelDocument>('Channel', ChannelSchema);
