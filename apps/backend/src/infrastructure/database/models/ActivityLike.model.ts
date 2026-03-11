import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IActivityLikeDocument {
  activityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ActivityLikeSchema = new Schema<IActivityLikeDocument>(
  {
    activityId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'activity_likes',
  }
);

ActivityLikeSchema.index({ activityId: 1, userId: 1 }, { unique: true });

export const ActivityLikeModel = mongoose.model<IActivityLikeDocument>(
  'ActivityLike',
  ActivityLikeSchema
);
