import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type ChatMessageType = 'text' | 'image' | 'recommendation' | 'list';

export interface IChatMessageDocument {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  clientMessageId?: string;
  text?: string;
  type: ChatMessageType;
  content?: any;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, required: true, index: true },
    clientMessageId: { type: String, trim: true },
    text: { type: String, trim: true },
    type: {
      type: String,
      enum: ['text', 'image', 'recommendation', 'list'],
      default: 'text',
    },
    content: { type: Schema.Types.Mixed },
    readBy: [{ type: Schema.Types.ObjectId, default: [] }],
  },
  {
    timestamps: true,
    collection: 'chat_messages',
  }
);

ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
ChatMessageSchema.index(
  { conversationId: 1, senderId: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientMessageId: { $exists: true },
    },
  }
);

export const ChatMessageModel = mongoose.model<IChatMessageDocument>(
  'ChatMessage',
  ChatMessageSchema
);
