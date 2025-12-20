// Require mongoose at runtime to avoid depending on ambient types during build

import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

/**
 * Program document interface for MongoDB
 */
export interface IProgramDocument {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  startUtc?: string;
  endUtc?: string;
  date?: string;
  startMinutes?: number;
  endMinutes?: number;
  durationMinutes?: number;
  timeSlotIndex?: number;
  category?: string;
  image?: string;
  rating?: string;
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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
    image: {
      type: String,
      trim: true,
    },
    rating: {
      type: String,
      trim: true,
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

/**
 * Program model
 */
export const ProgramModel = mongoose.model<IProgramDocument>('Program', ProgramSchema);
