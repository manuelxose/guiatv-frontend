/**
 * RightSidebarComponent - VERSIÓN COMPLETA CORREGIDA
 * Ubicación: src/app/components/right-sidebar/right-sidebar.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';

// NUEVO: Usar HomeDataService en lugar de TvGuideService
import { HomeDataService } from 'src/app/services/features/home-data.service';
import { IFeaturedMovie } from 'src/app/interfaces';
import { environment } from 'src/environments/environment';

// ===============================================
// INTERFACES ESPECÍFICAS PARA SIDEBAR
// ===============================================

interface ISidebarItem {
  id?: string;
  title: { value: string };
  category: { value: string };
  icon: string;
  starRating: string | number;
}

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, AutocompleteComponent],
})
export class RightSidebarComponent implements OnInit {
  
  // ===============================================
  // DEPENDENCY INJECTION
  // ===============================================
  
  private readonly homeDataService = inject(HomeDataService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ===============================================
  // COMPONENT STATE - SIGNALS CORREGIDOS
  // ===============================================
  
  public readonly popular_movies = signal<ISidebarItem[]>([]);
  public readonly popular_series = signal<ISidebarItem[]>([]);
  public readonly isLoading = signal<boolean>(true);

  // ===============================================
  // LIFECYCLE METHODS
  // ===============================================

  ngOnInit(): void {
    console.log('🔧 RIGHT-SIDEBAR - Initializing with corrected SOLID system');
    this.initializeDataStreams();
  }

  // ===============================================
  // DATA INITIALIZATION
  // ===============================================

  /**
   * Inicializar streams de datos desde HomeDataService
   */
  private initializeDataStreams(): void {
    console.log('📡 RIGHT-SIDEBAR - Setting up data streams');

    // Stream de películas populares
    this.homeDataService.popularMovies$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(movies => {
        console.log('🎬 RIGHT-SIDEBAR - Popular movies received:', movies.length);
        
        if (movies && movies.length > 0) {
          // Convertir al formato que espera el template
          const convertedMovies = this.convertToSidebarFormat(movies, 'movie');
          this.popular_movies.set(convertedMovies);
          this.isLoading.set(false);
          
          console.log('✅ RIGHT-SIDEBAR - Movies converted and set:', convertedMovies.length);
        } else {
          console.log('⚠️ RIGHT-SIDEBAR - No movies received, keeping loading state');
        }
      });

    // Stream de series (simuladas desde películas por ahora)
    this.homeDataService.popularMovies$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(movies => {
        if (movies && movies.length > 0) {
          // Simular series para mantener funcionalidad
          const convertedSeries = this.convertToSidebarFormat(movies, 'series');
          this.popular_series.set(convertedSeries);
          
          console.log('📺 RIGHT-SIDEBAR - Series simulated and set:', convertedSeries.length);
        }
      });

    // Stream de estado de carga
    this.homeDataService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => {
        if (!loading && this.popular_movies().length === 0) {
          // Si ya no está cargando pero no hay películas, mantener estado de carga local
          setTimeout(() => {
            if (this.popular_movies().length === 0) {
              console.log('⏰ RIGHT-SIDEBAR - Loading timeout, no movies available');
              this.isLoading.set(false);
            }
          }, 2000);
        }
      });
  }

  // ===============================================
  // DATA CONVERSION METHODS
  // ===============================================

  /**
   * Convierte IFeaturedMovie al formato que espera el template del sidebar
   */
  private convertToSidebarFormat(movies: IFeaturedMovie[], type: 'movie' | 'series'): ISidebarItem[] {
    const maxItems = 4;
    
    return movies.slice(0, maxItems).map((movie, index) => {
      const baseTitle = movie.title || `${type === 'movie' ? 'Película' : 'Serie'} ${index + 1}`;
      
      return {
        id: movie.id || `${type}_${index}`,
        title: { 
          value: type === 'series' ? `${baseTitle} (Serie)` : baseTitle 
        },
        category: { 
          value: type === 'series' ? 'Series,Drama' : 'Cine,Drama' 
        },
        icon: this.getValidImageUrl(movie, index),
        starRating: this.normalizeRating(movie.rating)
      };
    });
  }

  /**
   * Normaliza el rating a un formato consistente
   */
  private normalizeRating(rating: any): string {
    if (!rating) return '6.0';
    
    if (typeof rating === 'number') {
      return rating.toFixed(1);
    }
    
    if (typeof rating === 'string') {
      // Si ya tiene formato "/10", extraer solo el número
      if (rating.includes('/10')) {
        const parts = rating.split('/10');
        return parts[0] || '6.0';
      }
      
      // Si es string número
      const numRating = parseFloat(rating);
      if (!isNaN(numRating)) {
        return numRating.toFixed(1);
      }
    }
    
    return '6.0';
  }

  /**
   * Obtiene URL de poster por defecto
   */
  private getDefaultPosterUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNGE1NTY4Ii8+CjxwYXRoIGQ9Ik00NS41IDk1TDYwIDgwVjEyMEw0NS41IDEwNVpNNzUgODBMMTA0LjUgOTVMNzUgMTEwVjgwWiIgZmlsbD0iI2ZmZmZmZiIvPgo8L3N2Zz4K';
  }

  /**
   * NUEVO: Obtiene una imagen válida, evitando llamadas externas innecesarias
   */
  private getValidImageUrl(movie: IFeaturedMovie, index: number): string {
    // Array de imágenes estáticas para usar como fallback
    const staticImages = [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNkYzI2MjYiLz48cGF0aCBkPSJNNjAgNzBMMTAwIDk1TDYwIDEyMFY3MFpNNzUgNDBIODVWNjBINzVWNDBaTTc1IDE0MEg4NVYxNjBINzVWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNTk1MjEiLz48cGF0aCBkPSJNNTUgNzBMMTAzIDk1TDU1IDEyMFY3MFpNNzIgNDBIODJWNjBINzJWNDBaTTcyIDE0MEg4MlYxNjBINzJWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM4YjVjZjYiLz48cGF0aCBkPSJNNTggNzBMMTAxIDk1TDU4IDEyMFY3MFpNNzQgNDBIODRWNjBINzRWNDBaTTc0IDE0MEg4NFYxNjBINzRWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo='
    ];
    
    // Si hay poster válido de TMDb o similar, intentar usarlo
    if (movie.poster && this.isValidImageUrl(movie.poster)) {
      return movie.poster;
    }
    
    // Usar imagen estática basada en el índice
    return staticImages[index % staticImages.length];
  }

  /**
   * Verifica si una URL es válida y no es un placeholder
   */
  private isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    // Evitar placeholders conocidos
    if (url.includes('placeholder.com') || 
        url.includes('via.placeholder') || 
        url.includes('placehold')) {
      return false;
    }
    
    // Verificar que es una URL válida
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ===============================================
  // NAVIGATION METHODS
  // ===============================================

  /**
   * Navegar a detalles de una película/serie
   */
  public navigateTo(item: ISidebarItem): void {
    console.log('🔗 RIGHT-SIDEBAR - Navigating to details:', item.title.value);
    
    const slug = item.title.value.replace(/\s/g, '-').toLowerCase();
    this.router.navigate(['programacion-tv/detalles', slug]);
  }

  /**
   * Navegar a listas de películas o series
   */
  public navigateTo2(type: string): void {
    console.log('🔗 RIGHT-SIDEBAR - Navigating to list:', type);
    
    if (type === 'movie') {
      this.router.navigate(['programacion-tv/peliculas']);
    } else if (type === 'serie') {
      this.router.navigate(['programacion-tv/series']);
    }
  }

  // ===============================================
  // TEMPLATE HELPER METHODS
  // ===============================================

  /**
   * Obtiene la URL de imagen para una película
   */
  public getMovieImageUrl(movie: ISidebarItem): string {
    // Buscar en diferentes propiedades posibles para el poster
    if (movie.icon && !movie.icon.includes('picons_dobleM')) {
      return movie.icon; // Es un poster real, no un logo de canal
    }
    
    // Si no hay poster válido, usar imagen por defecto
    return this.getDefaultPosterUrl();
  }

  /**
   * Obtiene la URL de imagen para una serie
   */
  public getSerieImageUrl(serie: ISidebarItem): string {
    return serie.icon || this.getDefaultPosterUrl();
  }

  /**
   * Obtiene la categoría de una película
   */
  public getMovieCategory(movie: ISidebarItem): string {
    if (movie.category?.value) {
      const parts = movie.category.value.split(',');
      return parts[1]?.trim() || parts[0]?.trim() || 'Drama';
    }
    return 'Drama';
  }

  /**
   * Obtiene la categoría de una serie
   */
  public getSerieCategory(serie: ISidebarItem): string {
    if (serie.category?.value) {
      const parts = serie.category.value.split(',');
      return parts[1]?.trim() || parts[0]?.trim() || 'Drama';
    }
    return 'Drama';
  }

  /**
   * Formatea el rating para mostrar
   */
  public formatRating(rating: any): string {
    if (!rating) return 'N/A';
    
    // Normalizar el rating primero
    const normalizedRating = this.normalizeRating(rating);
    
    // Agregar /10 si no lo tiene
    if (!normalizedRating.includes('/10')) {
      return `${normalizedRating}/10`;
    }
    
    return normalizedRating;
  }

  /**
   * Maneja errores de carga de imágenes
   */
  public onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.getDefaultPosterUrl();
  }

  /**
   * Verifica si está en modo debug
   */
  public isDebugMode(): boolean {
    return !environment.production;
  }

  // ===============================================
  // TRACK BY FUNCTIONS
  // ===============================================

  /**
   * Track by function para películas
   */
  public trackByMovieId(index: number, movie: ISidebarItem): string {
    return movie.id || movie.title?.value || index.toString();
  }

  /**
   * Track by function para series
   */
  public trackBySerieId(index: number, serie: ISidebarItem): string {
    return serie.id || serie.title?.value || index.toString();
  }

  // ===============================================
  // DEBUG METHODS
  // ===============================================

  /**
   * Debug del estado del componente
   */
  public debugState(): void {
    console.log('🔍 RIGHT-SIDEBAR - Component state:');
    console.table({
      'Popular Movies': this.popular_movies().length,
      'Popular Series': this.popular_series().length,
      'Is Loading': this.isLoading()
    });
    
    console.log('Movies data:', this.popular_movies());
    console.log('Series data:', this.popular_series());
    
    // Debug del servicio también
    const serviceState = this.homeDataService.getCurrentState();
    console.log('Service state:', {
      featuredMovie: serviceState.featuredMovie?.title || 'none',
      popularMovies: serviceState.popularMovies.length,
      isLoading: serviceState.isLoading
    });
  }

  /**
   * Fuerza la recarga de datos
   */
  public forceReload(): void {
    console.log('🔄 RIGHT-SIDEBAR - Forcing data reload');
    this.isLoading.set(true);
    this.popular_movies.set([]);
    this.popular_series.set([]);
    
    // Trigger refresh desde el servicio
    this.homeDataService.refreshData().subscribe(result => {
      console.log('🔄 RIGHT-SIDEBAR - Refresh result:', result.success);
    });
  }
}