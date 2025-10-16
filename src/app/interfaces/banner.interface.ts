/**
 * Banner Interface - Principio de Responsabilidad Única
 * Define la estructura específica de datos para el componente Banner
 */

// Datos básicos que el banner necesita
export interface IBannerTitle {
  value: string;
  lang?: string;
}

export interface IBannerDescription {
  details?: string;
  value?: string;
  year?: string;
  rate?: string;
  lang?: string;
}

export interface IBannerCategory {
  value: string;
  lang?: string;
}

export interface IBannerSchedule {
  start: string;
  stop: string;
  duration?: string;
}

export interface IBannerMetadata {
  year?: string;
  rating?: string;
  starRating?: string | number;
  category?: IBannerCategory;
  description?: string;
}

/**
 * Interface principal para datos del Banner
 * Aplicando principio de Responsabilidad Única: Solo define la estructura del banner
 */
export interface IBannerData {
  // Información básica del programa
  title: IBannerTitle;
  
  // Información del canal
  channel: string;
  
  // Imágenes separadas por responsabilidad
  poster?: string;        // Carátula del programa (para fondo)
  icon?: string;          // Imagen alternativa
  
  // Información temporal
  start: string;
  stop: string;
  
  // Información adicional
  desc?: IBannerDescription;
  category?: IBannerCategory;
  starRating?: string | number;
  
  // ID para navegación
  id?: string;
}

/**
 * Interface para datos de entrada (lo que recibe el banner)
 * Permite flexibilidad en los datos de entrada
 */
export interface IBannerInputData {
  // Estructura de programa completo (desde program-list)
  title?: string | IBannerTitle;
  channel?: string;
  channelName?: string;  // Añadido
  start?: string | Date;
  stop?: string | Date;
  startTime?: string;    // Añadido
  endTime?: string;      // Añadido
  desc?: string | IBannerDescription;
  category?: string | IBannerCategory;
  starRating?: string | number;
  icon?: string;
  poster?: string;
  id?: string;
  
  // Campos adicionales que pueden venir de diferentes fuentes
  description?: string;
  year?: string;
  rating?: string;
  releaseDate?: string;
  overview?: string;
  vote_average?: number;
  contentRating?: string;
  genre?: string;
  
  // Metadatos específicos de diferentes fuentes
  channel_id?: string;
  date?: string;
  duracion?: number;
  type?: string;
  votes?: any;
}

/**
 * Interface para servicios de imágenes - Principio de Inversión de Dependencias
 */
export interface IImageService {
  getChannelLogoUrl(channelName: string): string;
  getProgramPosterUrl(programData: any): string;
  getFallbackImageUrl(): string;
  handleImageError(event: Event): void;
}

/**
 * Interface para servicio de conversión de datos del banner
 */
export interface IBannerDataService {
  convertProgramToBannerData(programData: any): IBannerData;
  convertMovieToBannerData(movieData: any): IBannerData;
  convertGenericToBannerData(data: any): IBannerData;
}

/**
 * Interface para utilidades de tiempo - Principio de Responsabilidad Única
 */
export interface ITimeUtilsService {
  formatTime(timeString: string): string;
  calculateDuration(start: string, stop: string): string;
}
