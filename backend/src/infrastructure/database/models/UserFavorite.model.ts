import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type FavoriteType = 'channel' | 'program' | 'list' | 'user';

export interface IUserFavoriteDocument {
  userId: mongoose.Types.ObjectId;
  itemId?: string;
  title: string;
  image?: string;
  subtitle?: string;
  type: FavoriteType;
  createdAt: Date;
  updatedAt: Date;
}

const UserFavoriteSchema = new Schema<IUserFavoriteDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    itemId: { type: String, trim: true },
    title: { type: String, trim: true, required: true },
    image: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    type: {
      type: String,
      enum: ['channel', 'program', 'list', 'user'],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'user_favorites',
  }
);

UserFavoriteSchema.index({ userId: 1, type: 1, createdAt: -1 });
UserFavoriteSchema.index({ userId: 1, itemId: 1 }, { unique: false });

export const UserFavoriteModel = mongoose.model<IUserFavoriteDocument>(
  'UserFavorite',
  UserFavoriteSchema
);
