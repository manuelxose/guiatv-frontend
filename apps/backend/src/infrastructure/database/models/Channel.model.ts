// Require mongoose at runtime to avoid depending on ambient types during build
import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

/**
 * Channel document interface for MongoDB
 */
export interface IChannelDocument {
  id: string;
  name: string;
  logo?: string;
  type?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  language?: string;
  category?: string;
  url?: string;
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

/**
 * Channel model
 */
export const ChannelModel = mongoose.model<IChannelDocument>('Channel', ChannelSchema);
