/* ──────────────────────────────────────────────────────────
 *  Chatbot Domain Types
 *  Shared across all AI-chatbot components and services.
 * ────────────────────────────────────────────────────────── */

export interface ChatbotRecommendation {
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
  reason: string;
  tmdbId?: number;
  image?: string;
  actions?: {
    canOpenDetail: boolean;
    canSave: boolean;
    canTrack: boolean;
  };
  badges?: string[];
  rating?: number;
  durationMinutes?: number;
  synopsis?: string;
  platformLogo?: string;
}

export interface ChatbotQueryContext {
  mode: 'tv_now' | 'tv_tonight' | 'streaming' | 'general';
  requestedTypes: Array<'movie' | 'series' | 'program'>;
  totalMatches: number;
  primaryMatches?: number;
  shownCount: number;
  hasMore: boolean;
  answerWindowLabel: string;
  hasAutonomicMatches?: boolean;
  autonomicPromptRequired?: boolean;
  savedAutonomousCommunity?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: ChatbotRecommendation[];
  moreRecommendations?: ChatbotRecommendation[];
  followUpSuggestions?: string[];
  queryContext?: ChatbotQueryContext;
  isLoading?: boolean;
  /** True while SSE tokens are still arriving. */
  isStreaming?: boolean;
  /** True only for messages created via sendMessage(), false/undefined for hydrated history. */
  isNewMessage?: boolean;
  feedback?: { rating: 'positive' | 'negative' };
}

export interface AssistantMemorySnapshot {
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
  lastCommunityConfirmationAt?: string;
  updatedAt?: string;
}

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  recommendations?: ChatbotRecommendation[];
  moreRecommendations?: ChatbotRecommendation[];
  followUpSuggestions?: string[];
  queryContext?: ChatbotQueryContext;
  feedback?: { rating: 'positive' | 'negative' };
}

export type ChatbotSessionState =
  | 'unknown'
  | 'authenticated'
  | 'unauthenticated'
  | 'refreshing';

export type ChatbotRequestState =
  | 'idle'
  | 'sending'
  | 'login_required'
  | 'unavailable';

/** Fields editable in the memory editor panel. */
export interface MemoryEditorField {
  key: string;
  label: string;
  placeholder: string;
}

export interface ConversationSummary {
  conversationId: string;
  sessionTitle: string;
  lastUsedAt: string;
  pinned: boolean;
  archived: boolean;
  messageCount: number;
  lastMessage?: string;
}
