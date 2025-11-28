import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  favoriteGenres: string[];
  watchingNow: WatchingNow;
  privacy: UserPrivacy;
  notifications: UserNotifications;
  stats: UserStats;
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
}

export interface UserNotifications {
  recommendations: boolean;
  followers: boolean;
  weeklySummary: boolean;
}

export interface UserStats {
  followers: number;
  following: number;
  recommendations: number;
  watchlist: number;
}

export interface UserRecommendation {
  id: string;
  title: string;
  type: 'movie' | 'series';
  note: string;
  tags: string[];
  visibility: Visibility;
  status: 'watching' | 'pending' | 'finished';
  rating?: number;
  createdAt: string;
  mood?: string;
  platform?: string;
}

export interface UserActivity {
  id: string;
  type: 'review' | 'status' | 'follow' | 'list' | 'recommendation';
  title: string;
  description: string;
  createdAt: string;
  badge?: string;
  category?: string;
  target?: string;
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
  title: string;
  type: 'movie' | 'series';
  state: 'pending' | 'watching' | 'finished';
  progress: number;
  mood?: string;
  visibility: Visibility;
  poster?: string;
}

export type Visibility = 'public' | 'friends' | 'private';

export interface UserSessionState {
  isAuthenticated: Observable<boolean>;
  profile: Observable<UserProfile>;
}
