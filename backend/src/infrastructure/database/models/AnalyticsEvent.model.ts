import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IAnalyticsEventDocument {
  eventId: string;
  sessionId: string;
  anonId: string;
  userId?: string;
  type: string;
  name?: string;
  path?: string;
  title?: string;
  referrer?: string;
  occurredAt: Date;
  data?: Record<string, any>;
  userAgent?: string;
  ip?: string;
  language?: string;
  timezone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEventDocument>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    anonId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    path: {
      type: String,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    referrer: {
      type: String,
      trim: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ip: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
    },
    timezone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'analytics_events',
  }
);

AnalyticsEventSchema.index({ occurredAt: 1, type: 1 });
AnalyticsEventSchema.index({ path: 1, occurredAt: 1 });

export const AnalyticsEventModel = mongoose.model<IAnalyticsEventDocument>(
  'AnalyticsEvent',
  AnalyticsEventSchema
);
