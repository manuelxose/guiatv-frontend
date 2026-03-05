/**
 * Tipos y enums compartidos
 * Ubicación: src/app/interfaces/types.ts
 */

/**
 * Tipos de contenido disponibles
 */
export enum ContentType {
  MOVIE = 'Cine',
  SERIES = 'Series',
  DOCUMENTARY = 'Documental',
  NEWS = 'Noticias',
  SPORTS = 'Deportes'
}

/**
 * Estados de inicialización
 */
export enum InitializationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Claves de cache predefinidas
 */
export enum CacheKeys {
  TODAY_PROGRAMS = 'today_programs',
  TOMORROW_PROGRAMS = 'tomorrow_programs',
  FEATURED_MOVIES = 'featured_movies',
  POPULAR_SERIES = 'popular_series'
}

/**
 * Result type para operaciones que pueden fallar
 */
export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

/**
 * Estado de inicialización
 */
export interface InitializationState {
  initialized: boolean;
  initializing: boolean;
  error: string | null;
}