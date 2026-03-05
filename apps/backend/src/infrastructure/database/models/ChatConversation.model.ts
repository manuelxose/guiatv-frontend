import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IChatConversationDocument {
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatConversationSchema = new Schema<IChatConversationDocument>(
  {
    participants: [{ type: Schema.Types.ObjectId, required: true, index: true }],
  },
  {
    timestamps: true,
    collection: 'chat_conversations',
  }
);

ChatConversationSchema.index({ participants: 1 });

export const ChatConversationModel = mongoose.model<IChatConversationDocument>(
  'ChatConversation',
  ChatConversationSchema
);
