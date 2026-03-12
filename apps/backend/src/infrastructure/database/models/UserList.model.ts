import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type ListVisibility = 'public' | 'friends' | 'private';

export interface IUserListDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  visibility: ListVisibility;
  cover?: string;
  isDefault?: boolean;
  itemsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserListSchema = new Schema<IUserListDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'private',
    },
    cover: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    itemsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'user_lists',
  }
);

UserListSchema.index({ userId: 1, updatedAt: -1 });
UserListSchema.index({ visibility: 1, itemsCount: -1, updatedAt: -1 });

export const UserListModel = mongoose.model<IUserListDocument>('UserList', UserListSchema);
