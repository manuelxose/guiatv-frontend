/**
 * Interfaces específicas para ProgramListComponent
 * Ubicación: src/app/interfaces/program-list.interface.ts
 */

import { Observable } from 'rxjs';

// ===============================================
// INTERFACES DE DATOS
// ===============================================

/**
 * Estructura de datos para un canal con sus programas
 */
export interface IProgramListData {
  id: string;
  channel: IChannelInfo;
  channels: IProgramItem[]; // Array de programas para este canal
}

/**
 * Información del canal
 */
export interface IChannelInfo {
  id: string;
  name: string;
  icon?: string;
  type?: string;
}

/**
 * Programa individual
 */
export interface IProgramItem {
  id: string;
  title: string | { lang?: string; value: any };
  start: string;
  stop: string;
  category?: {
    value: string;
    lang?: string;
  };
  desc?: {
    value?: string;
    details?: string;
    lang?: string;
  };
  duracion?: number; // Duración en minutos
  starRating?: number;
}

/**
 * Información de día para selector
 */
export interface IDayInfo {
  diaSemana: string;
  diaNumero: string;
  index: number;
}

// ===============================================
// INTERFACES DE EVENTOS
// ===============================================

/**
 * Evento cuando cambia el día seleccionado
 */
export interface IDayChangedEvent {
  dayIndex: number;
  dayInfo: IDayInfo;
}

/**
 * Evento cuando se selecciona un programa
 */
export interface IProgramSelectedEvent {
  channelIndex: number;
  program: IProgramItem;
}

// ===============================================
// INTERFACES DE ESTADO
// ===============================================

/**
 * Estado del indicador de tiempo
 */
export interface ITimeIndicatorState {
  visible: boolean;
  leftPosition: number;
  currentTime: string;
}

/**
 * Resultado de operación genérico
 */
export interface IOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===============================================
// INTERFACES DE SERVICIOS (CONTRATOS)
// ===============================================

/**
 * Contrato para manejo de tiempo
 */
export interface ITimeManager {
  getCurrentTimeSlot(): number;
  getTimeSlots(): readonly string[][];
  getCurrentTime(): string;
  parseTimeToMinutes(timeString: string): number;
  calculateTimePosition(time: string, baseTime: string): number;
  generateHoursForSlot(slotIndex: number): string[];
  formatDisplayTime(timeString: string): string;
  shouldShowCurrentTimeIndicator(activeDay: number): boolean;
  calculateDuration(startTime: string, endTime: string): number;
}

/**
 * Contrato para cálculo de dimensiones
 */
export interface IDimensionCalculator {
  calculateProgramWidth(duration: number): string;
  calculateLeftPosition(time: string, baseTime: string): string;
  updateScreenDimensions(): void;
  getColumnWidth(): number;
  getScreenWidthInRem(): number;
  calculateCurrentTimeIndicatorPosition(currentTime: string, baseTime: string): number;
  areDimensionsValid(): boolean;
}

/**
 * Contrato para manejo de estilos y categorías
 */
export interface ICategoryStyleManager {
  getCategoryBadgeClasses(categoryValue: string): string;
  getCategoryDisplayName(categoryValue: string): string;
  getDayButtonClasses(dayIndex: number, activeIndex: number): string;
  getTimeSlotButtonClasses(timeSlot: string, activeSlot: string): string;
  getProgramContainerClasses(isSelected: boolean, isLive?: boolean): string;
}

/**
 * Contrato para manejo de logos de canales
 */
export interface IChannelLogoManager {
  getChannelLogoUrl(channelData: IChannelInfo): string;
  handleLogoError(event: Event): void;
  handleLogoLoad(event: Event): void;
  clearCache(): void;
  updateCanalesData(canalesData: any): void;
  preloadLogos?(channels: IChannelInfo[]): void;
}

/**
 * Contrato para manejo del viewport virtual
 */
export interface IViewportManager {
  setupUniqueViewport(elementRef: any, componentId: string): void;
  ensureViewportUniqueness(retryCount?: number): boolean;
  cleanupViewport(): void;
  isViewportReady(): boolean;
  diagnoseViewportState?(): void;
}

// ===============================================
// INTERFACES DE CONFIGURACIÓN
// ===============================================

/**
 * Configuración del componente ProgramList
 */
export interface IProgramListConfig {
  virtualScroll: {
    itemSize: number;
    maxHeight: number;
  };
  timeIndicator: {
    updateInterval: number;
    screenWidthRem: number;
    columnWidth: number;
  };
  viewport: {
    setupDelay: number;
    retryDelay: number;
    maxRetries: number;
  };
  loading: {
    timeout: number;
    debounceTime: number;
  };
  programDisplay: {
    minWidth: number;
    timeSlotDuration: number;
  };
}

// ===============================================
// TIPOS HELPER
// ===============================================

/**
 * Tipo para mapeo de colores de categorías
 */
export type CategoryColorMap = {
  [key: string]: string;
};

/**
 * Tipo para mapeo de nombres de categorías
 */
export type CategoryNameMap = {
  [key: string]: string;
};

/**
 * Estado UI simplificado
 */
export interface IUIState {
  hasData: boolean;
  isLoading: boolean;
  hasError: boolean;
  showContent: boolean;
  showEmpty: boolean;
}