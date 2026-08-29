import { ChannelModel } from '../../infrastructure/database/models/Channel.model';
import { ProgramModel } from '../../infrastructure/database/models/Program.model';

export type EpgChannelStatus = 'current' | 'stale' | 'missing';

export interface EpgChannelDiagnostic {
  id: string;
  name: string;
  logo?: string;
  access: string;
  active: boolean;
  sources: string[];
  externalIds: string[];
  aliasesCount: number;
  epgStatus: EpgChannelStatus;
  lastScheduleUpdate?: Date;
  nextScheduleAt?: Date;
}

/** Read-only operational projection; never exposes provider credentials or EPG payloads. */
export class AdminEpgDiagnosticsService {
  async getOverview(): Promise<Record<string, unknown>> {
    const now = new Date();
    const staleAt = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const [channels, activeChannelIds, currentIds, staleIds, lastProgram] = await Promise.all([
      ChannelModel.find({}, { id: 1, access: 1, active: 1 }).lean(),
      ChannelModel.distinct('id', { active: true }),
      ProgramModel.distinct('canonicalChannelId', { endTime: { $gte: now } }),
      ProgramModel.distinct('canonicalChannelId', { updatedAt: { $lt: staleAt }, endTime: { $gte: now } }),
      ProgramModel.findOne({}).sort({ updatedAt: -1 }).select({ updatedAt: 1 }).lean(),
    ]);
    const current = new Set(currentIds.filter(Boolean));
    const stale = new Set(staleIds.filter(Boolean));
    const active = new Set(activeChannelIds);
    const activeChannels = channels.filter((channel) => active.has(channel.id));
    const freeChannels = channels.filter((channel) => channel.access === 'free').length;
    const payChannels = channels.filter((channel) => channel.access === 'pay').length;
    const channelsWithCurrentEpg = activeChannels.filter((channel) => current.has(channel.id) && !stale.has(channel.id)).length;
    return {
      generatedAt: now,
      totalChannels: channels.length,
      activeChannels: activeChannels.length,
      freeChannels,
      payChannels,
      channelsWithCurrentEpg,
      channelsMissingEpg: activeChannels.filter((channel) => !current.has(channel.id)).length,
      staleChannels: activeChannels.filter((channel) => stale.has(channel.id)).length,
      currentCoveragePercent: activeChannels.length ? Math.round((channelsWithCurrentEpg / activeChannels.length) * 100) : 0,
      lastScheduleUpdate: lastProgram?.updatedAt,
    };
  }

  async listChannels(input: { page?: number; limit?: number; search?: string; access?: string; status?: string }) {
    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 25));
    const filter: Record<string, unknown> = {};
    if (input.access === 'free' || input.access === 'pay') filter.access = input.access;
    if (input.search) filter.$or = [{ name: new RegExp(input.search, 'i') }, { id: new RegExp(input.search, 'i') }, { aliases: new RegExp(input.search, 'i') }];
    const [channels, total] = await Promise.all([
      ChannelModel.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      ChannelModel.countDocuments(filter),
    ]);
    const ids = channels.map((channel) => channel.id);
    const now = new Date();
    const programRows = await ProgramModel.aggregate([
      { $match: { canonicalChannelId: { $in: ids } } },
      { $group: { _id: '$canonicalChannelId', lastScheduleUpdate: { $max: '$updatedAt' }, nextScheduleAt: { $min: { $cond: [{ $gte: ['$endTime', now] }, '$startTime', null] } } } },
    ]);
    const programByChannel = new Map(programRows.map((row) => [row._id, row]));
    const staleAt = now.getTime() - 6 * 60 * 60 * 1000;
    const items: EpgChannelDiagnostic[] = channels.map((channel) => {
      const epg = programByChannel.get(channel.id);
      const epgStatus: EpgChannelStatus = !epg?.nextScheduleAt ? 'missing' : new Date(epg.lastScheduleUpdate).getTime() < staleAt ? 'stale' : 'current';
      return { id: channel.id, name: channel.name, logo: channel.logo, access: channel.access || 'unknown', active: channel.active, sources: channel.providers || [], externalIds: channel.sourceIds || [], aliasesCount: channel.aliases?.length || 0, epgStatus, lastScheduleUpdate: epg?.lastScheduleUpdate, nextScheduleAt: epg?.nextScheduleAt };
    }).filter((channel) => !input.status || channel.epgStatus === input.status);
    return { page, limit, total, items };
  }
}
