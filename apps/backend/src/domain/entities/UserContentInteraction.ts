export type UserContentInteractionType = 'movie' | 'series' | 'program';
export type UserContentInteractionStatus =
  | 'seen'
  | 'watching'
  | 'pending'
  | 'dropped';

export interface UserContentInteractionProps {
  userId: string;
  contentId: string;
  contentTitle: string;
  contentType: UserContentInteractionType;
  tmdbId?: number;
  genres: string[];
  rating?: number;
  status: UserContentInteractionStatus;
  liked?: boolean;
  addedToList?: boolean;
  recommended?: boolean;
  platform?: string;
  watchedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
}

export interface UserContentInteraction extends UserContentInteractionProps {
  id: string;
}
