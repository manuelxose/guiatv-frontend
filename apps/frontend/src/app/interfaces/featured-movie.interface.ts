/**
 * Interface para películas destacadas
 * Ubicación: src/app/interfaces/featured-movie.interface.ts
 */

export interface IFeaturedMovie {
  id: string;
  title: string;
  description?: string;
  poster?: string;
  rating?: number;
  tmdbId?: number;
  releaseDate?: string;
  isFallback?: boolean;
  error?: string;
  // Información adicional del programa de TV
  channelId?: string;
  channelName?: string;
  startTime?: string;
  endTime?: string;
  category?: string;
}

/**
 * Interface para configuración del HomeComponent
 */
export interface IHomeComponentConfig {
  enableMovies: boolean;
  enableSeries: boolean;
  maxFeaturedMovies: number;
  autoRefreshInterval?: number;
  enableTMDbFallback: boolean;
}