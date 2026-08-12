import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { finalize, map, shareReplay, tap } from 'rxjs/operators';
import { TvApiService } from '../api/tv-api.service';
import {
  ChannelMetaDTO,
  DateAlias,
  LayoutsQuery,
  LayoutsResponse,
  ProgramLayoutDTO,
  ProgramsQuery,
  ProgramsResponse,
  TimeSlotDTO,
  TvReadChannelsResponseDTO,
  TvChannelSurfaceDTO,
  TvGuideSurfaceDTO,
  TvReadItemDTO,
  TvReadResponseDTO,
  TvReadView,
} from '../api/models';

const SLOT_MINUTES = 180;
const GRID_UNIT_MINUTES = 5;
const SLOT_COUNT = 8;

@Injectable({ providedIn: 'root' })
export class TvDataService {
  private readonly readByKey = new Map<string, TvReadResponseDTO>();
  private readonly readInFlight = new Map<string, Observable<TvReadResponseDTO>>();
  private readonly guideSurfaceByKey = new Map<string, TvGuideSurfaceDTO>();
  private readonly guideSurfaceInFlight = new Map<string, Observable<TvGuideSurfaceDTO>>();
  private readonly channelSurfaceByKey = new Map<string, TvChannelSurfaceDTO>();
  private readonly channelSurfaceInFlight = new Map<string, Observable<TvChannelSurfaceDTO>>();
  private readonly channelSummaryByKey = new Map<string, TvReadChannelsResponseDTO>();
  private readonly channelSummaryInFlight = new Map<string, Observable<TvReadChannelsResponseDTO>>();

  private readonly layoutsByDay = new Map<string, LayoutsResponse>();
  private readonly layoutsByKey = new Map<string, LayoutsResponse>();
  private readonly layoutsInFlight = new Map<string, Observable<LayoutsResponse>>();

  private readonly programsByDay = new Map<string, ProgramsResponse>();
  private readonly programsByKey = new Map<string, ProgramsResponse>();
  private readonly programsInFlight = new Map<string, Observable<ProgramsResponse>>();

  private readonly channelsById = new Map<string, ChannelMetaDTO>();
  private channelsInFlight: Observable<ChannelMetaDTO[]> | null = null;

  private readonly layoutsSubject = new BehaviorSubject<LayoutsResponse | null>(null);
  private readonly programsSubject = new BehaviorSubject<ProgramsResponse | null>(null);
  private readonly channelsSubject = new BehaviorSubject<ChannelMetaDTO[] | null>(null);
  private readonly readSubject = new BehaviorSubject<TvReadResponseDTO | null>(null);

  public readonly layouts$ = this.layoutsSubject.asObservable();
  public readonly programs$ = this.programsSubject.asObservable();
  public readonly channels$ = this.channelsSubject.asObservable();
  public readonly read$ = this.readSubject.asObservable();

  constructor(private api: TvApiService) {}

  loadReadView(
    date: DateAlias,
    query: {
      view?: TvReadView;
      group?: string;
      category?: string;
      sport?: string;
      channelId?: string;
      q?: string;
      limit?: number;
      cursor?: string;
    } = {}
  ): Observable<TvReadResponseDTO> {
    const params = {
      view: query.view ?? 'day',
      date,
      group: query.group,
      category: query.category,
      sport: query.sport,
      channelId: query.channelId,
      q: query.q,
      limit: query.limit,
      cursor: query.cursor,
    };
    const cacheKey = this.buildReadKey(params);
    const cached = this.readByKey.get(cacheKey);
    if (cached) {
      this.hydrateChannelsFromRead(cached);
      this.readSubject.next(cached);
      return of(cached);
    }

    const inFlight = this.readInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request$ = this.api.getTvRead(params).pipe(
      map((resp) => resp.data as TvReadResponseDTO),
      tap((data) => {
        this.readByKey.set(cacheKey, data);
        this.hydrateChannelsFromRead(data);
        this.readSubject.next(data);
      }),
      finalize(() => this.readInFlight.delete(cacheKey)),
      shareReplay(1)
    );

    this.readInFlight.set(cacheKey, request$);
    return request$;
  }

  loadChannelDetail(
    channelId: string,
    date: DateAlias = 'today',
    view: 'now' | 'next' | 'night' | 'day' = 'day'
  ): Observable<TvReadResponseDTO> {
    const cacheKey = `channel:${channelId}:${date}:${view}`;
    const cached = this.readByKey.get(cacheKey);
    if (cached) {
      this.hydrateChannelsFromRead(cached);
      return of(cached);
    }

    const inFlight = this.readInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request$ = this.api.getTvReadChannelDetail(channelId, date, view).pipe(
      map((resp) => resp.data as TvReadResponseDTO),
      tap((data) => {
        this.readByKey.set(cacheKey, data);
        this.hydrateChannelsFromRead(data);
      }),
      finalize(() => this.readInFlight.delete(cacheKey)),
      shareReplay(1)
    );

    this.readInFlight.set(cacheKey, request$);
    return request$;
  }

  loadGuideSurface(
    date: DateAlias = 'today',
    group?: string,
    category?: string,
    sport?: string
  ): Observable<TvGuideSurfaceDTO> {
    const cacheKey = `guide:${date}:${group || 'all'}:${category || 'all'}:${sport || 'all'}`;
    const cached = this.guideSurfaceByKey.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    const inFlight = this.guideSurfaceInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request$ = this.api.getTvGuideSurface({ date, group, category, sport }).pipe(
      map((resp) => resp.data as TvGuideSurfaceDTO),
      tap((data) => this.guideSurfaceByKey.set(cacheKey, data)),
      finalize(() => this.guideSurfaceInFlight.delete(cacheKey)),
      shareReplay(1)
    );

    this.guideSurfaceInFlight.set(cacheKey, request$);
    return request$;
  }

  loadChannelSurface(
    channelId: string,
    date: DateAlias = 'today'
  ): Observable<TvChannelSurfaceDTO> {
    const cacheKey = `channel-surface:${channelId}:${date}`;
    const cached = this.channelSurfaceByKey.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    const inFlight = this.channelSurfaceInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request$ = this.api.getTvChannelSurface(channelId, date).pipe(
      map((resp) => resp.data as TvChannelSurfaceDTO),
      tap((data) => this.channelSurfaceByKey.set(cacheKey, data)),
      finalize(() => this.channelSurfaceInFlight.delete(cacheKey)),
      shareReplay(1)
    );

    this.channelSurfaceInFlight.set(cacheKey, request$);
    return request$;
  }

  loadLayouts(date: DateAlias, query?: LayoutsQuery): Observable<LayoutsResponse> {
    const cacheKey = this.buildLayoutKey(date, query);
    const cached = this.layoutsByKey.get(cacheKey);
    if (cached) {
      this.layoutsSubject.next(cached);
      return of(cached);
    }

    const inFlight = this.layoutsInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const groups = this.normalizeLegacyGroups(query?.channelTypes);
    const view = query?.timeSlot === '6' || query?.timeSlot === '7' ? 'night' : 'day';
    const request$ = this.loadReadView(date, {
      view,
      group: groups.length === 1 ? groups[0] : undefined,
      limit: 5000,
    }).pipe(
      map((resp) => this.toLayoutsResponse(resp, query)),
      tap((data) => {
        this.layoutsByDay.set(String(date), data);
        this.layoutsByKey.set(cacheKey, data);
        data.channels.forEach((entry) => this.upsertChannelMeta(entry.channel, entry.channel.id));
        this.layoutsSubject.next(data);
      }),
      finalize(() => this.layoutsInFlight.delete(cacheKey)),
      shareReplay(1)
    );

    this.layoutsInFlight.set(cacheKey, request$);
    return request$;
  }

  loadPrograms(query: ProgramsQuery): Observable<ProgramsResponse> {
    const cacheKey = this.buildProgramKey(query);
    const cached = this.programsByKey.get(cacheKey);
    if (cached) {
      this.programsSubject.next(cached);
      return of(cached);
    }

    const inFlight = this.programsInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const groups = this.normalizeLegacyGroups(query.channelTypes);
    const view = query.timeSlot === '6' || query.timeSlot === '7' ? 'night' : 'day';
    const request$ = this.loadReadView(query.date, {
      view,
      group: groups.length === 1 ? groups[0] : undefined,
      limit: query.limit ?? 5000,
    }).pipe(
      map((resp) => this.toProgramsResponse(resp, query)),
      tap((data) => {
        this.programsByDay.set(String(query.date), data);
        this.programsByKey.set(cacheKey, data);
        data.channels.forEach((channel) => this.upsertChannelMeta(channel, channel.id));
        this.programsSubject.next(data);
      }),
      finalize(() => this.programsInFlight.delete(cacheKey)),
      shareReplay(1)
    );

    this.programsInFlight.set(cacheKey, request$);
    return request$;
  }

  loadChannels(date: DateAlias = 'today', group?: string): Observable<ChannelMetaDTO[]> {
    const cacheKey = `channels:${date}:${group || 'all'}`;
    const cachedSummary = this.channelSummaryByKey.get(cacheKey);
    if (cachedSummary) {
      const channels = cachedSummary.channels.map((entry) =>
        this.mapTvReadChannel(entry.channel)
      );
      this.channelsSubject.next(channels);
      return of(channels);
    }

    if (this.channelsInFlight) {
      return this.channelsInFlight;
    }

    const request$ = this.api.getTvReadChannels(date, group).pipe(
      map((resp) => resp.data as TvReadChannelsResponseDTO),
      tap((data) => {
        this.channelSummaryByKey.set(cacheKey, data);
        const channels = data.channels.map((entry) => this.mapTvReadChannel(entry.channel));
        channels.forEach((channel) => this.upsertChannelMeta(channel, channel.id));
        this.channelsSubject.next(channels);
      }),
      map((data) => data.channels.map((entry) => this.mapTvReadChannel(entry.channel))),
      finalize(() => (this.channelsInFlight = null)),
      shareReplay(1)
    );

    this.channelsInFlight = request$;
    return request$;
  }

  getCachedLayouts(date: DateAlias): LayoutsResponse | null {
    return this.layoutsByDay.get(String(date)) ?? null;
  }

  getCachedPrograms(date: DateAlias): ProgramsResponse | null {
    return this.programsByDay.get(String(date)) ?? null;
  }

  getFlattenedPrograms(date: DateAlias): ProgramLayoutDTO[] {
    const layout = this.getCachedLayouts(date);
    if (layout?.channels?.length) {
      return layout.channels.flatMap((entry) => entry.programs || []);
    }
    const programs = this.getCachedPrograms(date);
    return programs?.programs ?? [];
  }

  getChannelMeta(date: DateAlias): ChannelMetaDTO[] {
    const layout = this.getCachedLayouts(date);
    if (layout?.channels?.length) {
      return layout.channels.map((entry) => entry.channel);
    }
    const programs = this.getCachedPrograms(date);
    return programs?.channels ?? [];
  }

  getCachedChannelMeta(channelId: string): ChannelMetaDTO | undefined {
    return channelId ? this.channelsById.get(channelId) : undefined;
  }

  getTimeSlots(date: DateAlias): TimeSlotDTO[] {
    const layout = this.getCachedLayouts(date);
    if (layout?.timeSlots?.length) {
      return layout.timeSlots;
    }
    const programs = this.getCachedPrograms(date);
    return programs?.timeSlots ?? this.buildTimeSlots();
  }

  private toLayoutsResponse(
    response: TvReadResponseDTO,
    query?: LayoutsQuery
  ): LayoutsResponse {
    const items = this.filterReadItems(response.items, {
      channels: query?.channels,
      channelTypes: query?.channelTypes,
      timeSlot: query?.timeSlot,
    });
    const channelMap = new Map<string, { channel: ChannelMetaDTO; programs: ProgramLayoutDTO[] }>();

    items.forEach((item) => {
      const channel = this.mapTvReadChannel(item.channel);
      const current =
        channelMap.get(channel.id) ||
        {
          channel,
          programs: [],
        };
      current.programs.push(this.mapTvReadItemToProgram(item));
      channelMap.set(channel.id, current);
    });

    const channels = Array.from(channelMap.values())
      .map((entry) => ({
        channel: entry.channel,
        programs: entry.programs.sort(
          (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime()
        ),
      }))
      .sort(
        (left, right) =>
          (left.channel.sortOrder ?? 999) - (right.channel.sortOrder ?? 999)
      );

    return {
      date: response.date,
      timeSlots: this.buildTimeSlots(),
      channels,
    };
  }

  private toProgramsResponse(
    response: TvReadResponseDTO,
    query: ProgramsQuery
  ): ProgramsResponse {
    const items = this.filterReadItems(response.items, {
      channels: query.channels,
      channelTypes: query.channelTypes,
      timeSlot: query.timeSlot,
    });
    const channels = Array.from(
      new Map(
        items.map((item) => {
          const channel = this.mapTvReadChannel(item.channel);
          return [channel.id, channel] as const;
        })
      ).values()
    ).sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999));

    return {
      date: response.date,
      timeSlots: this.buildTimeSlots(),
      channels,
      programs: items.map((item) => this.mapTvReadItemToProgram(item)),
    };
  }

  private filterReadItems(
    items: TvReadItemDTO[],
    filters: {
      channels?: string[];
      channelTypes?: string[];
      timeSlot?: string;
    }
  ): TvReadItemDTO[] {
    const allowedChannels = new Set((filters.channels || []).filter(Boolean));
    const allowedGroups = new Set(this.normalizeLegacyGroups(filters.channelTypes));

    return items.filter((item) => {
      if (allowedChannels.size > 0 && !allowedChannels.has(item.channel.id)) {
        return false;
      }
      if (allowedGroups.size > 0 && !allowedGroups.has(String(item.channel.group || ''))) {
        return false;
      }
      if (!filters.timeSlot) {
        return true;
      }
      const hour = new Date(item.airing.start).getHours();
      if (filters.timeSlot === '6') {
        return hour >= 18 && hour < 21;
      }
      if (filters.timeSlot === '7') {
        return hour >= 21 || hour < 3;
      }
      return true;
    });
  }

  private mapTvReadChannel(channel: any): ChannelMetaDTO {
    return {
      id: String(channel?.id || ''),
      name: String(channel?.name || channel?.id || ''),
      normalizedName: channel?.normalizedName || undefined,
      aliases: Array.isArray(channel?.aliases) ? [...channel.aliases] : undefined,
      sourceIds: Array.isArray(channel?.sourceIds) ? [...channel.sourceIds] : undefined,
      icon: channel?.icon || null,
      type: channel?.type || undefined,
      group: channel?.group || undefined,
      subgroups: Array.isArray(channel?.subgroups) ? [...channel.subgroups] : undefined,
      sortOrder: typeof channel?.sortOrder === 'number' ? channel.sortOrder : undefined,
      country: channel?.country || undefined,
      countryCode: channel?.countryCode || undefined,
      region: channel?.region || undefined,
      description: channel?.description || undefined,
    };
  }

  private mapTvReadItemToProgram(item: TvReadItemDTO): ProgramLayoutDTO {
    const layoutsBySlot = this.buildLayoutsBySlot(item.airing.start, item.airing.end);
    const primaryLayout = layoutsBySlot[0];
    const image =
      item.assets.poster?.url ||
      ((item.assets.primary?.kind === 'poster' ||
        item.assets.primary?.kind === 'backdrop')
        ? item.assets.primary?.url
        : undefined) ||
      undefined;

    return {
      id: item.id,
      channelId: item.channel.id,
      channelName: item.channel.name,
      channelIcon: item.channel.icon || undefined,
      title: item.program.title,
      start: item.airing.start,
      end: item.airing.end,
      durationMinutes: item.airing.durationMinutes,
      category: item.program.editorialCategory,
      editorialCategory: item.program.editorialCategory,
      image,
      poster: item.assets.poster?.url || image,
      background: item.assets.backdrop?.url || image,
      tmdbId: item.program.tmdbId,
      description: item.program.description,
      timeSlotIndex: primaryLayout?.timeSlotIndex ?? null,
      gridColumnStart: primaryLayout?.gridColumnStart ?? 1,
      gridColumnEnd: primaryLayout?.gridColumnEnd ?? 2,
      columnStartMinutes: primaryLayout?.columnStartMinutes,
      columnEndMinutes: primaryLayout?.columnEndMinutes,
      layerIndex: 0,
      isCutAtStart: primaryLayout?.isCutAtStart ?? false,
      isCutAtEnd: primaryLayout?.isCutAtEnd ?? false,
      visibleStartTime: primaryLayout?.visibleStartTime || item.airing.start,
      visibleEndTime: primaryLayout?.visibleEndTime || item.airing.end,
      crossesMidnight: primaryLayout?.crossesMidnight ?? false,
      fieldsProvided: 'full',
      liveNow: item.airing.liveNow,
      groupKey: item.channel.group as any,
      assets: item.assets,
      sourceProvenance: item.sourceProvenance,
      timingContext: item.timingContext,
      layoutsBySlot,
    };
  }

  private buildLayoutsBySlot(startIso: string, endIso: string): Array<{
    timeSlotIndex: number;
    gridColumnStart: number;
    gridColumnEnd: number;
    layerIndex?: number;
    isCutAtStart?: boolean;
    isCutAtEnd?: boolean;
    visibleStartTime?: string;
    visibleEndTime?: string;
    crossesMidnight?: boolean;
    pxStart?: number;
    pxWidth?: number;
    columnStartMinutes?: number;
    columnEndMinutes?: number;
  }> {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return [];
    }

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    let endMinutes = end.getHours() * 60 + end.getMinutes();
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    const layouts: Array<{
      timeSlotIndex: number;
      gridColumnStart: number;
      gridColumnEnd: number;
      layerIndex?: number;
      isCutAtStart?: boolean;
      isCutAtEnd?: boolean;
      visibleStartTime?: string;
      visibleEndTime?: string;
      crossesMidnight?: boolean;
      pxStart?: number;
      pxWidth?: number;
      columnStartMinutes?: number;
      columnEndMinutes?: number;
    }> = [];

    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const slotStart = index * SLOT_MINUTES;
      const slotEnd = slotStart + SLOT_MINUTES;
      const visibleStart = Math.max(startMinutes, slotStart);
      const visibleEnd = Math.min(endMinutes, slotEnd);
      if (visibleEnd <= visibleStart) {
        continue;
      }

      const gridColumnStart = Math.max(
        1,
        Math.floor((visibleStart - slotStart) / GRID_UNIT_MINUTES) + 1
      );
      const gridColumnEnd = Math.max(
        gridColumnStart + 1,
        Math.ceil((visibleEnd - slotStart) / GRID_UNIT_MINUTES) + 1
      );

      layouts.push({
        timeSlotIndex: index,
        gridColumnStart,
        gridColumnEnd,
        layerIndex: 0,
        isCutAtStart: visibleStart > startMinutes,
        isCutAtEnd: visibleEnd < endMinutes,
        visibleStartTime: this.minutesToIso(start, visibleStart),
        visibleEndTime: this.minutesToIso(start, visibleEnd),
        crossesMidnight: endMinutes >= 24 * 60,
        pxStart: (visibleStart - slotStart) * 4,
        pxWidth: Math.max(24, (visibleEnd - visibleStart) * 4),
        columnStartMinutes: visibleStart,
        columnEndMinutes: visibleEnd,
      });
    }

    return layouts;
  }

  private buildTimeSlots(): TimeSlotDTO[] {
    return Array.from({ length: SLOT_COUNT }, (_, index) => {
      const startMinutes = index * SLOT_MINUTES;
      const endMinutes = startMinutes + SLOT_MINUTES;
      return {
        index,
        start: this.minutesToClock(startMinutes),
        end: this.minutesToClock(endMinutes % (24 * 60)),
        startMinutes,
        endMinutes,
      };
    });
  }

  private minutesToClock(minutes: number): string {
    const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private minutesToIso(baseDate: Date, minutes: number): string {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);
    if (minutes >= 24 * 60) {
      date.setDate(date.getDate() + 1);
    }
    const normalized = minutes % (24 * 60);
    date.setMinutes(normalized);
    return date.toISOString();
  }

  private normalizeLegacyGroups(channelTypes?: string[]): string[] {
    const normalized = new Set<string>();
    (channelTypes || []).forEach((type) => {
      const value = String(type || '').trim().toUpperCase();
      if (value === 'TDT') normalized.add('tdt');
      else if (value === 'AUTONOMICO') normalized.add('autonomico');
      else if (value === 'MOVISTAR') normalized.add('movistar');
      else if (['OTT', 'ONLINE', 'CABLE'].includes(value)) normalized.add('online');
      else if (['DEPORTES', 'SPORTS'].includes(value)) normalized.add('deporte');
    });
    return Array.from(normalized);
  }

  private buildReadKey(params: Record<string, any>): string {
    return Object.values(params)
      .map((value) => (value == null ? '' : String(value)))
      .join('|');
  }

  private buildLayoutKey(date: DateAlias, query?: LayoutsQuery): string {
    return [
      String(date),
      query?.fields ?? '',
      this.normalizeKeyArray(query?.channels),
      query?.timeSlot ?? '',
      this.normalizeKeyArray(query?.channelTypes),
    ].join('|');
  }

  private buildProgramKey(query: ProgramsQuery): string {
    return [
      String(query.date),
      query.fields ?? '',
      query.limit ?? '',
      this.normalizeKeyArray(query.channels),
      this.normalizeKeyArray(query.channelTypes),
      query.timeSlot ?? '',
    ].join('|');
  }

  private normalizeKeyArray(values?: string[]): string {
    if (!values?.length) {
      return '';
    }
    return values
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .sort()
      .join(',');
  }

  private hydrateChannelsFromRead(response: TvReadResponseDTO): void {
    response.channels.forEach((entry) => this.upsertChannelMeta(entry.channel, entry.channel.id));
    response.items.forEach((item) => this.upsertChannelMeta(item.channel, item.channel.id));
  }

  private upsertChannelMeta(
    channel: Partial<ChannelMetaDTO> | null | undefined,
    fallbackId: string
  ): void {
    const id = String(channel?.id || fallbackId || '').trim();
    if (!id) {
      return;
    }

    const current = this.channelsById.get(id);
    const merged: ChannelMetaDTO = {
      id,
      name: String(channel?.name || current?.name || id).trim() || id,
      normalizedName:
        String(channel?.normalizedName || current?.normalizedName || '').trim() || undefined,
      aliases:
        Array.isArray(channel?.aliases) && channel.aliases.length
          ? [...channel.aliases]
          : current?.aliases,
      sourceIds:
        Array.isArray(channel?.sourceIds) && channel.sourceIds.length
          ? [...channel.sourceIds]
          : current?.sourceIds,
      icon: (channel?.icon as string | null | undefined) || current?.icon || undefined,
      type: String(channel?.type || current?.type || '').trim() || undefined,
      group: String(channel?.group || current?.group || '').trim() || undefined,
      subgroups:
        Array.isArray(channel?.subgroups) && channel.subgroups.length
          ? [...channel.subgroups]
          : current?.subgroups,
      sortOrder:
        typeof channel?.sortOrder === 'number'
          ? channel.sortOrder
          : current?.sortOrder,
      country: String(channel?.country || current?.country || '').trim() || undefined,
      countryCode:
        String(channel?.countryCode || current?.countryCode || '').trim() || undefined,
      region: String(channel?.region || current?.region || '').trim() || undefined,
      description:
        String(channel?.description || current?.description || '').trim() || undefined,
    };

    this.channelsById.set(id, merged);
  }
}
