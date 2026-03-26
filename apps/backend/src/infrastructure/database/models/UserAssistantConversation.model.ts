import * as mongoose from 'mongoose';
import { Document, Schema } from 'mongoose';

const RecommendationSchema = new Schema(
  {
    catalogId: { type: String, trim: true },
    detailPath: { type: String, trim: true },
    source: {
      type: String,
      enum: ['program', 'tmdb'],
    },
    title: { type: String, trim: true, required: true },
    subtitle: { type: String, trim: true },
    type: {
      type: String,
      enum: ['movie', 'series', 'program'],
      required: true,
    },
    platform: { type: String, trim: true },
    channel: { type: String, trim: true },
    time: { type: String, trim: true },
    channelOrPlatform: { type: String, trim: true },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    liveNow: { type: Boolean, default: false },
    reason: { type: String, trim: true },
    tmdbId: { type: Number },
    image: { type: String, trim: true },
    actions: {
      canOpenDetail: { type: Boolean, default: true },
      canSave: { type: Boolean, default: true },
      canTrack: { type: Boolean, default: true },
    },
    badges: { type: [String], default: [] },
    rating: { type: Number },
    durationMinutes: { type: Number },
    synopsis: { type: String, trim: true },
    platformLogo: { type: String, trim: true },
  },
  { _id: false }
);

const AssistantQueryContextSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ['tv_now', 'tv_tonight', 'streaming', 'general'],
    },
    requestedTypes: {
      type: [String],
      default: [],
    },
    totalMatches: { type: Number, default: 0 },
    primaryMatches: { type: Number, default: 0 },
    shownCount: { type: Number, default: 0 },
    hasMore: { type: Boolean, default: false },
    answerWindowLabel: { type: String, trim: true },
    hasAutonomicMatches: { type: Boolean, default: false },
    autonomicPromptRequired: { type: Boolean, default: false },
    savedAutonomousCommunity: { type: String, trim: true },
  },
  { _id: false }
);

const MessageFeedbackSchema = new Schema(
  {
    rating: { type: String, enum: ['positive', 'negative'], required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const AssistantMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: { type: String, trim: true, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    recommendations: { type: [RecommendationSchema], default: [] },
    moreRecommendations: { type: [RecommendationSchema], default: [] },
    followUpSuggestions: { type: [String], default: [] },
    queryContext: { type: AssistantQueryContextSchema, default: undefined },
    feedback: { type: MessageFeedbackSchema, default: undefined },
  },
  { _id: false }
);

export interface IUserAssistantConversationDocument extends Document {
  userId: string;
  conversationId: string;
  sessionTitle?: string;
  pinned: boolean;
  archived: boolean;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
    recommendations?: Array<{
      catalogId?: string;
      detailPath?: string;
      source?: 'program' | 'tmdb';
      title: string;
      subtitle?: string;
      type: 'movie' | 'series' | 'program';
      platform?: string;
      channel?: string;
      time?: string;
      channelOrPlatform?: string;
      startTime?: string;
      endTime?: string;
      liveNow?: boolean;
      reason?: string;
      tmdbId?: number;
      image?: string;
      actions?: {
        canOpenDetail?: boolean;
        canSave?: boolean;
        canTrack?: boolean;
      };
      badges?: string[];
    }>;
    moreRecommendations?: Array<{
      catalogId?: string;
      detailPath?: string;
      source?: 'program' | 'tmdb';
      title: string;
      subtitle?: string;
      type: 'movie' | 'series' | 'program';
      platform?: string;
      channel?: string;
      time?: string;
      channelOrPlatform?: string;
      startTime?: string;
      endTime?: string;
      liveNow?: boolean;
      reason?: string;
      tmdbId?: number;
      image?: string;
      actions?: {
        canOpenDetail?: boolean;
        canSave?: boolean;
        canTrack?: boolean;
      };
      badges?: string[];
    }>;
    followUpSuggestions?: string[];
    queryContext?: {
      mode?: 'tv_now' | 'tv_tonight' | 'streaming' | 'general';
      requestedTypes?: Array<'movie' | 'series' | 'program'>;
      totalMatches?: number;
      primaryMatches?: number;
      shownCount?: number;
      hasMore?: boolean;
      answerWindowLabel?: string;
      hasAutonomicMatches?: boolean;
      autonomicPromptRequired?: boolean;
      savedAutonomousCommunity?: string;
    };
    feedback?: {
      rating: 'positive' | 'negative';
      createdAt: Date;
    };
  }>;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserAssistantConversationSchema = new Schema<IUserAssistantConversationDocument>(
  {
    userId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, unique: true, index: true },
    sessionTitle: { type: String, trim: true },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    messages: { type: [AssistantMessageSchema], default: [] },
    lastUsedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'user_assistant_conversations',
  }
);

UserAssistantConversationSchema.index({ userId: 1, lastUsedAt: -1 });
UserAssistantConversationSchema.index({ userId: 1, pinned: -1, lastUsedAt: -1 });
// TTL: remove conversations with no activity for 90 days (7776000 s).
// NOTE: the old index on { createdAt: 1 } must be dropped manually in MongoDB if it exists:
//   db.user_assistant_conversations.dropIndex("createdAt_1")
UserAssistantConversationSchema.index({ lastUsedAt: 1 }, { expireAfterSeconds: 7776000 });

export const UserAssistantConversationModel =
  mongoose.model<IUserAssistantConversationDocument>(
    'UserAssistantConversation',
    UserAssistantConversationSchema
  );
