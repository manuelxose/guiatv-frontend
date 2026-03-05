import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IUserBlockDocument {
  blockerId: mongoose.Types.ObjectId;
  blockedId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserBlockSchema = new Schema<IUserBlockDocument>(
  {
    blockerId: { type: Schema.Types.ObjectId, required: true, index: true },
    blockedId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'user_blocks',
  }
);

UserBlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
UserBlockSchema.index({ blockedId: 1, createdAt: -1 });

export const UserBlockModel = mongoose.model<IUserBlockDocument>(
  'UserBlock',
  UserBlockSchema
);
