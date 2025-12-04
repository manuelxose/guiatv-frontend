import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, filter } from 'rxjs/operators';
import { ProgramListService, ProgramListSnapshot } from '../../state/program-list.service';
import { IProgramListData, ITimeIndicatorState, IDayInfo, IProgramItem } from 'src/app/interfaces';

/**
 * Nueva fachada ligera para ProgramListComponent.
 * Sustituye la anterior capa legacy; carga datos desde /v2/layouts/{date}
 * y expone helpers básicos para mantener el componente funcionando.
 */
@Injectable({ providedIn: 'root' })
export class ProgramListFacadeService {
  // Start in loading state so the UI never sees "not loading + no data" on first render
  private loading$ = new BehaviorSubject<boolean>(true);
  private error$ = new BehaviorSubject<string | null>(null);
  private snapshot$ = new BehaviorSubject<ProgramListSnapshot | null>(null);
  private currentDayIndex = 0; // -1..2; default today=0
  private currentLoad$: any = null; // Changed to any or Subscription to avoid type errors with previous usage

  constructor(private programList: ProgramListService) {}

  getProgramListData(): Observable<IProgramListData[]> {
    // Trigger initial load if no data exists
    if (!this.snapshot$.value && !this.currentLoad$) {
      this.loadInitialData();
    }

    // Return reactive stream that emits whenever snapshot changes
    return this.snapshot$.pipe(
      filter((snap): snap is ProgramListSnapshot => snap !== null),
      map((snap) => snap.channels)
    );
  }

  /**
   * Load initial data for current day index
   */
  private loadInitialData(): void {
    this.loading$.next(true);
    this.error$.next(null);
    
    this.currentLoad$ = this.programList
      .loadProgramList(this.aliasForIndex(this.currentDayIndex))
      .pipe(
        tap((snap) => {
          console.log('[Facade] Initial data loaded:', snap.channels.length, 'channels');
          this.snapshot$.next(snap);
          this.loading$.next(false);
          this.currentLoad$ = null;
        }),
        catchError((err) => {
          console.error('[Facade] Initial load error:', err);
          this.loading$.next(false);
          this.error$.next(err?.message || 'Error loading program list');
          this.currentLoad$ = null;
          return of(null);
        })
      )
      .subscribe();
  }

  getLoadingState(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getErrorState(): Observable<string | null> {
    return this.error$.asObservable();
  }

  refreshData(): Observable<{ success: boolean; data?: boolean; error?: string }> {
    return this.getProgramListData().pipe(
      map(() => ({ success: true, data: true })),
      catchError((err) => of({ success: false, error: err?.message }))
    );
  }

  getTimeSlots(): readonly string[][] {
    // Fixed 3h slots as in README
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

  generateHoursForSlot(slotIndex: number): string[] {
    const start = slotIndex * 3;
    const hours: string[] = [];
    for (let h = start; h <= start + 3; h++) {
      const hh = (h % 24).toString().padStart(2, '0');
      hours.push(`${hh}:00`);
    }
    return hours;
  }

  formatDisplayTime(timeString: string): string {
    try {
      const d = new Date(timeString);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  }

  calculateTimeIndicatorState(activeDay: number, currentTimeSlot: string): Observable<ITimeIndicatorState> {
    const visible = activeDay === 0;
    const leftPosition = 0; // Placeholder; UI recalculates via component
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
    return dayIndex === activeIndex ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-200';
  }

  getTimeSlotButtonClasses(timeSlot: string, activeSlot: string): string {
    return timeSlot === activeSlot ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-200';
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
    for (let i = -1; i <= 2; i++) {
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

  loadProgramsForDay(dayIndex: number): Observable<{ success: boolean; data?: boolean; error?: string }> {
    this.currentDayIndex = dayIndex;
    return this.programList
      .loadProgramList(this.aliasForIndex(dayIndex))
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
    console.log('[ProgramListFacade] snapshot', this.snapshot$.value);
  }

  resetAllCaches(): void {
    this.snapshot$.next(null);
    this.currentLoad$ = null;
  }

  public getCurrentDayIndex(): number {
    return this.currentDayIndex;
  }

  private aliasForIndex(index: number): string {
    if (index === -1) return 'yesterday';
    if (index === 0) return 'today';
    if (index === 1) return 'tomorrow';
    if (index === 2) return 'after_tomorrow';
    return 'today';
  }
}
