import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type UserReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type UserReportType = 'user' | 'message' | 'content' | 'other';

export interface IUserReportDocument {
  reporterId: mongoose.Types.ObjectId;
  targetUserId?: mongoose.Types.ObjectId;
  targetMessageId?: mongoose.Types.ObjectId;
  type: UserReportType;
  reason: string;
  details?: string;
  status: UserReportStatus;
  resolutionNote?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const UserReportSchema = new Schema<IUserReportDocument>(
  {
    reporterId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, index: true },
    targetMessageId: { type: Schema.Types.ObjectId, index: true },
    type: {
      type: String,
      enum: ['user', 'message', 'content', 'other'],
      default: 'user',
      required: true,
    },
    reason: { type: String, trim: true, required: true },
    details: { type: String, trim: true },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolutionNote: { type: String, trim: true },
    resolvedBy: { type: Schema.Types.ObjectId },
    resolvedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'user_reports',
  }
);

UserReportSchema.index({ status: 1, createdAt: -1 });
UserReportSchema.index({ reporterId: 1, createdAt: -1 });

export const UserReportModel = mongoose.model<IUserReportDocument>(
  'UserReport',
  UserReportSchema
);
