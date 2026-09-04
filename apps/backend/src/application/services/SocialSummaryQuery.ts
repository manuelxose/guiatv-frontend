import { UserFollowModel } from '@/infrastructure/database/models/UserFollow.model';
import { UserContentInteractionModel } from '@/infrastructure/database/models/UserContentInteraction.model';

/**
 * Shared Mongo access for "what did the people I follow do with this
 * content" — the query shape behind a detail page's social summary.
 * CatalogService (catalog-id-keyed detail path) and GetContentDetail
 * (legacy raw-programId detail path) both need this and used to carry
 * near-identical copies of the follow lookup and aggregation pipeline;
 * consolidated here so there's one query to index/tune, while each caller
 * keeps its own id-matching strategy (see the `orConditions` it builds) and
 * its own "no followees" return convention.
 */

export interface FriendActivityStats {
  friendsWhoWatched: number;
  avgFriendRating?: number;
}

/** Ids of the accounts `followerId` follows. Empty when there are none. */
export async function findFolloweeIds(followerId: string): Promise<string[]> {
  const follows = await UserFollowModel.find({ followerId }).lean().exec();
  return follows.map((entry: any) => String(entry.followeeId)).filter(Boolean);
}

/**
 * Aggregates interactions from `friendIds` matching any of `orConditions`
 * into a friends-who-watched count and average rating. Returns `null` when
 * there is no matching activity — callers decide what an empty result means
 * for their own response shape (omit the field vs. report a zero count).
 */
export async function aggregateFriendActivity(
  friendIds: string[],
  orConditions: Array<Record<string, unknown>>
): Promise<FriendActivityStats | null> {
  if (!friendIds.length || !orConditions.length) {
    return null;
  }

  const stats = await UserContentInteractionModel.aggregate([
    {
      $match: {
        userId: { $in: friendIds },
        $or: orConditions,
      },
    },
    {
      $group: {
        _id: null,
        users: { $addToSet: '$userId' },
        avgFriendRating: { $avg: '$rating' },
      },
    },
  ]).exec();

  const first = stats[0];
  if (!first) {
    return null;
  }

  return {
    friendsWhoWatched: Array.isArray(first.users) ? first.users.length : 0,
    avgFriendRating:
      typeof first.avgFriendRating === 'number'
        ? Number(first.avgFriendRating.toFixed(1))
        : undefined,
  };
}
