import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IUserDocument extends mongoose.Document {
  googleId?: string;
  email: string;
  name?: string;
  picture?: string;
  provider: 'google' | 'local' | 'hybrid';
  passwordHash?: string;
  passwordSalt?: string;
  lastLoginAt?: Date;
  role?: 'admin' | 'editor' | 'user';
  status?: 'active' | 'suspended';
  subscription?: 'free' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    googleId: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, trim: true },
    picture: { type: String, trim: true },
    provider: {
      type: String,
      enum: ['google', 'local', 'hybrid'],
      default: 'google',
    },
    passwordHash: { type: String },
    passwordSalt: { type: String },
    lastLoginAt: { type: Date },
    role: {
      type: String,
      enum: ['admin', 'editor', 'user'],
      default: 'user',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },
    subscription: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
