import {
  UserContentInteraction,
  UserContentInteractionProps,
} from '../entities/UserContentInteraction';

export interface IUserContentInteractionRepository {
  findByUserAndContent(
    userId: string,
    contentId: string
  ): Promise<UserContentInteraction | null>;
  findByUser(
    userId: string,
    filters?: {
      status?: string;
      contentType?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<UserContentInteraction[]>;
  upsert(
    interaction: Omit<
      UserContentInteractionProps,
      'createdAt' | 'updatedAt'
    > & {
      createdAt?: Date;
      updatedAt?: Date;
    }
  ): Promise<UserContentInteraction>;
  delete(userId: string, contentId: string): Promise<boolean>;
  getUserGenreProfile(userId: string): Promise<{
    genres: Array<{ genre: string; score: number; count: number }>;
    preferredPlatforms: string[];
    avgRating: number;
    totalInteractions: number;
  }>;
  getSimilarUsers(userId: string, limit?: number): Promise<string[]>;
}
