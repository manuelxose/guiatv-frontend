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
  mode: 'tv_now' | 'tv_tonight' | 'streaming' | 'football_today' | 'general';
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
  matches?: AssistantMatchCard[];
  isLoading?: boolean;
  /** True while SSE tokens are still arriving. */
  isStreaming?: boolean;
  /** True between send and first SSE text chunk — shows "thinking" animation. */
  isThinking?: boolean;
  /** True only for messages created via sendMessage(), false/undefined for hydrated history. */
  isNewMessage?: boolean;
  feedback?: { rating: 'positive' | 'negative' };
  /** Set when the user explicitly stopped this response. Excluded from prompt history. */
  isCancelled?: boolean;
}

export interface AssistantMatchCard {
  id: string;
  slug: string;
  competition: string;
  kickoffAt: string;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'suspended' | 'cancelled';
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  broadcasters: Array<{ name: string; path?: string }>;
  detailPath: string;
}

export type AssistantIntent =
  | 'tv_now'
  | 'tv_later'
  | 'tv_channel'
  | 'program_lookup'
  | 'movie_discovery'
  | 'series_discovery'
  | 'streaming_availability'
  | 'football_today'
  | 'football_match'
  | 'football_team'
  | 'football_competition'
  | 'recommendation'
  | 'comparison'
  | 'reminder'
  | 'account_preference'
  | 'general_chat';

export type AssistantContextKind =
  | 'global'
  | 'programme'
  | 'movie'
  | 'series'
  | 'channel'
  | 'football_match'
  | 'football_team'
  | 'football_competition';

export interface AssistantLaunchContext {
  kind: AssistantContextKind;
  entityId?: string;
  title?: string;
  channel?: string;
  kickoff?: string;
  competition?: string;
  homeTeam?: string;
  awayTeam?: string;
  broadcasters?: string[];
}

export interface AssistantSource {
  id: string;
  kind: 'epg' | 'catalog' | 'streaming_provider' | 'football_provider' | 'user_profile';
  label: string;
  entityId?: string;
  retrievedAt?: string;
}

export interface AssistantAction {
  id: string;
  type: 'open_detail' | 'watch_now' | 'create_reminder' | 'retry' | 'set_preference';
  label: string;
  targetId?: string;
}

export interface AssistantSection {
  id: string;
  kind: 'summary' | 'programmes' | 'recommendations' | 'matches' | 'comparison' | 'note';
  title?: string;
  text?: string;
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
  | 'connecting'
  | 'retrieving'
  | 'composing'
  | 'streaming'
  | 'recovering'
  | 'cancelled'
  | 'rate_limited'
  | 'offline'
  | 'login_required'
  | 'unavailable';

export function isChatbotBusyState(state: ChatbotRequestState): boolean {
  return state === 'connecting' ||
    state === 'retrieving' ||
    state === 'composing' ||
    state === 'streaming' ||
    state === 'recovering';
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
