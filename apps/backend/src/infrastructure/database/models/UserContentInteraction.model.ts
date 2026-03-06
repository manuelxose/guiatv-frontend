import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IUserContentInteractionDocument {
  userId: string;
  contentId: string;
  contentTitle: string;
  contentType: 'movie' | 'series' | 'program';
  tmdbId?: number;
  genres: string[];
  rating?: number;
  status: 'seen' | 'watching' | 'pending' | 'dropped';
  liked?: boolean;
  addedToList?: boolean;
  recommended?: boolean;
  platform?: string;
  watchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserContentInteractionSchema = new Schema<IUserContentInteractionDocument>(
  {
    userId: { type: String, required: true, index: true },
    contentId: { type: String, required: true, index: true },
    contentTitle: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      required: true,
      enum: ['movie', 'series', 'program'],
      index: true,
    },
    tmdbId: { type: Number },
    genres: { type: [String], default: [] },
    rating: { type: Number, min: 1, max: 10 },
    status: {
      type: String,
      required: true,
      enum: ['seen', 'watching', 'pending', 'dropped'],
      default: 'pending',
    },
    liked: { type: Boolean, default: false },
    addedToList: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    platform: { type: String, trim: true },
    watchedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'user_content_interactions',
  }
);

UserContentInteractionSchema.index({ userId: 1, contentId: 1 }, { unique: true });
UserContentInteractionSchema.index({ userId: 1, contentType: 1 });
UserContentInteractionSchema.index({ userId: 1, status: 1 });
UserContentInteractionSchema.index({ userId: 1, genres: 1 });
UserContentInteractionSchema.index({ userId: 1, rating: -1 });
UserContentInteractionSchema.index({ userId: 1, updatedAt: -1 });

export const UserContentInteractionModel =
  mongoose.model<IUserContentInteractionDocument>(
    'UserContentInteraction',
    UserContentInteractionSchema
  );
