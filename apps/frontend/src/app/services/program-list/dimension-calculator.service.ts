/**
 * Servicio para cálculos de dimensiones y posicionamiento
 * Ubicación: src/app/services/program-list/dimension-calculator.service.ts
 */

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IDimensionCalculator } from 'src/app/interfaces/program-list.interface';
import { PROGRAM_LIST_CONFIG } from 'src/app/constants/program-list.constants';
import { TimeManagerService } from './time-manager.service';


@Injectable({
  providedIn: 'root'
})
export class DimensionCalculatorService implements IDimensionCalculator {
  
  private screenWidthInRem: number = PROGRAM_LIST_CONFIG.TIME_INDICATOR.SCREEN_WIDTH_REM;
  private columnWidth: number = PROGRAM_LIST_CONFIG.TIME_INDICATOR.COLUMN_WIDTH;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private timeManager: TimeManagerService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.updateScreenDimensions();
      this.setupResizeListener();
    }
  }
  calculateProgramWidth(duration: number): string {
    if (!duration || duration <= 0) {
      return `${PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.MIN_WIDTH}px`;
    }
    
    // Usar el ancho fijo de hora desde la configuración
    const pixelsPerMinute = PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.HOUR_WIDTH_PX / 60; // 120px / 60min = 2px por minuto
    const width = duration * pixelsPerMinute;
    
    return `${Math.max(PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.MIN_WIDTH, width)}px`;
  }

  calculateLeftPosition(time: string, baseTime: string): string {
    if (!time || !baseTime) return '0px';
    
    const timeMinutes = this.timeManager.parseTimeToMinutes(time);
    const baseMinutes = this.timeManager.parseTimeToMinutes(baseTime);
    
    let difference = timeMinutes - baseMinutes;
    if (difference < 0) difference += 24 * 60; // Handle day overflow
    
    // Usar el ancho fijo de hora para consistencia
    const pixelsPerMinute = PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.HOUR_WIDTH_PX / 60; // 2px por minuto
    const leftPosition = Math.max(0, difference * pixelsPerMinute);
    
    return `${leftPosition}px`;
  }

  updateScreenDimensions(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    try {
      const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      this.screenWidthInRem = window.innerWidth / remSize;
      this.columnWidth = Math.floor(window.innerWidth / 7);
    } catch (error) {
      return;
    }
  }

  getColumnWidth(): number {
    return this.columnWidth;
  }

  getScreenWidthInRem(): number {
    return this.screenWidthInRem;
  }
  /**
   * Calcula la posición del indicador de tiempo actual
   */
  calculateCurrentTimeIndicatorPosition(currentTime: string, baseTime: string): number {
    const currentMinutes = this.timeManager.parseTimeToMinutes(currentTime);
    const baseMinutes = this.timeManager.parseTimeToMinutes(baseTime);
    
    let difference = currentMinutes - baseMinutes;
    if (difference < 0) difference += 24 * 60;
    
    // Usar el mismo cálculo de píxeles por minuto que para los programas
    const pixelsPerMinute = PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.HOUR_WIDTH_PX / 60; // 2px por minuto
    const positionInPx = Math.max(0, difference * pixelsPerMinute);
    
    // Convertir a rem para consistencia con el CSS
    const remSize = 16; // Default browser rem size
    return positionInPx / remSize;
  }

  /**
   * Calcula las dimensiones óptimas para el viewport virtual
   */
  calculateOptimalViewportSize(itemCount: number): { height: number; itemSize: number } {
    const maxHeight = PROGRAM_LIST_CONFIG.VIRTUAL_SCROLL.MAX_HEIGHT;
    const itemSize = PROGRAM_LIST_CONFIG.VIRTUAL_SCROLL.ITEM_SIZE;
    
    // Si hay pocos elementos, usar altura variable
    if (itemCount < 5) {
      return {
        height: Math.min(itemCount * itemSize, maxHeight),
        itemSize
      };
    }
    
    return {
      height: maxHeight,
      itemSize
    };
  }

  /**
   * Verifica si las dimensiones actuales son válidas
   */
  areDimensionsValid(): boolean {
    return this.screenWidthInRem > 0 && this.columnWidth > 0;
  }

  private setupResizeListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    let resizeTimeout: any;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateScreenDimensions();
      }, 250);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup se puede manejar desde el componente que usa este servicio
  }
}
