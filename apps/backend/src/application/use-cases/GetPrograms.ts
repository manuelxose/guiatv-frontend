import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
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
import { ProgramDeduplicator } from '../services/ProgramDeduplicator';

export interface GetProgramsRequest {
  date: string;
  channels?: string[];
  timeSlot?: string;
  fields?: 'minimal' | 'full';
  page?: number;
  limit?: number;
  country?: string;
  channelTypes?: string[];
  skipScheduleSnapshot?: boolean;
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
  skipScheduleSnapshot: boolean;
};

/**
 * Core use case that fetches, filters and paginates programs for a given date.
 */
export class GetPrograms {
  private readonly layoutBuilder = new ProgramLayoutBuilder();
  private readonly timeSlots = this.layoutBuilder.buildTimeSlots();
  private readonly deduplicator = new ProgramDeduplicator();
  private readonly cacheTtlSeconds =
    Number(process.env.PROGRAMS_CACHE_TTL_SEC || 300) || 300;
  private readonly layoutVersion =
    process.env.LAYOUT_VERSION || 'v1';
  private readonly fullSnapshotLimit =
    Number(process.env.PROGRAMS_FULL_SNAPSHOT_LIMIT || 100000) || 100000;
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
  private readonly spanishNationalTdtOrder = [
    'la_1',
    'la_2',
    'antena_3',
    'cuatro',
    'telecinco',
    'la_sexta',
    'neox',
    'nova',
    'mega',
    'energy',
    'dmax',
    'boing',
    'clan',
    'atreseries',
    'fdf',
    'divinity',
    'dkiss',
    'ten',
    'be_mad',
    'paramount_network',
    'trece',
  ];

  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly channelRepository: IChannelRepository,
    private readonly cacheRepository: ICacheRepository
  ) {}

  /**
   * Retrieves program layouts using cache, precomputations, or live queries.
   */
  async execute(request: GetProgramsRequest): Promise<GetProgramsResponse> {
    const normalized = this.normalizeRequest(request);
    const fields = normalized.fields;

    const canUsePrecomputed =
      !normalized.skipScheduleSnapshot &&
      !normalized.channels.length &&
      !normalized.timeSlot &&
      normalized.page === 1 &&
      normalized.limit >= this.fullSnapshotLimit;

    const preKey = `precomputed:programs:${normalized.date}:${fields}`;
    if (canUsePrecomputed) {
      const pre = await this.cacheRepository.get<GetProgramsResponse>(preKey);
      if (pre) {
        return { ...pre, meta: { ...pre.meta, cached: true, precomputed: true } };
      }
    }

    if (!normalized.skipScheduleSnapshot) {
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

    filteredPrograms = this.deduplicator.dedupe(filteredPrograms);

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

    programs = this.dedupeProgramLayouts(programs);

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
      limit:
        request.limit ??
        (request.skipScheduleSnapshot ? this.fullSnapshotLimit : 500),
      country: request.country,
      channelTypes:
        request.channelTypes?.filter(Boolean).map((t) => t.toUpperCase()) ?? [
          'TDT',
          'CABLE',
          'MOVISTAR',
          'AUTONOMICO',
          'OTT',
        ],
      skipScheduleSnapshot: request.skipScheduleSnapshot === true,
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

  private dedupeProgramLayouts(programs: ProgramLayoutDTO[]): ProgramLayoutDTO[] {
    const grouped = new Map<string, ProgramLayoutDTO[]>();
    const firstIndex = new Map<string, number>();

    programs.forEach((program, index) => {
      const key = `${program.channelId}|${this.startKey(program.start)}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
        firstIndex.set(key, index);
      }
      grouped.get(key)!.push(program);
    });

    const cleaned: ProgramLayoutDTO[] = [];
    grouped.forEach((bucket) => {
      if (bucket.length === 1) {
        cleaned.push(bucket[0]);
        return;
      }
      const winner = bucket.reduce((best, candidate) =>
        this.pickBetterLayout(best, candidate)
      );
      cleaned.push(winner);
    });

    return cleaned.sort((a, b) => {
      const keyA = `${a.channelId}|${this.startKey(a.start)}`;
      const keyB = `${b.channelId}|${this.startKey(b.start)}`;
      const idxA = firstIndex.get(keyA) ?? 0;
      const idxB = firstIndex.get(keyB) ?? 0;
      if (idxA !== idxB) return idxA - idxB;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  private pickBetterLayout(
    current: ProgramLayoutDTO,
    candidate: ProgramLayoutDTO
  ): ProgramLayoutDTO {
    const currentScore = this.scoreLayout(current);
    const candidateScore = this.scoreLayout(candidate);

    if (candidateScore > currentScore) return candidate;
    if (currentScore > candidateScore) return current;

    const currentDesc = (current.description || '').length;
    const candidateDesc = (candidate.description || '').length;
    if (candidateDesc !== currentDesc) {
      return candidateDesc > currentDesc ? candidate : current;
    }

    const currentDuration = current.durationMinutes || 0;
    const candidateDuration = candidate.durationMinutes || 0;
    if (candidateDuration !== currentDuration) {
      return candidateDuration > currentDuration ? candidate : current;
    }

    const currentTitleLen = (current.title || '').length;
    const candidateTitleLen = (candidate.title || '').length;
    if (candidateTitleLen !== currentTitleLen) {
      return candidateTitleLen > currentTitleLen ? candidate : current;
    }

    return candidateScore >= currentScore ? candidate : current;
  }

  private scoreLayout(program: ProgramLayoutDTO): number {
    let score = 0;
    const title = program.title || '';
    const normalizedTitle = ProgramDeduplicator.normalizeTitle(title);
    const isGeneric = ProgramDeduplicator.isGenericTitle(title);

    score += isGeneric ? -10 : 50;
    if (program.description) {
      score += Math.min(program.description.length / 40, 10);
    }
    if (program.image) score += 5;
    if (program.category) score += 3;
    if (program.rating) score += 2;

    score += Math.min((program.durationMinutes || 0) / 30, 4);
    score += Math.min(normalizedTitle.length / 8, 4);

    return score;
  }

  private paginate<T>(items: T[], page: number, limit: number): T[] {
    const offset = (page - 1) * limit;
    return items.slice(offset, offset + limit);
  }

  private normalizeChannelType(
    rawType?: string,
    channelName?: string,
    channelId?: string,
    region?: string
  ): { type: string; isRegionalVariant: boolean } {
    const base = (rawType || '').toString().trim();
    const normalizedBase = base
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    let type = normalizedBase || 'TDT';
    const isRegionalVariant = this.isRegionalNationalVariant(
      channelName || '',
      channelId || '',
      region
    );

    if (type.startsWith('AUTONOM')) type = 'AUTONOMICO';
    if (type === 'MOVISTAR+' || type === 'M+') type = 'MOVISTAR';
    if (type === 'CABLE') type = 'CABLE';
    if (type === 'OTT') type = 'OTT';

    if (type === 'TDT') {
      if (isRegionalVariant) {
        type = 'AUTONOMICO';
      }
    }

    return { type, isRegionalVariant };
  }

  private isRegionalNationalVariant(
    channelName: string,
    channelId: string,
    region?: string
  ): boolean {
    const normalizedName = (channelName || '').toLowerCase();
    const normalizedId = (channelId || '').toLowerCase();
    const normalizedRegion = (region || '').toLowerCase();

    const regionKeywords = ['canarias', 'canaria', 'cataluna', 'catalunya', 'catalan', 'catalonia'];
    const mentionsRegion = regionKeywords.some(
      (kw) =>
        normalizedName.includes(kw) ||
        normalizedId.includes(kw) ||
        normalizedRegion.includes(kw)
    );
    if (!mentionsRegion) return false;

    const isLa1OrLa2 =
      /(la[\s\-_]?1|la[\s\-_]?2)/.test(normalizedName) ||
      /(la[\s\-_]?1|la[\s\-_]?2)/.test(normalizedId);

    return isLa1OrLa2;
  }

  private isSpainContext(country?: string): boolean {
    if (!country) return false;
    const value = country.toLowerCase();
    return value === 'es' || value === 'es-es' || value.includes('espa');
  }

  private isSpanishChannel(
    channel: { id: string; country?: string; countryCode?: string },
    normalizedType: string,
    isRegionalVariant: boolean
  ): boolean {
    const id = (channel.id || '').toLowerCase();
    const countryCode = (channel.countryCode || '').toUpperCase();
    const countryName = (channel.country || '').toLowerCase();

    const isEsCountry =
      countryCode === 'ES' || countryName.includes('espa');

    const inNationalList =
      normalizedType === 'TDT' &&
      this.spanishNationalTdtOrder.includes(id);

    const isAutonomico = normalizedType === 'AUTONOMICO';

    return isEsCountry || inNationalList || isAutonomico || isRegionalVariant;
  }

  private startKey(start: string): string {
    const date = new Date(start);
    const minute = Math.floor(date.getTime() / 60000);
    if (Number.isNaN(minute)) return start || '';
    return String(minute);
  }

  private async getChannelMeta(
    channelFilter: Set<string> | null,
    country?: string,
    channelTypes?: string[]
  ): Promise<GetProgramsResponse['channels']> {
    const cacheKey = 'channels:meta:v2';
    const cached = await this.cacheRepository.get<
      GetProgramsResponse['channels']
    >(cacheKey);

    if (cached && !channelFilter && !country && !channelTypes?.length) {
      return this.sortChannels(cached);
    }

    const channels = await this.channelRepository.findAll({
      isActive: true,
    });

    const typeFilter =
      channelTypes && channelTypes.length
        ? new Set(channelTypes.map((t) => t.toUpperCase()))
        : null;
    const isSpainContext = this.isSpainContext(country);
    const meta = channels
      .map((ch) => {
        const { type: normalizedType, isRegionalVariant } = this.normalizeChannelType(
          ch.type as any,
          ch.name,
          ch.id,
          (ch as any).region || ch.region
        );
        return { ch, normalizedType, isRegionalVariant };
      })
      .filter(({ ch, normalizedType, isRegionalVariant }) => {
        if (channelFilter && !channelFilter.has(ch.id)) return false;
        if (typeFilter && !typeFilter.has(normalizedType)) return false;
        if (isSpainContext && !this.isSpanishChannel(ch, normalizedType, isRegionalVariant)) {
          return false;
        }
        if (!isSpainContext && country) {
          if (!ch.country) return false;
          if (ch.country.toLowerCase() !== country.toLowerCase()) return false;
        }
        return true;
      })
      .map(({ ch, normalizedType }) => ({
        id: ch.id,
        name: ch.name,
        icon: ch.icon,
        type: normalizedType,
        country: ch.country,
        countryCode: ch.countryCode,
      }));

    const sortedMeta = this.sortChannels(meta);
    if (!channelFilter && !country && !channelTypes?.length) {
      await this.cacheRepository.set(cacheKey, sortedMeta, this.cacheTtlSeconds);
    }

    return sortedMeta;
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
        const idIdxA = this.spanishNationalTdtOrder.indexOf((a.id || '').toLowerCase());
        const idIdxB = this.spanishNationalTdtOrder.indexOf((b.id || '').toLowerCase());
        if (idIdxA !== -1 || idIdxB !== -1) {
          if (idIdxA === -1) return 1;
          if (idIdxB === -1) return -1;
          if (idIdxA !== idIdxB) return idIdxA - idIdxB;
        }

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
