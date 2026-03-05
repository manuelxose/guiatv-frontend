import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { finalize, map, shareReplay, tap } from 'rxjs/operators';
import { TvApiService } from '../api/tv-api.service';
import {
  DateAlias,
  LayoutsQuery,
  LayoutsResponse,
  ProgramsQuery,
  ProgramsResponse,
  ProgramLayoutDTO,
  ChannelMetaDTO,
  TimeSlotDTO,
} from '../api/models';

/**
 * Single state holder for the app. Replaces the previous scattered services.
 * Exposes lean streams for components and keeps in-memory cache per day.
 */
@Injectable({ providedIn: 'root' })
export class TvDataService {
  private layoutsByDay = new Map<string, LayoutsResponse>();
  private layoutsByKey = new Map<string, LayoutsResponse>();
  private layoutsInFlight = new Map<string, Observable<LayoutsResponse>>();

  private programsByDay = new Map<string, ProgramsResponse>();
  private programsByKey = new Map<string, ProgramsResponse>();
  private programsInFlight = new Map<string, Observable<ProgramsResponse>>();

  private channelsById = new Map<string, ChannelMetaDTO>();
  private channelsInFlight: Observable<ChannelMetaDTO[]> | null = null;

  private readonly layoutsSubject = new BehaviorSubject<LayoutsResponse | null>(null);
  private readonly programsSubject = new BehaviorSubject<ProgramsResponse | null>(null);
  private readonly channelsSubject = new BehaviorSubject<ChannelMetaDTO[] | null>(null);

  public readonly layouts$ = this.layoutsSubject.asObservable();
  public readonly programs$ = this.programsSubject.asObservable();
  public readonly channels$ = this.channelsSubject.asObservable();

  constructor(private api: TvApiService) {}

  loadLayouts(date: DateAlias, query?: LayoutsQuery): Observable<LayoutsResponse> {
    const cacheKey = this.buildLayoutKey(date, query);

    // Serve from cache if already fetched
    const cached = this.layoutsByKey.get(cacheKey);
    if (cached) {
      this.layoutsSubject.next(cached);
      return of(cached);
    }

    // Reuse in-flight request to avoid duplicate HTTP calls
    const inFlight = this.layoutsInFlight.get(cacheKey);
    if (inFlight) return inFlight;

    const request$ = this.api.getLayouts(date, query).pipe(
      map((resp) => resp.data as LayoutsResponse),
      tap((data) => {
        this.layoutsByDay.set(String(date), data);
        this.layoutsByKey.set(cacheKey, data);
        (data.channels || []).forEach((entry) => {
          this.upsertChannelMeta(
            entry?.channel,
            entry?.channel?.id || (entry?.programs || [])[0]?.channelId || ''
          );
        });
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
    if (inFlight) return inFlight;

    const request$ = this.api.getPrograms(query).pipe(
      map((resp) => resp.data as ProgramsResponse),
      tap((data) => {
        this.programsByDay.set(String(query.date), data);
        this.programsByKey.set(cacheKey, data);
        // cache channel metadata (includes icons) for enrichment elsewhere
        (data.channels || []).forEach((c) => {
          this.upsertChannelMeta(c, c?.id || '');
        });
        this.programsSubject.next(data);
      }),
      finalize(() => this.programsInFlight.delete(cacheKey)),
      shareReplay(1)
    );

    this.programsInFlight.set(cacheKey, request$);
    return request$;
  }

  /**
   * Load full channel catalog (includes icons) and cache it.
   */
  loadChannels(): Observable<ChannelMetaDTO[]> {
    if (this.channelsById.size > 0) {
      this.channelsSubject.next(Array.from(this.channelsById.values()));
      return of(Array.from(this.channelsById.values()));
    }

    if (this.channelsInFlight) {
      return this.channelsInFlight;
    }

    const request$ = this.api.getChannels().pipe(
      map((resp) => resp.data?.channels ?? []),
      tap((channels) => {
        channels.forEach((c) => {
          this.upsertChannelMeta(c, c?.id || '');
        });
        this.channelsSubject.next(channels);
      }),
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
      return layout.channels.flatMap((c) => c.programs || []);
    }
    const programs = this.getCachedPrograms(date);
    return programs?.programs ?? [];
  }

  getChannelMeta(date: DateAlias): ChannelMetaDTO[] {
    const layout = this.getCachedLayouts(date);
    if (layout?.channels?.length) {
      return layout.channels.map((c) => c.channel);
    }
    const programs = this.getCachedPrograms(date);
    return programs?.channels ?? [];
  }

  getCachedChannelMeta(channelId: string): ChannelMetaDTO | undefined {
    if (!channelId) return undefined;
    return this.channelsById.get(channelId);
  }

  getTimeSlots(date: DateAlias): TimeSlotDTO[] {
    const layout = this.getCachedLayouts(date);
    if (layout?.timeSlots?.length) return layout.timeSlots;
    const programs = this.getCachedPrograms(date);
    return programs?.timeSlots ?? [];
  }

  // ==========================================
  // Private helpers
  // ==========================================
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
    if (!values || !values.length) return '';
    return values
      .map((v) => (v || '').toString().trim().toUpperCase())
      .filter(Boolean)
      .sort()
      .join(',');
  }

  private upsertChannelMeta(
    channel: Partial<ChannelMetaDTO> | null | undefined,
    fallbackId: string
  ): void {
    const id = String(channel?.id || fallbackId || '').trim();
    if (!id) return;

    const current = this.channelsById.get(id);
    const merged: ChannelMetaDTO = {
      id,
      name:
        String(channel?.name || current?.name || id).trim() || id,
      icon:
        (channel?.icon as string | null | undefined) ||
        current?.icon ||
        undefined,
      type: String(channel?.type || current?.type || '').trim() || undefined,
      country:
        String(channel?.country || current?.country || '').trim() || undefined,
      countryCode:
        String(channel?.countryCode || current?.countryCode || '').trim() ||
        undefined,
    };

    this.channelsById.set(id, merged);
  }
}
