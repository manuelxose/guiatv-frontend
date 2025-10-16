/**
 * Servicio principal para manejo de películas destacadas
 * Ubicación: src/app/services/features/featured-movies.service.ts
 */

import { Injectable, Inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { 
  IProgramDataProvider,
  IMovieProvider,
  IContentFilter,
  IDataTransformer,
  ICacheManager,
  ILogger,
  ITvProgram,
  IFeaturedMovie,
  Result
} from '../../interfaces';
import {
  PROGRAM_PROVIDER_TOKEN,
  MOVIE_PROVIDER_TOKEN,
  CONTENT_FILTER_TOKEN,
  DATA_TRANSFORMER_TOKEN,
  CACHE_MANAGER_TOKEN,
  LOGGER_TOKEN
} from '../../config/di-tokens';

@Injectable({
  providedIn: 'root'
})
export class FeaturedMoviesService {
  
  constructor(
    @Inject(PROGRAM_PROVIDER_TOKEN) private programProvider: IProgramDataProvider,
    @Inject(MOVIE_PROVIDER_TOKEN) private movieProvider: IMovieProvider,
    @Inject(CONTENT_FILTER_TOKEN) private contentFilter: IContentFilter,
    @Inject(DATA_TRANSFORMER_TOKEN) private dataTransformer: IDataTransformer,
    @Inject(CACHE_MANAGER_TOKEN) private cache: ICacheManager<IFeaturedMovie[]>,
    @Inject(LOGGER_TOKEN) private logger: ILogger
  ) {}

  /**
   * Obtiene películas destacadas desde programación de TV
   */
  getFeaturedMoviesFromPrograms(programs: ITvProgram[]): Observable<Result<IFeaturedMovie[], string>> {
    try {
      this.logger.info(`Processing ${programs.length} programs for featured movies`);

      if (!Array.isArray(programs) || programs.length === 0) {
        return of({
          success: false,
          error: 'No programs provided or empty array'
        });
      }

      // Usar el filtro específico para películas destacadas (incluye horario prime time)
      const featuredMoviePrograms = this.contentFilter.filterFeaturedMovies(programs);
      
      if (featuredMoviePrograms.length === 0) {
        this.logger.warn('No featured movies found in prime time (21:00-23:59). Trying to find any movies...');
        
        // Fallback: usar filtro normal de películas si no hay películas en prime time
        const allMoviePrograms = this.contentFilter.filterMovies(programs);
        
        if (allMoviePrograms.length === 0) {
          return of({
            success: false,
            error: 'No movies found in program data'
          });
        }

        // Para fallback, al menos intentemos evitar películas de madrugada
        const betterMovies = allMoviePrograms.filter(program => {
          if (!program.start) return false;
          try {
            const hour = new Date(program.start).getHours();
            // Evitar películas de madrugada (00:00-05:59) en el fallback
            return hour >= 6;
          } catch {
            return false;
          }
        });

        const fallbackPrograms = (betterMovies.length > 0 ? betterMovies : allMoviePrograms).slice(0, 3);
        
        this.logger.info(`Using ${fallbackPrograms.length} movies as fallback (excluding early morning)`);
        fallbackPrograms.forEach(program => {
          const title = typeof program.title === 'string' ? program.title : program.title?.value || 'Unknown';
          const startTime = program.start ? new Date(program.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Unknown';
          this.logger.info(`Fallback movie: "${title}" at ${startTime} on ${program.channel?.name}`);
        });
        
        return this.processMoviePrograms(fallbackPrograms);
      }

      this.logger.info(`Found ${featuredMoviePrograms.length} movies in prime time`);
      featuredMoviePrograms.forEach(program => {
        const title = typeof program.title === 'string' ? program.title : program.title?.value || 'Unknown';
        const startTime = program.start ? new Date(program.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Unknown';
        this.logger.info(`Prime time movie: "${title}" at ${startTime} on ${program.channel?.name}`);
      });
      
      return this.processMoviePrograms(featuredMoviePrograms);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error processing programs';
      this.logger.error('Error processing featured movies from programs', error);
      
      return of({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * Procesa los programas de películas y los transforma
   */
  private processMoviePrograms(moviePrograms: ITvProgram[]): Observable<Result<IFeaturedMovie[], string>> {
    return this.dataTransformer.transformToFeaturedMovies(moviePrograms).pipe(
      map(featuredMovies => {
        this.logger.info(`Successfully processed ${featuredMovies.length} featured movies`);
        return {
          success: true as const,
          data: featuredMovies
        };
      }),
      catchError(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error processing programs';
        this.logger.error('Error transforming featured movies', error);
        
        return of({
          success: false as const,
          error: errorMessage
        });
      })
    );
  }

  /**
   * Obtiene películas populares desde TMDb como fallback
   */
  getFeaturedMoviesFromTMDb(): Observable<Result<IFeaturedMovie[], string>> {
    this.logger.info('Fetching featured movies from TMDb as fallback');

    return this.movieProvider.getPopularMovies().pipe(
      map(movies => {
        this.logger.info(`Retrieved ${movies.length} movies from TMDb`);
        return {
          success: true as const,
          data: movies
        };
      }),
      catchError(error => {
        const errorMessage = error instanceof Error ? error.message : 'TMDb fetch failed';
        this.logger.error('Error fetching movies from TMDb', error);
        
        return of({
          success: false as const,
          error: errorMessage
        });
      })
    );
  }

  /**
   * Selecciona la película destacada principal
   */
  selectFeaturedMovie(movies: IFeaturedMovie[]): IFeaturedMovie | null {
    if (!Array.isArray(movies)) {
      this.logger.warn('Invalid movies array provided to selectFeaturedMovie');
      return null;
    }

    return this.dataTransformer.selectFeaturedMovie(movies);
  }

  /**
   * Enriquece películas con datos adicionales de TMDb
   */
  enrichMoviesWithTMDbData(movies: IFeaturedMovie[]): Observable<IFeaturedMovie[]> {
    if (!Array.isArray(movies) || movies.length === 0) {
      this.logger.info('No movies to enrich');
      return of([]);
    }

    this.logger.info(`Enriching ${movies.length} movies with TMDb data`);

    // Limitar a las primeras 5 películas para evitar demasiadas llamadas API
    const moviesToEnrich = movies.slice(0, 5);
    const remainingMovies = movies.slice(5);

    if (moviesToEnrich.length === 0) {
      return of(movies);
    }

    // Crear observables para enriquecer cada película
    const enrichmentObservables = moviesToEnrich.map(movie => 
      this.movieProvider.searchMovie(movie.title).pipe(
        map((response: any) => {
          if (response?.results?.[0]) {
            const tmdbMovie = response.results[0];
            
            return {
              ...movie,
              rating: tmdbMovie.vote_average || movie.rating,
              description: tmdbMovie.overview || movie.description,
              poster: tmdbMovie.poster_path ? 
                `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : 
                movie.poster,
              tmdbId: tmdbMovie.id,
              releaseDate: tmdbMovie.release_date
            };
          }
          return movie;
        }),
        catchError(error => {
          this.logger.warn(`Error enriching movie "${movie.title}":`, error);
          return of(movie);
        })
      )
    );

    // Combinar todos los observables
    return forkJoin(enrichmentObservables).pipe(
      map(enrichedMovies => {
        const result = [...enrichedMovies, ...remainingMovies];
        this.logger.info(`Successfully enriched ${enrichedMovies.length} movies`);
        return result;
      }),
      catchError(error => {
        this.logger.error('Error in global movie enrichment:', error);
        return of(movies);
      })
    );
  }

  /**
   * Obtiene películas destacadas con estrategia híbrida
   * Primero intenta desde programas, luego fallback a TMDb
   */
  getFeaturedMoviesHybrid(programs: ITvProgram[]): Observable<Result<IFeaturedMovie[], string>> {
    this.logger.info('Starting hybrid featured movies strategy');
    
    // Intentar primero desde programas
    return this.getFeaturedMoviesFromPrograms(programs).pipe(
      map(programResult => {
        if (programResult.success && programResult.data.length > 0) {
          this.logger.info('Using featured movies from program data');
          return programResult;
        }
        
        this.logger.info('No movies found in programs, will fallback to TMDb');
        return null; // Indicar que necesitamos fallback
      }),
      // Si el resultado es null, hacer fallback a TMDb
      switchMap(result => {
        if (result !== null) {
          return of(result);
        }
        
        this.logger.info('Falling back to TMDb for featured movies');
        return this.getFeaturedMoviesFromTMDb();
      }),
      catchError(error => {
        this.logger.error('Error in hybrid featured movies strategy', error);
        // En caso de error, intentar TMDb como último recurso
        return this.getFeaturedMoviesFromTMDb();
      })
    );
  }

  /**
   * Limpia cache de películas destacadas
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Featured movies cache cleared');
  }
}