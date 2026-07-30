import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IActivityCommentDocument {
  activityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityCommentSchema = new Schema<IActivityCommentDocument>(
  {
    activityId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  {
    timestamps: true,
    collection: 'activity_comments',
  }
);

ActivityCommentSchema.index({ activityId: 1, createdAt: -1 });

export const ActivityCommentModel = mongoose.model<IActivityCommentDocument>(
  'ActivityComment',
  ActivityCommentSchema
);
