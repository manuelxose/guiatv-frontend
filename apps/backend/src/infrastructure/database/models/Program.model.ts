// Require mongoose at runtime to avoid depending on ambient types during build

import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

/**
 * Program document interface for MongoDB
 */
export interface IProgramDocument {
  id: string;
  channelId: string;
  canonicalChannelId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  normalizedTitle?: string;
  titleAliases?: string[];
  brandKey?: string;
  startUtc?: string;
  endUtc?: string;
  date?: string;
  startMinutes?: number;
  endMinutes?: number;
  durationMinutes?: number;
  timeSlotIndex?: number;
  category?: string;
  subgenre?: string;
  image?: string;
  year?: string;
  rating?: string;
  tmdbId?: number;
  sourceFeed?: string;
  sourceProgrammeId?: string;
  sourceAssetCandidates?: Array<Record<string, any>>;
  sourceProvenance?: Record<string, any>;
  trustFlags?: Record<string, any>;
  details?: Record<string, any>;
  // Optional layout cache to avoid recomputation on hot paths
  layoutVersion?: string;
  precomputedLayout?: boolean;
  precomputedLayouts?: Record<string, any>;
  layoutsBySlot?: Array<Record<string, any>>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Program schema definition
 */
const ProgramSchema = new Schema<IProgramDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    canonicalChannelId: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    normalizedTitle: {
      type: String,
      trim: true,
      index: true,
    },
    titleAliases: {
      type: [String],
      default: [],
      index: true,
    },
    brandKey: {
      type: String,
      trim: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    startUtc: {
      type: String,
    },
    endUtc: {
      type: String,
    },
    date: {
      type: String,
    },
    startMinutes: {
      type: Number,
    },
    endMinutes: {
      type: Number,
    },
    durationMinutes: {
      type: Number,
    },
    timeSlotIndex: {
      type: Number,
    },
    category: {
      type: String,
      trim: true,
    },
    subgenre: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
    rating: {
      type: String,
      trim: true,
    },
    tmdbId: {
      type: Number,
    },
    sourceFeed: {
      type: String,
      trim: true,
      index: true,
    },
    sourceProgrammeId: {
      type: String,
      trim: true,
    },
    sourceAssetCandidates: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    sourceProvenance: {
      type: Schema.Types.Mixed,
    },
    trustFlags: {
      type: Schema.Types.Mixed,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    layoutVersion: {
      type: String,
    },
    precomputedLayout: {
      type: Boolean,
    },
    precomputedLayouts: {
      type: Schema.Types.Mixed,
    },
    layoutsBySlot: {
      type: [Schema.Types.Mixed],
    },
  },
  {
    timestamps: true,
    collection: 'programs',
  }
);

// Focus on the indexes used by live queries to keep storage under control.
ProgramSchema.index({ channelId: 1, startTime: 1 });
ProgramSchema.index({ startTime: 1, endTime: 1 });
ProgramSchema.index({ tmdbId: 1 }, { sparse: true });
ProgramSchema.index({ title: 1, startTime: -1 });
ProgramSchema.index({ normalizedTitle: 1, startTime: -1 });
ProgramSchema.index({ titleAliases: 1, startTime: -1 });
ProgramSchema.index({ date: 1, canonicalChannelId: 1, startTime: 1 });
ProgramSchema.index({ brandKey: 1, date: 1 });
ProgramSchema.index({ sourceFeed: 1, sourceProgrammeId: 1 });
ProgramSchema.index({ sourceFeed: 1, channelId: 1, startTime: 1 });

/**
 * Program model
 */
export const ProgramModel = mongoose.model<IProgramDocument>('Program', ProgramSchema);
