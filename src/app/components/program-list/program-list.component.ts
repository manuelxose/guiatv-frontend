/**
 * ProgramListComponent - Componente para mostrar la programación de TV en formato grid
 *
 * @description
 * Componente principal que muestra la guía de programación televisiva usando CSS Grid.
 * Maneja franjas horarias, filtros por categoría, navegación por días y
 * visualización optimizada con virtual scrolling.
 *
 * @features
 * - Grid de 7 columnas para slots de 30 minutos
 * - Manejo especial de franjas nocturnas (21:00-00:30)
 * - Sistema de capas para programas solapados
 * - Filtrado por categorías
 * - Navegación responsive con dropdowns
 * - Indicador de tiempo actual
 *
 * @author Sistema SOLID
 * @version 2.0.0
 */

import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  inject,
  DestroyRef,
  HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter } from 'rxjs/operators';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

// Componentes y servicios
import { BannerComponent } from '../banner/banner.component';
import { ProgramListFacadeService } from '../../services/program-list/program-list-facade.service';
import {
  IDayChangedEvent,
  IProgramListData,
  IProgramItem,
} from 'src/app/interfaces';

/**
 * Constantes de configuración UI
 */

const UI_CONFIG = {
  PIXELS_PER_HOUR: 240,
  LOGO_COLUMN_WIDTH: 160,
  BASE_CHANNEL_HEIGHT: 75,
  LAYER_HEIGHT: 75, // Altura de cada capa de programas
  EXPANDED_BANNER_HEIGHT: 320,
  MINUTES_PER_SLOT: 30,
  MINUTES_PER_COLUMN: 5, // <-- nueva unidad de columna (granularidad de 5 min)
  MAX_GRID_COLUMNS: 7,
  NIGHT_SLOT_END_MINUTES: 30, // 00:30
  MAX_LAYERS: 5, // Máximo de capas para evitar overflow
} as const;

/**
 * Interface para programas con información de posición en grid
 */
interface ProgramWithPosition extends IProgramItem {
  gridColumnStart: number;
  gridColumnEnd: number;
  layerIndex: number;
  visibleStartTime: string;
  visibleEndTime: string;
  isCutAtStart: boolean;
  isCutAtEnd: boolean;

  // ADICIÓN: guardar minutos normalizados para detección fiable de solapamientos
  _normStartMinutes?: number;
  _normEndMinutes?: number;
}

@Component({
  selector: 'app-program-list',
  templateUrl: './program-list.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BannerComponent, ScrollingModule],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
  ],
})
export class ProgramListComponent implements OnInit, OnDestroy, AfterViewInit {
  //DEBUG: habilitar logs de depuración
  private readonly DEBUG = true;

  // ===============================================
  // DEPENDENCY INJECTION
  // ===============================================

  private readonly destroyRef = inject(DestroyRef);
  public readonly facade = inject(ProgramListFacadeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  // ===============================================
  // COMPONENT OUTPUTS
  // ===============================================

  /** Evento emitido cuando cambia el día seleccionado */
  @Output() dayChanged = new EventEmitter<IDayChangedEvent>();

  /** Evento emitido cuando cambian las categorías seleccionadas */
  @Output() categorySelected = new EventEmitter<string[]>();

  // ===============================================
  // VIEW REFERENCES
  // ===============================================

  @ViewChild('virtualScrollViewport')
  virtualScrollViewport!: CdkVirtualScrollViewport;

  // ===============================================
  // REACTIVE STATE SIGNALS
  // ===============================================

  /** Datos principales de canales con programación */
  public readonly canalesConProgramas = signal<IProgramListData[]>([]);

  /** Estado de carga de datos */
  public readonly isLoading = signal<boolean>(true);

  /** Mensaje de error si ocurre algún problema */
  public readonly error = signal<string | null>(null);

  /** Índice del día activo (0=hoy, 1=mañana, 2=pasado mañana) */
  public readonly activeDay = signal<number>(0);

  /** Índice de la franja horaria activa (0-7) */
  public readonly activeTimeSlot = signal<number>(0);

  /** Hora de inicio de la franja actual (ej: "21:00") */
  public readonly currentTimeSlot = signal<string>('');

  /** Set de canales expandidos para mostrar banner */
  public readonly expandedChannels = signal<Set<number>>(new Set());

  /** Índice del canal seleccionado (-1 si ninguno) */
  public readonly selectedChannel = signal<number>(-1);

  /** Programa seleccionado para mostrar en banner */
  public readonly selectedProgram = signal<IProgramItem | null>(null);

  /** Estados de apertura de dropdowns */
  public readonly isDayDropdownOpen = signal<boolean>(false);
  public readonly isCategoryDropdownOpen = signal<boolean>(false);
  public readonly isTimeSlotDropdownOpen = signal<boolean>(false);

  /** Set de categorías seleccionadas para filtrado */
  public readonly selectedCategories = signal<Set<string>>(new Set());

  /** Flag para mostrar/ocultar filtro de categorías */
  public readonly showCategoryFilter = signal<boolean>(true);

  /** Flag para mostrar/ocultar indicador de tiempo actual */
  public readonly showTimeIndicator = signal<boolean>(true);

  // ===============================================
  // COMPUTED PROPERTIES
  // ===============================================

  /** Computed: Verifica si hay canales cargados */
  public readonly hasChannels = computed(
    () => this.canalesConProgramas().length > 0
  );

  /** Computed: Obtiene las franjas horarias disponibles */
  public readonly currentTimeSlots = computed(() => this.facade.getTimeSlots());

  /** Computed: Genera las horas para la franja activa */
  public readonly currentHours = computed(() =>
    this.facade.generateHoursForSlot(this.activeTimeSlot())
  );

  /** Computed: Información de los días disponibles */
  public readonly daysInfo = computed(() => this.facade.generateDaysInfo());

  /** Computed: Canales filtrados por categorías seleccionadas */
  public readonly filteredChannels = computed(() => {
    const channels = this.canalesConProgramas();
    const categories = this.selectedCategories();

    if (categories.size === 0) return channels;

    return channels
      .map((canal) => ({
        ...canal,
        channels: canal.channels.filter((programa) =>
          this.programMatchesCategory(programa, Array.from(categories))
        ),
      }))
      .filter((canal) => canal.channels.length > 0);
  });

  /** Computed: Lista de categorías disponibles */
  public readonly availableCategories = computed(() => {
    const channels = this.canalesConProgramas();
    const allPrograms = channels.flatMap((canal) => canal.channels);

    const categoriesSet = new Set<string>();
    allPrograms.forEach((programa) => {
      if (programa.category?.value) {
        const categories = programa.category.value
          .split(',')
          .map((cat) => this.normalizeCategoryName(cat.trim()))
          .filter((cat) => cat);
        categories.forEach((cat) => categoriesSet.add(cat));
      }
    });

    return this.sortCategories(Array.from(categoriesSet));
  });

  /** Computed: Estado combinado de la UI */
  public readonly uiState = computed(() => ({
    hasData: this.hasChannels(),
    isLoading: this.isLoading(),
    hasError: this.error() !== null,
    showContent: this.hasChannels() && !this.isLoading() && !this.error(),
    showEmpty: !this.hasChannels() && !this.isLoading() && !this.error(),
  }));

  /** Computed: Posición en píxeles del indicador de tiempo */
  public readonly timeIndicatorPositionPx = computed(() => {
    if (!this.showTimeIndicator()) return 0;

    const currentHours = this.currentHours();
    if (!currentHours.length) return 0;

    // usar hora LOCAL para alinear con las etiquetas del header
    const now = new Date();
    const localMinutes = now.getHours() * 60 + now.getMinutes();

    const slotStartMinutes = this.parseTimeToMinutes(this.currentTimeSlot());
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);
    const slotDuration = slotEndMinutes - slotStartMinutes;

    let minutesFromSlotStart = localMinutes - slotStartMinutes;
    if (minutesFromSlotStart < 0) minutesFromSlotStart += 24 * 60;

    // limitar al rango visible de la franja
    if (minutesFromSlotStart < 0) minutesFromSlotStart = 0;
    if (minutesFromSlotStart > slotDuration)
      minutesFromSlotStart = slotDuration;

    return (
      UI_CONFIG.LOGO_COLUMN_WIDTH +
      (minutesFromSlotStart / 60) * UI_CONFIG.PIXELS_PER_HOUR
    );
  });

  /**
   * Devuelve el valor CSS para grid-template-columns basado en MINUTES_PER_COLUMN.
   * Uso en template: [style.gridTemplateColumns]="gridTemplateColumns"
   */
  public get gridTemplateColumns(): string {
    const columnsPerSlot =
      UI_CONFIG.MINUTES_PER_SLOT / UI_CONFIG.MINUTES_PER_COLUMN; // e.g. 6
    const totalColumns = UI_CONFIG.MAX_GRID_COLUMNS * columnsPerSlot; // e.g. 42
    return `repeat(${totalColumns}, 1fr)`;
  }

  // ===============================================
  // COMPONENT PROPERTIES
  // ===============================================

  /** ID único del componente */
  public readonly componentId = `pl-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  /** Intervalo para actualización del indicador de tiempo */
  private updateInterval: any;

  // ===============================================
  // LIFECYCLE METHODS
  // ===============================================

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    this.initializeComponent();
    this.initializeDataStreams();

    if (isPlatformBrowser(this.platformId)) {
      this.initializeBrowserFeatures();
    }
  }

  /**
   * Después de la inicialización de la vista
   */
  ngAfterViewInit(): void {
    if (this.hasChannels() && isPlatformBrowser(this.platformId)) {
      this.updateTimeIndicator();
    }
  }

  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy(): void {
    this.cleanup();
  }

  // ===============================================
  // INITIALIZATION METHODS
  // ===============================================

  /**
   * Configura el estado inicial del componente
   * @private
   */
  private initializeComponent(): void {
    const currentSlot = this.facade.getCurrentTimeSlot();
    this.activeTimeSlot.set(currentSlot);

    const timeSlots = this.facade.getTimeSlots();
    if (timeSlots[currentSlot]) {
      this.currentTimeSlot.set(timeSlots[currentSlot][0]);
    }

    // Mostrar indicador SOLO si es hoy y la franja seleccionada es la franja actual
    this.showTimeIndicator.set(
      this.activeDay() === 0 &&
        this.activeTimeSlot() === this.facade.getCurrentTimeSlot()
    );
  }

  /**
   * Configura las suscripciones a streams de datos
   * @private
   */
  private initializeDataStreams(): void {
    // Stream principal de datos
    this.facade
      .getProgramListData()
      .pipe(
        filter((data) => data !== null && data !== undefined),
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => this.handleDataUpdate(data),
        error: (error) => this.handleDataError(error),
      });

    // Stream de estado de carga
    this.facade
      .getLoadingState()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => {
        this.isLoading.set(loading);
        this.cdr.markForCheck();
      });

    // Stream de errores
    this.facade
      .getErrorState()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => {
        this.error.set(error);
        this.cdr.markForCheck();
      });
  }

  /**
   * Configura funcionalidades específicas del navegador
   * @private
   */
  private initializeBrowserFeatures(): void {
    this.facade.updateScreenDimensions();
    this.setupTimeIndicatorUpdates();
    this.loadChannelLogos();
  }

  // ===============================================
  // DATA HANDLING METHODS
  // ===============================================

  /**
   * Maneja la actualización de datos exitosa
   * @param data - Datos de canales recibidos
   * @private
   */
  private handleDataUpdate(data: IProgramListData[]): void {
    this.isLoading.set(false);
    this.error.set(null);

    if (data && Array.isArray(data) && data.length > 0) {
      const validChannels = data.filter(
        (canal) => canal && canal.channel && Array.isArray(canal.channels)
      );
      this.canalesConProgramas.set(validChannels);

      // DEBUG: volcado resumido de los programas recibidos
      if (this.DEBUG) {
        this.debugLogChannels(validChannels, 'handleDataUpdate');
      }
    } else {
      this.canalesConProgramas.set([]);
      if (this.DEBUG) {
        console.debug('PL: handleDataUpdate -> no channels received', {
          activeDay: this.activeDay(),
          activeTimeSlot: this.activeTimeSlot(),
        });
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Maneja errores en la carga de datos
   * @param error - Error ocurrido
   * @private
   */
  private handleDataError(error: any): void {
    this.isLoading.set(false);
    this.error.set(error?.message || 'Error cargando datos');
    this.canalesConProgramas.set([]);
    this.cdr.markForCheck();
  }

  // ===============================================
  // CORE GRID CALCULATION METHODS
  // ===============================================

  /**
   * Convierte minutos relativos a columna de grid (1-based) usando MINUTES_PER_COLUMN.
   * Maneja offsets negativos en franjas nocturnas añadiendo 1440 cuando procede.
   */
  private minutesToGridColumn(
    minutes: number,
    slotStartMinutes: number,
    totalColumns: number,
    isNightSlot: boolean
  ): number {
    const unit = UI_CONFIG.MINUTES_PER_COLUMN;
    let delta = minutes - slotStartMinutes;

    if (delta < 0 && isNightSlot) {
      delta += 1440;
    }

    if (delta < 0) delta = 0;
    const colIndex = Math.floor(delta / unit); // 0-based
    return Math.max(1, Math.min(totalColumns, colIndex + 1));
  }

  /**
   * Verifica si la franja horaria actual es nocturna
   * Una franja es nocturna si contiene '00:00'
   * @param currentHours - Array de horas de la franja
   * @returns true si es franja nocturna
   * @private
   */
  private isNightTimeSlot(currentHours: string[]): boolean {
    return currentHours?.includes('00:00') ?? false;
  }

  /**
   * Calcula el minuto de fin de la franja actual
   * CORREGIDO: Ahora calcula correctamente para todas las franjas
   * @param currentHours - Array de horas de la franja
   * @returns Minutos desde medianoche donde termina la franja
   * @private
   */
  private getSlotEndMinutes(currentHours: string[]): number {
    if (!currentHours?.length) return 1440;

    const lastHour = currentHours[currentHours.length - 1];
    const [hours, minutes] = lastHour.split(':').map(Number);
    let lastHourMinutes = hours * 60 + (minutes || 0);

    // fin nominal de la franja
    let slotEndMinutes = lastHourMinutes + UI_CONFIG.MINUTES_PER_SLOT;

    // Si la franja atraviesa medianoche, normalizamos para que sea > slotStartMinutes
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    if (slotEndMinutes <= slotStartMinutes) {
      slotEndMinutes += 1440;
    }

    return slotEndMinutes;
  }

  /**
   * Filtra programas que son visibles en la franja horaria actual
   * Maneja casos especiales de franjas nocturnas y programas que cruzan medianoche
   * @param programs - Array de programas a filtrar
   * @returns Array de programas visibles en la franja
   * @private
   */
  private getVisiblePrograms(programs: IProgramItem[]): IProgramItem[] {
    if (!programs?.length) return [];

    const currentHours = this.currentHours();
    if (!currentHours.length) return programs;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    // NUEVO: Obtener timestamp del slot para el día activo
    const slotStartTs = this.getSlotStartTimestamp(
      this.activeDay(),
      slotStartMinutes
    );
    const slotEndTs =
      slotStartTs + (slotEndMinutes - slotStartMinutes) * 60_000;

    const DAY_MS = 24 * 60 * 60 * 1000;

    return programs.filter((programa) => {
      // Si el programa trae fecha completa (ISO-like), usar timestamps y activeDay
      const hasDate = /\d{4}-\d{2}-\d{2}T/.test(String(programa.start));
      if (hasDate) {
        const startTs = Date.parse(String(programa.start));
        let endTs = Date.parse(String(programa.stop));
        if (isNaN(startTs) || isNaN(endTs)) {
          return false; // Si no se puede parsear, excluir
        }
        if (endTs <= startTs) endTs += DAY_MS;

        // CORREGIDO: Verificar que el programa pertenece al día activo
        const programIntersectsSlot =
          startTs < slotEndTs && endTs > slotStartTs;

        if (!programIntersectsSlot) {
          // Probar shifts de días cercanos (por si hay desfase de zona horaria)
          const approxShiftDays = Math.round((slotStartTs - startTs) / DAY_MS);
          for (let k = approxShiftDays - 1; k <= approxShiftDays + 1; k++) {
            const adjStart = startTs + k * DAY_MS;
            const adjEnd = endTs + k * DAY_MS;
            if (adjStart < slotEndTs && adjEnd > slotStartTs) {
              return true;
            }
          }
          return false;
        }

        return true;
      }

      // Si no trae fecha, usar la lógica por minutos normalizados
      const programStartMinutes = this.getProgramStartMinutes(programa);
      const programEndMinutes = this.getProgramEndMinutes(programa);

      const { start: normStart, end: normEnd } = this.normalizeProgramRange(
        programStartMinutes,
        programEndMinutes,
        slotStartMinutes
      );

      return normEnd > slotStartMinutes && normStart < slotEndMinutes;
    });
  }
  /**
   * Devuelve timestamp UTC de inicio del slot para el día dado (activeDay)
   * @param dayOffset - 0=hoy,1=mañana,...
   * @param slotStartMinutes - minutos desde medianoche (HH:MM) del slot
   * @returns número ms UTC
   * @private
   */
  private getSlotStartTimestamp(
    dayOffset: number,
    slotStartMinutes: number
  ): number {
    const now = new Date();
    // Fecha base en UTC (00:00 UTC del día actual)
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate() + dayOffset;
    const hours = Math.floor(slotStartMinutes / 60);
    const minutes = slotStartMinutes % 60;
    return Date.UTC(year, month, date, hours, minutes, 0, 0);
  }

  /**
   * Obtiene timestamp UTC de inicio real del programa
   * @private
   */
  private getProgramStartTimestamp(programa: IProgramItem): number {
    try {
      return Date.parse(programa.start);
    } catch {
      return 0;
    }
  }

  /**
   * Obtiene timestamp UTC de fin real del programa.
   * Si el stop <= start asume día siguiente y suma 24h.
   * @private
   */
  private getProgramEndTimestamp(programa: IProgramItem): number {
    try {
      const startTs = Date.parse(programa.start);
      let endTs = Date.parse(programa.stop);
      if (isNaN(endTs) || isNaN(startTs)) return endTs || startTs;
      if (endTs <= startTs) {
        endTs += 24 * 60 * 60 * 1000; // sumar 1 día
      }
      return endTs;
    } catch {
      return 0;
    }
  }

  /**
   * Convierte minutos (posiblemente >1440) a "HH:MM" donde 1440 -> "00:00"
   * @private
   */
  private formatMinutesToHHMM(totalMinutes: number): string {
    const norm = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
    const hh = Math.floor(norm / 60)
      .toString()
      .padStart(2, '0');
    const mm = (norm % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /**
   * Verifica si un programa es visible en franja nocturna
   * @param programa - Programa a evaluar
   * @param programStart - Minutos de inicio del programa
   * @param programEnd - Minutos de fin del programa
   * @param crossesMidnight - Si el programa cruza medianoche
   * @param slotStartMinutes - Inicio de la franja en minutos (1260 = 21:00)
   * @param slotEndMinutes - Fin de la franja en minutos (180 = 03:00)
   * @returns true si el programa es visible
   * @private
   */
  private isProgramVisibleInNightSlot(
    programa: IProgramItem,
    programStart: number,
    programEnd: number,
    crossesMidnight: boolean,
    slotStartMinutes: number,
    slotEndMinutes: number
  ): boolean {
    // Normalizar ambos extremos respecto a slotStart para comparar en la misma escala
    const { start: normStart, end: normEnd } = this.normalizeProgramRange(
      programStart,
      programEnd,
      slotStartMinutes
    );

    // Si la franja comienza a medianoche (slotStartMinutes === 0),
    // el slotEndMinutes puede ser por ejemplo 180 (03:00). norm* ya están en la
    // escala [slotStart, slotStart + 1440), así que basta comprobar la intersección.
    return normEnd > slotStartMinutes && normStart < slotEndMinutes;
  }

  /**
   * Verifica si un programa es visible en franja diurna
   * @param programStart - Minutos de inicio del programa
   * @param programEnd - Minutos de fin del programa
   * @param slotStartMinutes - Inicio de la franja en minutos
   * @param slotEndMinutes - Fin de la franja en minutos
   * @returns true si el programa es visible
   * @private
   */
  private isProgramVisibleInDaySlot(
    programStart: number,
    programEnd: number,
    slotStartMinutes: number,
    slotEndMinutes: number
  ): boolean {
    return programEnd > slotStartMinutes && programStart < slotEndMinutes;
  }

  /**
   * Calcula la columna de inicio en el grid para un programa
   * @param programa - Programa a posicionar
   * @returns Número de columna (1-7)
   */
  public getProgramGridColumn(programa: IProgramItem): number {
    const currentHours = this.currentHours();
    if (!currentHours.length) return 1;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const isNightSlot = this.isNightTimeSlot(currentHours);

    const columnsPerSlot =
      UI_CONFIG.MINUTES_PER_SLOT / UI_CONFIG.MINUTES_PER_COLUMN; // e.g. 6
    const totalColumns = UI_CONFIG.MAX_GRID_COLUMNS * columnsPerSlot; // e.g. 42

    // Normalizar rango relativo al inicio de la franja para cubrir cruces de medianoche
    const { start: normalizedStart } = this.normalizeProgramRange(
      programStartMinutes,
      programEndMinutes,
      slotStartMinutes
    );

    // Usa la función helper para mapear minutos a columna en la rejilla fina
    return this.minutesToGridColumn(
      normalizedStart,
      slotStartMinutes,
      totalColumns,
      isNightSlot
    );
  }
  /**
   * Calcula la columna de fin en el grid para un programa
   * @param programa - Programa a posicionar
   * @returns Número de columna final (2-8)
   */
  public getProgramGridColumnEnd(programa: IProgramItem): number {
    const currentHours = this.currentHours();
    if (!currentHours.length) return 2;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);
    const isNightSlot = this.isNightTimeSlot(currentHours);

    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);

    // Normalizar inicio/fin respecto al slot para evitar inconsistencias al cruzar medianoche
    const { start: normalizedStart, end: normalizedEnd } =
      this.normalizeProgramRange(
        programStartMinutes,
        programEndMinutes,
        slotStartMinutes
      );

    let effectiveProgramEndMinutes: number;

    const programInVisibleSlot = this.isProgramInVisibleSlot(
      programa,
      slotStartMinutes,
      slotEndMinutes,
      isNightSlot
    );

    if (!programInVisibleSlot) {
      effectiveProgramEndMinutes = normalizedEnd;
    } else if (isNightSlot && crossesMidnight) {
      // mantener el end ya normalizado (puede ser >1440)
      effectiveProgramEndMinutes = normalizedEnd;
    } else if (isNightSlot) {
      effectiveProgramEndMinutes = Math.min(normalizedEnd, slotEndMinutes);
    } else {
      effectiveProgramEndMinutes = Math.min(normalizedEnd, slotEndMinutes);
    }

    // Usar normalizedStart para garantizar coherencia entre start y end
    return this.calculateGridColumnEnd(
      programa,
      normalizedStart,
      effectiveProgramEndMinutes,
      slotStartMinutes,
      isNightSlot,
      crossesMidnight
    );
  }

  /**
   * Verifica si un programa está realmente dentro de la franja visible
   * @param programa - Programa a verificar
   * @param slotStartMinutes - Inicio de la franja en minutos
   * @param slotEndMinutes - Final de la franja en minutos
   * @param isNightSlot - Si es franja nocturna
   * @returns true si el programa está en la franja visible
   * @private
   */
  private isProgramInVisibleSlot(
    programa: IProgramItem,
    slotStartMinutes: number,
    slotEndMinutes: number,
    isNightSlot: boolean
  ): boolean {
    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);

    if (isNightSlot) {
      return (
        programStartMinutes >= slotStartMinutes ||
        programEndMinutes <= slotEndMinutes ||
        (programStartMinutes < slotStartMinutes &&
          programEndMinutes > slotStartMinutes)
      );
    } else {
      return (
        programStartMinutes < slotEndMinutes &&
        programEndMinutes > slotStartMinutes
      );
    }
  }

  /**
   * Calcula minutos de fin efectivos para programa nocturno que cruza medianoche
   * @param programEndMinutes - Minutos de fin del programa
   * @param slotEndMinutes - Minutos de fin de la franja
   * @returns Minutos de fin efectivos
   * @private
   */
  private calculateNightCrossingEndMinutes(
    programEndMinutes: number,
    slotEndMinutes: number
  ): number {
    return programEndMinutes <= slotEndMinutes
      ? programEndMinutes
      : slotEndMinutes;
  }

  /**
   * Calcula la columna final del grid basada en la duración efectiva
   * @param programa - Programa a posicionar
   * @param programStartMinutes - Inicio del programa en minutos
   * @param effectiveEndMinutes - Fin efectivo en minutos
   * @param slotStartMinutes - Inicio de franja en minutos
   * @param isNightSlot - Si es franja nocturna
   * @param crossesMidnight - Si cruza medianoche
   * @returns Número de columna final
   * @private
   */
  private calculateGridColumnEnd(
    programa: IProgramItem,
    programStartMinutes: number,
    effectiveEndMinutes: number,
    slotStartMinutes: number,
    isNightSlot: boolean,
    crossesMidnight: boolean
  ): number {
    const columnsPerSlot =
      UI_CONFIG.MINUTES_PER_SLOT / UI_CONFIG.MINUTES_PER_COLUMN;
    const totalColumns = UI_CONFIG.MAX_GRID_COLUMNS * columnsPerSlot;

    const startColumn = this.getProgramGridColumn(programa);

    // Calcular columna final basada en MINUTES_PER_COLUMN (usar ceil para abarcar duración)
    let endMinutesFromSlotStart = effectiveEndMinutes - slotStartMinutes;
    if (endMinutesFromSlotStart < 0 && isNightSlot) {
      endMinutesFromSlotStart += 1440;
    }
    if (endMinutesFromSlotStart < 1) endMinutesFromSlotStart = 1;

    const unit = UI_CONFIG.MINUTES_PER_COLUMN;
    const endColIndex = Math.ceil(endMinutesFromSlotStart / unit); // 0-based slots -> ceil
    const finalEndColumn = Math.max(
      startColumn + 1,
      Math.min(totalColumns + 1, endColIndex + 1)
    );

    return finalEndColumn;
  }
  /**
   * Obtiene programas organizados en capas sin solapamientos
   * VERSIÓN CORREGIDA: Usa el nuevo sistema de detección de solapamientos
   * @param programs - Array de programas a organizar
   * @returns Array de arrays, cada uno representando una capa
   */
  public getProgramLayers(canal: IProgramListData): ProgramWithPosition[][] {
    if (!canal || !Array.isArray(canal.channels) || canal.channels.length === 0)
      return [];

    // CRÍTICO: Filtrar primero por día activo
    const programsForActiveDay = this.filterProgramsByActiveDay(
      canal.channels || [],
      this.activeDay()
    );
    // Combinar programas del canal con posibles continuaciones del día anterior
    // mergeContinuationProgramsIfAny espera IProgramListData, pero podemos usar
    // una versión que acepte programas ya filtrados — reutilizamos la función
    // existente añadiendo temporalmente los programas filtrados en una copia del canal.
    const canalCopy: IProgramListData = {
      ...canal,
      channels: programsForActiveDay,
    };

    // Combinar programas del canal con posibles continuaciones del día anterior
    const combinedPrograms = this.mergeContinuationProgramsIfAny(canalCopy);

    const visiblePrograms = this.getVisiblePrograms(combinedPrograms);
    if (!visiblePrograms.length) return [];

    // Calcular posiciones para cada programa
    const programsWithPositions: ProgramWithPosition[] = visiblePrograms.map(
      (programa) => {
        const slotStartMinutes = this.parseTimeToMinutes(
          this.currentHours()[0]
        );
        const { start: normStart, end: normEnd } = this.normalizeProgramRange(
          this.getProgramStartMinutes(programa),
          this.getProgramEndMinutes(programa),
          slotStartMinutes
        );

        return {
          ...programa,
          gridColumnStart: this.getProgramGridColumn(programa),
          gridColumnEnd: this.getProgramGridColumnEnd(programa),
          layerIndex: 0, // Se asignará después
          visibleStartTime: this.getProgramVisibleStartTime(programa),
          visibleEndTime: this.getProgramVisibleEndTime(programa),
          isCutAtStart: this.isProgramCutAtStart(programa),
          isCutAtEnd: this.isProgramCutAtEnd(programa),
          _normStartMinutes: normStart,
          _normEndMinutes: normEnd,
        };
      }
    );

    // Ordenar por columna de inicio y duración
    programsWithPositions.sort((a, b) => {
      if (a.gridColumnStart !== b.gridColumnStart) {
        return a.gridColumnStart - b.gridColumnStart;
      }
      // Si empiezan en la misma columna, el más largo va primero
      return (
        b.gridColumnEnd -
        b.gridColumnStart -
        (a.gridColumnEnd - a.gridColumnStart)
      );
    });

    // Asignar programas a capas evitando solapamientos
    const layers: ProgramWithPosition[][] = [];

    programsWithPositions.forEach((program) => {
      // Buscar la primera capa donde el programa cabe sin solaparse
      let layerIndex = 0;
      let placed = false;

      while (!placed && layerIndex < UI_CONFIG.MAX_LAYERS) {
        if (!layers[layerIndex]) {
          layers[layerIndex] = [];
        }

        // Verificar si el programa se solapa con alguno en esta capa
        const hasOverlap = layers[layerIndex].some((existingProgram) =>
          this.programsOverlapInGrid(program, existingProgram)
        );

        if (!hasOverlap) {
          program.layerIndex = layerIndex;
          layers[layerIndex].push(program);
          placed = true;
        } else {
          layerIndex++;
        }
      }

      // Si no se pudo colocar en ninguna capa (muy raro), crear nueva capa
      if (!placed && layerIndex < UI_CONFIG.MAX_LAYERS) {
        program.layerIndex = layerIndex;
        layers[layerIndex] = [program];
      }
    });

    return layers;
  }

  /**
   * Filtra un array de programas para que pertenezcan al día indicado (UTC).
   * Incluye programas que intersectan el día (si empiezan el día anterior y continúan).
   * @param programs - array de IProgramItem
   * @param dayIndex - 0 = hoy, 1 = mañana, ...
   * @returns programas que pertenecen (o intersectan) ese día
   * @private
   */
  private filterProgramsByActiveDay(
    programs: IProgramItem[],
    dayIndex: number
  ): IProgramItem[] {
    if (!Array.isArray(programs) || programs.length === 0) return [];

    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate() + dayIndex;
    const dayStartTs = Date.UTC(year, month, date, 0, 0, 0, 0);
    const dayEndTs = dayStartTs + DAY_MS;

    return programs.filter((p) => {
      let startTs = Date.parse(String(p.start));
      let endTs = Date.parse(String(p.stop));

      // Si no hay fechas parseables, intentar interpretar como HH:MM en la fecha del dayIndex
      if (isNaN(startTs)) {
        const [sh = '0', sm = '0'] = String(p.start || '00:00').split(':');
        const sTs = Date.UTC(year, month, date, Number(sh), Number(sm), 0, 0);
        // para stop intentamos lo mismo
        if (isNaN(endTs)) {
          const [eh = '0', em = '0'] = String(p.stop || sh + ':00').split(':');
          endTs = Date.UTC(year, month, date, Number(eh), Number(em), 0, 0);
          if (endTs <= sTs) endTs += DAY_MS;
        }
        // usar sTs como start
        if (!isNaN(sTs)) {
          // reasignar startTs para comparación
          // @ts-ignore — reasignamos local var para comparar
          (startTs as unknown) = sTs;
        }
      }

      if (isNaN(endTs)) {
        // si tampoco hay endTs válidos, ignorar (no incluir)
        return false;
      }

      // normalizar si end <= start (paso a día siguiente)
      if (endTs <= startTs) endTs += DAY_MS;

      // incluir si el intervalo intersecta [dayStartTs, dayEndTs)
      return startTs < dayEndTs && endTs > dayStartTs;
    });
  }

  /**
   * Si existen datos del mismo canal que pertenezcan al día anterior y continúan
   * en la franja actual, los añade (sin duplicados) al array de programas.
   * @param canal - Entrada del canal actual
   * @returns Array combinado de programas
   * @private
   */
  private mergeContinuationProgramsIfAny(
    canal: IProgramListData
  ): IProgramItem[] {
    const original = Array.isArray(canal.channels) ? [...canal.channels] : [];
    if (original.length === 0) return original;

    // slot start en UTC ms para activeDay
    const currentHours = this.currentHours();
    if (!currentHours.length) return original;
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotStartTs = this.getSlotStartTimestamp(
      this.activeDay(),
      slotStartMinutes
    );

    // clave del canal
    const key =
      canal.id ||
      canal.channel?.id ||
      (canal.channel ? String(canal.channel) : '');

    const seen = new Set<string>();
    original.forEach((p) => seen.add(this.programUniqueKey(p)));

    // Buscar en el dataset global programas del mismo canal que puedan pertenecer al día anterior
    const candidates = this.canalesConProgramas()
      .filter((c) => (c.id || c.channel?.id) === key)
      .flatMap((c) => c.channels || []);

    for (const prog of candidates) {
      const keyProg = this.programUniqueKey(prog);
      if (seen.has(keyProg)) continue;

      const startTs = this.getProgramStartTimestamp(prog);
      let endTs = this.getProgramEndTimestamp(prog);
      const DAY_MS = 24 * 60 * 60 * 1000;
      if (endTs <= startTs) endTs += DAY_MS;

      // incluir solo si empieza ANTES del slot y termina DESPUÉS del inicio del slot
      if (startTs < slotStartTs && endTs > slotStartTs) {
        original.push(prog);
        seen.add(keyProg);
      }
    }

    return original;
  }

  /**
   * Genera una clave única simple para identificar un programa (id o start-stop)
   * @private
   */
  private programUniqueKey(p: IProgramItem): string {
    if (!p) return '';
    if (p.id) return String(p.id);
    return `${String(p.start || '')}::${String(p.stop || '')}`;
  }

  /**
   * Verifica si dos programas se solapan en el grid
   * NUEVO MÉTODO: Verifica solapamiento basado en posiciones del grid
   * @param program1 - Primer programa con posición
   * @param program2 - Segundo programa con posición
   * @returns true si se solapan en el grid
   */
  private programsOverlapInGrid(
    program1: ProgramWithPosition,
    program2: ProgramWithPosition
  ): boolean {
    // Si disponemos de minutos normalizados, usarlos para evitar errores por redondeo de columnas
    if (
      typeof program1._normStartMinutes === 'number' &&
      typeof program1._normEndMinutes === 'number' &&
      typeof program2._normStartMinutes === 'number' &&
      typeof program2._normEndMinutes === 'number'
    ) {
      return this.minutesOverlap(
        program1._normStartMinutes,
        program1._normEndMinutes,
        program2._normStartMinutes,
        program2._normEndMinutes
      );
    }

    // Fallback: comprobación por columnas (existente)
    return !(
      program1.gridColumnEnd <= program2.gridColumnStart ||
      program2.gridColumnEnd <= program1.gridColumnStart
    );
  }

  // ADICIÓN: comprobación de solapamiento en minutos (intervalos [start, end) )
  private minutesOverlap(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number
  ): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  /**
   * Encuentra la primera capa donde el programa puede caber sin solaparse
   * @param program - Programa a colocar
   * @param layers - Capas existentes
   * @returns Índice de capa disponible o -1 si necesita nueva capa
   * @private
   */
  private findAvailableLayer(
    program: IProgramItem,
    layers: IProgramItem[][]
  ): number {
    const programStart = this.getProgramStartMinutes(program);
    const programEnd = this.getProgramEndMinutes(program);

    for (let i = 0; i < layers.length; i++) {
      const canFit = !layers[i].some((existingProgram) => {
        const existingStart = this.getProgramStartMinutes(existingProgram);
        const existingEnd = this.getProgramEndMinutes(existingProgram);
        return this.programsOverlap(
          { start: programStart, end: programEnd },
          { start: existingStart, end: existingEnd }
        );
      });

      if (canFit) return i;
    }

    return -1;
  }

  /**
   * Verifica si dos programas se solapan en tiempo
   * @param program1 - Primer programa
   * @param program2 - Segundo programa
   * @returns true si se solapan
   * @private
   */
  private programsOverlap(
    program1: { start: number; end: number },
    program2: { start: number; end: number }
  ): boolean {
    const p1CrossesMidnight = program1.end < program1.start;
    const p2CrossesMidnight = program2.end < program2.start;

    if (!p1CrossesMidnight && !p2CrossesMidnight) {
      // Caso simple: ninguno cruza medianoche
      return program1.start < program2.end && program1.end > program2.start;
    }

    // Casos complejos con cruces de medianoche
    return this.complexOverlapCheck(
      program1,
      program2,
      p1CrossesMidnight,
      p2CrossesMidnight
    );
  }

  /**
   * Verificación compleja de solapamiento para programas que cruzan medianoche
   * @param program1 - Primer programa
   * @param program2 - Segundo programa
   * @param p1CrossesMidnight - Si programa 1 cruza medianoche
   * @param p2CrossesMidnight - Si programa 2 cruza medianoche
   * @returns true si se solapan
   * @private
   */
  private complexOverlapCheck(
    program1: { start: number; end: number },
    program2: { start: number; end: number },
    p1CrossesMidnight: boolean,
    p2CrossesMidnight: boolean
  ): boolean {
    if (p1CrossesMidnight && p2CrossesMidnight) {
      // Ambos cruzan medianoche - siempre se solapan en algún punto
      return true;
    }

    if (p1CrossesMidnight) {
      // Solo program1 cruza medianoche
      return (
        (program2.start < 1440 && program2.end > program1.start) ||
        (program2.start < program1.end && program2.end > 0)
      );
    }

    if (p2CrossesMidnight) {
      // Solo program2 cruza medianoche
      return (
        (program1.start < 1440 && program1.end > program2.start) ||
        (program1.start < program2.end && program1.end > 0)
      );
    }

    return false;
  }

  // ===============================================
  // UTILITY METHODS
  // ===============================================

  /**
   * Convierte string de tiempo a minutos desde medianoche
   * @param timeString - Tiempo en formato "HH:MM"
   * @returns Minutos desde medianoche
   * @private
   */
  private parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Obtiene minutos de inicio de un programa
   * @param programa - Programa a evaluar
   * @returns Minutos desde medianoche (UTC)
   * @private
   */
  private getProgramStartMinutes(programa: IProgramItem): number {
    if (!programa.start) return 0;
    try {
      const date = new Date(programa.start);
      // CORRECCIÓN: Usar UTC en lugar de local para evitar problemas de zona horaria
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    } catch {
      return 0;
    }
  }

  /**
   * Obtiene minutos de fin de un programa
   * @param programa - Programa a evaluar
   * @returns Minutos desde medianoche (UTC)
   * @private
   */
  private getProgramEndMinutes(programa: IProgramItem): number {
    if (!programa.stop || !programa.start) return 0;
    try {
      const startDate = new Date(programa.start);
      const endDate = new Date(programa.stop);

      const startMinutes =
        startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
      let endMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();

      // Si la hora de fin es igual o anterior a la de inicio, asumimos que es al día siguiente
      if (
        endDate.getTime() <= startDate.getTime() ||
        endMinutes <= startMinutes
      ) {
        endMinutes += 1440;
      }

      return endMinutes;
    } catch {
      return 0;
    }
  }

  /**
   * Verifica si un programa cruza medianoche
   * @param programa - Programa a evaluar
   * @returns true si cruza medianoche
   * @private
   */
  private programCrossesMidnight(programa: IProgramItem): boolean {
    if (!programa.start || !programa.stop) return false;

    try {
      const startMinutes = this.getProgramStartMinutes(programa);
      const endMinutes = this.getProgramEndMinutes(programa);

      // Si el fin normalizado es mayor que 1440 (o mayor que el inicio), cruza medianoche
      return endMinutes > 1440 || endMinutes > startMinutes;
    } catch {
      return false;
    }
  }
  /**
   * Calcula la duración visible de un programa en la franja actual
   * @param programa - Programa a evaluar
   * @returns Duración en minutos
   * @private
   */
  private calculateVisibleDuration(programa: IProgramItem): number {
    const currentHours = this.currentHours();
    if (!currentHours.length) return 30;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const isNightSlot = this.isNightTimeSlot(currentHours);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);

    if (isNightSlot && crossesMidnight) {
      return this.calculateNightCrossingDuration(
        programStartMinutes,
        programEndMinutes,
        slotStartMinutes,
        slotEndMinutes
      );
    }

    // Cálculo normal
    const visibleStartMinutes = Math.max(programStartMinutes, slotStartMinutes);
    const visibleEndMinutes = isNightSlot
      ? Math.min(programEndMinutes, 1440)
      : Math.min(programEndMinutes, slotEndMinutes);

    return Math.max(1, visibleEndMinutes - visibleStartMinutes);
  }

  /**
   * Calcula duración visible para programa nocturno que cruza medianoche
   * @param programStartMinutes - Inicio del programa
   * @param programEndMinutes - Fin del programa
   * @param slotStartMinutes - Inicio de la franja
   * @param slotEndMinutes - Fin de la franja
   * @returns Duración visible en minutos
   * @private
   */
  private calculateNightCrossingDuration(
    programStartMinutes: number,
    programEndMinutes: number,
    slotStartMinutes: number,
    slotEndMinutes: number
  ): number {
    const visibleStartMinutes = Math.max(programStartMinutes, slotStartMinutes);
    const durationUntilMidnight = 1440 - visibleStartMinutes;
    const durationAfterMidnight = Math.min(programEndMinutes, slotEndMinutes);

    return Math.max(1, durationUntilMidnight + durationAfterMidnight);
  }

  /**
   * Calcula la duración real de un programa (manejando cruces de medianoche)
   * @param programa - Programa a evaluar
   * @returns Duración real en minutos
   * @private
   */
  private calculateRealDuration(programa: IProgramItem): number {
    const startMinutes = this.getProgramStartMinutes(programa);
    const endMinutes = this.getProgramEndMinutes(programa);

    if (this.programCrossesMidnight(programa)) {
      return 1440 - startMinutes + endMinutes;
    }

    return endMinutes - startMinutes;
  }

  // ===============================================
  // EVENT HANDLERS
  // ===============================================

  public onDayChanged(dayIndex: number): void {
    if (this.activeDay() === dayIndex) return;

    const dayInfo = this.daysInfo()[dayIndex];
    if (!dayInfo) return;

    // CRÍTICO: Actualizar el día activo ANTES de cualquier recálculo
    this.activeDay.set(dayIndex);

    // Mostrar indicador SOLO si es hoy y la franja activa coincide con la franja actual
    this.showTimeIndicator.set(
      dayIndex === 0 &&
        this.activeTimeSlot() === this.facade.getCurrentTimeSlot()
    );

    // Si volvemos a "hoy" actualizamos la franja activa al slot actual
    if (dayIndex === 0) {
      const currentSlot = this.facade.getCurrentTimeSlot();
      this.onTimeSlotChanged(currentSlot);
    }

    // Reset UI state que puede quedar stale (banners/selecciones/scroll)
    this.selectedProgram.set(null);
    this.expandedChannels.set(new Set());

    // NUEVO: Solicitar datos del nuevo día al facade
    try {
      const f: any = this.facade as any;
      if (typeof f.loadProgramsForDay === 'function') {
        f.loadProgramsForDay(dayIndex);
      } else if (typeof f.fetchProgramsForDay === 'function') {
        f.fetchProgramsForDay(dayIndex);
      } else if (typeof f.setActiveDay === 'function') {
        f.setActiveDay(dayIndex);
      } else if (typeof f.refreshData === 'function') {
        // Fallback: si el facade tiene refreshData, úsalo
        f.refreshData();
      }
    } catch (error) {
      console.warn(
        'No se pudo solicitar datos del nuevo día al facade:',
        error
      );
    }

    // Forzar recálculo completo del componente
    this.cdr.detectChanges();

    // Resetear virtual scroll
    try {
      this.virtualScrollViewport?.checkViewportSize();
      this.virtualScrollViewport?.scrollToIndex(0);
    } catch {
      // noop
    }

    // DEBUG: log al cambiar de día
    if (this.DEBUG) {
      console.groupCollapsed(`PL: onDayChanged -> day=${dayIndex}`);
      console.debug('activeDay:', this.activeDay());
      console.debug('activeTimeSlot:', this.activeTimeSlot());
      console.debug('currentTimeSlot:', this.currentTimeSlot());
      this.debugLogChannels(
        this.canalesConProgramas(),
        `onDayChanged (day ${dayIndex})`
      );
      console.groupEnd();
    }

    this.dayChanged.emit({ dayIndex, dayInfo });
  }

  /**
   * DEBUG helper: imprime un resumen compacto de los canales y sus primeros programas
   * @param channels - array de IProgramListData
   * @param ctx - contexto del log
   */
  /**
   * DEBUG helper: imprime un resumen compacto de los canales y sus primeros programas
   * @param channels - array de IProgramListData
   * @param ctx - contexto del log
   */
  private debugLogChannels(channels: IProgramListData[], ctx = ''): void {
    if (!this.DEBUG) return;

    try {
      const list = channels || this.canalesConProgramas();
      const first = (list || [])[0];

      const summary = first
        ? {
            channelId: first.id || first.channel?.id || 'unknown',
            channelName: first.channel?.name || 'unknown',
            programsCount: Array.isArray(first.channels)
              ? first.channels.length
              : 0,
            sample: (first.channels || [])
              .slice(0, 1)
              .map((p: IProgramItem) => ({
                title:
                  typeof p.title === 'string'
                    ? p.title
                    : p.title?.value || 'sin título',
                start: p.start,
                stop: p.stop,
              })),
          }
        : null;

      console.debug(`PL DEBUG ${ctx}`, {
        activeDay: this.activeDay(),
        activeTimeSlot: this.activeTimeSlot(),
        currentHours: this.currentHours(),
        summary,
      });

      // Mostrar programas visibles del primer canal para diagnosticar cambios de día/franja
      if (first && Array.isArray(first.channels)) {
        try {
          const visible = this.getVisiblePrograms(first.channels);
          console.debug('PL: visible programs for first channel', {
            channelId: summary?.channelId,
            channelName: summary?.channelName,
            visibleCount: visible.length,
            sample: visible.slice(0, 5).map((p: IProgramItem) => ({
              title:
                typeof p.title === 'string'
                  ? p.title
                  : p.title?.value || 'sin título',
              start: p.start,
              stop: p.stop,
            })),
            activeDay: this.activeDay(),
            slotStart: this.currentTimeSlot(),
            currentHours: this.currentHours(),
          });
        } catch (e) {
          console.error(
            'PL DEBUG: error computing visible programs for first channel',
            e
          );
        }
      }
    } catch (e) {
      console.error('PL DEBUG: error dumping channels', e);
    }
  }
  /**
   * Maneja el cambio de franja horaria
   * @param slotIndex - Índice de la franja seleccionada
   */
  public onTimeSlotChanged(slotIndex: number): void {
    if (this.activeTimeSlot() === slotIndex || slotIndex < 0 || slotIndex >= 8)
      return;

    const timeSlots = this.facade.getTimeSlots();
    const selectedSlot = timeSlots[slotIndex];

    if (!selectedSlot) return;

    this.activeTimeSlot.set(slotIndex);
    this.currentTimeSlot.set(selectedSlot[0]);

    // Actualizar visibilidad del indicador: solo si estamos en "hoy" y la franja coincide con la franja actual real
    this.showTimeIndicator.set(
      this.activeDay() === 0 && slotIndex === this.facade.getCurrentTimeSlot()
    );

    // Debug simplificado solo para el primer canal en franja 00:00
    if (selectedSlot[0] === '00:00') {
      // ...existing debug code...
    }

    if (this.showTimeIndicator()) {
      this.updateTimeIndicator();
    }

    this.cdr.markForCheck();
  }

  private parseTimestampVariants(timestamp?: string): number[] {
    if (!timestamp) return [];
    const variants: number[] = [];

    const tryPush = (v: number | null | undefined) => {
      if (typeof v === 'number' && !isNaN(v) && !variants.includes(v))
        variants.push(v);
    };

    // 1) Tal cual
    tryPush(Date.parse(timestamp));

    // 2) Si no contiene zona horaria explícita, probar añadiendo 'Z'
    if (!/[zZ]|[+\-]\d{2}:?\d{2}$/.test(timestamp)) {
      tryPush(Date.parse(timestamp + 'Z'));
    }

    // 3) Si el formato es YYYY-MM-DDTHH:MM(:SS), construir con Date.UTC
    const m = String(timestamp).match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
    );
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      const hh = Number(m[4]);
      const mm = Number(m[5]);
      const ss = Number(m[6] || 0);
      tryPush(Date.UTC(y, mo, d, hh, mm, ss));
    }

    // Siempre devolver al menos una variante (puede ser NaN si todo falla)
    return variants.length ? variants : [Date.parse(timestamp)];
  }

  /**
   * Maneja la selección de un programa
   * @param channelIndex - Índice del canal
   * @param program - Programa seleccionado
   */
  public onProgramSelected(channelIndex: number, program: IProgramItem): void {
    this.closeAllDropdowns();

    if (
      this.selectedProgram()?.id === program.id &&
      this.isChannelExpanded(channelIndex)
    ) {
      this.selectedProgram.set(null);
      this.onChannelToggle(channelIndex);
      return;
    }

    // Cerrar otros canales expandidos
    const expandedChannels = this.expandedChannels();
    expandedChannels.forEach((expandedIndex) => {
      if (expandedIndex !== channelIndex) {
        this.onChannelToggle(expandedIndex);
      }
    });

    if (!this.isChannelExpanded(channelIndex)) {
      this.onChannelToggle(channelIndex);
    }

    this.selectedProgram.set(program);
    this.cdr.markForCheck();
  }

  /**
   * Alterna la expansión de un canal
   * @param index - Índice del canal
   */
  public onChannelToggle(index: number): void {
    const expanded = new Set(this.expandedChannels());

    if (expanded.has(index)) {
      expanded.delete(index);
      this.selectedChannel.set(-1);
      this.selectedProgram.set(null);
    } else {
      expanded.clear();
      expanded.add(index);
      this.selectedChannel.set(index);
    }

    this.expandedChannels.set(expanded);
    this.cdr.markForCheck();
  }

  // ===============================================
  // DROPDOWN METHODS
  // ===============================================

  /**
   * Alterna el dropdown de días
   */
  public toggleDayDropdown(): void {
    this.isDayDropdownOpen.set(!this.isDayDropdownOpen());
    this.isCategoryDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }

  /**
   * Alterna el dropdown de categorías
   */
  public toggleCategoryDropdown(): void {
    this.isCategoryDropdownOpen.set(!this.isCategoryDropdownOpen());
    this.isDayDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }

  /**
   * Alterna el dropdown de franjas horarias
   */
  public toggleTimeSlotDropdown(): void {
    this.isTimeSlotDropdownOpen.set(!this.isTimeSlotDropdownOpen());
    this.isDayDropdownOpen.set(false);
    this.isCategoryDropdownOpen.set(false);
    this.cdr.markForCheck();
  }

  /**
   * Cierra todos los dropdowns
   */
  public closeAllDropdowns(): void {
    this.isDayDropdownOpen.set(false);
    this.isCategoryDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }

  // ===============================================
  // CATEGORY FILTERING METHODS
  // ===============================================

  /**
   * Selecciona/deselecciona una categoría
   * @param category - Categoría a toggle
   */
  public onCategorySelected(category: string): void {
    const selectedCategories = new Set(this.selectedCategories());

    if (selectedCategories.has(category)) {
      selectedCategories.delete(category);
    } else {
      selectedCategories.add(category);
    }

    this.selectedCategories.set(selectedCategories);
    this.categorySelected.emit(Array.from(selectedCategories));
    this.cdr.markForCheck();
  }

  /**
   * Limpia el filtro de categorías
   */
  public clearCategoryFilter(): void {
    this.selectedCategories.set(new Set());
    this.categorySelected.emit([]);
    this.cdr.markForCheck();
  }

  /**
   * Verifica si un programa coincide con las categorías seleccionadas
   * @param programa - Programa a verificar
   * @param categories - Array de categorías seleccionadas
   * @returns true si coincide
   * @private
   */
  private programMatchesCategory(
    programa: IProgramItem,
    categories: string[]
  ): boolean {
    if (!programa?.category?.value) return false;

    const programCategories = programa.category.value
      .split(',')
      .map((cat) => this.normalizeCategoryName(cat.trim()))
      .filter((cat) => cat);

    return categories.some((category) =>
      programCategories.some(
        (programCategory) =>
          programCategory.toLowerCase() === category.toLowerCase()
      )
    );
  }

  /**
   * Normaliza inicio/fin de programa relativos al inicio de la franja (slotStartMinutes).
   * Devuelve start/end en la misma escala (>= slotStartMinutes), añadiendo 1440 si hace falta.
   * Esto permite mapear correctamente programas que cruzan medianoche.
   * @private
   */
  private normalizeProgramRange(
    programStartMinutes: number,
    programEndMinutes: number,
    slotStartMinutes: number
  ): { start: number; end: number } {
    // Normalizar fin respecto al inicio si el end no es posterior al start (cruce de medianoche)
    let start = programStartMinutes;
    let end = programEndMinutes;
    if (end <= start) {
      end += 1440;
    }

    // Asegurar que el intervalo esté en la misma "ventana" relativa al slot:
    // mover start/end hacia adelante en días completos hasta que end > slotStart
    while (end <= slotStartMinutes) {
      start += 1440;
      end += 1440;
    }

    // Si el programa empezó antes del inicio de la franja pero continúa dentro de ella,
    // mostrarlo desde el inicio de la franja (clamp start).
    if (start < slotStartMinutes && end > slotStartMinutes) {
      start = slotStartMinutes;
    }

    // Garantizar end > start
    if (end <= start) {
      end = start + 1;
    }

    return { start, end };
  }

  /**
   * Normaliza el nombre de una categoría
   * @param category - Categoría a normalizar
   * @returns Nombre normalizado
   * @private
   */
  private normalizeCategoryName(category: string): string {
    const normalizedCategory = category.toLowerCase().trim();

    const categoryMappings: Record<string, string> = {
      pelicula: 'Películas',
      peliculas: 'Películas',
      cine: 'Películas',
      serie: 'Series',
      series: 'Series',
      drama: 'Series',
      documental: 'Documentales',
      documentales: 'Documentales',
      noticia: 'Noticias',
      noticias: 'Noticias',
      informativo: 'Noticias',
      deporte: 'Deportes',
      deportes: 'Deportes',
      futbol: 'Deportes',
      entretenimiento: 'Entretenimiento',
      show: 'Entretenimiento',
      musica: 'Música',
      música: 'Música',
      infantil: 'Infantil',
      niños: 'Infantil',
    };

    return (
      categoryMappings[normalizedCategory] ||
      this.capitalizeFirstLetter(normalizedCategory)
    );
  }

  /**
   * Capitaliza la primera letra de un string
   * @param str - String a capitalizar
   * @returns String capitalizado
   * @private
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Ordena categorías según un orden predefinido
   * @param categories - Array de categorías a ordenar
   * @returns Array ordenado
   * @private
   */
  private sortCategories(categories: string[]): string[] {
    const categoryOrder = [
      'Películas',
      'Series',
      'Documentales',
      'Noticias',
      'Deportes',
      'Entretenimiento',
      'Música',
      'Infantil',
    ];

    return categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  // ===============================================
  // TEMPLATE HELPER METHODS
  // ===============================================

  /**
   * Obtiene el texto del día seleccionado
   * @returns String con día seleccionado
   */
  public getCurrentSelectedDay(): string {
    const dayInfo = this.daysInfo()[this.activeDay()];
    return dayInfo
      ? `${dayInfo.diaSemana} ${dayInfo.diaNumero}`
      : 'Seleccionar día';
  }

  /**
   * Obtiene el texto de la franja horaria seleccionada
   * @returns String con franja horaria
   */
  public getCurrentSelectedTimeSlot(): string {
    const timeSlots = this.currentTimeSlots();
    const activeSlot = this.activeTimeSlot();
    if (timeSlots && timeSlots[activeSlot]) {
      const franja = timeSlots[activeSlot];
      return `${franja[0]} - ${franja[franja.length - 1]}`;
    }
    return 'Seleccionar franja';
  }

  /**
   * Obtiene el texto del botón de categorías
   * @returns String descriptivo de las categorías seleccionadas
   */
  public getCategoryButtonText(): string {
    const selectedCategories = this.selectedCategories();
    if (selectedCategories.size === 0) return 'Todas las categorías';
    if (selectedCategories.size === 1) {
      const category = Array.from(selectedCategories)[0];
      return this.getCategoryDisplayName(category);
    }
    return `${selectedCategories.size} categorías seleccionadas`;
  }

  /**
   * Selecciona un día y cierra el dropdown
   * @param dayIndex - Índice del día
   */
  public selectDay(dayIndex: number): void {
    this.onDayChanged(dayIndex);
    this.isDayDropdownOpen.set(false);
  }

  /**
   * Selecciona una categoría y maneja el dropdown
   * @param category - Categoría a seleccionar (null para limpiar)
   */
  public selectCategory(category: string | null): void {
    if (category) {
      this.onCategorySelected(category);
    } else {
      this.clearCategoryFilter();
      this.isCategoryDropdownOpen.set(false);
    }
    this.cdr.markForCheck();
  }

  /**
   * Selecciona una franja horaria y cierra el dropdown
   * @param slotIndex - Índice de la franja
   */
  public selectTimeSlot(slotIndex: number): void {
    this.onTimeSlotChanged(slotIndex);
    this.isTimeSlotDropdownOpen.set(false);
  }

  // ===============================================
  // STATE CHECK METHODS
  // ===============================================

  /**
   * Verifica si un canal está expandido
   * @param index - Índice del canal
   * @returns true si está expandido
   */
  public isChannelExpanded(index: number): boolean {
    return this.expandedChannels().has(index);
  }

  /**
   * Verifica si una categoría está seleccionada
   * @param category - Categoría a verificar
   * @returns true si está seleccionada
   */
  public isCategorySelected(category: string): boolean {
    return this.selectedCategories().has(category);
  }

  /**
   * Verifica si están seleccionadas todas las categorías
   * @returns true si no hay filtros activos
   */
  public isAllCategoriesSelected(): boolean {
    return this.selectedCategories().size === 0;
  }

  /**
   * Verifica si un programa está cortado al inicio (usa timestamps absolutos)
   * @param programa - Programa a verificar
   * @returns true si está cortado
   */
  public isProgramCutAtStart(programa: IProgramItem): boolean {
    const currentHours = this.currentHours();
    if (!currentHours.length) return false;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotStartTs = this.getSlotStartTimestamp(
      this.activeDay(),
      slotStartMinutes
    );
    const progStartTs = this.getProgramStartTimestamp(programa);

    return progStartTs < slotStartTs;
  }

  /**
   * Verifica si un programa está cortado al final (usa timestamps absolutos)
   * @param programa - Programa a verificar
   * @returns true si está cortado
   */
  public isProgramCutAtEnd(programa: IProgramItem): boolean {
    const currentHours = this.currentHours();
    if (!currentHours.length) return false;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    const slotStartTs = this.getSlotStartTimestamp(
      this.activeDay(),
      slotStartMinutes
    );
    const slotEndTs =
      slotStartTs + (slotEndMinutes - slotStartMinutes) * 60_000;

    const progEndTs = this.getProgramEndTimestamp(programa);

    return progEndTs > slotEndTs;
  }

  // ===============================================
  // FACADE DELEGATION METHODS
  // ===============================================

  /**
   * Formatea tiempo para visualización
   * @param timeString - String de tiempo
   * @returns Tiempo formateado
   */
  public formatDisplayTime(timeString: string): string {
    return this.facade.formatDisplayTime(timeString);
  }

  /**
   * Obtiene clases CSS para badge de categoría
   * @param categoryValue - Valor de la categoría
   * @returns String con clases CSS
   */
  public getCategoryBadgeClasses(categoryValue: string): string {
    return this.facade.getCategoryBadgeClasses(categoryValue);
  }

  /**
   * Obtiene nombre de visualización de categoría
   * @param categoryValue - Valor de la categoría
   * @returns Nombre normalizado
   */
  public getCategoryDisplayName(categoryValue: string): string {
    return this.normalizeCategoryName(categoryValue);
  }

  /**
   * Obtiene clases CSS para botones de día
   * @param dayIndex - Índice del día
   * @returns String con clases CSS
   */
  public getDayButtonClasses(dayIndex: number): string {
    return this.facade.getDayButtonClasses(dayIndex, this.activeDay());
  }

  /**
   * Obtiene clases CSS para botones de franja horaria
   * @param timeSlot - Franja horaria
   * @returns String con clases CSS
   */
  public getTimeSlotButtonClasses(timeSlot: string): string {
    return this.facade.getTimeSlotButtonClasses(
      timeSlot,
      this.currentTimeSlot()
    );
  }

  /**
   * Obtiene URL del logo de un canal
   * @param channelData - Datos del canal
   * @returns URL del logo
   */
  public getChannelLogoUrl(channelData: any): string {
    if (channelData?.channel?.icon) return channelData.channel.icon;
    if (channelData?.icon) return channelData.icon;
    return this.facade.getChannelLogoUrl(channelData) || '';
  }

  /**
   * Maneja error de carga de logo
   * @param event - Evento de error
   */
  public onChannelLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';

    const fallbackElement = img.parentElement?.querySelector(
      '.channel-name-fallback'
    ) as HTMLElement;
    if (fallbackElement) {
      fallbackElement.classList.remove('hidden');
    }
  }

  /**
   * Obtiene el título de un programa
   * @param programa - Programa a evaluar
   * @returns Título del programa
   */
  public getProgramTitle(programa: IProgramItem): string {
    if (!programa?.title) return 'Sin título';

    if (typeof programa.title === 'string') {
      return programa.title;
    }

    if (typeof programa.title === 'object' && programa.title.value) {
      return String(programa.title.value);
    }

    return 'Sin título';
  }

  /**
   * Obtiene la hora actual formateada
   * @returns Hora actual en formato HH:MM
   */
  public getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0'); // local time
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // ===============================================
  // UI HELPER METHODS
  // ===============================================

  /**
   * Calcula la altura dinámica de un canal basado en el número de capas
   * Actualizado para usar getProgramLayers(canal)
   * @param canal - Datos del canal
   * @param index - Índice del canal
   * @returns Altura en píxeles
   */
  public getChannelHeight(canal: IProgramListData, index: number): number {
    const layers = this.getProgramLayers(canal);
    const layerCount = layers.length || 1;
    const baseHeight = UI_CONFIG.LAYER_HEIGHT * layerCount;

    if (this.isChannelExpanded(index) && this.selectedProgram()) {
      return baseHeight + UI_CONFIG.EXPANDED_BANNER_HEIGHT;
    }

    return baseHeight;
  }

  /**
   * Devuelve el número de capas para un canal
   * Ahora usa la versión que recibe el objeto canal completo
   * @param canal - Datos del canal
   * @returns Número de capas necesarias
   */
  public getLayerCount(canal: IProgramListData): number {
    const layers = this.getProgramLayers(canal);
    return Math.max(1, layers.length);
  }

  /**
   * Obtiene el tamaño de item para virtual scrolling
   * @returns Altura base del canal
   */
  public getItemSize(): number {
    return UI_CONFIG.BASE_CHANNEL_HEIGHT;
  }

  /**
   * Obtiene clases CSS para programas cortados
   * @param programa - Programa a evaluar
   * @returns String con clases CSS
   */
  public getProgramCutClasses(programa: IProgramItem): string {
    const classes: string[] = [];

    if (this.isProgramCutAtStart(programa)) classes.push('program-cut-start');
    if (this.isProgramCutAtEnd(programa)) classes.push('program-cut-end');

    return classes.join(' ');
  }

  /**
   * Obtiene tiempo visible de inicio de programa (usa timestamps absolutos)
   * @param programa - Programa a evaluar
   * @returns Tiempo formateado
   */
  public getProgramVisibleStartTime(programa: IProgramItem): string {
    const currentHours = this.currentHours();
    if (!currentHours.length) return this.formatProgramTime(programa.start);

    // Mostrar SIEMPRE la hora real de inicio del programa.
    // La indicación de "cortado al inicio" se gestiona con isProgramCutAtStart()
    return this.formatProgramTime(programa.start);
  }

  /**
   * Obtiene tiempo visible de fin de programa
   * CORRECCIÓN: formatear correctamente minutos > 1440 como 00:xx y usar timestamps
   * @param programa - Programa a evaluar
   * @returns Tiempo formateado
   */
  public getProgramVisibleEndTime(programa: IProgramItem): string {
    const currentHours = this.currentHours();
    if (!currentHours.length) return this.formatProgramTime(programa.stop);

    const isNightSlot = this.isNightTimeSlot(currentHours);
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    const progEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);

    // Si programa cruza medianoche y supera la franja, mostrar límite de la franja con formateo correcto
    if (isNightSlot && crossesMidnight) {
      if (progEndMinutes > slotEndMinutes) {
        return this.formatMinutesToHHMM(slotEndMinutes);
      }
    }

    // Si el programa termina después del slot (en cualquier caso), limitar a slotEndMinutes formateado
    const progEndTs = this.getProgramEndTimestamp(programa);
    const slotStartTs = this.getSlotStartTimestamp(
      this.activeDay(),
      slotStartMinutes
    );
    const slotEndTs =
      slotStartTs + (slotEndMinutes - slotStartMinutes) * 60_000;

    if (progEndTs > slotEndTs) {
      return this.formatMinutesToHHMM(slotEndMinutes);
    }

    return this.formatProgramTime(programa.stop);
  }

  /**
   * Formatea timestamp a tiempo legible
   * @param timestamp - Timestamp a formatear
   * @returns Tiempo formateado
   * @private
   */
  private formatProgramTime(timestamp: string): string {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  /**
   * Obtiene z-index para el indicador de tiempo
   * @returns Valor de z-index
   */
  public getTimeIndicatorZIndex(): number {
    const hasOpenDropdown =
      this.isDayDropdownOpen() ||
      this.isCategoryDropdownOpen() ||
      this.isTimeSlotDropdownOpen();
    return hasOpenDropdown ? 30 : 10000;
  }

  /**
   * Obtiene datos para el banner del programa seleccionado
   * @returns Datos del programa seleccionado
   */
  public getSelectedProgramBannerData(): any {
    return this.selectedProgram();
  }

  // ===============================================
  // DROPDOWN CSS CLASSES
  // ===============================================

  /**
   * Obtiene clases CSS para items del dropdown de días
   * @param dayIndex - Índice del día
   * @returns String con clases CSS
   */
  public getDayDropdownItemClasses(dayIndex: number): string {
    const isActive = dayIndex === this.activeDay();
    return isActive
      ? 'bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold'
      : '';
  }

  /**
   * Obtiene clases CSS para items del dropdown de categorías
   * @param category - Categoría (null para "todas")
   * @returns String con clases CSS
   */
  public getCategoryDropdownItemClasses(category: string | null): string {
    const isActive = category
      ? this.selectedCategories().has(category)
      : this.selectedCategories().size === 0;
    return isActive
      ? 'bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold'
      : '';
  }

  /**
   * Obtiene clases CSS para items del dropdown de franjas horarias
   * @param timeSlotStart - Hora de inicio de la franja
   * @returns String con clases CSS
   */
  public getTimeSlotDropdownItemClasses(timeSlotStart: string): string {
    const isActive = timeSlotStart === this.currentTimeSlot();
    return isActive
      ? 'bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold'
      : '';
  }

  // ===============================================
  // MOBILE NAVIGATION METHODS
  // ===============================================

  /**
   * Navega a la franja horaria anterior
   */
  public previousTimeSlot(): void {
    const current = this.activeTimeSlot();
    if (current > 0) {
      this.onTimeSlotChanged(current - 1);
    }
  }

  /**
   * Navega a la franja horaria siguiente
   */
  public nextTimeSlot(): void {
    const current = this.activeTimeSlot();
    if (current < 7) {
      this.onTimeSlotChanged(current + 1);
    }
  }

  /**
   * Navega a la franja horaria actual (solo para "hoy")
   */
  public scrollToNow(): void {
    if (this.activeDay() !== 0) return;

    const currentSlot = this.facade.getCurrentTimeSlot();
    this.onTimeSlotChanged(currentSlot);
  }

  // ===============================================
  // TRACK BY FUNCTIONS
  // ===============================================

  /** TrackBy para días */
  public trackByDayIndex = (index: number): number => index;

  /** TrackBy para franjas horarias */
  public trackByTimeSlot = (index: number, item: string[]): string => item[0];

  /** TrackBy para horas */
  public trackByHour = (index: number, item: string): string => item;

  /** TrackBy para canales */
  public trackByChannelId = (index: number, item: IProgramListData): string =>
    item.id || item.channel?.id || `channel-${index}`;

  /** TrackBy para programas */
  public trackByProgramId = (index: number, item: IProgramItem): string =>
    item.id || `${item.start}-${item.stop}-${index}`;

  /** TrackBy para categorías */
  public trackByCategory = (index: number, category: string): string =>
    category;

  // ===============================================
  // HOST LISTENERS
  // ===============================================

  /**
   * Maneja clicks en el documento para cerrar dropdowns y banners
   * @param event - Evento de click
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Cerrar dropdowns si se hace click fuera
    if (!target.closest('.dropdown-container')) {
      this.closeAllDropdowns();
    }

    // Cerrar banners si se hace click fuera del área de programas
    if (
      !target.closest('.channel-programs-container') &&
      !target.closest('.expanded-banner') &&
      !target.closest('.dropdown-container') &&
      !target.closest('app-banner') &&
      this.selectedProgram()
    ) {
      const expandedChannels = this.expandedChannels();
      expandedChannels.forEach((channelIndex) => {
        this.onChannelToggle(channelIndex);
      });
      this.selectedProgram.set(null);
      this.cdr.markForCheck();
    }
  }

  // ===============================================
  // PRIVATE UTILITY METHODS
  // ===============================================

  /**
   * Actualiza la posición del indicador de tiempo
   * @private
   */
  private updateTimeIndicator(): void {
    if (!this.showTimeIndicator() || !isPlatformBrowser(this.platformId))
      return;
    this.cdr.markForCheck();
  }

  /**
   * Configura la actualización periódica del indicador de tiempo
   * @private
   */
  private setupTimeIndicatorUpdates(): void {
    this.updateInterval = setInterval(() => {
      if (this.showTimeIndicator() && this.activeDay() === 0) {
        this.updateTimeIndicator();
      }
    }, 60000);
  }

  /**
   * Carga los logos de canales desde assets
   * @private
   */
  private loadChannelLogos(): void {
    this.http
      .get<any>('/assets/canales.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.facade.updateChannelData(data || {}),
        error: (error) => console.error('Error loading channel data:', error),
      });
  }

  /**
   * Limpia recursos al destruir el componente
   * @private
   */
  private cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
