import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IUserDocument extends mongoose.Document {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  provider: 'google';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, trim: true },
    picture: { type: String, trim: true },
    provider: { type: String, default: 'google' },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
