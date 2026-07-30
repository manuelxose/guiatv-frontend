import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, tap } from 'rxjs/operators';
import { LayoutsQuery } from '../../api/models';
import { ProgramListService, ProgramListSnapshot } from '../../state/program-list.service';
import {
  IDayInfo,
  IProgramItem,
  IProgramListData,
  ITimeIndicatorState,
  ProgramListEmbedConfig,
} from 'src/app/interfaces';

interface ProgramListRequestState {
  channelIds?: string[];
  channelTypes?: string[];
  timeSlot?: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramListFacadeService {
  private readonly loading$ = new BehaviorSubject<boolean>(true);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  private readonly snapshot$ = new BehaviorSubject<ProgramListSnapshot | null>(null);

  private currentDayIndex = 0;
  private currentLoad$: any = null;
  private requestState: ProgramListRequestState = {};

  constructor(private readonly programList: ProgramListService) {}

  getProgramListData(): Observable<IProgramListData[]> {
    if (!this.snapshot$.value && !this.currentLoad$) {
      this.loadInitialData();
    }

    return this.snapshot$.pipe(
      filter((snap): snap is ProgramListSnapshot => snap !== null),
      map((snap) => snap.channels)
    );
  }

  public configureEmbed(config: ProgramListEmbedConfig | null): void {
    if (!config) {
      return;
    }

    this.currentDayIndex = this.resolveDayIndex(config.date);
    this.requestState = {
      channelIds: config.channelIds?.length ? [...config.channelIds] : undefined,
      channelTypes: config.channelTypes?.length
        ? config.channelTypes.map((type) => String(type).trim().toUpperCase()).filter(Boolean)
        : undefined,
      timeSlot: this.normalizeTimeSlot(config.timeSlot),
    };
    this.snapshot$.next(null);
    this.error$.next(null);
  }

  getLoadingState(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getErrorState(): Observable<string | null> {
    return this.error$.asObservable();
  }

  refreshData(): Observable<{ success: boolean; data?: boolean; error?: string }> {
    const request$ = this.loadSnapshot(this.currentDayIndex).pipe(shareReplay(1));
    request$.subscribe();
    return request$;
  }

  getTimeSlots(): readonly string[][] {
    return [
      ['00:00', '03:00'],
      ['03:00', '06:00'],
      ['06:00', '09:00'],
      ['09:00', '12:00'],
      ['12:00', '15:00'],
      ['15:00', '18:00'],
      ['18:00', '21:00'],
      ['21:00', '00:00'],
    ];
  }

  getCurrentTimeSlot(): number {
    const now = new Date();
    return Math.floor(now.getHours() / 3);
  }

  getConfiguredTimeSlot(): number | null {
    if (!this.requestState.timeSlot) {
      return null;
    }

    const parsed = Number(this.requestState.timeSlot);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 7) {
      return null;
    }

    return parsed;
  }

  generateHoursForSlot(slotIndex: number): string[] {
    const start = slotIndex * 3;
    const hours: string[] = [];
    for (let h = start; h <= start + 3; h += 1) {
      const hh = (h % 24).toString().padStart(2, '0');
      hours.push(`${hh}:00`);
    }
    return hours;
  }

  formatDisplayTime(timeString: string): string {
    try {
      const d = new Date(timeString);
      return d.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeString;
    }
  }

  calculateTimeIndicatorState(
    activeDay: number,
    _currentTimeSlot: string
  ): Observable<ITimeIndicatorState> {
    const visible = activeDay === 0;
    const leftPosition = 0;
    const currentTime = this.formatDisplayTime(new Date().toISOString());
    return of({ visible, leftPosition, currentTime });
  }

  getCategoryBadgeClasses(_categoryValue: string): string {
    return 'bg-red-600/20 text-red-200';
  }

  getCategoryDisplayName(categoryValue: string): string {
    return categoryValue || 'Categoria';
  }

  getDayButtonClasses(dayIndex: number, activeIndex: number): string {
    return dayIndex === activeIndex
      ? 'bg-red-600 text-white'
      : 'bg-gray-800 text-gray-200';
  }

  getTimeSlotButtonClasses(timeSlot: string, activeSlot: string): string {
    return timeSlot === activeSlot
      ? 'bg-red-600 text-white'
      : 'bg-gray-800 text-gray-200';
  }

  getProgramContainerClasses(isSelected: boolean, isLive?: boolean): string {
    const live = isLive ? 'border border-red-500/60' : '';
    return `${isSelected ? 'ring-2 ring-red-500' : ''} ${live}`.trim();
  }

  getChannelLogoUrl(channelData: any): string {
    return channelData?.channel?.icon || channelData?.icon || '';
  }

  handleLogoError(_event: Event): void {}
  handleLogoLoad(_event: Event): void {}
  updateChannelData(_canalesData: any): void {}
  updateScreenDimensions(): void {}

  setupUniqueViewport(_elementRef: any, _componentId: string): void {}
  isViewportReady(): boolean {
    return true;
  }
  cleanupViewport(): void {}

  generateDaysInfo(): IDayInfo[] {
    const days: IDayInfo[] = [];
    const base = new Date();
    for (let i = -1; i <= 2; i += 1) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      let diaSemana = d.toLocaleDateString('es-ES', { weekday: 'long' });
      const diaNumero = d.toLocaleDateString('es-ES', { day: 'numeric' });
      diaSemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
      if (i === -1) diaSemana = 'Ayer';
      if (i === 0) diaSemana = 'Hoy';
      if (i === 1) diaSemana = 'Mañana';
      if (i === 2) diaSemana = 'Pasado';
      days.push({ diaSemana, diaNumero, index: i });
    }
    return days;
  }

  loadProgramsForDay(
    dayIndex: number
  ): Observable<{ success: boolean; data?: boolean; error?: string }> {
    this.currentDayIndex = dayIndex;
    return this.loadSnapshot(dayIndex);
  }

  calculateProgramDuration(startTime: string, endTime: string): number {
    const s = new Date(startTime).getTime();
    let e = new Date(endTime).getTime();
    if (e <= s) e += 24 * 60 * 60 * 1000;
    return Math.max(1, Math.round((e - s) / 60000));
  }

  generateProgramAriaLabel(programa: IProgramItem): string {
    const startTime = this.formatDisplayTime(programa.start);
    const endTime = this.formatDisplayTime(programa.stop);
    return `${(programa.title as any)?.value || programa.title}, ${startTime} a ${endTime}`;
  }

  diagnoseState(): void {
    return;
  }

  resetAllCaches(): void {
    this.snapshot$.next(null);
    this.currentLoad$ = null;
  }

  public getCurrentDayIndex(): number {
    return this.currentDayIndex;
  }

  private loadInitialData(): void {
    this.loading$.next(true);
    this.error$.next(null);

    this.currentLoad$ = this.programList
      .loadProgramList(this.aliasForIndex(this.currentDayIndex), this.buildLoadQuery())
      .pipe(
        tap((snap) => {
          this.snapshot$.next(snap);
          this.loading$.next(false);
          this.currentLoad$ = null;
        }),
        catchError((err) => {
          this.loading$.next(false);
          this.error$.next(err?.message || 'Error loading program list');
          this.currentLoad$ = null;
          return of(null);
        })
      )
      .subscribe();
  }

  private loadSnapshot(
    dayIndex: number
  ): Observable<{ success: boolean; data?: boolean; error?: string }> {
    this.loading$.next(true);
    this.error$.next(null);
    return this.programList
      .loadProgramList(this.aliasForIndex(dayIndex), this.buildLoadQuery())
      .pipe(
        tap((snap) => {
          this.snapshot$.next(snap);
          this.loading$.next(false);
        }),
        map(() => ({ success: true, data: true })),
        catchError((err) => {
          this.loading$.next(false);
          this.error$.next(err?.message || 'Error loading day');
          return of({ success: false, error: err?.message });
        })
      );
  }

  private buildLoadQuery(): Pick<
    LayoutsQuery,
    'channels' | 'channelTypes' | 'fields' | 'timeSlot'
  > {
    return {
      fields: 'full',
      channels: this.requestState.channelIds,
      channelTypes: this.requestState.channelTypes,
      timeSlot: this.requestState.timeSlot,
    };
  }

  private aliasForIndex(index: number): string {
    if (index === -1) return 'yesterday';
    if (index === 0) return 'today';
    if (index === 1) return 'tomorrow';
    if (index === 2) return 'after_tomorrow';
    return 'today';
  }

  private normalizeTimeSlot(value?: string | null): string | undefined {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 7) {
      return undefined;
    }
    return String(parsed);
  }

  private resolveDayIndex(rawDate?: string | null): number {
    const value = String(rawDate || '').trim().toLowerCase();
    if (!value || value === 'today') return 0;
    if (value === 'yesterday') return -1;
    if (value === 'tomorrow') return 1;
    if (value === 'after_tomorrow') return 2;

    if (/^\d{8}$/.test(value)) {
      const year = Number(value.slice(0, 4));
      const month = Number(value.slice(4, 6)) - 1;
      const day = Number(value.slice(6, 8));
      const requested = new Date(year, month, day);
      const today = new Date();
      requested.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diff = Math.round((requested.getTime() - today.getTime()) / 86_400_000);
      if (diff >= -1 && diff <= 2) {
        return diff;
      }
    }

    return 0;
  }
}
