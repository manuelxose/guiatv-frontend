/**
 * Interfaces para providers y servicios abstractos
 * Ubicación: src/app/interfaces/providers.interface.ts
 */

import { Observable } from 'rxjs';
import { ITvProgram, IChannel } from './tv-program.interface';
import { IFeaturedMovie } from './featured-movie.interface';

/**
 * Contrato para proveedores de datos de programación
 */
export abstract class IProgramDataProvider {
  abstract getPrograms(date: string): Observable<ITvProgram[]>;
  abstract getChannels(): Observable<IChannel[]>;
}

/**
 * Contrato para proveedores de películas
 */
export abstract class IMovieProvider {
  abstract getPopularMovies(): Observable<IFeaturedMovie[]>;
  abstract searchMovie(title: string): Observable<any>;
  abstract getMovieDetails(id: string): Observable<any>;
}

/**
 * Contrato para filtrado de contenido
 */
export abstract class IContentFilter {
  abstract filterMovies(programs: ITvProgram[]): ITvProgram[];
  abstract filterFeaturedMovies(programs: ITvProgram[]): ITvProgram[];
  abstract filterSeries(programs: ITvProgram[]): ITvProgram[];
  abstract filterByCategory(programs: ITvProgram[], category: string): ITvProgram[];
}

/**
 * Contrato para transformación de datos
 */
export abstract class IDataTransformer {
  abstract transformToFeaturedMovies(programs: ITvProgram[]): Observable<IFeaturedMovie[]>;
  abstract selectFeaturedMovie(movies: IFeaturedMovie[]): IFeaturedMovie | null;
}

/**
 * Contrato para manejo de estado de inicialización
 */
export abstract class IInitializationManager {
  abstract isInitialized(): boolean;
  abstract startInitialization(): boolean;
  abstract completeInitialization(dataVerification?: () => boolean): void;
  abstract failInitialization(error: string): void;
  abstract resetInitialization(): void;
}

/**
 * Contrato para cache de datos
 */
export abstract class ICacheManager<T> {
  abstract get(key: string): T | null;
  abstract set(key: string, data: T, ttl?: number): void;
  abstract has(key: string): boolean;
  abstract clear(key?: string): void;
}

/**
 * Contrato para logging
 */
export abstract class ILogger {
  abstract info(message: string, ...args: any[]): void;
  abstract warn(message: string, ...args: any[]): void;
  abstract error(message: string, ...args: any[]): void;
  abstract debug(message: string, ...args: any[]): void;
}

/**
 * Contrato para extracción de posters
 */
export abstract class IPosterProvider {
  abstract extractPoster(movieTitle: string, year?: string): Observable<string>;
  abstract extractPosterFromProgram(program: ITvProgram): Observable<string>;
  abstract getDefaultPoster(): string;
}