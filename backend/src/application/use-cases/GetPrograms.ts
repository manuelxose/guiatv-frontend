import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { ChannelMapper } from '../mappers/ChannelMapper';
import { DateUtils } from '../../shared/utils/dateUtils';
import { ProgramFilter, DEFAULT_TIME_SLOTS } from '../../domain/services/ProgramFilter';
import { CacheKeyBuilder } from '../../shared/utils/cacheKeyBuilder';
import { Program } from '../../domain/entities/Program';
import { ScheduleModel, IScheduleDocument } from '../../infrastructure/database/models/Schedule.model';
import {
  ProgramLayoutBuilder,
  ProgramLayoutDTO,
  TimeSlotDTO,
} from '../services/ProgramLayoutBuilder';

export interface GetProgramsRequest {
  date: string;
  channels?: string[];
  timeSlot?: string;
  fields?: 'minimal' | 'full';
  page?: number;
  limit?: number;
  country?: string;
  channelTypes?: string[];
}

export interface GetProgramsResponse {
  date: string;
  timeSlots: TimeSlotDTO[];
  channels: Array<{
    id: string;
    name: string;
    icon?: string | null;
    type?: string;
    country?: string;
    countryCode?: string;
  }>;
  programs: ProgramLayoutDTO[];
  meta: {
    date: string;
    totalChannels: number;
    totalPrograms: number;
    cached: boolean;
    precomputed?: boolean;
  };
}

type NormalizedRequest = GetProgramsRequest & {
  date: string;
  channels: string[];
  timeSlot: string;
  fields: 'minimal' | 'full';
  page: number;
  limit: number;
  channelTypes: string[];
};

export class GetPrograms {
  private readonly layoutBuilder = new ProgramLayoutBuilder();
  private readonly timeSlots = this.layoutBuilder.buildTimeSlots();
  private readonly cacheTtlSeconds =
    Number(process.env.PROGRAMS_CACHE_TTL_SEC || 300) || 300;
  private readonly layoutVersion =
    process.env.LAYOUT_VERSION || 'v1';
  private readonly typeOrder: Record<string, number> = {
    TDT: 0,
    AUTONOMICO: 1,
    MOVISTAR: 2,
    CABLE: 3,
    OTT: 4,
  };
  private readonly tdtPriority = [
    'LA 1',
    'LA 2',
    'ANTENA 3',
    'CUATRO',
    'TELECINCO',
    'LA SEXTA',
    'PARAMOUNT NETWORK',
    'DIVINITY',
    'DKISS',
    'TEN',
    'BE MAD',
    'MEGA',
    'DMAX',
    'ENERGY',
    'FDF',
    'ATRESERIES',
    'NEOX',
    'NOVA',
  ];

  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly channelRepository: IChannelRepository,
    private readonly cacheRepository: ICacheRepository
  ) {}

  async execute(request: GetProgramsRequest): Promise<GetProgramsResponse> {
    const normalized = this.normalizeRequest(request);
    const fields = normalized.fields;

    const canUsePrecomputed =
      !normalized.channels.length &&
      !normalized.timeSlot &&
      normalized.page === 1 &&
      normalized.limit >= 10000;

    const preKey = `precomputed:programs:${normalized.date}:${fields}`;
    if (canUsePrecomputed) {
      const pre = await this.cacheRepository.get<GetProgramsResponse>(preKey);
      if (pre) {
        return { ...pre, meta: { ...pre.meta, cached: true, precomputed: true } };
      }
    }

    // Try schedule cache/collection first to avoid hitting Mongo when data is precomputed
    const scheduleHit = await this.loadScheduleSnapshot(normalized.date, fields);
    if (scheduleHit) {
      const filtered = this.filterSchedulePrograms(scheduleHit, normalized);
      const totalPrograms = filtered.programs.length;
      const channelOrder = this.buildChannelOrder(filtered.channels);
      const sortedLayouts = this.sortProgramLayouts(filtered.programs, channelOrder);
      const paged = this.paginate(sortedLayouts, normalized.page, normalized.limit);

      const response: GetProgramsResponse = {
        date: filtered.date,
        timeSlots: filtered.timeSlots,
        channels: filtered.channels,
        programs: paged,
        meta: {
          date: filtered.date,
          totalChannels: filtered.channels.length,
          totalPrograms,
          cached: true,
          precomputed: true,
        },
      };

      // Cache the fully resolved response if it matched the canonical no-filter path
      if (canUsePrecomputed && !filtered.fromCache) {
        await this.cacheRepository.set(preKey, response, this.cacheTtlSeconds * 4);
      }

      return response;
    }

    const cacheKey = CacheKeyBuilder.forPrograms(normalized);

    const cached = await this.cacheRepository.get<GetProgramsResponse>(cacheKey);
    if (cached) {
      return {
        ...cached,
        meta: { ...cached.meta, cached: true },
      };
    }

    const channelFilter = normalized.channels?.length
      ? new Set(normalized.channels)
      : null;

    const channelMeta = await this.getChannelMeta(
      channelFilter,
      normalized.country,
      normalized.channelTypes
    );
    const sortedChannelMeta = this.sortChannels(channelMeta);
    const allowedChannelIds = new Set(sortedChannelMeta.map((c) => c.id));
    const channelOrder = this.buildChannelOrder(sortedChannelMeta);

    const programs = await this.programRepository.findByDate(
      normalized.date,
      normalized.fields
    );
    let filteredPrograms = this.filterPrograms(
      programs,
      normalized,
      channelFilter,
      allowedChannelIds
    );

    const totalPrograms = filteredPrograms.length;
    filteredPrograms = this.paginate(
      filteredPrograms,
      normalized.page,
      normalized.limit
    );

    const sortedPrograms = this.sortProgramsRaw(filteredPrograms, channelOrder);

    const dtoPrograms = this.layoutBuilder.buildProgramLayouts(
      sortedPrograms,
      normalized.date,
      this.timeSlots,
      normalized.timeSlot,
      normalized.fields
    );

    const response: GetProgramsResponse = {
      date: normalized.date,
      timeSlots: this.timeSlots,
      channels: sortedChannelMeta,
      programs: dtoPrograms,
      meta: {
        date: normalized.date,
        totalChannels: sortedChannelMeta.length,
        totalPrograms,
        cached: false,
      },
    };

    await this.cacheRepository.set(cacheKey, response, this.cacheTtlSeconds);
    if (canUsePrecomputed) {
      await this.cacheRepository.set(
        `precomputed:programs:${normalized.date}:${normalized.fields}`,
        response,
        this.cacheTtlSeconds * 4
      );
    }
    return response;
  }

  private async loadScheduleSnapshot(
    date: string,
    fields: 'minimal' | 'full'
  ): Promise<
    | {
        date: string;
        timeSlots: TimeSlotDTO[];
        channels: GetProgramsResponse['channels'];
        programs: ProgramLayoutDTO[];
        layoutVersion?: string;
        fromCache?: boolean;
      }
    | null
  > {
    const cacheKey = `schedule:json:${date}:${fields}`;
    const cached = await this.cacheRepository.get<any>(cacheKey);
    if (cached && (!cached.layoutVersion || cached.layoutVersion === this.layoutVersion)) {
      return { ...cached, fromCache: true };
    }

    const doc = (await ScheduleModel.findOne({ date }).lean().exec()) as
      | IScheduleDocument
      | null;
    if (!doc) return null;

    if (doc.layoutVersion && doc.layoutVersion !== this.layoutVersion) {
      return null;
    }
    const storedFields = (doc.meta as any)?.fields;
    if (storedFields && storedFields !== fields) {
      return null;
    }

    const programs =
      doc.channels?.flatMap((ch) => ch.programs || []) || [];

    const snapshot = {
      date: doc.date,
      timeSlots: doc.timeSlots as any,
      channels: this.sortChannels((doc.channelMeta as any) || []),
      programs: programs as any,
      layoutVersion: doc.layoutVersion,
    };

    await this.cacheRepository.set(cacheKey, snapshot, this.cacheTtlSeconds * 2);
    return snapshot;
  }

  private filterSchedulePrograms(
    snapshot: {
      date: string;
      timeSlots: TimeSlotDTO[];
      channels: GetProgramsResponse['channels'];
      programs: ProgramLayoutDTO[];
      fromCache?: boolean;
    },
    request: NormalizedRequest
  ): {
    date: string;
    timeSlots: TimeSlotDTO[];
    channels: GetProgramsResponse['channels'];
    programs: ProgramLayoutDTO[];
    fromCache?: boolean;
  } {
    const channelFilter = request.channels?.length
      ? new Set(request.channels)
      : null;
    const typeFilter = request.channelTypes?.length ? new Set(request.channelTypes.map((t) => t.toUpperCase())) : null;
    const countryFilter = request.country ? request.country.toLowerCase() : '';

    const filteredChannels = snapshot.channels.filter((c) => {
      if (channelFilter && !channelFilter.has(c.id)) return false;
      if (typeFilter && c.type && !typeFilter.has(String(c.type).toUpperCase())) return false;
      if (countryFilter && c.country && c.country.toLowerCase() !== countryFilter) return false;
      if (countryFilter && !c.country) return false;
      return true;
    });

    const allowedChannelIds = new Set(filteredChannels.map((c) => c.id));
    let programs = snapshot.programs.filter((p) => allowedChannelIds.has(p.channelId));

    if (request.timeSlot) {
      const slotIndex = Number(request.timeSlot);
      if (!isNaN(slotIndex)) {
        programs = programs.filter(
          (p) => p.timeSlotIndex === slotIndex || p.layoutsBySlot?.some((l) => l.timeSlotIndex === slotIndex)
        );
      }
    }

    return {
      date: snapshot.date,
      timeSlots: snapshot.timeSlots,
      channels: this.sortChannels(filteredChannels),
      programs: this.sortProgramLayouts(
        programs,
        this.buildChannelOrder(filteredChannels)
      ),
      fromCache: snapshot.fromCache,
    };
  }

  private normalizeRequest(
    request: GetProgramsRequest
  ): NormalizedRequest {
    const date = DateUtils.parseDateAlias(request.date);
    return {
      date,
      channels: request.channels?.filter(Boolean) ?? [],
      timeSlot: request.timeSlot ?? '',
      fields: request.fields ?? 'full',
      page: request.page ?? 1,
      limit: request.limit ?? 500,
      country: request.country,
      channelTypes:
        request.channelTypes?.filter(Boolean).map((t) => t.toUpperCase()) ?? [
          'TDT',
          'CABLE',
          'MOVISTAR',
          'AUTONOMICO',
          'OTT',
        ],
    };
  }

  private filterPrograms(
    programs: Program[],
    request: NormalizedRequest,
    channelFilter: Set<string> | null,
    allowedChannelIds: Set<string>
  ): Program[] {
    let result = programs;

    if (channelFilter) {
      result = result.filter((p) => channelFilter.has(p.channelId));
    }

    if (allowedChannelIds && allowedChannelIds.size > 0) {
      result = result.filter((p) => allowedChannelIds.has(p.channelId));
    }

    if (request.timeSlot) {
      result = ProgramFilter.byTimeSlot(result, request.timeSlot, DEFAULT_TIME_SLOTS);
    }

    // Enrichments (TMDB) already happen at ingestion (SyncEPGData)
    return result;
  }

  private paginate<T>(items: T[], page: number, limit: number): T[] {
    const offset = (page - 1) * limit;
    return items.slice(offset, offset + limit);
  }

  private async getChannelMeta(
    channelFilter: Set<string> | null,
    country?: string,
    channelTypes?: string[]
  ): Promise<GetProgramsResponse['channels']> {
    const cacheKey = 'channels:meta';
    const cached = await this.cacheRepository.get<
      GetProgramsResponse['channels']
    >(cacheKey);

    if (cached && !channelFilter && !country && !channelTypes?.length) {
      return cached;
    }

    const channels = await this.channelRepository.findAll(
      country || channelTypes?.length
        ? {
            type: channelTypes && channelTypes.length ? (channelTypes[0] as any) : undefined,
            region: undefined,
            isActive: true,
          }
        : undefined
    );
    const typeFilter =
      channelTypes && channelTypes.length
        ? new Set(channelTypes.map((t) => t.toUpperCase()))
        : null;
    const meta = channels
      .filter((ch) => {
        if (channelFilter && !channelFilter.has(ch.id)) return false;
        if (country && ch.country && ch.country.toLowerCase() !== country.toLowerCase()) return false;
        if (country && !ch.country) return false;
        if (typeFilter && !typeFilter.has(String(ch.type).toUpperCase())) return false;
        return true;
      })
      .map((ch) => ChannelMapper.toMetaDTO(ch));

    if (!channelFilter && !country && !channelTypes?.length) {
      await this.cacheRepository.set(cacheKey, meta, this.cacheTtlSeconds);
    }

    return this.sortChannels(meta);
  }

  private sortChannels(
    channels: GetProgramsResponse['channels']
  ): GetProgramsResponse['channels'] {
    return [...channels].sort((a, b) => {
      const tA = (a.type || '').toString().toUpperCase();
      const tB = (b.type || '').toString().toUpperCase();
      const oA = this.typeOrder[tA] ?? 99;
      const oB = this.typeOrder[tB] ?? 99;
      if (oA !== oB) return oA - oB;

      if (tA === 'TDT' && tB === 'TDT') {
        const idxA = this.tdtPriority.indexOf((a.name || '').toUpperCase());
        const idxB = this.tdtPriority.indexOf((b.name || '').toUpperCase());
        if (idxA !== -1 || idxB !== -1) {
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          if (idxA !== idxB) return idxA - idxB;
        }
      }

      return (a.name || '').localeCompare(b.name || '', 'es', {
        sensitivity: 'base',
      });
    });
  }

  private buildChannelOrder(
    channels: GetProgramsResponse['channels']
  ): Map<string, number> {
    const order = new Map<string, number>();
    channels.forEach((c, idx) => order.set(c.id, idx));
    return order;
  }

  private sortProgramsRaw(
    programs: Program[],
    channelOrder: Map<string, number>
  ): Program[] {
    return [...programs].sort((a, b) => {
      const oA = channelOrder.get(a.channelId) ?? 9999;
      const oB = channelOrder.get(b.channelId) ?? 9999;
      if (oA !== oB) return oA - oB;

      const startA = new Date(a.startTime).getTime();
      const startB = new Date(b.startTime).getTime();
      if (!isNaN(startA) && !isNaN(startB) && startA !== startB) {
        return startA - startB;
      }
      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    });
  }

  private sortProgramLayouts(
    programs: ProgramLayoutDTO[],
    channelOrder: Map<string, number>
  ): ProgramLayoutDTO[] {
    return [...programs].sort((a, b) => {
      const oA = channelOrder.get(a.channelId) ?? 9999;
      const oB = channelOrder.get(b.channelId) ?? 9999;
      if (oA !== oB) return oA - oB;

      const startA = new Date(a.start).getTime();
      const startB = new Date(b.start).getTime();
      if (!isNaN(startA) && !isNaN(startB) && startA !== startB) {
        return startA - startB;
      }
      return (a.title || '').localeCompare(b.title || '', 'es', {
        sensitivity: 'base',
      });
    });
  }
}
