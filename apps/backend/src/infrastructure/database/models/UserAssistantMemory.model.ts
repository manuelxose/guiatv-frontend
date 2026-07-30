import * as mongoose from 'mongoose';
import { Document, Schema } from 'mongoose';

export interface IUserAssistantMemoryDocument extends Document {
  userId: string;
  likedGenres: string[];
  dislikedGenres: string[];
  preferredPlatforms: string[];
  avoidedPlatforms: string[];
  preferredDurations: string[];
  preferredViewingContexts: string[];
  favoriteFranchisesOrTitles: string[];
  recentTopics: string[];
  negativeSignals: string[];
  preferredAutonomousCommunity?: string;
  autonomicOptIn?: boolean | 'unknown';
  lastCommunityConfirmationAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserAssistantMemorySchema = new Schema<IUserAssistantMemoryDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    likedGenres: { type: [String], default: [] },
    dislikedGenres: { type: [String], default: [] },
    preferredPlatforms: { type: [String], default: [] },
    avoidedPlatforms: { type: [String], default: [] },
    preferredDurations: { type: [String], default: [] },
    preferredViewingContexts: { type: [String], default: [] },
    favoriteFranchisesOrTitles: { type: [String], default: [] },
    recentTopics: { type: [String], default: [] },
    negativeSignals: { type: [String], default: [] },
    preferredAutonomousCommunity: { type: String, trim: true },
    autonomicOptIn: {
      type: Schema.Types.Mixed,
      default: 'unknown',
    },
    lastCommunityConfirmationAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'user_assistant_memory',
  }
);

export const UserAssistantMemoryModel =
  mongoose.model<IUserAssistantMemoryDocument>(
    'UserAssistantMemory',
    UserAssistantMemorySchema
  );
