import { UserAssistantConversationModel } from '@/infrastructure/database/models/UserAssistantConversation.model';
import { UserAssistantMemoryModel } from '@/infrastructure/database/models/UserAssistantMemory.model';
import { UserModel } from '@/infrastructure/database/models/User.model';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';

export interface AIAnalyticsOverview {
  totalConversations: number;
  totalMessages: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  avgMessagesPerConversation: number;
  topGenres: { genre: string; count: number }[];
  topPlatforms: { platform: string; count: number }[];
  subscriptionBreakdown: { free: number; premium: number };
  feedbackSummary: { positive: number; negative: number };
}

export interface AIAnalyticsTimeSeries {
  date: string;
  conversations: number;
  messages: number;
}

export class AIAnalyticsService {
  constructor(private readonly cacheRepository: ICacheRepository) {}

  async getOverview(): Promise<AIAnalyticsOverview> {
    const cacheKey = 'ai:analytics:overview';
    try {
      const cached = await this.cacheRepository.get<string>(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* miss */ }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

    const [
      totalConversations,
      messagePipeline,
      activeTodayCount,
      activeWeekCount,
      memoryAgg,
      feedbackAgg,
      subscriptionAgg,
    ] = await Promise.all([
      UserAssistantConversationModel.countDocuments(),
      UserAssistantConversationModel.aggregate([
        { $project: { msgCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$msgCount' }, count: { $sum: 1 } } },
      ]),
      UserAssistantConversationModel.distinct('userId', {
        lastUsedAt: { $gte: todayStart },
      }).then((ids) => ids.length),
      UserAssistantConversationModel.distinct('userId', {
        lastUsedAt: { $gte: weekStart },
      }).then((ids) => ids.length),
      UserAssistantMemoryModel.aggregate([
        {
          $facet: {
            genres: [
              { $unwind: '$likedGenres' },
              { $group: { _id: '$likedGenres', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            platforms: [
              { $unwind: '$preferredPlatforms' },
              { $group: { _id: '$preferredPlatforms', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ]),
      UserAssistantConversationModel.aggregate([
        { $unwind: '$messages' },
        { $match: { 'messages.feedback': { $exists: true } } },
        {
          $group: {
            _id: '$messages.feedback.rating',
            count: { $sum: 1 },
          },
        },
      ]),
      UserModel.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$subscription', 'free'] },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const msgStats = messagePipeline[0] || { total: 0, count: 0 };
    const memFacets = memoryAgg[0] || { genres: [], platforms: [] };

    const feedbackMap: Record<string, number> = {};
    feedbackAgg.forEach((f: { _id: string; count: number }) => {
      feedbackMap[f._id] = f.count;
    });

    const subMap: Record<string, number> = {};
    subscriptionAgg.forEach((s: { _id: string; count: number }) => {
      subMap[s._id] = s.count;
    });

    const result: AIAnalyticsOverview = {
      totalConversations,
      totalMessages: msgStats.total,
      activeUsersToday: activeTodayCount,
      activeUsersWeek: activeWeekCount,
      avgMessagesPerConversation:
        msgStats.count > 0 ? Math.round((msgStats.total / msgStats.count) * 10) / 10 : 0,
      topGenres: memFacets.genres.map((g: { _id: string; count: number }) => ({
        genre: g._id,
        count: g.count,
      })),
      topPlatforms: memFacets.platforms.map((p: { _id: string; count: number }) => ({
        platform: p._id,
        count: p.count,
      })),
      subscriptionBreakdown: {
        free: subMap['free'] || 0,
        premium: subMap['premium'] || 0,
      },
      feedbackSummary: {
        positive: feedbackMap['positive'] || 0,
        negative: feedbackMap['negative'] || 0,
      },
    };

    this.cacheRepository.set(cacheKey, JSON.stringify(result), 120).catch(() => {});
    return result;
  }

  async getTimeSeries(days = 30): Promise<AIAnalyticsTimeSeries[]> {
    const cacheKey = `ai:analytics:timeseries:${days}`;
    try {
      const cached = await this.cacheRepository.get<string>(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* miss */ }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const pipeline = await UserAssistantConversationModel.aggregate([
      { $match: { lastUsedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastUsedAt' },
          },
          conversations: { $sum: 1 },
          messages: { $sum: { $size: '$messages' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = pipeline.map((row: { _id: string; conversations: number; messages: number }) => ({
      date: row._id,
      conversations: row.conversations,
      messages: row.messages,
    }));

    this.cacheRepository.set(cacheKey, JSON.stringify(result), 300).catch(() => {});
    return result;
  }
}
