/**
 * Servicio para transformación de datos
 * Ubicación: src/app/services/providers/data-transformer.service.ts
 */

import { Injectable, Inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  IDataTransformer, 
  ITvProgram, 
  IFeaturedMovie, 
  ILogger,
  IPosterProvider
} from '../../interfaces';
import { AppConfigurationService } from '../core/config.service';
import { POSTER_PROVIDER_TOKEN, LOGGER_TOKEN } from '../../config/di-tokens';

@Injectable({
  providedIn: 'root'
})
export class DataTransformerService implements IDataTransformer {
  
  constructor(
    @Inject(LOGGER_TOKEN) private logger: ILogger,
    @Inject(POSTER_PROVIDER_TOKEN) private posterProvider: IPosterProvider,
    private configService: AppConfigurationService
  ) {}

  transformToFeaturedMovies(programs: ITvProgram[]): Observable<IFeaturedMovie[]> {
    if (!Array.isArray(programs)) {
      this.logger.warn('Invalid programs array provided to transformToFeaturedMovies');
      return of([]);
    }

    const maxMovies = this.configService.getUIConfig().maxFeaturedMovies;
    const programsToTransform = programs.slice(0, maxMovies);

    if (programsToTransform.length === 0) {
      this.logger.info('No programs to transform');
      return of([]);
    }

    // Verificar estado del servicio de posters
    const isServiceAvailable = (this.posterProvider as any).isServiceAvailable?.() ?? true;
    
    if (!isServiceAvailable) {
      this.logger.warn('🚫 TMDb service temporarily unavailable. Using fallback posters for all movies.');
    }

    this.logger.info(`Starting transformation of ${programsToTransform.length} programs to featured movies`);

    // Crear un Map para evitar duplicados por título
    const uniquePrograms = new Map<string, ITvProgram>();
    
    programsToTransform.forEach(program => {
      const title = this.extractTitle(program.title);
      if (title && !uniquePrograms.has(title.toLowerCase())) {
        uniquePrograms.set(title.toLowerCase(), program);
      }
    });

    const uniqueProgramsArray = Array.from(uniquePrograms.values());
    this.logger.info(`Removed duplicates: ${programsToTransform.length} -> ${uniqueProgramsArray.length} unique movies`);

    // Crear observables para transformar cada programa único
    const transformObservables = uniqueProgramsArray.map((program, index) => 
      this.transformSingleProgramOptimized(program, index)
    );

    // Combinar todos los observables
    return forkJoin(transformObservables).pipe(
      map(movies => {
        const validMovies = movies.filter(movie => movie !== null) as IFeaturedMovie[];
        const tmdbMovies = validMovies.filter(movie => !movie.isFallback).length;
        const fallbackMovies = validMovies.filter(movie => movie.isFallback).length;
        
        this.logger.info(`🎬 Transformation complete: ${validMovies.length} movies (${tmdbMovies} from TMDb, ${fallbackMovies} fallback)`);
        
        return validMovies;
      }),
      catchError(error => {
        this.logger.error('Error transforming programs to featured movies', error);
        return of([]);
      })
    );
  }

  /**
   * Transforma un solo programa a película destacada
   */
  private transformSingleProgram(program: ITvProgram, index: number): Observable<IFeaturedMovie | null> {
    const title = this.extractTitle(program.title);
    
    if (!title) {
      this.logger.warn(`Program at index ${index} has no valid title`, { programId: program.id });
      return of(null);
    }

    return this.posterProvider.extractPosterFromProgram(program).pipe(
      map(poster => ({
        id: program.id || `movie_${index}`,
        title: title,
        description: this.extractDescription(program),
        poster: poster,
        rating: program.starRating || null,
        // Información adicional para enriquecimiento
        tmdbId: null,
        releaseDate: (program.desc as any)?.year,
        isFallback: false,
        // Datos del programa original
        channelId: program.channel_id,
        channelName: program.channel?.name,
        startTime: program.start,
        endTime: program.end,
        category: program.category?.value
      })),
      catchError(error => {
        this.logger.warn(`Error transforming program "${title}":`, error);
        // Retornar película con poster por defecto en caso de error
        return of({
          id: program.id || `movie_${index}`,
          title: title,
          description: this.extractDescription(program),
          poster: this.posterProvider.getDefaultPoster(),
          rating: program.starRating || null,
          tmdbId: null,
          releaseDate: (program.desc as any)?.year,
          isFallback: true,
          channelId: program.channel_id,
          channelName: program.channel?.name,
          startTime: program.start,
          endTime: program.end,
          category: program.category?.value
        });
      })
    );
  }

  /**
   * Transforma un solo programa a película destacada (versión optimizada)
   */
  private transformSingleProgramOptimized(program: ITvProgram, index: number): Observable<IFeaturedMovie | null> {
    const title = this.extractTitle(program.title);
    
    if (!title) {
      this.logger.warn(`Program at index ${index} has no valid title`, { programId: program.id });
      return of(null);
    }

    // Verificar si el servicio de posters está disponible
    const isServiceAvailable = (this.posterProvider as any).isServiceAvailable?.() ?? true;

    if (!isServiceAvailable) {
      // Usar poster de fallback sin intentar TMDb
      return of(this.createMovieWithFallback(program, index, title));
    }

    // Logging más inteligente para evitar spam
    const shouldLogDetails = index < 3 || index % 5 === 0; // Solo loggear los primeros 3 y cada 5
    
    if (shouldLogDetails) {
      this.logger.info('🎬 Processing movie:', {
        id: program.id,
        title: title,
        channel: program.channel?.name,
        category: program.category?.value,
        year: (program.desc as any)?.year,
        rating: (program as any).starRating,
        startTime: this.formatTime(program.start)
      });
    }

    // Usar el método estándar del poster provider
    return this.posterProvider.extractPosterFromProgram(program).pipe(
      map(poster => {
        const baseMovie: IFeaturedMovie = {
          id: program.id || `movie_${index}`,
          title: title,
          description: this.extractDescription(program),
          poster: poster,
          rating: this.extractRating(program),
          tmdbId: null,
          releaseDate: (program.desc as any)?.year,
          isFallback: poster === this.posterProvider.getDefaultPoster(),
          // Datos del programa original
          channelId: program.channel_id,
          channelName: program.channel?.name,
          startTime: program.start,
          endTime: program.end,
          category: program.category?.value
        };

        if (shouldLogDetails && !baseMovie.isFallback) {
          this.logger.info(`✅ TMDb poster found for "${title}"`);
        }

        return baseMovie;
      }),
      catchError(error => {
        if (shouldLogDetails) {
          this.logger.warn(`⚠️ Error transforming program "${title}", using fallback`);
        }
        
        return of(this.createMovieWithFallback(program, index, title));
      })
    );
  }

  /**
   * Crea una película con datos de fallback
   */
  private createMovieWithFallback(program: ITvProgram, index: number, title: string): IFeaturedMovie {
    return {
      id: program.id || `movie_${index}`,
      title: title,
      description: this.extractDescription(program),
      poster: program.channel?.icon || this.posterProvider.getDefaultPoster(),
      rating: this.extractRating(program),
      tmdbId: null,
      releaseDate: (program.desc as any)?.year,
      isFallback: true,
      channelId: program.channel_id,
      channelName: program.channel?.name,
      startTime: program.start,
      endTime: program.end,
      category: program.category?.value
    };
  }

  /**
   * Extrae el rating del programa de manera inteligente
   */
  private extractRating(program: ITvProgram): number | null {
    const rating = (program as any).starRating; // Uso any para manejar inconsistencias de tipos

    if (!rating) {
      return null;
    }

    // Si es un string como "6.0/10", extraer solo el número
    if (typeof rating === 'string') {
      const match = rating.match(/^(\d+(?:\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    // Si es un número, retornarlo directamente
    if (typeof rating === 'number') {
      return rating;
    }

    return null;
  }

  selectFeaturedMovie(movies: IFeaturedMovie[]): IFeaturedMovie | null {
    if (!Array.isArray(movies) || movies.length === 0) {
      this.logger.warn('No movies available for selection');
      return null;
    }

    // Criterio 1: Película con mejor rating (> 7.0)
    const highRatedMovie = movies.find(movie => 
      movie.rating && movie.rating > 7.0
    );

    if (highRatedMovie) {
      this.logger.info(`Selected featured movie by rating: "${highRatedMovie.title}" (${highRatedMovie.rating})`);
      return highRatedMovie;
    }

    // Criterio 2: Película con poster disponible
    const movieWithPoster = movies.find(movie => 
      movie.poster && movie.poster.length > 0
    );

    if (movieWithPoster) {
      this.logger.info(`Selected featured movie with poster: "${movieWithPoster.title}"`);
      return movieWithPoster;
    }

    // Criterio 3: Primera película disponible
    const selected = movies[0];
    this.logger.info(`Selected default featured movie: "${selected.title}"`);
    return selected;
  }

  private extractTitle(title: string | { lang?: string; value: string }): string {
    if (typeof title === 'string') {
      return title;
    }
    
    return title?.value || '';
  }

  private extractDescription(program: ITvProgram): string {
    // Prioridad: desc.value > desc.details > descripción generada
    if (program.desc?.value) {
      return program.desc.value;
    }
    
    if (program.desc?.details) {
      return program.desc.details;
    }
    
    // Generar descripción básica
    const title = this.extractTitle(program.title);
    const channelName = program.channel?.name || 'canal desconocido';
    const startTime = this.formatTime(program.start);
    
    return `${title} en ${channelName} a las ${startTime}`;
  }

  private formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      this.logger.warn(`Invalid date string: ${dateString}`);
      return 'hora desconocida';
    }
  }

  /**
   * Obtiene estadísticas del servicio de posters
   */
  public getPosterServiceStats(): {
    isAvailable: boolean;
    consecutiveFailures: number;
    cacheSize: number;
  } {
    const posterService = this.posterProvider as any;
    
    return {
      isAvailable: posterService.isServiceAvailable?.() ?? true,
      consecutiveFailures: posterService.consecutiveFailures ?? 0,
      cacheSize: 0 // Podríamos implementar esto si el cache lo soporta
    };
  }

  /**
   * Fuerza reconexión del servicio de posters
   */
  public forceReconnectPosterService(): void {
    const posterService = this.posterProvider as any;
    if (posterService.forceReconnect) {
      posterService.forceReconnect();
      this.logger.info('🔄 Poster service reconnection forced');
    }
  }
}