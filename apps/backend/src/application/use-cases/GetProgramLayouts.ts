import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { ScheduleModel } from '../../infrastructure/database/models/Schedule.model';
import { DateUtils } from '../../shared/utils/dateUtils';
import { ProgramLayoutDTO, TimeSlotDTO } from '../services/ProgramLayoutBuilder';
import { GetPrograms } from './GetPrograms';

export interface GetProgramLayoutsRequest {
  date: string;
  channels?: string[];
  timeSlot?: string;
  fields?: 'minimal' | 'full';
}

export interface GetProgramLayoutsResponse {
  date: string;
  timeSlots: TimeSlotDTO[];
  channels: Array<{
    channel: any;
    programs: ProgramLayoutDTO[];
  }>;
  meta: {
    date: string;
    totalChannels: number;
    totalPrograms: number;
    cached: boolean;
    precomputed: boolean;
    layoutVersion: string;
    uiConstants?: Record<string, any>;
  };
}

/**
 * Returns per-channel layout metadata for the TV grid, using cached snapshots when available.
 */
export class GetProgramLayouts {
  private readonly layoutVersion = process.env.LAYOUT_VERSION || 'v1';
  private readonly fullSnapshotLimit =
    Number(process.env.PROGRAMS_FULL_SNAPSHOT_LIMIT || 100000) || 100000;

  constructor(
    private readonly cacheRepository: ICacheRepository,
    private readonly getPrograms: GetPrograms
  ) {}

  /**
   * Resolves the layout snapshot for a date applying optional filters.
   */
  async execute(
    request: GetProgramLayoutsRequest
  ): Promise<GetProgramLayoutsResponse> {
    const normalizedDate = DateUtils.parseDateAlias(request.date);
    const fields = request.fields || 'full';
    const channelFilter = request.channels?.filter(Boolean) ?? [];
    const slotFilter = request.timeSlot;

    const preKey = this.buildPreKey(normalizedDate, fields);

    // 1) Redis snapshot
    const cached = await this.cacheRepository.get<any>(preKey);
    if (cached) {
      return this.buildResponseFromSnapshot(
        cached,
        channelFilter,
        slotFilter,
        true
      );
    }

    // 2) Schedules collection
    const doc = await ScheduleModel.findOne({ date: normalizedDate })
      .lean()
      .exec();
    if (doc && (!doc.layoutVersion || doc.layoutVersion === this.layoutVersion)) {
      const snapshot = {
        date: doc.date,
        timeSlots: doc.timeSlots as any,
        channelMeta: doc.channelMeta || [],
        channels: doc.channels || [],
        meta: {
          layoutVersion: doc.layoutVersion,
          uiConstants: (doc.meta as any)?.uiConstants,
        },
      };
      await this.cacheRepository.set(preKey, snapshot);
      return this.buildResponseFromSnapshot(
        snapshot,
        channelFilter,
        slotFilter,
        true
      );
    }

    // 3) Fallback: compute via GetPrograms, luego agrupar
    const flat = await this.getPrograms.execute({
      date: normalizedDate,
      fields,
      limit: this.fullSnapshotLimit,
    });
    const grouped = this.groupPrograms(flat.channels, flat.programs, channelFilter, slotFilter);
    const response: GetProgramLayoutsResponse = {
      date: flat.date,
      timeSlots: flat.timeSlots,
      channels: grouped.channels,
      meta: {
        date: flat.date,
        totalChannels: grouped.channels.length,
        totalPrograms: grouped.totalPrograms,
        cached: false,
        precomputed: false,
        layoutVersion: this.layoutVersion,
      },
    };
    return response;
  }

  private buildPreKey(date: string, fields: string) {
    return `precomputed:programs:${date}:${fields}:${this.layoutVersion}`;
  }

  private buildResponseFromSnapshot(
    snapshot: any,
    channelFilter: string[],
    slotFilter: string | undefined,
    cached: boolean
  ): GetProgramLayoutsResponse {
    const channelsData = Array.isArray(snapshot.channels) ? snapshot.channels : [];
    const channelMeta = Array.isArray(snapshot.channelMeta) ? snapshot.channelMeta : [];
    const channelSet = channelFilter.length ? new Set(channelFilter) : null;
    const looksLikeFlatSnapshot =
      channelsData.length > 0 && channelsData.every((entry: any) => !Array.isArray(entry?.programs));

    // Compatibilidad: snapshots legacy en formato { channels: channelMeta[], programs: [...] }.
    if (looksLikeFlatSnapshot && Array.isArray(snapshot.programs)) {
      const grouped = this.groupPrograms(
        channelsData as Array<{ id: string; name: string }>,
        snapshot.programs as ProgramLayoutDTO[],
        channelFilter,
        slotFilter
      );

      return {
        date: snapshot.date,
        timeSlots: snapshot.timeSlots || [],
        channels: grouped.channels,
        meta: {
          date: snapshot.date,
          totalChannels: grouped.channels.length,
          totalPrograms: grouped.totalPrograms,
          cached,
          precomputed: true,
          layoutVersion: snapshot.meta?.layoutVersion || this.layoutVersion,
          uiConstants: snapshot.meta?.uiConstants,
        },
      };
    }

    const channelMetaMap = new Map<string, any>();
    channelMeta.forEach((ch: any) => {
      const normalized = this.normalizeChannelMeta(ch, ch?.id);
      if (normalized?.id) channelMetaMap.set(normalized.id, normalized);
    });

    const filteredChannels = channelsData
      .map((entry: any) => {
        const programs: ProgramLayoutDTO[] = this.filterProgramsBySlot(
          entry?.programs || [],
          slotFilter
        );
        const channelId = this.resolveChannelIdFromEntry(entry, programs);
        const channel = this.hydrateChannel(entry, channelMetaMap, programs, channelId);
        return {
          channelId,
          channel,
          programs,
        };
      })
      .filter((entry: any) => !!entry.channel?.id)
      .filter((entry: any) => !channelSet || channelSet.has(entry.channelId))
      .filter((entry: any) => Array.isArray(entry.programs) && entry.programs.length)
      .map((entry: any) => ({
        channel: entry.channel,
        programs: entry.programs,
      }));

    const totalPrograms = filteredChannels.reduce(
      (acc: number, c: any) => acc + (c.programs?.length || 0),
      0
    );

    return {
      date: snapshot.date,
      timeSlots: snapshot.timeSlots || [],
      channels: filteredChannels,
      meta: {
        date: snapshot.date,
        totalChannels: filteredChannels.length,
        totalPrograms,
        cached,
        precomputed: true,
        layoutVersion: snapshot.meta?.layoutVersion || this.layoutVersion,
        uiConstants: snapshot.meta?.uiConstants,
      },
    };
  }

  private filterProgramsBySlot(programs: ProgramLayoutDTO[], slotFilter?: string): ProgramLayoutDTO[] {
    return (programs || []).filter((p: any) => {
      if (!slotFilter) return true;
      const num = Number(slotFilter);
      if (Number.isNaN(num)) return true;
      if (typeof p.timeSlotIndex === 'number' && p.timeSlotIndex === num) return true;
      return !!p.layoutsBySlot?.some((l: any) => l.timeSlotIndex === num);
    });
  }

  private resolveChannelIdFromEntry(entry: any, programs: ProgramLayoutDTO[]): string {
    return (
      entry?.channel?.id ||
      entry?.channelId ||
      programs.find((p: any) => !!p?.channelId)?.channelId ||
      ''
    );
  }

  private normalizeChannelMeta(channel: any, fallbackId: string): any {
    if (!channel && !fallbackId) return null;
    const id = channel?.id || fallbackId || '';
    if (!id) return null;
    const channelName =
      typeof channel?.name === 'string' && channel.name.trim()
        ? channel.name.trim()
        : undefined;
    return {
      id,
      name: channelName,
      icon: channel?.icon || undefined,
      type: channel?.type || undefined,
      country: channel?.country || undefined,
      countryCode: channel?.countryCode || undefined,
    };
  }

  private hydrateChannel(
    entry: any,
    channelMetaMap: Map<string, any>,
    programs: ProgramLayoutDTO[],
    channelId: string
  ): any {
    const fromEntry = this.normalizeChannelMeta(entry?.channel, channelId);
    const fromMeta = channelMetaMap.get(channelId);
    const fromProgram = this.normalizeChannelMeta(
      (programs.find((p: any) => p?.channel && (p.channel as any).id) as any)?.channel,
      channelId
    );

    const merged = {
      id: channelId || fromEntry?.id || fromMeta?.id || fromProgram?.id || '',
      name:
        fromEntry?.name ||
        fromMeta?.name ||
        fromProgram?.name ||
        channelId ||
        'Canal desconocido',
      icon: fromEntry?.icon || fromMeta?.icon || fromProgram?.icon,
      type: fromEntry?.type || fromMeta?.type || fromProgram?.type,
      country: fromEntry?.country || fromMeta?.country || fromProgram?.country,
      countryCode:
        fromEntry?.countryCode || fromMeta?.countryCode || fromProgram?.countryCode,
    };

    return merged;
  }

  private groupPrograms(
    channelMeta: Array<{ id: string; name: string }>,
    programs: ProgramLayoutDTO[],
    channelFilter: string[],
    slotFilter?: string
  ) {
    const channelSet = channelFilter.length ? new Set(channelFilter) : null;
    const filtered = channelSet
      ? programs.filter((p) => channelSet.has(p.channelId))
      : programs;

    const slot = slotFilter ? Number(slotFilter) : null;
    const filteredBySlot =
      slot !== null && !isNaN(slot)
        ? filtered.filter(
            (p) =>
              p.timeSlotIndex === slot ||
              p.layoutsBySlot?.some((l) => l.timeSlotIndex === slot)
          )
        : filtered;

    const map = new Map<string, ProgramLayoutDTO[]>();
    filteredBySlot.forEach((p) => {
      const list = map.get(p.channelId) || [];
      list.push(p);
      map.set(p.channelId, list);
    });

    const channels = channelMeta
      .filter((ch) => map.has(ch.id))
      .map((ch) => ({
        channel: ch,
        programs: map.get(ch.id) || [],
      }));

    return {
      channels,
      totalPrograms: filteredBySlot.length,
    };
  }
}
