import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IAuthSessionDocument {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  deviceName?: string;
  lastUsedAt?: Date;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuthSessionSchema = new Schema<IAuthSessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    refreshTokenHash: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    deviceName: { type: String, trim: true },
    lastUsedAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'auth_sessions',
  }
);

AuthSessionSchema.index({ userId: 1, createdAt: -1 });
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthSessionModel = mongoose.model<IAuthSessionDocument>(
  'AuthSession',
  AuthSessionSchema
);
