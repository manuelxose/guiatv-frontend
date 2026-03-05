import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface IUserProfileDocument {
  userId: mongoose.Types.ObjectId;
  username: string;
  bio?: string;
  location?: string;
  avatar?: string;
  favoriteGenres?: string[];
  watchingNow?: {
    title?: string;
    mood?: string;
    visibility?: ProfileVisibility;
  };
  privacy?: {
    profilePublic: boolean;
    shareActivity: boolean;
    shareWatchlist: boolean;
    showOnline: boolean;
    allowMessages: 'all' | 'followers' | 'none';
    publicLists: boolean;
  };
  notifications?: {
    recommendations: boolean;
    followers: boolean;
    weeklySummary: boolean;
    chatMessages: boolean;
    groupActivity: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WatchingNowSchema = new Schema(
  {
    title: { type: String, trim: true },
    mood: { type: String, trim: true },
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends',
    },
  },
  { _id: false }
);

const PrivacySchema = new Schema(
  {
    profilePublic: { type: Boolean, default: true },
    shareActivity: { type: Boolean, default: true },
    shareWatchlist: { type: Boolean, default: true },
    showOnline: { type: Boolean, default: true },
    allowMessages: {
      type: String,
      enum: ['all', 'followers', 'none'],
      default: 'followers',
    },
    publicLists: { type: Boolean, default: true },
  },
  { _id: false }
);

const NotificationsSchema = new Schema(
  {
    recommendations: { type: Boolean, default: true },
    followers: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: false },
    chatMessages: { type: Boolean, default: true },
    groupActivity: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserProfileSchema = new Schema<IUserProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, unique: true },
    username: { type: String, trim: true, required: true },
    bio: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '-' },
    avatar: { type: String, trim: true },
    favoriteGenres: { type: [String], default: [] },
    watchingNow: { type: WatchingNowSchema, default: () => ({}) },
    privacy: { type: PrivacySchema, default: () => ({}) },
    notifications: { type: NotificationsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: 'user_profiles',
  }
);


export const UserProfileModel = mongoose.model<IUserProfileDocument>(
  'UserProfile',
  UserProfileSchema
);
