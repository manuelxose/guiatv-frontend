/**
 * HomeComponent refactorizado con principios SOLID - Migrado a nueva capa de servicios
 * Ubicación: src/app/pages/home/home.component.ts
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

// Components
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { ProgramListComponent } from 'src/app/components/program-list/program-list.component';
import { BannerComponent } from 'src/app/components/banner/banner.component';

// Services and Interfaces
import { MetaService } from 'src/app/services/meta.service';
import { TvDataService } from 'src/app/state/tv-data.service';
import { ContentService, ContentItem } from 'src/app/state/content.service';
import { CategoryFilterService } from 'src/app/services/program-list/category-filter.service';
import {
  IFeaturedMovie,
  ITvProgram,
  IDayChangedEvent,
} from 'src/app/interfaces';
import { ConsoleLoggerService } from 'src/app/services/core/logger.service';
import { DeviceDetectorService } from 'src/app/services/device-detector.service';

const DEFAULT_CHANNEL_TYPES = ['TDT', 'CABLE', 'MOVISTAR', 'AUTONOMICO', 'OTT'];

/**
 * HomeComponent - REFACTORIZADO CON NUEVA CAPA DE SERVICIOS
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NavBarComponent,
    ProgramListComponent,
    BannerComponent,
  ],
})
export class HomeComponent implements OnInit {
  // ===============================================
  // DEPENDENCY INJECTION - NUEVA ARQUITECTURA
  // ===============================================
  public readonly deviceDetector = inject(DeviceDetectorService);

  private readonly destroyRef = inject(DestroyRef);
  private readonly metaService = inject(MetaService);
  private readonly tvDataService = inject(TvDataService);
  private readonly contentService = inject(ContentService);
  private readonly categoryFilterService = inject(CategoryFilterService);
  private readonly logger = inject(ConsoleLoggerService);

  // ===============================================
  // COMPONENT STATE - REACTIVE SIGNALS
  // ===============================================

  // Datos principales - se sincronizan con los servicios
  public readonly programs = signal<any[]>([]);
  public readonly featuredMovie = signal<IFeaturedMovie | null>(null);
  public readonly popularMovies = signal<IFeaturedMovie[]>([]);

  // Estados de UI
  public readonly isLoading = signal<boolean>(true);
  public readonly error = signal<string | null>(null);

  // Categorías gestionadas por el servicio dedicado
  public readonly selectedCategory = computed(() =>
    this.categoryFilterService.getSelectedCategory()
  );

  // ===============================================
  // COMPUTED PROPERTIES - DERIVED STATE
  // ===============================================

  public readonly hasData = computed(() => this.programs().length > 0);
  public readonly hasFeaturedMovie = computed(
    () => this.featuredMovie() !== null
  );
  public readonly hasError = computed(() => this.error() !== null);

  // Estado combinado para la UI
  public readonly uiState = computed(() => ({
    isLoading: this.isLoading(),
    hasFeaturedMovie: this.hasFeaturedMovie(),
    hasError: this.hasError(),
    showContent: !this.isLoading() && this.hasData() && !this.hasError(),
    showError: !this.isLoading() && this.hasError(),
    showEmpty: !this.isLoading() && !this.hasData() && !this.hasError(),
  }));

  // ===============================================
  // LIFECYCLE METHODS
  // ===============================================

  ngOnInit(): void {
    this.logger.info('HomeComponent initializing with new service layer');

    this.setupMetaTags();
    this.initializeDataStreams();
    // NOTE: Data loading removed - ProgramListComponent handles initial load

    // Exponer métodos de debug en desarrollo
    if (!this.isProduction()) {
      this.exposeDebugMethods();

      // Verificar consistencia después de la inicialización
      setTimeout(() => {
        this.checkDataConsistency();
      }, 3000);
    }
  }

  // ===============================================
  // INITIALIZATION METHODS - SINGLE RESPONSIBILITY
  // ===============================================

  /**
   * Configura los meta tags SEO
   */
  private setupMetaTags(): void {
    this.metaService.setMetaTags({
      title: 'Guía TV - Programación de Televisión Actual',
      description:
        'Descubre qué ver en TV hoy. Guía completa de programación televisiva con horarios actualizados.',
      canonicalUrl: '/',
    });
  }

  /**
   * Inicializa los streams de datos reactivos usando nueva arquitectura
   */
  private initializeDataStreams(): void {
    this.logger.debug('Initializing reactive data streams from TvDataService and ContentService');

    // Stream de programas desde /layouts (snapshot completo por canal)
    this.tvDataService.layouts$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((layoutsResp) => {
          const channelEntries = layoutsResp?.channels ?? [];
          return channelEntries.flatMap((entry: any) => {
            const channelMeta = entry?.channel || { id: '', name: '', icon: '' };
            const channelPrograms = entry?.programs ?? [];
            return channelPrograms.map((prog: any) => ({
              ...prog,
              channel_id: prog.channelId || channelMeta.id || '',
              channel: prog.channel || channelMeta,
            }));
          });
        })
      )
      .subscribe((programs) => {
        this.logger.debug(`Programs updated: ${programs.length} items`);
        this.programs.set(programs);

        // Actualizar programas en el servicio de categorías
        this.categoryFilterService.updatePrograms(programs);

        // Loading completo cuando llegan programas
        if (programs.length > 0) {
          this.isLoading.set(false);
        }
      });

    // Stream de película destacada desde ContentService
    this.contentService
      .loadContent('movies', 'today')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((snapshot) => this.convertContentItemToFeaturedMovie(snapshot.featured))
      )
      .subscribe((movie) => {
        this.logger.debug(`Featured movie updated: ${movie?.title || 'none'}`);
        this.featuredMovie.set(movie);
      });

    // Stream de películas populares desde ContentService
    this.contentService
      .loadContent('movies', 'today')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((snapshot) =>
          snapshot.items
            .slice(0, 10)
            .map((item) => this.convertContentItemToFeaturedMovie(item))
            .filter((m): m is IFeaturedMovie => m !== null)
        )
      )
      .subscribe((movies) => {
        this.logger.debug(`Popular movies updated: ${movies.length} items`);
        this.popularMovies.set(movies);
      });
  }

  // REMOVED: initializeData() - ProgramListComponent now handles all data loading
  // Data is consumed via tvDataService.programs$ stream subscription in initializeDataStreams()

  // ===============================================
  // EVENT HANDLERS
  // ===============================================

  /**
   * Maneja el cambio de día en la programación
   */
  public onDayChanged(event: IDayChangedEvent): void {
    const { dayIndex, dayInfo } = event;

    this.logger.info(
      `Day changed: index ${dayIndex}, day: ${dayInfo.diaSemana} ${dayInfo.diaNumero}`
    );

    // Actualizar el título de la página según el día seleccionado
    if (dayIndex === 0) {
      this.updatePageTitle('Guía TV - Programación de Hoy');
    } else if (dayIndex === 1) {
      this.updatePageTitle(
        `Guía TV - Programación de Mañana (${dayInfo.diaSemana} ${dayInfo.diaNumero})`
      );
    } else {
      this.updatePageTitle(
        `Guía TV - Programación ${dayInfo.diaSemana} ${dayInfo.diaNumero}`
      );
    }

    // NOTE: Day change is handled by ProgramListComponent's facade
    // No need to reload data here - the facade will update the shared stream
    this.logger.info(`Day change event propagated to ProgramListComponent`);
  }

  public onMovieSelected(movie: any): void {
    this.logger.info(`Movie selected: ${movie.title}`);
    // Aquí se podría navegar a detalles o abrir modal
  }

  /**
   * Maneja el reintentar en caso de error
   */
  public onRetry(): void {
    this.logger.info('Retry requested by user');
    this.error.set(null);
    // NOTE: Data loading is handled by ProgramListComponent
    this.logger.info('Error cleared, ProgramListComponent will handle reload');
  }

  /**
   * Maneja la recarga manual de datos
   */
  public onRefresh(): void {
    this.logger.info('Manual refresh requested');
    // NOTE: Data loading is handled by ProgramListComponent
    this.logger.info('Refresh request logged, ProgramListComponent manages data');
  }

  // ===============================================
  // UTILITY METHODS - PURE FUNCTIONS
  // ===============================================

  /**
   * Formatea el tiempo de un programa
   */
  public formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      this.logger.warn(`Invalid date string: ${dateString}`);
      return 'N/A';
    }
  }

  /**
   * Formatea el rating para mostrar
   */
  public formatRating(rating: number | string | null): string {
    if (!rating) return 'N/A';

    if (typeof rating === 'string') {
      if (rating.includes('/10') || rating.includes('/')) {
        return rating;
      }
      const numRating = parseFloat(rating);
      if (!isNaN(numRating)) {
        return `${numRating.toFixed(1)}`;
      }
      return rating;
    }

    if (typeof rating === 'number') {
      return `${rating.toFixed(1)}`;
    }

    return 'N/A';
  }

  /**
   * Track by function para optimizar rendering
   */
  public trackByMovieId(index: number, movie: IFeaturedMovie): string {
    return movie.id;
  }

  /**
   * Track by function para programas
   */
  public trackByProgramId(index: number, program: ITvProgram): string {
    return program.id;
  }

  // ===============================================
  // TEMPLATE HELPER METHODS
  // ===============================================

  /**
   * Convierte la película destacada al formato que espera el Banner
   */
  public getBannerData(): any {
    const featured = this.featuredMovie();
    if (!featured) return null;

    return {
      title: { value: featured.title },
      channel: featured.channelName || 'Canal desconocido',
      channelName: featured.channelName,
      icon: featured.poster || 'assets/images/default-movie-poster.svg',
      poster: featured.poster || 'assets/images/default-movie-poster.svg',
      start: featured.startTime || new Date().toISOString(),
      stop:
        featured.endTime ||
        new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      startTime: featured.startTime,
      endTime: featured.endTime,
      desc: {
        details:
          featured.description ||
          'Película destacada de la programación actual.',
        year: featured.releaseDate,
        rate: 'TP',
      },
      description: featured.description,
      year: featured.releaseDate,
      rating: featured.rating,
      starRating: featured.rating || '7.0',
      category: featured.category || 'Cine',
      id: featured.id,
    };
  }

  /**
   * Obtiene la URL del poster con fallback
   */
  public getPosterUrl(movie: IFeaturedMovie): string {
    return (
      movie.poster ||
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo='
    );
  }

  /**
   * Maneja errores de carga de posters
   */
  public onPosterError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=';
  }

  /**
   * Verifica si está en modo debug
   */
  public isDebugMode(): boolean {
    return !this.isProduction();
  }

  // ===============================================
  // HELPER METHODS
  // ===============================================

  /**
   * Actualizar título de página
   */
  private updatePageTitle(title: string): void {
    this.metaService.setMetaTags({
      title,
      description:
        'Descubre qué ver en TV. Guía completa de programación televisiva con horarios actualizados.',
      canonicalUrl: '/',
    });
  }

  /**
   * Verificar si es producción
   */
  private isProduction(): boolean {
    return false; // Por ahora siempre false para debug
  }

  /**
   * Convierte índice de día a alias de API
   */
  private getDayAlias(dayIndex: number): 'yesterday' | 'today' | 'tomorrow' | 'after_tomorrow' {
    switch (dayIndex) {
      case -1:
        return 'yesterday';
      case 0:
        return 'today';
      case 1:
        return 'tomorrow';
      case 2:
        return 'after_tomorrow';
      default:
        return 'today';
    }
  }

  /**
   * Convierte ContentItem a IFeaturedMovie para compatibilidad
   */
  private convertContentItemToFeaturedMovie(item: ContentItem | null): IFeaturedMovie | null {
    if (!item) return null;

    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      poster: item.image || '',
      rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating?.toString() || '0') || 0,
      category: item.category || '',
      channelName: item.channel?.name || '',
      startTime: item.start,
      endTime: item.end,
      releaseDate: '', // No disponible en ContentItem
    };
  }

  // ===============================================
  // DEBUG METHODS (solo en desarrollo)
  // ===============================================

  /**
   * Debug del estado actual del componente
   */
  public debugComponentState(): void {
    if (this.logger) {
      this.logger.debug('=== HOME COMPONENT STATE ===');
      this.logger.debug(`UI State:`, this.uiState());
      this.logger.debug(`Programs: ${this.programs().length}`);
      this.logger.debug(
        `Featured Movie: ${this.featuredMovie()?.title || 'none'}`
      );
      this.logger.debug(`Popular Movies: ${this.popularMovies().length}`);
      this.logger.debug('=== END COMPONENT STATE ===');
    }
  }

  /**
   * Método para forzar sincronización de datos
   */
  public forceSyncData(): void {
    this.logger.info('🔄 FORCE SYNC - Forcing data synchronization');
    // NOTE: Data loading is handled by ProgramListComponent
    this.logger.info('Sync request logged, ProgramListComponent manages data');
  }

  /**
   * Verificación de consistencia de datos
   */
  public checkDataConsistency(): void {
    const componentState = {
      programs: this.programs().length,
      featuredMovie: this.featuredMovie()?.title || 'none',
      popularMovies: this.popularMovies().length,
      isLoading: this.isLoading(),
      hasError: this.error() !== null,
    };

    console.log('🔍 DATA CONSISTENCY CHECK:');
    console.log('Component State:', componentState);

    // Detectar inconsistencias
    if (this.isLoading() && this.programs().length > 0) {
      console.warn(
        '🚨 INCONSISTENCY: Loading flag is true but component has programs'
      );
      this.isLoading.set(false);
    }

    if (!this.isLoading() && this.programs().length === 0 && !this.error()) {
      console.warn(
        '🚨 INCONSISTENCY: Not loading, no programs, no error - may need refresh'
      );
    }
  }

  /**
   * Expone métodos en consola para debugging manual
   */
  public exposeDebugMethods(): void {
    if (typeof window !== 'undefined') {
      (window as any).homeComponentDebug = {
        state: () => this.debugComponentState(),
        sync: () => this.forceSyncData(),
        check: () => this.checkDataConsistency(),
        refresh: () => this.onRefresh(),
        componentState: () => ({
          programs: this.programs().length,
          featuredMovie: this.featuredMovie()?.title,
          popularMovies: this.popularMovies().length,
          uiState: this.uiState(),
        }),
        testFormatRating: (value: any) => this.formatRating(value),
      };

      console.log('🛠️ DEBUG METHODS EXPOSED:');
      console.log('- homeComponentDebug.state() - Ver estado completo');
      console.log('- homeComponentDebug.sync() - Forzar sincronización');
      console.log('- homeComponentDebug.check() - Verificar consistencia');
      console.log('- homeComponentDebug.refresh() - Refrescar datos');
      console.log(
        '- homeComponentDebug.componentState() - Estado del componente'
      );
      console.log(
        '- homeComponentDebug.testFormatRating(value) - Probar formatRating'
      );
    }
  }

  // ===============================================
  // MÉTODOS PARA FILTRADO DE CATEGORÍAS
  // ===============================================

  /**
   * Maneja la selección de categorías desde el componente hijo
   */
  public onCategorySelected(categories: string[]): void {
    this.logger.info(
      `HomeComponent: Categorías seleccionadas: ${categories.join(', ')}`
    );

    if (categories.length === 0) {
      this.categoryFilterService.clearCategoryFilter();
      return;
    }

    // Por ahora, el CategoryFilterService maneja una sola categoría
    const primaryCategory = categories[0];
    this.categoryFilterService.selectCategory(primaryCategory);

    if (categories.length > 1) {
      this.logger.info(
        `HomeComponent: Múltiples categorías seleccionadas, usando como principal: ${primaryCategory}`
      );
    }
  }

  /**
   * Limpia el filtro de categoría
   */
  public clearCategoryFilter(): void {
    this.categoryFilterService.clearCategoryFilter();
    this.logger.info('HomeComponent: Filtro de categoría limpiado');
  }

  /**
   * Obtiene el número de programas de las categorías seleccionadas
   */
  public getCategoryProgramCount(): number {
    const category = this.selectedCategory();
    if (!category) return 0;

    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.totalPrograms;
  }

  /**
   * Obtiene el número de canales que tienen programas de las categorías seleccionadas
   */
  public getCategoryChannelCount(): number {
    const category = this.selectedCategory();
    if (!category) return 0;

    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.channelsCount;
  }

  /**
   * Obtiene el número de programas actualmente en emisión de las categorías seleccionadas
   */
  public getCurrentCategoryPrograms(): number {
    const category = this.selectedCategory();
    if (!category) return 0;

    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.currentlyAiring;
  }

  /**
   * Obtiene información del próximo programa de las categorías seleccionadas
   */
  public getNextCategoryProgram(): string {
    const category = this.selectedCategory();
    if (!category) return '0';

    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.nextProgramTime;
  }
}
