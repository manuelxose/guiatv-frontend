import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IChatParticipantState {
  userId: mongoose.Types.ObjectId;
  lastReadAt?: Date;
}

export interface IChatConversationDocument {
  participants: mongoose.Types.ObjectId[];
  participantStates: IChatParticipantState[];
  pairKey?: string;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatParticipantStateSchema = new Schema<IChatParticipantState>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    lastReadAt: { type: Date },
  },
  { _id: false }
);

const ChatConversationSchema = new Schema<IChatConversationDocument>(
  {
    participants: [{ type: Schema.Types.ObjectId, required: true }],
    participantStates: { type: [ChatParticipantStateSchema], default: [] },
    pairKey: { type: String, trim: true },
    isGroup: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'chat_conversations',
  }
);

ChatConversationSchema.index({ participants: 1 });
ChatConversationSchema.index({ pairKey: 1 }, { unique: true, sparse: true });

export const ChatConversationModel = mongoose.model<IChatConversationDocument>(
  'ChatConversation',
  ChatConversationSchema
);
