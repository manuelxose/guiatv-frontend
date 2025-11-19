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
  category?: string;
  image?: string;
  rating?: string;
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
      index: true,
    },
    channelId: {
      type: String,
      required: true,
      index: true,
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
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
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
  },
  {
    timestamps: true,
    collection: 'programs',
  }
);

// Compound indexes for common queries
ProgramSchema.index({ channelId: 1, startTime: 1 });
ProgramSchema.index({ channelId: 1, endTime: 1 });
ProgramSchema.index({ startTime: 1, endTime: 1 });
ProgramSchema.index({ channelId: 1, startTime: 1, endTime: 1 });

/**
 * Program model
 */
export const ProgramModel = mongoose.model<IProgramDocument>('Program', ProgramSchema);
