/**
 * Provider para películas desde TMDb API
 * Ubicación: src/app/services/providers/tmdb-movie.provider.ts
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  IMovieProvider, 
  IFeaturedMovie, 
  ICacheManager, 
  ILogger, 
  CacheKeys 
} from '../../interfaces';
import { AppConfigurationService } from '../core/config.service';

@Injectable({
  providedIn: 'root'
})
export class TMDbMovieProvider implements IMovieProvider {
  private readonly baseUrl: string;
  private readonly headers: HttpHeaders;

  constructor(
    private http: HttpClient,
    private cache: ICacheManager<IFeaturedMovie[]>,
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

  getPopularMovies(): Observable<IFeaturedMovie[]> {
    const cacheKey = CacheKeys.FEATURED_MOVIES;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      this.logger.info('Using cached popular movies', { count: cached.length });
      return of(cached);
    }

    this.logger.info('Fetching popular movies from TMDb');
    
    const language = this.configService.getApiConfig().tmdb.language;
    
    return this.http.get<any>(`${this.baseUrl}/movie/popular?language=${language}&page=1`, {
      headers: this.headers
    }).pipe(
      map(response => this.transformTMDbMovies(response.results || [])),
      tap(movies => {
        this.cache.set(cacheKey, movies);
        this.logger.info('Popular movies cached', { count: movies.length });
      }),
      catchError(error => {
        this.logger.error('Failed to fetch popular movies from TMDb', error);
        return of([]);
      })
    );
  }

  searchMovie(title: string): Observable<any> {
    if (!title?.trim()) {
      this.logger.warn('Empty title provided for movie search');
      return of({ results: [] });
    }

    const language = this.configService.getApiConfig().tmdb.language;
    const url = `${this.baseUrl}/search/movie?language=${language}&query=${encodeURIComponent(title.trim())}&page=1&include_adult=false`;
    
    this.logger.debug(`Searching movie: "${title}"`);
    
    return this.http.get(url, { headers: this.headers }).pipe(
      tap(() => this.logger.debug(`Movie search completed for: "${title}"`)),
      catchError(error => {
        this.logger.error(`Failed to search movie: "${title}"`, error);
        return of({ results: [] });
      })
    );
  }

  getMovieDetails(id: string): Observable<any> {
    if (!id?.trim()) {
      this.logger.warn('Empty ID provided for movie details');
      return of({});
    }

    const language = this.configService.getApiConfig().tmdb.language;
    const url = `${this.baseUrl}/movie/${id}?language=${language}`;
    
    this.logger.debug(`Fetching movie details for ID: ${id}`);
    
    return this.http.get(url, { headers: this.headers }).pipe(
      tap(() => this.logger.debug(`Movie details fetched for ID: ${id}`)),
      catchError(error => {
        this.logger.error(`Failed to fetch movie details for ID: ${id}`, error);
        return of({});
      })
    );
  }

  private transformTMDbMovies(movies: any[]): IFeaturedMovie[] {
    if (!Array.isArray(movies)) {
      this.logger.warn('Invalid movies data received from TMDb', movies);
      return [];
    }

    const maxMovies = this.configService.getUIConfig().maxFeaturedMovies;
    
    return movies.slice(0, maxMovies).map((movie, index) => ({
      id: movie.id?.toString() || `tmdb_${index}`,
      title: movie.title || 'Sin título',
      description: movie.overview || 'Sin descripción disponible',
      poster: movie.poster_path ? 
        `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      rating: movie.vote_average || null,
      tmdbId: movie.id,
      releaseDate: movie.release_date,
      isFallback: true
    }));
  }
}