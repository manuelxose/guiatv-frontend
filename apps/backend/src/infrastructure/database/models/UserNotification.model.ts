import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type UserNotificationType =
  | 'follow'
  | 'message'
  | 'recommendation'
  | 'report_status'
  | 'system';

export interface IUserNotificationDocument {
  recipientId: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  type: UserNotificationType;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserNotificationSchema = new Schema<IUserNotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, index: true },
    type: {
      type: String,
      enum: ['follow', 'message', 'recommendation', 'report_status', 'system'],
      default: 'system',
      index: true,
    },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    entityType: { type: String, trim: true },
    entityId: { type: String, trim: true },
    payload: { type: Schema.Types.Mixed },
    readAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    collection: 'user_notifications',
  }
);

UserNotificationSchema.index({ recipientId: 1, createdAt: -1 });
UserNotificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export const UserNotificationModel = mongoose.model<IUserNotificationDocument>(
  'UserNotification',
  UserNotificationSchema
);
