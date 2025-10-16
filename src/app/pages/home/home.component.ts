/**
 * HomeComponent refactorizado con principios SOLID - VERSIÓN COMPLETA CORREGIDA
 * Ubicación: src/app/pages/home/home.component.ts
 */

import { 
  Component, 
  OnInit, 
  ChangeDetectionStrategy, 
  signal, 
  computed,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Components
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';

// Services and Interfaces
import { MetaService } from 'src/app/services/meta.service';
import { HomeDataService } from 'src/app/services/features/home-data.service';
import { CategoryFilterService } from 'src/app/services/program-list/category-filter.service';
import { IFeaturedMovie, ITvProgram, ILogger, IDayChangedEvent } from 'src/app/interfaces';
import { ConsoleLoggerService } from 'src/app/services/core/logger.service';
import { ProgramListComponent } from 'src/app/components/program-list/program-list.component';
import { BannerComponent } from 'src/app/components/banner/banner.component';

/**
 * HomeComponent - REFACTORIZADO CON PRINCIPIOS SOLID
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NavBarComponent, ProgramListComponent, BannerComponent],
})
export class HomeComponent implements OnInit {
  
  // ===============================================
  // DEPENDENCY INJECTION - DEPENDENCY INVERSION PRINCIPLE
  // ===============================================
  
  private readonly destroyRef = inject(DestroyRef);
  private readonly metaService = inject(MetaService);
  private readonly homeDataService = inject(HomeDataService);
  private readonly categoryFilterService = inject(CategoryFilterService);
  private readonly router = inject(Router);
  private readonly logger = inject(ConsoleLoggerService);

  // ===============================================
  // COMPONENT STATE - REACTIVE SIGNALS
  // ===============================================

  // Datos principales - se sincronizan con el servicio
  public readonly programs = signal<ITvProgram[]>([]);
  public readonly featuredMovie = signal<IFeaturedMovie | null>(null);
  public readonly popularMovies = signal<IFeaturedMovie[]>([]);
  
  // Estados de UI
  public readonly isLoading = signal<boolean>(true);
  public readonly error = signal<string | null>(null);
  
  // Categorías gestionadas por el servicio dedicado
  public readonly selectedCategory = computed(() => this.categoryFilterService.getSelectedCategory());

  // ===============================================
  // COMPUTED PROPERTIES - DERIVED STATE
  // ===============================================

  public readonly hasData = computed(() => this.programs().length > 0);
  public readonly hasFeaturedMovie = computed(() => this.featuredMovie() !== null);
  public readonly hasError = computed(() => this.error() !== null);
  
  // Estado combinado para la UI
  public readonly uiState = computed(() => ({
    isLoading: this.isLoading(),
    hasData: this.hasData(),
    hasFeaturedMovie: this.hasFeaturedMovie(),
    hasError: this.hasError(),
    showContent: !this.isLoading() && this.hasData() && !this.hasError(),
    showError: !this.isLoading() && this.hasError(),
    showEmpty: !this.isLoading() && !this.hasData() && !this.hasError()
  }));

  // ===============================================
  // LIFECYCLE METHODS
  // ===============================================

  ngOnInit(): void {
    this.logger.info('HomeComponent initializing');
   
    this.setupMetaTags();
    this.initializeDataStreams();
    this.initializeData();
    
    // AÑADIDO: Exponer métodos de debug en desarrollo
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
   * Configura los meta tags SEO - responsabilidad específica
   */
  private setupMetaTags(): void {
    this.metaService.setMetaTags({
      title: 'Guía TV - Programación de Televisión Actual',
      description: 'Descubre qué ver en TV hoy. Guía completa de programación televisiva con horarios actualizados.',
      canonicalUrl: '/'
    });
  }

  /**
   * Inicializa los streams de datos reactivos - responsabilidad específica
   */
  private initializeDataStreams(): void {
    this.logger.debug('Initializing reactive data streams');

    // Stream de programas
    this.homeDataService.programs$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(programs => {
        this.logger.debug(`Programs updated: ${programs.length} items`);
        this.programs.set(programs);
        
        // Actualizar programas en el servicio de categorías
        this.categoryFilterService.updatePrograms(programs);
      });

    // Stream de película destacada
    this.homeDataService.featuredMovie$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(movie => {
        this.logger.debug(`Featured movie updated: ${movie?.title || 'none'}`);
        this.logger.debug(`Featured movie details:`, movie);
        this.featuredMovie.set(movie);
      });

    // Stream de películas populares
    this.homeDataService.popularMovies$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(movies => {
        this.logger.debug(`Popular movies updated: ${movies.length} items`);
        this.popularMovies.set(movies);
      });

    // Stream de estado de carga
    this.homeDataService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => {
        this.logger.debug(`Loading state: ${loading}`);
        this.isLoading.set(loading);
      });

    // Stream de errores
    this.homeDataService.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => {
        this.logger.debug(`Error state: ${error || 'none'}`);
        this.error.set(error);
      });
  }

  /**
   * Inicializa los datos del componente - delegación al servicio
   */
  private initializeData(): void {
    this.logger.info('Starting data initialization');

    this.homeDataService.initializeData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result.success) {
          this.logger.info('Home data initialization successful');
        } else {
          this.logger.error(`Home data initialization failed: ${result}`);
        }
      });
  }

  // ===============================================
  // EVENT HANDLERS - INTERFACE SEGREGATION (CORREGIDOS)
  // ===============================================

  /**
   * Maneja el cambio de día en la programación - CORREGIDO
   */
  public onDayChanged(event: IDayChangedEvent): void {
    const { dayIndex, dayInfo } = event;
    
    this.logger.info(`Day changed: index ${dayIndex}, day: ${dayInfo.diaSemana} ${dayInfo.diaNumero}`);
    
    // Actualizar el título de la página según el día seleccionado
    if (dayIndex === 0) {
      // Hoy
      this.updatePageTitle('Guía TV - Programación de Hoy');
    } else if (dayIndex === 1) {
      // Mañana
      this.updatePageTitle(`Guía TV - Programación de Mañana (${dayInfo.diaSemana} ${dayInfo.diaNumero})`);
    } else {
      // Pasado mañana
      this.updatePageTitle(`Guía TV - Programación ${dayInfo.diaSemana} ${dayInfo.diaNumero}`);
    }
  }

  /**
   * Maneja la selección de una película
   */
  public onMovieSelected(movie: any): void {
    this.logger.info(`Movie selected: ${movie.title}`);
    // Aquí se podría navegar a detalles o abrir modal
    // this.router.navigate(['/movie', movie.id]);
  }

  /**
   * Maneja el reintentar en caso de error
   */
  public onRetry(): void {
    this.logger.info('Retry requested by user');
    this.error.set(null);
    this.homeDataService.refreshData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result.success) {
          this.logger.error(`Retry failed: ${result}`);
        }
      });
  }

  /**
   * Maneja la recarga manual de datos
   */
  public onRefresh(): void {
    this.logger.info('Manual refresh requested');
    this.homeDataService.refreshData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result.success) {
          this.logger.info('Manual refresh completed');
        } else {
          this.logger.error(`Manual refresh failed: ${result}`);
        }
      });
  }

  // ===============================================
  // UTILITY METHODS - PURE FUNCTIONS (CORREGIDOS)
  // ===============================================

  /**
   * Formatea el tiempo de un programa
   */
  public formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      this.logger.warn(`Invalid date string: ${dateString}`);
      return 'N/A';
    }
  }

  /**
   * Formatea el rating para mostrar - CORREGIDO PARA STRINGS
   */
  public formatRating(rating: number | string | null): string {
    if (!rating) return 'N/A';
    
    // Si ya es una string con formato (ej: "6.0/10"), devolverla tal como está
    if (typeof rating === 'string') {
      // Si contiene "/10" o "/", devolverlo tal como está
      if (rating.includes('/10') || rating.includes('/')) {
        return rating;
      }
      // Si es una string pero solo número, convertir a número
      const numRating = parseFloat(rating);
      if (!isNaN(numRating)) {
        return `${numRating.toFixed(1)}`;
      }
      return rating; // Devolver la string original si no se puede procesar
    }
    
    // Si es número, formatear normalmente
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
  // TEMPLATE HELPER METHODS - NUEVOS MÉTODOS AGREGADOS
  // ===============================================

  /**
   * CORREGIDO: Convierte la película destacada al formato que espera el Banner
   */
  public getBannerData(): any {
    const featured = this.featuredMovie();
    if (!featured) return null;

    // Convertir del formato IFeaturedMovie al formato que espera BannerComponent
    return {
      title: { value: featured.title },
      channel: featured.channelName || 'Canal desconocido', // Usar el nombre real del canal
      channelName: featured.channelName,
      icon: featured.poster || 'assets/images/default-movie-poster.svg',
      poster: featured.poster || 'assets/images/default-movie-poster.svg',
      start: featured.startTime || new Date().toISOString(),
      stop: featured.endTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      startTime: featured.startTime,
      endTime: featured.endTime,
      desc: {
        details: featured.description || 'Película destacada de la programación actual.',
        year: featured.releaseDate,
        rate: 'TP'
      },
      description: featured.description,
      year: featured.releaseDate,
      rating: featured.rating,
      starRating: featured.rating || '7.0',
      category: featured.category || 'Cine',
      id: featured.id
    };
  }

  /**
   * Obtiene la URL del poster con fallback mejorado
   */
  public getPosterUrl(movie: IFeaturedMovie): string {
    return movie.poster || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=';
  }

  /**
   * Maneja errores de carga de posters
   */
  public onPosterError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=';

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
      description: 'Descubre qué ver en TV. Guía completa de programación televisiva con horarios actualizados.',
      canonicalUrl: '/'
    });
  }

  /**
   * Verificar si es producción
   */
  private isProduction(): boolean {
    return false; // Por ahora siempre false para debug
  }

  // ===============================================
  // DEBUG METHODS MEJORADOS (solo en desarrollo)
  // ===============================================

  /**
   * Debug del estado actual del componente y servicios
   */
  public debugComponentState(): void {
    if (this.logger) {
      this.logger.debug('=== HOME COMPONENT STATE ===');
      this.logger.debug(`UI State:`, this.uiState());
      this.logger.debug(`Programs: ${this.programs().length}`);
      this.logger.debug(`Featured Movie: ${this.featuredMovie()?.title || 'none'}`);
      this.logger.debug(`Popular Movies: ${this.popularMovies().length}`);
      
      // Debug del servicio de datos
      this.homeDataService.debugState();
      
      this.logger.debug('=== END COMPONENT STATE ===');
    }
  }

  /**
   * Método para forzar sincronización de datos si algo falla
   */
  public forceSyncData(): void {
    this.logger.info('🔄 FORCE SYNC - Forcing data synchronization');
    
    const currentState = this.homeDataService.getCurrentState();
    
    // Si hay datos en el servicio pero no en el componente, forzar sincronización
    if (currentState.programListData.length > 0 && this.programs().length === 0) {
      this.logger.warn('⚠️ FORCE SYNC - Data mismatch detected, forcing sync');
      
      // Forzar actualización de datos en ProgramList
      this.homeDataService.updateProgramListData(currentState.programListData);
      
      // Forzar change detection
      setTimeout(() => {
        this.logger.info('🔄 FORCE SYNC - Forcing change detection');
      }, 100);
    }
  }

  /**
   * Verificación de consistencia de datos
   */
  public checkDataConsistency(): void {
    const serviceState = this.homeDataService.getCurrentState();
    const componentState = {
      programs: this.programs().length,
      featuredMovie: this.featuredMovie()?.title || 'none',
      popularMovies: this.popularMovies().length
    };
    
    console.log('🔍 DATA CONSISTENCY CHECK:');
    console.log('Service State:', {
      programs: serviceState.programs.length,
      programListData: serviceState.programListData.length,
      featuredMovie: serviceState.featuredMovie?.title || 'none',
      popularMovies: serviceState.popularMovies.length,
      isLoading: serviceState.isLoading,
      hasData: serviceState.hasData
    });
    
    console.log('Component State:', componentState);
    
    // Detectar inconsistencias
    if (serviceState.programListData.length > 0 && this.programs().length === 0) {
      console.warn('🚨 INCONSISTENCY: Service has ProgramList data but component has no programs');
      this.forceSyncData();
    }
    
    if (serviceState.featuredMovie && !this.featuredMovie()) {
      console.warn('🚨 INCONSISTENCY: Service has featured movie but component does not');
    }
  }

  /**
   * Método para exponer en consola para debugging manual
   */
  public exposeDebugMethods(): void {
    if (typeof window !== 'undefined') {
      (window as any).homeComponentDebug = {
        state: () => this.debugComponentState(),
        sync: () => this.forceSyncData(),
        check: () => this.checkDataConsistency(),
        refresh: () => this.onRefresh(),
        serviceState: () => this.homeDataService.getCurrentState(),
        componentState: () => ({
          programs: this.programs().length,
          featuredMovie: this.featuredMovie()?.title,
          popularMovies: this.popularMovies().length,
          uiState: this.uiState()
        }),
        testFormatRating: (value: any) => this.formatRating(value)
      };
      
      console.log('🛠️ DEBUG METHODS EXPOSED:');
      console.log('- homeComponentDebug.state() - Ver estado completo');
      console.log('- homeComponentDebug.sync() - Forzar sincronización');
      console.log('- homeComponentDebug.check() - Verificar consistencia');
      console.log('- homeComponentDebug.refresh() - Refrescar datos');
      console.log('- homeComponentDebug.serviceState() - Estado del servicio');
      console.log('- homeComponentDebug.componentState() - Estado del componente');
      console.log('- homeComponentDebug.testFormatRating(value) - Probar formatRating');
    }
  }

  // ===============================================
  // MÉTODOS PARA FILTRADO DE CATEGORÍAS - PRINCIPIO SINGLE RESPONSIBILITY
  // ===============================================

  /**
   * Maneja la selección de categorías desde el componente hijo
   * Principio: Single Responsibility - Delega al servicio especializado
   * ACTUALIZADO: Ahora maneja selección múltiple
   */
  public onCategorySelected(categories: string[]): void {
    this.logger.info(`HomeComponent: Categorías seleccionadas: ${categories.join(', ')}`);
    
    // Si no hay categorías seleccionadas, limpiar filtro
    if (categories.length === 0) {
      this.categoryFilterService.clearCategoryFilter();
      return;
    }
    
    // Por ahora, el CategoryFilterService maneja una sola categoría
    // Usamos la primera categoría seleccionada como principal
    // TODO: Actualizar CategoryFilterService para soportar múltiples categorías
    const primaryCategory = categories[0];
    this.categoryFilterService.selectCategory(primaryCategory);
    
    // Log adicional para múltiples categorías
    if (categories.length > 1) {
      this.logger.info(`HomeComponent: Múltiples categorías seleccionadas, usando como principal: ${primaryCategory}`);
      this.logger.debug(`HomeComponent: Categorías adicionales: ${categories.slice(1).join(', ')}`);
    }
  }

  /**
   * Limpia el filtro de categoría
   * Principio: Single Responsibility - Delega al servicio
   */
  public clearCategoryFilter(): void {
    this.categoryFilterService.clearCategoryFilter();
    this.logger.info('HomeComponent: Filtro de categoría limpiado');
  }

  /**
   * Obtiene el número de programas de las categorías seleccionadas
   * Principio: Single Responsibility - Delega al servicio especializado
   * NOTA: Actualmente funciona con la categoría principal debido a limitaciones del servicio
   */
  public getCategoryProgramCount(): number {
    const category = this.selectedCategory();
    if (!category) return 0;
    
    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.totalPrograms;
  }

  /**
   * Obtiene el número de canales que tienen programas de las categorías seleccionadas
   * Principio: Single Responsibility - Delega al servicio especializado
   * NOTA: Actualmente funciona con la categoría principal debido a limitaciones del servicio
   */
  public getCategoryChannelCount(): number {
    const category = this.selectedCategory();
    if (!category) return 0;
    
    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.channelsCount;
  }

  /**
   * Obtiene el número de programas actualmente en emisión de las categorías seleccionadas
   * Principio: Single Responsibility - Delega al servicio especializado
   * NOTA: Actualmente funciona con la categoría principal debido a limitaciones del servicio
   */
  public getCurrentCategoryPrograms(): number {
    const category = this.selectedCategory();
    if (!category) return 0;
    
    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.currentlyAiring;
  }

  /**
   * Obtiene información del próximo programa de las categorías seleccionadas
   * Principio: Single Responsibility - Delega al servicio especializado
   * NOTA: Actualmente funciona con la categoría principal debido a limitaciones del servicio
   */
  public getNextCategoryProgram(): string {
    const category = this.selectedCategory();
    if (!category) return '0';
    
    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.nextProgramTime;
  }
}