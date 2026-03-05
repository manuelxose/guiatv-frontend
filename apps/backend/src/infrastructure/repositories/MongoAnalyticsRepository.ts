import { AnalyticsEventModel } from '../database/models/AnalyticsEvent.model';
import { AnalyticsSessionModel } from '../database/models/AnalyticsSession.model';
import {
  AnalyticsEventQuery,
  AnalyticsEventRecord,
  AnalyticsOverview,
  AnalyticsSessionRecord,
  IAnalyticsRepository,
} from '../../domain/repositories/IAnalyticsRepository';

export class MongoAnalyticsRepository implements IAnalyticsRepository {
  async startSession(payload: AnalyticsSessionRecord): Promise<void> {
    const startedAt = payload.startedAt || new Date();
    const lastSeenAt = payload.lastSeenAt || startedAt;
    const setOnInsert: Record<string, any> = {
      sessionId: payload.sessionId,
      anonId: payload.anonId,
      userId: payload.userId,
      startedAt,
      initialPath: payload.initialPath,
      referrer: payload.referrer,
      userAgent: payload.userAgent,
      ip: payload.ip,
      language: payload.language,
      timezone: payload.timezone,
      screen: payload.screen,
      viewport: payload.viewport,
      metadata: payload.metadata,
      endedAt: null,
      durationSec: 0,
    };

    const set: Record<string, any> = {
      lastSeenAt,
    };

    if (payload.lastPath || payload.initialPath) {
      set.lastPath = payload.lastPath || payload.initialPath;
    }
    if (payload.metadata) {
      set.metadata = payload.metadata;
    }

    await AnalyticsSessionModel.updateOne(
      { sessionId: payload.sessionId },
      { $setOnInsert: setOnInsert, $set: set },
      { upsert: true }
    ).exec();
  }

  async heartbeatSession(payload: {
    sessionId: string;
    lastSeenAt: Date;
    lastPath?: string;
    metadata?: Record<string, any>;
  }): Promise<AnalyticsSessionRecord | null> {
    const session = await AnalyticsSessionModel.findOne({
      sessionId: payload.sessionId,
    })
      .lean()
      .exec();
    if (!session) return null;

    const durationSec = this.calculateDurationSec(
      session.startedAt,
      payload.lastSeenAt
    );

    const update: Record<string, any> = {
      lastSeenAt: payload.lastSeenAt,
      durationSec,
    };
    if (payload.lastPath) {
      update.lastPath = payload.lastPath;
    }
    if (payload.metadata) {
      update.metadata = payload.metadata;
    }

    const updated = await AnalyticsSessionModel.findOneAndUpdate(
      { sessionId: payload.sessionId },
      { $set: update },
      { new: true }
    )
      .lean()
      .exec();

    return updated ? this.mapSession(updated) : this.mapSession(session);
  }

  async endSession(payload: {
    sessionId: string;
    endedAt: Date;
    lastSeenAt: Date;
    lastPath?: string;
    endReason?: string;
  }): Promise<AnalyticsSessionRecord | null> {
    const session = await AnalyticsSessionModel.findOne({
      sessionId: payload.sessionId,
    })
      .lean()
      .exec();
    if (!session) return null;

    const durationSec = this.calculateDurationSec(
      session.startedAt,
      payload.endedAt
    );

    const update: Record<string, any> = {
      endedAt: payload.endedAt,
      endReason: payload.endReason,
      lastSeenAt: payload.lastSeenAt,
      durationSec,
    };
    if (payload.lastPath) {
      update.lastPath = payload.lastPath;
    }

    const updated = await AnalyticsSessionModel.findOneAndUpdate(
      { sessionId: payload.sessionId },
      { $set: update },
      { new: true }
    )
      .lean()
      .exec();

    return updated ? this.mapSession(updated) : this.mapSession(session);
  }

  async createEvent(payload: AnalyticsEventRecord): Promise<void> {
    await AnalyticsEventModel.create({
      ...payload,
      occurredAt: payload.occurredAt || new Date(),
    });
  }

  async getLiveSessions(
    windowSec: number,
    limit: number
  ): Promise<AnalyticsSessionRecord[]> {
    const since = new Date(Date.now() - windowSec * 1000);
    const sessions = await AnalyticsSessionModel.find({
      lastSeenAt: { $gte: since },
      $or: [{ endedAt: null }, { endedAt: { $exists: false } }],
    })
      .sort({ lastSeenAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return sessions.map((session) => this.mapSession(session));
  }

  async countLiveSessions(windowSec: number): Promise<number> {
    const since = new Date(Date.now() - windowSec * 1000);
    return AnalyticsSessionModel.countDocuments({
      lastSeenAt: { $gte: since },
      $or: [{ endedAt: null }, { endedAt: { $exists: false } }],
    }).exec();
  }

  async getOverview(
    from: Date,
    to: Date,
    liveWindowSec: number
  ): Promise<AnalyticsOverview> {
    const [totalSessions, uniqueVisitors, totalPageViews] = await Promise.all([
      AnalyticsSessionModel.countDocuments({
        startedAt: { $gte: from, $lte: to },
      }).exec(),
      AnalyticsSessionModel.distinct('anonId', {
        startedAt: { $gte: from, $lte: to },
      }).then((items) => items.length),
      AnalyticsEventModel.countDocuments({
        type: 'page_view',
        occurredAt: { $gte: from, $lte: to },
      }).exec(),
    ]);

    const avgDurationAgg = await AnalyticsSessionModel.aggregate([
      {
        $match: {
          endedAt: { $gte: from, $lte: to },
          durationSec: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgDurationSec: { $avg: '$durationSec' },
        },
      },
    ]).exec();

    const topPages = await AnalyticsEventModel.aggregate([
      {
        $match: {
          type: 'page_view',
          occurredAt: { $gte: from, $lte: to },
          path: { $nin: [null, ''] },
        },
      },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, path: '$_id', count: 1 } },
    ]).exec();

    const topReferrers = await AnalyticsEventModel.aggregate([
      {
        $match: {
          type: 'page_view',
          occurredAt: { $gte: from, $lte: to },
          referrer: { $nin: [null, ''] },
        },
      },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, referrer: '$_id', count: 1 } },
    ]).exec();

    const sessionsByDay = await AnalyticsSessionModel.aggregate([
      {
        $match: {
          startedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]).exec();

    const liveCount = await this.countLiveSessions(liveWindowSec);

    return {
      activeNow: liveCount,
      totalSessions,
      uniqueVisitors,
      totalPageViews,
      avgSessionDurationSec: Math.round(
        avgDurationAgg[0]?.avgDurationSec || 0
      ),
      topPages,
      topReferrers,
      sessionsByDay,
    };
  }

  async getRecentEvents(
    query: AnalyticsEventQuery
  ): Promise<AnalyticsEventRecord[]> {
    const limit = query.limit || 50;
    const filters: Record<string, any> = {};

    if (query.type) filters.type = query.type;
    if (query.sessionId) filters.sessionId = query.sessionId;
    if (query.from || query.to) {
      filters.occurredAt = {};
      if (query.from) filters.occurredAt.$gte = query.from;
      if (query.to) filters.occurredAt.$lte = query.to;
    }

    const events = await AnalyticsEventModel.find(filters)
      .sort({ occurredAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return events.map((event) => this.mapEvent(event));
  }

  private calculateDurationSec(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  }

  private mapSession(doc: any): AnalyticsSessionRecord {
    return {
      sessionId: doc.sessionId,
      anonId: doc.anonId,
      userId: doc.userId,
      startedAt: doc.startedAt,
      lastSeenAt: doc.lastSeenAt,
      endedAt: doc.endedAt,
      endReason: doc.endReason,
      durationSec: doc.durationSec,
      initialPath: doc.initialPath,
      lastPath: doc.lastPath,
      referrer: doc.referrer,
      userAgent: doc.userAgent,
      ip: doc.ip,
      language: doc.language,
      timezone: doc.timezone,
      screen: doc.screen,
      viewport: doc.viewport,
      metadata: doc.metadata,
    };
  }

  private mapEvent(doc: any): AnalyticsEventRecord {
    return {
      eventId: doc.eventId,
      sessionId: doc.sessionId,
      anonId: doc.anonId,
      userId: doc.userId,
      type: doc.type,
      name: doc.name,
      path: doc.path,
      title: doc.title,
      referrer: doc.referrer,
      occurredAt: doc.occurredAt,
      data: doc.data,
      userAgent: doc.userAgent,
      ip: doc.ip,
      language: doc.language,
      timezone: doc.timezone,
    };
  }
}
