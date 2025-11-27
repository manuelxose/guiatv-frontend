// backend/src/shared/types/ApiResponse.ts

/**
 * Modelo de respuesta unificado para toda la API
 * Todos los endpoints deben usar este formato
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ResponseMeta {
  timestamp?: string;
  requestId?: string;
  cached?: boolean;
  [key: string]: any; // Permite metadatos adicionales específicos del endpoint
}

/**
 * Respuesta exitosa estándar
 */
export function successResponse<T>(
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Respuesta de error estándar
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Tipos de datos específicos para cada endpoint
 */

// Channels
export interface ChannelsData {
  channels: any[];
  total: number;
}

export interface ChannelData {
  channel: any;
}

// Programs
export interface ProgramsData {
  programs: any[];
  total: number;
  date?: string;
}

export interface ProgramData {
  program: any;
}

// Schedules
export interface ScheduleData {
  date: string;
  channels: Array<{
    channel: any;
    programs: any[];
  }>;
  totalChannels: number;
  totalPrograms: number;
}

// Optimized Programs
export interface OptimizedProgramsData {
  date: string;
  timeSlots: string[][];
  channels: Array<{
    id: string;
    name: string;
    icon: string | null;
    type: string;
    programs: any[];
  }>;
  totalChannels: number;
  totalPrograms: number;
}
