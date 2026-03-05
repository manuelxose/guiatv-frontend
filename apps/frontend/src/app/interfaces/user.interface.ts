import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  role?: 'admin' | 'editor' | 'user';
  favoriteGenres: string[];
  watchingNow: WatchingNow;
  privacy: UserPrivacy;
  notifications: UserNotifications;
  stats: UserStats;
  backgroundImage?: string; // For profile cover
}

export interface WatchingNow {
  title: string;
  mood: string;
  visibility: Visibility;
}

export interface UserPrivacy {
  profilePublic: boolean;
  shareActivity: boolean;
  shareWatchlist: boolean;
  showOnline: boolean;
  allowMessages: 'all' | 'followers' | 'none';
  publicLists: boolean;
}

export interface UserNotifications {
  recommendations: boolean;
  followers: boolean;
  weeklySummary: boolean;
  chatMessages: boolean;
  groupActivity: boolean;
}

export interface UserStats {
  followers: number;
  following: number;
  recommendations: number;
  watchlist: number;
  listsCreated: number;
  ratings: number;
}

export interface UserRecommendation {
  id: string;
  title: string;
  type: 'movie' | 'series' | 'program' | 'channel';
  note: string;
  tags: string[];
  visibility: Visibility;
  status: 'watching' | 'pending' | 'finished';
  rating?: number;
  createdAt: string;
  mood?: string;
  platform?: string;
  image?: string;
  likes: number;
  comments: number;
  user?: { // The user who made the recommendation (for feeds)
    id: string;
    name: string;
    avatar: string;
  };
}

export interface UserActivity {
  id: string;
  type: 'review' | 'status' | 'follow' | 'list' | 'recommendation' | 'comment' | 'like';
  title: string;
  description: string;
  createdAt: string;
  badge?: string;
  category?: string;
  target?: string;
  image?: string; // Image of the content
  user?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface UserFriend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastActivity: string;
  favoriteGenres: string[];
  following: boolean;
}

export interface UserListItem {
  id: string;
  contentId?: string;
  title: string;
  type: 'movie' | 'series' | 'program';
  state: 'pending' | 'watching' | 'finished';
  progress: number;
  mood?: string;
  visibility: Visibility;
  poster?: string;
  rating?: number;
  addedAt?: string;
}

export type Visibility = 'public' | 'friends' | 'private';

export interface UserList {
  id: string;
  title: string;
  description?: string;
  itemsCount: number;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  cover?: string;
  isDefault?: boolean;
  likes?: number;
  followers?: number;
  items?: UserListItem[]; // Optional for list preview
}

export interface UserFavorite {
  id: string;
  title: string;
  image?: string;
  subtitle?: string;
  type: 'channel' | 'program' | 'list' | 'user';
  createdAt?: string;
}

export interface Top10Category {
  id: string;
  title: string;
  items: Top10Item[];
}

export interface Top10Item {
  id: string;
  title: string;
  image: string;
  rank: number;
  change: 'up' | 'down' | 'same' | 'new';
  type: 'movie' | 'series' | 'program';
  rating: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  image: string;
  date: string;
  read: boolean;
  category: string;
}

// --- Chat Interfaces ---

export interface ChatConversation {
  id: string;
  participants: UserFriend[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  type: 'text' | 'image' | 'recommendation' | 'list';
  content?: any; // For rich content like recommendations
  createdAt: string;
  readBy: string[];
}

export interface ChatRecommendationContent {
  id: string;
  title: string;
  image: string;
  platform: string;
  type: 'movie' | 'series' | 'program';
}

export interface UserSessionState {
  isAuthenticated: Observable<boolean>;
  profile: Observable<UserProfile>;
}

export interface AuthSessionInfo {
  id: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceName?: string;
  current?: boolean;
}

export interface UserNotification {
  id: string;
  type: 'follow' | 'message' | 'recommendation' | 'report_status' | 'system';
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  payload?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  targetUserId?: string;
  targetMessageId?: string;
  type: 'user' | 'message' | 'content' | 'other';
  reason: string;
  details?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
