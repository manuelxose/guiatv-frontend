/**
 * Provider para extracción de posters desde TMDb API
 * Ubicación: src/app/services/providers/tmdb-poster.provider.ts
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { 
  IPosterProvider, 
  ITvProgram, 
  ICacheManager, 
  ILogger 
} from '../../interfaces';
import { AppConfigurationService } from '../core/config.service';

interface TMDbSearchResponse {
  results: Array<{
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    overview: string;
  }>;
}

interface PosterResult {
  posterUrl: string;
  movieData?: {
    tmdbId: number;
    rating: number;
    description: string;
    releaseDate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TMDbPosterProvider implements IPosterProvider {
  private readonly baseUrl: string;
  private readonly headers: HttpHeaders;
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  private readonly defaultPoster = 'assets/images/default-movie-poster.svg';
  private readonly cachePrefix = 'poster_';
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 horas
  
  // Estado de conectividad
  private isNetworkAvailable = true;
  private consecutiveFailures = 0;
  private readonly maxConsecutiveFailures = 3;
  private readonly networkRetryDelay = 30000; // 30 segundos

  constructor(
    private http: HttpClient,
    private cache: ICacheManager<string>,
    private logger: ILogger,
    private configService: AppConfigurationService
  ) {
    const apiConfig = this.configService.getApiConfig().tmdb;
    this.baseUrl = apiConfig.baseUrl;
    this.headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': apiConfig.apiKey
    });
  }

  /**
   * Extrae poster por título y año de película (método requerido por interfaz)
   */
  extractPoster(movieTitle: string, year?: string): Observable<string> {
    return this.extractPosterWithData(movieTitle, year).pipe(
      map(result => result.posterUrl)
    );
  }

  /**
   * Extrae poster y datos de película por título y año
   */
  extractPosterWithData(movieTitle: string, year?: string): Observable<PosterResult> {
    if (!movieTitle?.trim()) {
      this.logger.warn('Empty movie title provided for poster extraction');
      return of({
        posterUrl: this.getDefaultPoster()
      });
    }

    const cacheKey = this.generateCacheKey(movieTitle, year);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      this.logger.debug(`Using cached poster for: "${movieTitle}"`);
      return of({
        posterUrl: cached
      });
    }

    // Verificar estado de red antes de hacer la llamada
    if (!this.isNetworkAvailable) {
      this.logger.warn(`Network unavailable for "${movieTitle}", using default poster`);
      return of({
        posterUrl: this.getDefaultPoster()
      });
    }

    this.logger.debug(`Searching poster and data for movie: "${movieTitle}" (${year || 'no year'})`);

    return this.searchMoviePosterAndData(movieTitle, year).pipe(
      map(result => {
        // Resetear contador de fallos en caso de éxito
        this.consecutiveFailures = 0;
        this.isNetworkAvailable = true;
        
        // Cachear resultado por 24 horas
        this.cache.set(cacheKey, result.posterUrl, this.cacheTTL);
        
        this.logger.debug(`Movie data found for "${movieTitle}": ${result.posterUrl !== this.getDefaultPoster() ? 'TMDb' : 'default'}`);
        return result;
      }),
      catchError(error => {
        this.handleNetworkError(error, movieTitle);
        
        return of({
          posterUrl: this.getDefaultPoster()
        });
      }),
      timeout(10000) // Timeout de 10 segundos
    );
  }

  /**
   * Extrae poster desde un programa de TV
   */
  extractPosterFromProgram(program: ITvProgram): Observable<string> {
    const title = this.extractMovieTitle(program);
    const year = this.extractMovieYear(program);

    if (!title) {
      this.logger.warn('No title found in program for poster extraction', {
        programId: program.id,
        originalTitle: program.title
      });
      return of(this.getFallbackPoster(program));
    }

    this.logger.info('Extracting poster for program:', {
      id: program.id,
      title: title,
      channel: program.channel?.name,
      category: program.category?.value,
      year: year,
      rating: program.starRating,
      startTime: this.formatTime(program.start)
    });

    return this.extractPoster(title, year).pipe(
      catchError(error => {
        this.logger.warn(`Failed to extract poster for program "${title}", using fallback`, error);
        return of(this.getFallbackPoster(program));
      })
    );
  }

  /**
   * Extrae poster y datos de película desde un programa de TV (método optimizado)
   */
  extractPosterAndDataFromProgram(program: ITvProgram): Observable<PosterResult & { originalProgram: ITvProgram }> {
    const title = this.extractMovieTitle(program);
    const year = this.extractMovieYear(program);

    if (!title) {
      return of({
        posterUrl: this.getFallbackPoster(program),
        originalProgram: program
      });
    }

    return this.extractPosterWithData(title, year).pipe(
      map(result => ({
        ...result,
        originalProgram: program
      })),
      catchError(error => {
        this.logger.warn(`Failed to extract poster and data for program "${title}"`);
        return of({
          posterUrl: this.getFallbackPoster(program),
          originalProgram: program
        });
      })
    );
  }

  /**
   * Retorna el poster por defecto
   */
  getDefaultPoster(): string {
    return this.defaultPoster;
  }

  /**
   * Busca poster y datos en TMDb
   */
  private searchMoviePosterAndData(title: string, year?: string): Observable<PosterResult> {
    const language = this.configService.getApiConfig().tmdb.language;
    let query = encodeURIComponent(title.trim());
    
    // Añadir año a la búsqueda si está disponible
    if (year) {
      query += `&year=${year}`;
    }

    const url = `${this.baseUrl}/search/movie?language=${language}&query=${query}&page=1&include_adult=false`;

    return this.http.get<TMDbSearchResponse>(url, { headers: this.headers }).pipe(
      map(response => {
        if (!response?.results?.length) {
          return {
            posterUrl: this.getDefaultPoster()
          };
        }

        // Buscar la mejor coincidencia
        const bestMatch = this.findBestMatch(response.results, title, year);
        
        if (bestMatch) {
          const result: PosterResult = {
            posterUrl: bestMatch.poster_path ? 
              `${this.imageBaseUrl}${bestMatch.poster_path}` : 
              this.getDefaultPoster()
          };

          // Agregar datos adicionales si están disponibles
          if (bestMatch.poster_path) {
            result.movieData = {
              tmdbId: bestMatch.id,
              rating: bestMatch.vote_average,
              description: bestMatch.overview || '',
              releaseDate: bestMatch.release_date || ''
            };
          }

          return result;
        }

        return {
          posterUrl: this.getDefaultPoster()
        };
      }),
      catchError(error => {
        // Solo loggear errores detallados si es el primer fallo
        if (this.consecutiveFailures === 0) {
          this.logger.error(`🔍 TMDb API error searching "${title}":`, error);
        } else {
          this.logger.debug(`TMDb API error for "${title}" (failure ${this.consecutiveFailures + 1})`);
        }
        
        return of({
          posterUrl: this.getDefaultPoster()
        });
      })
    );
  }

  /**
   * Busca poster en TMDb (método legacy)
   */
  private searchMoviePoster(title: string, year?: string): Observable<string> {
    return this.searchMoviePosterAndData(title, year).pipe(
      map(result => result.posterUrl)
    );
  }

  /**
   * Verifica si el error es relacionado con SSL/Red
   */
  private isSSLError(error: any): boolean {
    return error?.error?.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
           error?.message?.includes('certificate') ||
           error?.message?.includes('SSL') ||
           error?.message?.includes('TLS') ||
           error?.status === 0;
  }

  /**
   * Encuentra la mejor coincidencia de película
   */
  private findBestMatch(results: TMDbSearchResponse['results'], searchTitle: string, searchYear?: string): TMDbSearchResponse['results'][0] | null {
    if (!results.length) return null;

    // Si hay año, priorizar coincidencias por año
    if (searchYear) {
      const yearMatches = results.filter(movie => {
        const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '';
        return movieYear === searchYear;
      });

      if (yearMatches.length > 0) {
        // Ordenar por rating y tomar el mejor
        return yearMatches.sort((a, b) => b.vote_average - a.vote_average)[0];
      }
    }

    // Búsqueda por similitud de título
    const titleLower = searchTitle.toLowerCase();
    const exactMatches = results.filter(movie => 
      movie.title.toLowerCase() === titleLower
    );

    if (exactMatches.length > 0) {
      return exactMatches.sort((a, b) => b.vote_average - a.vote_average)[0];
    }

    // Tomar la primera con mejor rating
    return results.sort((a, b) => b.vote_average - a.vote_average)[0];
  }

  /**
   * Extrae el título de la película del programa
   */
  private extractMovieTitle(program: ITvProgram): string {
    if (typeof program.title === 'string') {
      return program.title.trim();
    }
    
    return program.title?.value?.trim() || '';
  }

  /**
   * Extrae el año de la película del programa
   */
  private extractMovieYear(program: ITvProgram): string | undefined {
    // Intentar obtener año del desc
    const year = (program.desc as any)?.year;
    
    if (year && /^\d{4}$/.test(year.toString())) {
      return year.toString();
    }

    // Intentar extraer año del título o descripción
    const titleYear = this.extractYearFromText(this.extractMovieTitle(program));
    if (titleYear) return titleYear;

    const descYear = this.extractYearFromText(program.desc?.details || '');
    if (descYear) return descYear;

    return undefined;
  }

  /**
   * Extrae año de un texto usando regex
   */
  private extractYearFromText(text: string): string | undefined {
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : undefined;
  }

  /**
   * Obtiene poster de fallback (icono del canal)
   */
  private getFallbackPoster(program: ITvProgram): string {
    return program.channel?.icon || this.getDefaultPoster();
  }

  /**
   * Genera clave única para cache
   */
  private generateCacheKey(title: string, year?: string): string {
    const key = `${title.toLowerCase().replace(/\s+/g, '_')}${year ? `_${year}` : ''}`;
    return `${this.cachePrefix}${key}`;
  }

  /**
   * Formatea tiempo para logging
   */
  private formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'hora desconocida';
    }
  }

  /**
   * Maneja errores de red de manera inteligente
   */
  private handleNetworkError(error: any, movieTitle: string): void {
    this.consecutiveFailures++;
    
    if (this.isSSLError(error)) {
      this.logger.warn(`🔒 SSL/Network error for "${movieTitle}" (failure ${this.consecutiveFailures}/${this.maxConsecutiveFailures})`);
      
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.isNetworkAvailable = false;
        this.logger.warn(`🚫 Network marked as unavailable after ${this.consecutiveFailures} consecutive failures. Retrying in ${this.networkRetryDelay/1000} seconds.`);
        
        // Programar reconexión automática
        setTimeout(() => {
          this.logger.info('🔄 Attempting to restore network connectivity...');
          this.isNetworkAvailable = true;
          this.consecutiveFailures = 0;
        }, this.networkRetryDelay);
      }
    } else {
      this.logger.warn(`❌ API error for "${movieTitle}":`, error.message || error);
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  public isServiceAvailable(): boolean {
    return this.isNetworkAvailable && this.consecutiveFailures < this.maxConsecutiveFailures;
  }

  /**
   * Fuerza reconexión de red
   */
  public forceReconnect(): void {
    this.logger.info('🔄 Forcing network reconnection...');
    this.isNetworkAvailable = true;
    this.consecutiveFailures = 0;
  }
}
