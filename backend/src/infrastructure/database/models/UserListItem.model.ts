import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type ListItemState = 'pending' | 'watching' | 'finished';
export type ListItemType = 'movie' | 'series' | 'program';

export interface IUserListItemDocument {
  userId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  contentId?: string;
  title: string;
  type: ListItemType;
  state: ListItemState;
  progress?: number;
  mood?: string;
  visibility?: 'public' | 'friends' | 'private';
  poster?: string;
  rating?: number;
  addedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserListItemSchema = new Schema<IUserListItemDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    listId: { type: Schema.Types.ObjectId, required: true, index: true },
    contentId: { type: String, trim: true, index: true },
    title: { type: String, trim: true, required: true },
    type: {
      type: String,
      enum: ['movie', 'series', 'program'],
      default: 'program',
    },
    state: {
      type: String,
      enum: ['pending', 'watching', 'finished'],
      default: 'pending',
    },
    progress: { type: Number, default: 0 },
    mood: { type: String, trim: true },
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'private',
    },
    poster: { type: String, trim: true },
    rating: { type: Number },
    addedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'user_list_items',
  }
);

UserListItemSchema.index({ listId: 1, createdAt: -1 });
UserListItemSchema.index({ listId: 1, contentId: 1 });

export const UserListItemModel = mongoose.model<IUserListItemDocument>(
  'UserListItem',
  UserListItemSchema
);
