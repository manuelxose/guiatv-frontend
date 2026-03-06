import {
  UserContentInteraction,
  UserContentInteractionProps,
} from '@/domain/entities/UserContentInteraction';
import { IUserContentInteractionRepository } from '@/domain/repositories/IUserContentInteractionRepository';
import { UserContentInteractionModel } from '../database/models/UserContentInteraction.model';

type InteractionInput = Omit<
  UserContentInteractionProps,
  'createdAt' | 'updatedAt'
> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export class MongoUserContentInteractionRepository
  implements IUserContentInteractionRepository
{
  async findByUserAndContent(
    userId: string,
    contentId: string
  ): Promise<UserContentInteraction | null> {
    const doc = await UserContentInteractionModel.findOne({
      userId,
      contentId,
    })
      .lean()
      .exec();

    return doc ? this.map(doc) : null;
  }

  async findByUser(
    userId: string,
    filters?: {
      status?: string;
      contentType?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<UserContentInteraction[]> {
    const query: Record<string, unknown> = { userId };
    if (filters?.status) query.status = filters.status;
    if (filters?.contentType) query.contentType = filters.contentType;

    const docs = await UserContentInteractionModel.find(query)
      .sort({ updatedAt: -1 })
      .skip(Number(filters?.skip || 0))
      .limit(Math.max(0, Number(filters?.limit || 100)))
      .lean()
      .exec();

    return docs.map((doc) => this.map(doc));
  }

  async upsert(interaction: InteractionInput): Promise<UserContentInteraction> {
    const now = new Date();
    const next = await UserContentInteractionModel.findOneAndUpdate(
      {
        userId: interaction.userId,
        contentId: interaction.contentId,
      },
      {
        $set: {
          contentTitle: interaction.contentTitle,
          contentType: interaction.contentType,
          tmdbId: interaction.tmdbId,
          genres: interaction.genres || [],
          rating: interaction.rating,
          status: interaction.status,
          liked: Boolean(interaction.liked),
          addedToList: Boolean(interaction.addedToList),
          recommended: Boolean(interaction.recommended),
          platform: interaction.platform,
          watchedAt: interaction.watchedAt,
          updatedAt: interaction.updatedAt || now,
        },
        $setOnInsert: {
          createdAt: interaction.createdAt || now,
        },
      },
      {
        new: true,
        upsert: true,
      }
    )
      .lean()
      .exec();

    return this.map(next!);
  }

  async delete(userId: string, contentId: string): Promise<boolean> {
    const result = await UserContentInteractionModel.deleteOne({
      userId,
      contentId,
    }).exec();

    return Boolean(result.deletedCount);
  }

  async getUserGenreProfile(userId: string): Promise<{
    genres: Array<{ genre: string; score: number; count: number }>;
    preferredPlatforms: string[];
    avgRating: number;
    totalInteractions: number;
  }> {
    const [genreStats, platformStats, ratingStats] = await Promise.all([
      UserContentInteractionModel.aggregate([
        { $match: { userId } },
        { $unwind: { path: '$genres', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$genres',
            count: { $sum: 1 },
            ratingSum: { $sum: { $ifNull: ['$rating', 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            genre: '$_id',
            count: 1,
            score: {
              $add: ['$count', { $divide: ['$ratingSum', 10] }],
            },
          },
        },
        { $sort: { score: -1, count: -1 } },
        { $limit: 12 },
      ]).exec(),
      UserContentInteractionModel.aggregate([
        { $match: { userId, platform: { $exists: true, $ne: '' } } },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]).exec(),
      UserContentInteractionModel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalInteractions: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    const rating = ratingStats[0] || { avgRating: 0, totalInteractions: 0 };

    return {
      genres: genreStats.map((item) => ({
        genre: String(item.genre || ''),
        score: Number(item.score || 0),
        count: Number(item.count || 0),
      })),
      preferredPlatforms: platformStats
        .map((item) => String(item._id || '').trim())
        .filter(Boolean),
      avgRating: Number(rating.avgRating || 0),
      totalInteractions: Number(rating.totalInteractions || 0),
    };
  }

  async getSimilarUsers(userId: string, limit: number = 5): Promise<string[]> {
    const profile = await this.getUserGenreProfile(userId);
    const topGenres = profile.genres.slice(0, 5).map((genre) => genre.genre);

    if (!topGenres.length) {
      return [];
    }

    const docs = await UserContentInteractionModel.aggregate([
      {
        $match: {
          userId: { $ne: userId },
          genres: { $in: topGenres },
        },
      },
      {
        $group: {
          _id: '$userId',
          overlap: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { overlap: -1, avgRating: -1 } },
      { $limit: Math.max(1, limit) },
    ]).exec();

    return docs.map((item) => String(item._id));
  }

  private map(doc: any): UserContentInteraction {
    return {
      id: String(doc._id),
      userId: String(doc.userId),
      contentId: String(doc.contentId),
      contentTitle: String(doc.contentTitle),
      contentType: doc.contentType,
      tmdbId: typeof doc.tmdbId === 'number' ? doc.tmdbId : undefined,
      genres: Array.isArray(doc.genres) ? doc.genres.map(String) : [],
      rating: typeof doc.rating === 'number' ? doc.rating : undefined,
      status: doc.status,
      liked: Boolean(doc.liked),
      addedToList: Boolean(doc.addedToList),
      recommended: Boolean(doc.recommended),
      platform: doc.platform ? String(doc.platform) : undefined,
      watchedAt: doc.watchedAt ? new Date(doc.watchedAt) : undefined,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    };
  }
}
