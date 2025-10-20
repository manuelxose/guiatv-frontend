/**
 * Servicio Fachada para ProgramListComponent (Facade Pattern + SOLID)
 * Ubicación: src/app/services/program-list/program-list-facade.service.ts
 */

import { Injectable, ElementRef } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';

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
    return this.homeDataService.getProgramListData$();
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

  /**
   * Obtiene las franjas horarias disponibles
   */
  getTimeSlots(): readonly string[][] {
    return this.timeManager.getTimeSlots();
  }

  /**
   * Obtiene la franja horaria actual
   */
  getCurrentTimeSlot(): number {
    return this.timeManager.getCurrentTimeSlot();
  }

  /**
   * Genera las horas para una franja específica
   */
  generateHoursForSlot(slotIndex: number): string[] {
    return this.timeManager.generateHoursForSlot(slotIndex);
  }

  /**
   * Formatea tiempo para visualización
   */
  formatDisplayTime(timeString: string): string {
    return this.timeManager.formatDisplayTime(timeString);
  }

  /**
   * Calcula el estado del indicador de tiempo actual
   */
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

  /**
   * Calcula el ancho de un programa
   */
  calculateProgramWidth(duration: number): string {
    return this.dimensionCalculator.calculateProgramWidth(duration);
  }

  /**
   * Calcula la posición izquierda de un programa
   */
  calculateLeftPosition(programTime: string, baseTime: string): string {
    return this.dimensionCalculator.calculateLeftPosition(
      programTime,
      baseTime
    );
  }

  /**
   * Actualiza las dimensiones de pantalla
   */
  updateScreenDimensions(): void {
    this.dimensionCalculator.updateScreenDimensions();
  }

  // ===============================================
  // ESTILOS Y CATEGORÍAS
  // ===============================================

  /**
   * Obtiene las clases CSS para el badge de categoría
   */
  getCategoryBadgeClasses(categoryValue: string): string {
    return this.styleManager.getCategoryBadgeClasses(categoryValue);
  }

  /**
   * Obtiene el nombre de visualización de una categoría
   */
  getCategoryDisplayName(categoryValue: string): string {
    return this.styleManager.getCategoryDisplayName(categoryValue);
  }

  /**
   * Obtiene las clases CSS para botones de día
   */
  getDayButtonClasses(dayIndex: number, activeIndex: number): string {
    return this.styleManager.getDayButtonClasses(dayIndex, activeIndex);
  }

  /**
   * Obtiene las clases CSS para botones de franja horaria
   */
  getTimeSlotButtonClasses(timeSlot: string, activeSlot: string): string {
    return this.styleManager.getTimeSlotButtonClasses(timeSlot, activeSlot);
  }

  /**
   * Obtiene las clases CSS para contenedor de programa
   */
  getProgramContainerClasses(isSelected: boolean, isLive?: boolean): string {
    return this.styleManager.getProgramContainerClasses(isSelected, isLive);
  }

  // ===============================================
  // LOGOS DE CANALES
  // ===============================================

  /**
   * Obtiene la URL del logo de un canal
   */
  getChannelLogoUrl(channelData: any): string {
    return this.logoManager.getChannelLogoUrl(channelData);
  }

  /**
   * Maneja el error de carga de logo
   */
  handleLogoError(event: Event): void {
    this.logoManager.handleLogoError(event);
  }

  /**
   * Maneja la carga exitosa de logo
   */
  handleLogoLoad(event: Event): void {
    this.logoManager.handleLogoLoad(event);
  }

  /**
   * Actualiza los datos de canales para logos
   */
  updateChannelData(canalesData: any): void {
    this.logoManager.updateCanalesData(canalesData);
  }

  // ===============================================
  // VIEWPORT VIRTUAL
  // ===============================================

  /**
   * Configura el viewport único
   */
  setupUniqueViewport(elementRef: ElementRef, componentId: string): void {
    this.viewportManager.setupUniqueViewport(elementRef, componentId);
  }

  /**
   * Verifica si el viewport está listo
   */
  isViewportReady(): boolean {
    return this.viewportManager.isViewportReady();
  }

  /**
   * Limpia el viewport
   */
  cleanupViewport(): void {
    this.viewportManager.cleanupViewport();
  }

  // ===============================================
  // UTILIDADES Y HELPERS
  // ===============================================

  /**
   * Genera información de días
   */
  generateDaysInfo(): IDayInfo[] {
    const days: IDayInfo[] = [];
    const currentDate = new Date();

    for (let i = 0; i < 3; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      const diaSemana = date.toLocaleDateString('es-ES', { weekday: 'long' });
      const diaNumero = date.toLocaleDateString('es-ES', { day: 'numeric' });

      days.push({ diaSemana, diaNumero, index: i });
    }

    return days;
  }

  /**
   * Carga datos para un día específico
   * @param dayIndex - 0 = today, 1 = tomorrow, 2 = after_tomorrow
   */
  loadProgramsForDay(dayIndex: number): Observable<IOperationResult<boolean>> {
    return this.homeDataService.loadDataForDay(dayIndex).pipe(
      map((result: IOperationResult<any>) => ({
        success: result.success,
        data: result.success ? true : false,
        error: result.success ? undefined : result.error,
      }))
    );
  }

  /**
   * Calcula la duración de un programa
   */
  calculateProgramDuration(startTime: string, endTime: string): number {
    return this.timeManager.calculateDuration(startTime, endTime);
  }

  /**
   * Genera aria-label para un programa
   */
  generateProgramAriaLabel(programa: IProgramItem): string {
    const startTime = this.formatDisplayTime(programa.start);
    const endTime = this.formatDisplayTime(programa.stop);
    const category = this.getCategoryDisplayName(
      programa.category?.value || ''
    );

    return `${
      programa.title || 'Programa'
    }, ${startTime} a ${endTime}, ${category}`;
  }

  /**
   * Diagnóstico completo del estado
   */
  diagnoseState(): void {
    console.log('🔍 PROGRAM LIST FACADE - Diagnosing state...');

    // Diagnóstico de dimensiones
    const dimensionsValid = this.dimensionCalculator.areDimensionsValid();
    console.log('📐 Dimensions valid:', dimensionsValid);

    // Diagnóstico de viewport
    this.viewportManager.diagnoseViewportState();

    // Diagnóstico de logos
    const logoStats = this.logoManager.getCacheStats();
    console.log('🖼️ Logo cache stats:', logoStats);

    // Estado de datos
    this.homeDataService.debugState();
  }

  /**
   * Reinicia todos los caches y estados
   */
  resetAllCaches(): void {
    this.logoManager.clearCache();
    this.viewportManager.cleanupViewport();
    console.log('🗑️ All caches reset');
  }
}
