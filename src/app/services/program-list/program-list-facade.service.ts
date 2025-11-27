/**
 * Servicio Fachada para ProgramListComponent (Facade Pattern + SOLID)
 * Ubicación: src/app/services/program-list/program-list-facade.service.ts
 */

import { Injectable, ElementRef } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';

// Servicios especializados
import { TimeManagerService } from './time-manager.service';
import { DimensionCalculatorService } from './dimension-calculator.service';
import { CategoryStyleManagerService } from './category-style-manager.service';
import { ChannelLogoManagerService } from './channel-logo-manager.service';
import { HomeDataService } from '../features/home-data.service';
import {
  IProgramListData,
  IOperationResult,
  ITimeIndicatorState,
  IDayInfo,
  IProgramItem,
} from 'src/app/interfaces';
import { ViewportManagerService } from './viewport-manager.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramListFacadeService {
  constructor(
    private timeManager: TimeManagerService,
    private dimensionCalculator: DimensionCalculatorService,
    private styleManager: CategoryStyleManagerService,
    private logoManager: ChannelLogoManagerService,
    private viewportManager: ViewportManagerService,
    private homeDataService: HomeDataService
  ) {}

  // ===============================================
  // DATOS Y ESTADO
  // ===============================================

  /**
   * Obtiene los datos de programación para la lista
   */
  getProgramListData(): Observable<IProgramListData[]> {
    if (!this.homeDataService) {
      return of([]);
    }

    // Usa el getter público; si no existe, devuelve observable vacío para no romper suscriptores
    const stream =
      (this.homeDataService as any).getProgramListData$?.() ??
      (this.homeDataService as any).programListData$ ??
      of([]);

    return (stream as Observable<IProgramListData[]>).pipe(
      tap((data) => {
        const len = Array.isArray(data) ? data.length : 0;
        const sample = len > 0 ? data[0] : null;
        console.log(
          `[ProgramListFacade] Emission: channels=${len}, sample=${sample?.channel?.name || 'n/a'}`
        );
      })
    );
  }

  /**
   * Obtiene el estado de carga
   */
  getLoadingState(): Observable<boolean> {
    return this.homeDataService.loading$;
  }

  /**
   * Obtiene el estado de error
   */
  getErrorState(): Observable<string | null> {
    return this.homeDataService.error$;
  }

  /**
   * Refresca los datos
   */
  refreshData(): Observable<IOperationResult<boolean>> {
    return this.homeDataService.refreshData().pipe(
      map((result) => ({
        success: result.success,
        data: result.success ? true : false,
        error: result.success ? undefined : (result as any).error,
      }))
    );
  }

  // ===============================================
  // TIEMPO Y FRANJAS HORARIAS
  // ===============================================

  getTimeSlots(): readonly string[][] {
    return this.timeManager.getTimeSlots();
  }

  getCurrentTimeSlot(): number {
    return this.timeManager.getCurrentTimeSlot();
  }

  generateHoursForSlot(slotIndex: number): string[] {
    return this.timeManager.generateHoursForSlot(slotIndex);
  }

  formatDisplayTime(timeString: string): string {
    return this.timeManager.formatDisplayTime(timeString);
  }

  calculateTimeIndicatorState(
    activeDay: number,
    currentTimeSlot: string
  ): Observable<ITimeIndicatorState> {
    return new Observable((subscriber) => {
      const visible =
        this.timeManager.shouldShowCurrentTimeIndicator(activeDay);
      const currentTime = this.timeManager.getCurrentTime();
      const leftPosition =
        this.dimensionCalculator.calculateCurrentTimeIndicatorPosition(
          currentTime,
          currentTimeSlot
        );

      subscriber.next({
        visible,
        leftPosition,
        currentTime,
      });
    });
  }

  // ===============================================
  // DIMENSIONES Y POSICIONAMIENTO
  // ===============================================

  calculateProgramWidth(duration: number): string {
    return this.dimensionCalculator.calculateProgramWidth(duration);
  }

  calculateLeftPosition(programTime: string, baseTime: string): string {
    return this.dimensionCalculator.calculateLeftPosition(
      programTime,
      baseTime
    );
  }

  updateScreenDimensions(): void {
    this.dimensionCalculator.updateScreenDimensions();
  }

  // ===============================================
  // ESTILOS Y CATEGORÍAS
  // ===============================================

  getCategoryBadgeClasses(categoryValue: string): string {
    return this.styleManager.getCategoryBadgeClasses(categoryValue);
  }

  getCategoryDisplayName(categoryValue: string): string {
    return this.styleManager.getCategoryDisplayName(categoryValue);
  }

  getDayButtonClasses(dayIndex: number, activeIndex: number): string {
    return this.styleManager.getDayButtonClasses(dayIndex, activeIndex);
  }

  getTimeSlotButtonClasses(timeSlot: string, activeSlot: string): string {
    return this.styleManager.getTimeSlotButtonClasses(timeSlot, activeSlot);
  }

  getProgramContainerClasses(isSelected: boolean, isLive?: boolean): string {
    return this.styleManager.getProgramContainerClasses(isSelected, isLive);
  }

  // ===============================================
  // LOGOS DE CANALES
  // ===============================================

  getChannelLogoUrl(channelData: any): string {
    return this.logoManager.getChannelLogoUrl(channelData);
  }

  handleLogoError(event: Event): void {
    this.logoManager.handleLogoError(event);
  }

  handleLogoLoad(event: Event): void {
    this.logoManager.handleLogoLoad(event);
  }

  updateChannelData(canalesData: any): void {
    this.logoManager.updateCanalesData(canalesData);
  }

  // ===============================================
  // VIEWPORT VIRTUAL
  // ===============================================

  setupUniqueViewport(elementRef: ElementRef, componentId: string): void {
    this.viewportManager.setupUniqueViewport(elementRef, componentId);
  }

  isViewportReady(): boolean {
    return this.viewportManager.isViewportReady();
  }

  cleanupViewport(): void {
    this.viewportManager.cleanupViewport();
  }

  // ===============================================
  // UTILIDADES Y HELPERS
  // ===============================================

  generateDaysInfo(): IDayInfo[] {
    const days: IDayInfo[] = [];
    const currentDate = new Date();

    for (let i = -1; i <= 2; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      let diaSemana = date.toLocaleDateString('es-ES', { weekday: 'long' });
      const diaNumero = date.toLocaleDateString('es-ES', { day: 'numeric' });

      // Capitalize first letter
      diaSemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

      if (i === -1) diaSemana = 'Ayer';
      if (i === 0) diaSemana = 'Hoy';
      if (i === 1) diaSemana = 'Mañana';
      if (i === 2) diaSemana = 'Pasado';

      days.push({ diaSemana, diaNumero, index: i });
    }

    return days;
  }

  loadProgramsForDay(dayIndex: number): Observable<IOperationResult<boolean>> {
    return this.homeDataService.loadDataForDay(dayIndex).pipe(
      map((result: IOperationResult<any>) => ({
        success: result.success,
        data: result.success ? true : false,
        error: result.success ? undefined : result.error,
      }))
    );
  }

  calculateProgramDuration(startTime: string, endTime: string): number {
    return this.timeManager.calculateDuration(startTime, endTime);
  }

  generateProgramAriaLabel(programa: IProgramItem): string {
    const startTime = this.formatDisplayTime(programa.start);
    const endTime = this.formatDisplayTime(programa.stop);
    const category = this.getCategoryDisplayName(
      programa.category?.value || ''
    );

    return `${programa.title || 'Programa'}, ${startTime} a ${endTime}, ${category}`;
  }

  diagnoseState(): void {
    console.log('🧐 PROGRAM LIST FACADE - Diagnosing state...');
    const dimensionsValid = this.dimensionCalculator.areDimensionsValid();
    console.log('🧐 Dimensions valid:', dimensionsValid);
    this.viewportManager.diagnoseViewportState();
    const logoStats = this.logoManager.getCacheStats();
    console.log('🗂️ Logo cache stats:', logoStats);
    this.homeDataService.debugState();
  }

  resetAllCaches(): void {
    this.logoManager.clearCache();
    this.viewportManager.cleanupViewport();
    console.log('🗂️ All caches reset');
  }

  public getCurrentDayIndex(): number {
    return this.homeDataService.currentDayIndex;
  }
}
