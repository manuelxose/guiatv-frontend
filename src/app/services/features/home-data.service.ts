/**
 * HomeDataService - LOADING STATE FIXED
 * Ubicación: src/app/services/features/home-data.service.ts
 *
 * CAMBIOS PRINCIPALES:
 * 1. Manejo más robusto del estado de loading
 * 2. Garantía de que loading siempre se establece a false
 * 3. Mejores logs para debugging
 * 4. Verificación de datos después de la carga
 */

import { Injectable, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  of,
  forkJoin,
  timer,
  Subscription,
} from 'rxjs';
import {
  switchMap,
  map,
  catchError,
  tap,
  timeout,
  finalize,
} from 'rxjs/operators';
import {
  IProgramDataProvider,
  IInitializationManager,
  ILogger,
  ITvProgram,
  IFeaturedMovie,
  Result,
} from '../../interfaces';
import {
  PROGRAM_PROVIDER_TOKEN,
  INITIALIZATION_MANAGER_TOKEN,
  LOGGER_TOKEN,
} from '../../config/di-tokens';
import { FeaturedMoviesService } from './featured-movies.service';
import { ApiProgramProvider } from '../providers/api-program.provider';

@Injectable({
  providedIn: 'root',
})
export class HomeDataService {
  // Subjects para estado reactivo
  private readonly programsSubject = new BehaviorSubject<ITvProgram[]>([]);
  private readonly featuredMovieSubject =
    new BehaviorSubject<IFeaturedMovie | null>(null);
  private readonly popularMoviesSubject = new BehaviorSubject<IFeaturedMovie[]>(
    []
  );
  private readonly loadingSubject = new BehaviorSubject<boolean>(true); // NOTA: Inicialmente true
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly programListDataSubject = new BehaviorSubject<any[]>([]);

  // Observables públicos para suscripción
  public readonly programs$ = this.programsSubject.asObservable();
  public readonly featuredMovie$ = this.featuredMovieSubject.asObservable();
  public readonly popularMovies$ = this.popularMoviesSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly programListData$ = this.programListDataSubject.asObservable();

  // NUEVO: Flag para tracking de inicialización
  private initializationStarted = false;
  private _currentDayIndex = 0;

  public get currentDayIndex(): number {
    return this._currentDayIndex;
  }

  // Watchdog subscription for loading timeout
  private loadingWatchTimerSub: Subscription | null = null;

  constructor(
    @Inject(PROGRAM_PROVIDER_TOKEN)
    private programProvider: IProgramDataProvider,
    @Inject(INITIALIZATION_MANAGER_TOKEN)
    private initManager: IInitializationManager,
    @Inject(LOGGER_TOKEN) private logger: ILogger,
    private featuredMoviesService: FeaturedMoviesService
  ) {
    this.logger.info('HomeDataService initialized');

    // NUEVO: Watch loading state and start per-load watchdog
    this.watchLoadingTimeout();
  }

  /**
   * Inicializa todos los datos del home - MEJORADO
   */
  initializeData(): Observable<Result<boolean, string>> {
    this.logger.info('🚀 Starting home data initialization');

    // Verificar si ya se puede inicializar
    if (!this.initManager.startInitialization()) {
      const error = 'Initialization already in progress or completed';
      this.logger.warn(error);
      return of({
        success: false,
        error,
      });
    }

    // NUEVO: Marcar que la inicialización ha comenzado
    this.initializationStarted = true;

    // Establecer estado de carga
    this.setLoadingState(true);
    this.clearError();

    // Cargar una sola vez programas y derivar programList desde ahí
    const today = this.getDateForDayIndex(0);
    const standardPrograms$ = this.programProvider.getPrograms(today.date).pipe(
      timeout(45000), // backend puede tardar precomputando, ampliamos margen
      catchError((err) => {
        this.logger.error('Timeout o error cargando programas estándar:', err);
        throw err;
      })
    );

    return standardPrograms$.pipe(
      switchMap((programs) => {
        if (!programs || programs.length === 0) {
          throw new Error('No programs received from provider');
        }

        // Derivar programListData localmente para evitar segunda llamada
        const programListData = this.convertProgramsToListFormat(programs);

        this.programsSubject.next(programs);
        this.programListDataSubject.next(programListData);
        const featured = this.featuredMovieSubject.value;
        const sampleChannel = programListData?.[0];
        console.log(
          `[HomeData] Programs: ${programs.length} | ProgramList channels: ${programListData.length} | Featured: ${
            featured?.title || 'none'
          } | Sample channel: ${sampleChannel?.channel?.name || 'n/a'}`
        );
        console.log(
          `[HomeData] programListData set: ${programListData.length} channels`
        );

        this.logger.debug(
          '📊 Data set in subjects, processing featured movies...'
        );

        // Procesar películas destacadas
        return this.processFeaturedMovies(programs);
      }),
      map(() => {
        this.logger.info('🎬 Featured movies processed');

        // Completar inicialización
        const hasData = this.hasValidData();
        this.logger.info(`📝 Validating data: hasData = ${hasData}`);

        this.initManager.completeInitialization(() => hasData);

        // Inicialización finalizada, reiniciar flag
        this.initializationStarted = false;

        // CRÍTICO: Asegurar que loading se establece a false
        this.setLoadingState(false);
        this.logger.info('✅ Home data initialization completed successfully');

        // NUEVO: Verificar estado después de un momento
        setTimeout(() => this.verifyDataState(), 500);

        return {
          success: true as const,
          data: true,
        };
      }),
      catchError((error) => {
        const errorMessage = this.formatErrorMessage(error);
        this.logger.error(
          '❌ Home data initialization failed:',
          errorMessage,
          error
        );

        // Manejar fallo de inicialización
        this.initManager.failInitialization(errorMessage);

        // CRÍTICO: Asegurar que loading se establece a false incluso en error
        this.setLoadingState(false);
        this.setError(errorMessage);

        return of({
          success: false as const,
          error: errorMessage,
        });
      }),
      // CRÍTICO: finalize se ejecuta siempre, tanto en éxito como en error
      finalize(() => {
        this.logger.info('🏁 Initialize data finalized');

        // Última verificación de seguridad
        setTimeout(() => {
          if (this.loadingSubject.value) {
            this.logger.warn(
              '⚠️ Loading aún true después de finalize, forzando false'
            );
            this.setLoadingState(false);
          }
        }, 1000);
      })
    );
  }

  /**
   * NUEVO: Setup de timeout de seguridad global
   */
  private watchLoadingTimeout(): void {
    // Start/stop a watchdog timer whenever loading becomes true.
    // This prevents a single constructor timer from firing at an unrelated time.
    this.loadingSubject.subscribe((loading) => {
      // If loading turned on, (re)start the timer
      if (loading) {
        // clear any existing timer
        if (this.loadingWatchTimerSub) {
          this.loadingWatchTimerSub.unsubscribe();
          this.loadingWatchTimerSub = null;
        }

        // start a 20s timer for this loading session
        this.loadingWatchTimerSub = timer(20000).subscribe(() => {
          if (this.loadingSubject.value) {
            this.logger.error(
              '🚨 GLOBAL TIMEOUT: 20 segundos de loading, forzando false'
            );
            this.setLoadingState(false);

            if (!this.hasValidData()) {
              this.setError('Timeout de carga. Por favor, recarga la página.');
            }
          }
        });
      } else {
        // loading turned off, cancel any watchdog
        if (this.loadingWatchTimerSub) {
          this.loadingWatchTimerSub.unsubscribe();
          this.loadingWatchTimerSub = null;
        }
      }
    });
  }

  /**
   * NUEVO: Verifica el estado de los datos después de la carga
   */
  private verifyDataState(): void {
    const state = this.getCurrentState();

    this.logger.debug('🔍 VERIFY DATA STATE:');
    this.logger.debug('  Programs:', state.programs.length);
    this.logger.debug('  ProgramList Data:', state.programListData.length);
    this.logger.debug(
      '  Featured Movie:',
      state.featuredMovie?.title || 'none'
    );
    this.logger.debug('  Popular Movies:', state.popularMovies.length);
    this.logger.debug('  Loading:', state.isLoading);
    this.logger.debug('  Error:', state.error || 'none');
    this.logger.debug('  Has Data:', state.hasData);

    // Detectar inconsistencias
    if (state.isLoading && state.hasData) {
      this.logger.warn('⚠️ INCONSISTENCIA: Loading true pero hay datos');
      this.logger.warn('🔧 Corrigiendo...');
      this.setLoadingState(false);
    }

    if (!state.isLoading && !state.hasData && !state.error) {
      this.logger.warn('⚠️ INCONSISTENCIA: No loading, no data, no error');
      this.setError('No se pudieron cargar los datos');
    }
  }

  /**
   * Procesa las películas destacadas - SIN CAMBIOS
   */
  private processFeaturedMovies(programs: ITvProgram[]): Observable<void> {
    return this.featuredMoviesService
      .getFeaturedAndPopularMovies(programs)
      .pipe(
        tap(({ featured, popular }) => {
          this.logger.debug(
            `Featured movies processed: ${featured ? 1 : 0} featured, ${
              popular.length
            } popular`
          );
          this.featuredMovieSubject.next(featured);
          this.popularMoviesSubject.next(popular);
        }),
        map(() => void 0),
        catchError((error) => {
          this.logger.error('Error processing featured movies:', error);
          this.popularMoviesSubject.next([]);
          this.featuredMovieSubject.next(null);
          return of(void 0);
        })
      );
  }

  /**
   * Obtiene datos específicamente para ProgramListComponent - SIN CAMBIOS
   */
  private getProgramListData(date: string): Observable<any[]> {
    const apiProvider = this.programProvider as ApiProgramProvider;

    if (apiProvider.getProgramsForProgramList) {
      return apiProvider.getProgramsForProgramList(date);
    } else {
      return this.programProvider
        .getPrograms(date)
        .pipe(map((programs) => this.convertProgramsToListFormat(programs)));
    }
  }

  /**
   * Convierte programas estándar al formato que espera ProgramListComponent - SIN CAMBIOS
   */
  private convertProgramsToListFormat(programs: ITvProgram[]): any[] {
    const channelMap = new Map<string, any>();
    const typeOrder: Record<string, number> = {
      TDT: 0,
      AUTONOMICO: 1,
      MOVISTAR: 2,
      CABLE: 3,
      OTT: 4,
    };
    const tdtPriority = [
      'LA 1',
      'LA 2',
      'ANTENA 3',
      'CUATRO',
      'TELECINCO',
      'LA SEXTA',
      'PARAMOUNT NETWORK',
      'DIVINITY',
      'DKISS',
      'TEN',
      'BE MAD',
      'MEGA',
      'DMAX',
      'ENERGY',
      'FDF',
      'ATRESERIES',
      'NEOX',
      'NOVA',
    ];

    programs.forEach((program) => {
      const channelId = program.channel.id;
      const normalizedTitle =
        typeof program.title === 'object'
          ? program.title
          : { value: program.title, lang: 'es' };
      const normalizedCategory = program.category
        ? (program.category as any).value
          ? program.category
          : { value: program.category as any, lang: 'es' }
        : undefined;
      const normalizedDesc = program.desc
        ? typeof program.desc === 'string'
          ? {
              value: program.desc,
              lang: 'es',
              category: (normalizedCategory as any)?.value,
            }
          : program.desc
        : normalizedCategory
        ? { value: '', lang: 'es', category: (normalizedCategory as any).value }
        : undefined;

      const normalizedType = (program.channel as any)?.type
        ? String((program.channel as any).type).trim().toUpperCase()
        : undefined;

      const channelInfo = {
        ...program.channel,
        type: normalizedType,
      };

      if (!channelMap.has(channelId)) {
        channelMap.set(channelId, {
          id: channelId,
          channel: channelInfo,
          type: normalizedType,
          channels: [],
          programs: [],
        });
      }

      const channelData = channelMap.get(channelId);
      const normalizedProgram = {
        id: program.id,
        title: normalizedTitle,
        start: program.start,
        stop: program.end,
        channel_id: program.channel.id,
        channel: channelInfo,
        category: normalizedCategory,
        desc: normalizedDesc,
        description: normalizedDesc,
        duracion: program.duration,
        duration: program.duration,
        starRating: program.starRating,
        image: program.image,
        rating: (program as any)?.rating,
        // Layout fields from backend (keep for precomputed grid/slots)
        gridColumnStart: (program as any)?.gridColumnStart,
        gridColumnEnd: (program as any)?.gridColumnEnd,
        layerIndex: (program as any)?.layerIndex,
        isCutAtStart: (program as any)?.isCutAtStart,
        isCutAtEnd: (program as any)?.isCutAtEnd,
        visibleStartTime: (program as any)?.visibleStartTime,
        visibleEndTime: (program as any)?.visibleEndTime,
        crossesMidnight: (program as any)?.crossesMidnight,
        layoutsBySlot: (program as any)?.layoutsBySlot,
        fieldsProvided: (program as any)?.fieldsProvided,
        pxStart: (program as any)?.pxStart,
        pxWidth: (program as any)?.pxWidth,
        timeSlotIndex:
          (program as any)?.timeSlotIndex ?? (program as any)?.slotIndex,
      };

      channelData.channels.push(normalizedProgram);
      channelData.programs = channelData.channels;
    });

    const sortedChannels = Array.from(channelMap.values()).sort((a, b) => {
      const tA = (a.type || '').toUpperCase();
      const tB = (b.type || '').toUpperCase();
      const oA = typeOrder[tA] ?? 99;
      const oB = typeOrder[tB] ?? 99;
      if (oA !== oB) return oA - oB;

      if (tA === 'TDT' && tB === 'TDT') {
        const idxA = tdtPriority.indexOf((a.channel?.name || '').toUpperCase());
        const idxB = tdtPriority.indexOf((b.channel?.name || '').toUpperCase());
        if (idxA !== -1 || idxB !== -1) {
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          if (idxA !== idxB) return idxA - idxB;
        }
      }

      return (a.channel?.name || '').localeCompare(b.channel?.name || '', 'es', {
        sensitivity: 'base',
      });
    });

    // Ordenar programas de cada canal por hora de inicio
    sortedChannels.forEach((c: any) => {
      c.channels = (c.channels || []).sort((p1: any, p2: any) => {
        const t1 = new Date(p1.start).getTime();
        const t2 = new Date(p2.start).getTime();
        return t1 - t2;
      });
      c.programs = c.channels;
    });

    return sortedChannels;
  }

  /**
   * Carga datos para un día específico - MEJORADO
   */
  loadDataForDay(dayIndex: number): Observable<Result<boolean, string>> {
    const { alias: dateAlias, date: dateParam } =
      this.getDateForDayIndex(dayIndex);
    this.logger.info(
      `Loading data for day ${dayIndex} (${dateAlias} -> ${dateParam})`
    );

    // Update current day index
    this._currentDayIndex = dayIndex;

    // CRÍTICO: Establecer loading state
    this.setLoadingState(true);
    this.clearError();

    const standardPrograms$ = this.programProvider.getPrograms(dateParam).pipe(
      timeout(45000),
      catchError((err) => {
        this.logger.error(`Error loading programs for day ${dayIndex}:`, err);
        throw err;
      })
    );

    return standardPrograms$.pipe(
      switchMap((programs) => {
        // Derivar programListData localmente
        const programListData = this.convertProgramsToListFormat(programs);

        // Push data into subjects so subscribers react
        this.programsSubject.next(programs);
        this.programListDataSubject.next(programListData);
        console.log(
          `[HomeData] programListData set (day ${dayIndex}): ${programListData.length} channels`
        );

        const noPrograms = !programs || programs.length === 0;
        const noProgramList = !programListData || programListData.length === 0;

        if (noPrograms && noProgramList) {
          // Throw to enter catchError branch and set loading=false + error
          throw new Error(`No data received for day ${dayIndex}`);
        }

        return this.processFeaturedMovies(programs);
      }),
      map(() => {
        // CRÍTICO: Establecer loading a false
        this.setLoadingState(false);
        this.logger.info(`✅ Day ${dayIndex} data loading completed`);

        return {
          success: true as const,
          data: true,
        };
      }),
      catchError((error) => {
        const errorMessage = this.formatErrorMessage(error);
        this.logger.error(`❌ Day ${dayIndex} loading failed:`, errorMessage, error);

        // CRÍTICO: Establecer loading a false incluso en error
        this.setLoadingState(false);
        this.setError(errorMessage);

        return of({
          success: false as const,
          error: errorMessage,
        });
      }),
      // CRÍTICO: finalize siempre se ejecuta
      finalize(() => {
        this.logger.debug(`🏁 Load day ${dayIndex} finalized`);

        // Garantizar inmediatamente que loading=false al finalizar
        if (this.loadingSubject.value) {
          this.logger.warn(
            '⚠️ Loading aún true en finalize (loadDataForDay), forzando false ahora'
          );
          this.setLoadingState(false);
        }

        // Verificación de seguridad adicional
        setTimeout(() => {
          if (this.loadingSubject.value) {
            this.logger.warn(
              '⚠️ Loading aún true después de finalize (loadDataForDay), forzando false'
            );
            this.setLoadingState(false);
          }
        }, 500);
      })
    );
  }

  /**
   * NUEVO: Obtiene el parámetro de fecha para un día
   */
  private getDayParam(dayIndex: number): string {
    if (dayIndex === -1) return 'yesterday';
    if (dayIndex === 0) return 'today';
    if (dayIndex === 1) return 'tomorrow';
    if (dayIndex === 2) return 'after_tomorrow';
    return 'today';
  }

  /**
   * Devuelve alias y fecha YYYYMMDD para un índice relativo.
   * Evita peticiones ambiguas sin fecha y deja claro qué día se está consultando.
   */
  private getDateForDayIndex(dayIndex: number): { alias: string; date: string } {
    const alias = this.getDayParam(dayIndex);
    const base = new Date();
    base.setDate(base.getDate() + dayIndex);

    const year = base.getFullYear();
    const month = `${base.getMonth() + 1}`.padStart(2, '0');
    const day = `${base.getDate()}`.padStart(2, '0');

    return { alias, date: `${year}${month}${day}` };
  }

  // Alias de compatibilidad (algunos consumidores esperan método sin $)
  getProgramListDataStream(): Observable<any[]> {
    return this.programListData$;
  }

  /**
   * Método para actualizar solo los datos de ProgramList
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

    this.programsSubject.next([]);
    this.featuredMovieSubject.next(null);
    this.popularMoviesSubject.next([]);
    this.programListDataSubject.next([]);
    this.setLoadingState(true); // Volver a estado inicial
    this.clearError();

    this.initManager.resetInitialization();
    this.initializationStarted = false;
    this._currentDayIndex = 0;
  }

  /**
   * Verifica si hay datos válidos cargados
   */
  hasValidData(): boolean {
    const hasPrograms = this.programsSubject.value.length > 0;
    const hasProgramListData = this.programListDataSubject.value.length > 0;
    const isValid = hasPrograms || hasProgramListData;

    this.logger.debug(
      `Valid data check: ${isValid} (programs: ${this.programsSubject.value.length}, programList: ${this.programListDataSubject.value.length})`
    );
    return isValid;
  }

  /**
   * Fuerza una actualización de datos - MEJORADO
   */
  refreshData(): Observable<Result<boolean, string>> {
    this.logger.info('🔄 Forcing data refresh');
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
      programListData: this.programListDataSubject.value,
      isLoading: this.loadingSubject.value,
      error: this.errorSubject.value,
      hasData: this.hasValidData(),
      isInitialized: this.initManager.isInitialized(),
    };
  }

  /**
   * Debug del estado actual - MEJORADO
   */
  debugState(): void {
    const state = this.getCurrentState();

    this.logger.debug('=== HOME DATA SERVICE STATE ===');
    this.logger.debug(`Programs: ${state.programs.length}`);
    this.logger.debug(
      `ProgramList Data: ${state.programListData.length} channels`
    );
    this.logger.debug(
      `Featured Movie: ${state.featuredMovie?.title || 'none'}`
    );
    this.logger.debug(`Popular Movies: ${state.popularMovies.length}`);
    this.logger.debug(`Loading: ${state.isLoading}`);
    this.logger.debug(`Error: ${state.error || 'none'}`);
    this.logger.debug(`Has Data: ${state.hasData}`);
    this.logger.debug(`Initialized: ${state.isInitialized}`);

    if (state.programListData.length > 0) {
      this.logger.debug(
        'Sample ProgramList channel:',
        state.programListData[0]
      );
    }

    this.logger.debug('=== END STATE DEBUG ===');
  }

  // ===============================================
  // MÉTODOS PRIVADOS PARA MANEJO DE ESTADO
  // ===============================================

  /**
   * Establece el estado de carga - MEJORADO CON LOGS
   */
  private setLoadingState(loading: boolean): void {
    const previousState = this.loadingSubject.value;

    if (previousState !== loading) {
      this.logger.debug(
        `🔄 Loading state change: ${previousState} -> ${loading}`
      );
    }

    this.loadingSubject.next(loading);
  }

  /**
   * Establece un error
   */
  private setError(error: string): void {
    this.logger.error(`Setting error: ${error}`);
    this.errorSubject.next(error);
  }

  /**
   * Limpia el error
   */
  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Formatea errores para logs y UI con contexto HTTP cuando aplica
   */
  private formatErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      const body = this.stringifyErrorBody(error.error);
      const base = `HTTP ${error.status} ${error.statusText || ''}`.trim();
      const url = error.url ? ` @ ${error.url}` : '';
      const message = error.message ? ` - ${error.message}` : '';
      const payload = body ? ` | body: ${body}` : '';
      return `${base}${url}${message}${payload}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }

  private stringifyErrorBody(body: any): string {
    if (body === undefined || body === null) {
      return '';
    }

    if (typeof body === 'string') {
      return body;
    }

    try {
      return JSON.stringify(body);
    } catch {
      return '';
    }
  }
}
