/**
 * Servicio para manejo de datos del HomeComponent - ADAPTADO A ESTRUCTURA REAL
 * Ubicación: src/app/services/features/home-data.service.ts
 */

import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import {
  IProgramDataProvider,
  IInitializationManager,
  ILogger,
  ITvProgram,
  IFeaturedMovie,
  Result
} from '../../interfaces';
import {
  PROGRAM_PROVIDER_TOKEN,
  INITIALIZATION_MANAGER_TOKEN,
  LOGGER_TOKEN
} from '../../config/di-tokens';
import { FeaturedMoviesService } from './featured-movies.service';
import { FirebaseProgramProvider } from '../providers/firebase-program.provider';

@Injectable({
  providedIn: 'root'
})
export class HomeDataService {
  
  // Subjects para estado reactivo
  private readonly programsSubject = new BehaviorSubject<ITvProgram[]>([]);
  private readonly featuredMovieSubject = new BehaviorSubject<IFeaturedMovie | null>(null);
  private readonly popularMoviesSubject = new BehaviorSubject<IFeaturedMovie[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // NUEVO: Subject para datos de ProgramList (formato original)
  private readonly programListDataSubject = new BehaviorSubject<any[]>([]);

  // Observables públicos para suscripción
  public readonly programs$ = this.programsSubject.asObservable();
  public readonly featuredMovie$ = this.featuredMovieSubject.asObservable();
  public readonly popularMovies$ = this.popularMoviesSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  
  // NUEVO: Observable para ProgramListComponent
  public readonly programListData$ = this.programListDataSubject.asObservable();

  constructor(
    @Inject(PROGRAM_PROVIDER_TOKEN) private programProvider: IProgramDataProvider,
    @Inject(INITIALIZATION_MANAGER_TOKEN) private initManager: IInitializationManager,
    @Inject(LOGGER_TOKEN) private logger: ILogger,
    private featuredMoviesService: FeaturedMoviesService
  ) {
    this.logger.info('HomeDataService initialized with enhanced data handling');
  }

  /**
   * Inicializa todos los datos del home
   */
  initializeData(): Observable<Result<boolean, string>> {
    this.logger.info('Starting home data initialization');

    // Verificar si ya se puede inicializar
    if (!this.initManager.startInitialization()) {
      const error = 'Initialization already in progress or completed';
      this.logger.warn(error);
      return of({
        success: false,
        error
      });
    }

    // Establecer estado de carga
    this.setLoadingState(true);
    this.clearError();

    // Cargar ambos tipos de datos en paralelo
    const standardPrograms$ = this.programProvider.getPrograms('today');
    const programListData$ = this.getProgramListData('today');

    return forkJoin({
      programs: standardPrograms$,
      programListData: programListData$
    }).pipe(
      switchMap(({ programs, programListData }) => {
        this.logger.info(`Loaded data - Programs: ${programs.length}, ProgramList channels: ${programListData.length}`);
        
        // Validar que tengamos datos
        if (!programs || programs.length === 0) {
          throw new Error('No programs received from provider');
        }

        // Establecer ambos tipos de datos
        this.programsSubject.next(programs);
        this.programListDataSubject.next(programListData);

        // Procesar películas destacadas
        return this.processFeaturedMovies(programs);
      }),
      map(() => {
        // Completar inicialización
        this.initManager.completeInitialization(() => 
          this.hasValidData()
        );
        
        this.setLoadingState(false);
        this.logger.info('Home data initialization completed successfully');
        
        return {
          success: true as const,
          data: true
        };
      }),
      catchError(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        this.logger.error('Home data initialization failed', error);
        
        // Manejar fallo de inicialización
        this.initManager.failInitialization(errorMessage);
        this.setLoadingState(false);
        this.setError(errorMessage);

        return of({
          success: false as const,
          error: errorMessage
        });
      })
    );
  }

  /**
   * NUEVO: Obtiene datos específicamente para ProgramListComponent
   */
  private getProgramListData(date: string): Observable<any[]> {
    // Cast a FirebaseProgramProvider para acceder al método específico
    const firebaseProvider = this.programProvider as FirebaseProgramProvider;
    
    if (firebaseProvider.getProgramsForProgramList) {
      return firebaseProvider.getProgramsForProgramList(date);
    } else {
      // Fallback: convertir datos estándar al formato esperado
      return this.programProvider.getPrograms(date).pipe(
        map(programs => this.convertProgramsToListFormat(programs))
      );
    }
  }

  /**
   * Convierte programas estándar al formato que espera ProgramListComponent
   */
  private convertProgramsToListFormat(programs: ITvProgram[]): any[] {
    const channelMap = new Map<string, any>();

    programs.forEach(program => {
      const channelId = program.channel.id;
      
      if (!channelMap.has(channelId)) {
        channelMap.set(channelId, {
          id: channelId,
          channel: program.channel,
          channels: [] // Array de programas para este canal
        });
      }

      const channelData = channelMap.get(channelId);
      channelData.channels.push({
        id: program.id,
        title: program.title,
        start: program.start,
        stop: program.end,
        category: program.category,
        desc: program.desc,
        starRating: program.starRating,
        duracion: this.calculateDuration(program.start, program.end)
      });
    });

    const result = Array.from(channelMap.values());
    this.logger.debug(`Converted ${programs.length} programs to ${result.length} channel groups`);
    
    return result;
  }

  /**
   * Calcula duración en minutos
   */
  private calculateDuration(start: string, end: string): number {
    if (!start || !end) return 30;
    
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      return Math.max(1, Math.floor((endTime - startTime) / (1000 * 60)));
    } catch (error) {
      return 30;
    }
  }

  /**
   * Procesa las películas destacadas desde los programas cargados
   */
  private processFeaturedMovies(programs: ITvProgram[]): Observable<void> {
    this.logger.info('Processing featured movies');

    return this.featuredMoviesService.getFeaturedMoviesHybrid(programs).pipe(
      map(result => {
        if (result.success) {
          this.popularMoviesSubject.next(result.data);
          
          // Seleccionar película destacada principal
          const featured = this.featuredMoviesService.selectFeaturedMovie(result.data);
          this.featuredMovieSubject.next(featured);
          
          this.logger.info(`Featured movies processed: ${result.data.length} total, featured: ${featured?.title || 'none'}`);
        } else {
          this.logger.warn(`Failed to process featured movies: ${result}`);
          
          // Establecer arrays vacíos en caso de error
          this.popularMoviesSubject.next([]);
          this.featuredMovieSubject.next(null);
        }
      }),
      catchError(error => {
        this.logger.error('Error processing featured movies', error);
        
        // Establecer arrays vacíos en caso de error
        this.popularMoviesSubject.next([]);
        this.featuredMovieSubject.next(null);
        
        return of(void 0);
      })
    );
  }

  /**
   * NUEVO: Método específico para obtener datos para ProgramListComponent
   */
  getProgramListData$(): Observable<any[]> {
    return this.programListData$;
  }

  /**
   * NUEVO: Método para actualizar solo los datos de ProgramList
   */
  updateProgramListData(data: any[]): void {
    this.logger.debug(`Updating ProgramList data: ${data.length} channels`);
    this.programListDataSubject.next(data);
  }

  /**
   * Resetea todos los datos del servicio
   */
  resetData(): void {
    this.logger.info('Resetting all home data');
    
    // Limpiar todos los subjects
    this.programsSubject.next([]);
    this.featuredMovieSubject.next(null);
    this.popularMoviesSubject.next([]);
    this.programListDataSubject.next([]); // NUEVO
    this.setLoadingState(false);
    this.clearError();
    
    // Resetear estado de inicialización
    this.initManager.resetInitialization();
  }

  /**
   * Verifica si hay datos válidos cargados
   */
  hasValidData(): boolean {
    const hasPrograms = this.programsSubject.value.length > 0;
    const hasProgramListData = this.programListDataSubject.value.length > 0;
    const isValid = hasPrograms || hasProgramListData;
    
    this.logger.debug(`Valid data check: ${isValid} (programs: ${this.programsSubject.value.length}, programList: ${this.programListDataSubject.value.length})`);
    return isValid;
  }

  /**
   * Fuerza una actualización de datos
   */
  refreshData(): Observable<Result<boolean, string>> {
    this.logger.info('Forcing data refresh');
    this.resetData();
    return this.initializeData();
  }

  /**
   * Obtiene el estado actual de los datos
   */
  getCurrentState() {
    return {
      programs: this.programsSubject.value,
      featuredMovie: this.featuredMovieSubject.value,
      popularMovies: this.popularMoviesSubject.value,
      programListData: this.programListDataSubject.value, // NUEVO
      isLoading: this.loadingSubject.value,
      error: this.errorSubject.value,
      hasData: this.hasValidData(),
      isInitialized: this.initManager.isInitialized()
    };
  }

  /**
   * Debug del estado actual - MEJORADO
   */
  debugState(): void {
    const state = this.getCurrentState();
    this.logger.debug('=== HOME DATA SERVICE STATE ===');
    this.logger.debug(`Programs: ${state.programs.length}`);
    this.logger.debug(`ProgramList Data: ${state.programListData.length} channels`);
    this.logger.debug(`Featured Movie: ${state.featuredMovie?.title || 'none'}`);
    this.logger.debug(`Popular Movies: ${state.popularMovies.length}`);
    this.logger.debug(`Loading: ${state.isLoading}`);
    this.logger.debug(`Error: ${state.error || 'none'}`);
    this.logger.debug(`Has Data: ${state.hasData}`);
    this.logger.debug(`Initialized: ${state.isInitialized}`);
    
    // Debug específico de estructura de datos
    if (state.programListData.length > 0) {
      this.logger.debug('Sample ProgramList channel:', state.programListData[0]);
    }
    
    this.logger.debug('=== END STATE DEBUG ===');
  }

  // Métodos privados para manejo de estado

  private setLoadingState(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }
}