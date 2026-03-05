import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IPasswordResetTokenDocument {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'password_reset_tokens',
  }
);

PasswordResetTokenSchema.index({ userId: 1, createdAt: -1 });
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetTokenModel = mongoose.model<IPasswordResetTokenDocument>(
  'PasswordResetToken',
  PasswordResetTokenSchema
);
