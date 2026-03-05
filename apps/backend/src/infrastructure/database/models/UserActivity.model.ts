import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type ActivityType =
  | 'review'
  | 'status'
  | 'follow'
  | 'list'
  | 'recommendation'
  | 'comment'
  | 'like';

export interface IUserActivityDocument {
  userId: mongoose.Types.ObjectId;
  type: ActivityType;
  title: string;
  description?: string;
  badge?: string;
  category?: string;
  target?: string;
  image?: string;
  visibility?: 'public' | 'friends' | 'private';
  payload?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const UserActivitySchema = new Schema<IUserActivityDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: {
      type: String,
      enum: ['review', 'status', 'follow', 'list', 'recommendation', 'comment', 'like'],
      required: true,
    },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    badge: { type: String, trim: true },
    category: { type: String, trim: true },
    target: { type: String, trim: true },
    image: { type: String, trim: true },
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends',
    },
    payload: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'user_activities',
  }
);

UserActivitySchema.index({ userId: 1, createdAt: -1 });

export const UserActivityModel = mongoose.model<IUserActivityDocument>(
  'UserActivity',
  UserActivitySchema
);
