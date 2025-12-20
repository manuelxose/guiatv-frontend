import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IUserFollowDocument {
  followerId: mongoose.Types.ObjectId;
  followeeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserFollowSchema = new Schema<IUserFollowDocument>(
  {
    followerId: { type: Schema.Types.ObjectId, required: true, index: true },
    followeeId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'user_follows',
  }
);

UserFollowSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });

export const UserFollowModel = mongoose.model<IUserFollowDocument>(
  'UserFollow',
  UserFollowSchema
);
