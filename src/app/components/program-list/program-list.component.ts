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

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotStartTime = this.currentTimeSlot();
    const [slotHour, slotMinute] = slotStartTime.split(':').map(Number);
    const slotStartMinutes = slotHour * 60 + (slotMinute || 0);

    let minutesFromSlotStart = currentMinutes - slotStartMinutes;
    if (minutesFromSlotStart < 0) minutesFromSlotStart += 24 * 60;

    return (
      UI_CONFIG.LOGO_COLUMN_WIDTH +
      (minutesFromSlotStart / 60) * UI_CONFIG.PIXELS_PER_HOUR
    );
  });

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

    this.showTimeIndicator.set(this.activeDay() === 0);
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
    } else {
      this.canalesConProgramas.set([]);
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
    const lastHourMinutes = hours * 60 + (minutes || 0);

    const isNightSlot = this.isNightTimeSlot(currentHours);

    if (isNightSlot && lastHour === '00:00') {
      return 3 * 60; // 03:00 = 180 minutos
    }

    let slotEndMinutes = lastHourMinutes + UI_CONFIG.MINUTES_PER_SLOT;

    if (slotEndMinutes >= 1440) {
      slotEndMinutes = slotEndMinutes - 1440;
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
    const isNightSlot = this.isNightTimeSlot(currentHours);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    const visiblePrograms = programs.filter((programa) => {
      const programStart = this.getProgramStartMinutes(programa);
      const programEnd = this.getProgramEndMinutes(programa);
      const crossesMidnight = this.programCrossesMidnight(programa);

      let isVisible = false;

      if (isNightSlot) {
        isVisible = this.isProgramVisibleInNightSlot(
          programa,
          programStart,
          programEnd,
          crossesMidnight,
          slotStartMinutes,
          slotEndMinutes
        );
      } else {
        isVisible = this.isProgramVisibleInDaySlot(
          programStart,
          programEnd,
          slotStartMinutes,
          slotEndMinutes
        );
      }

      return isVisible;
    });

    return visiblePrograms;
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
    if (slotStartMinutes === 0) {
      if (crossesMidnight && programEnd <= slotEndMinutes) {
        return true;
      }

      if (
        !crossesMidnight &&
        programStart >= 0 &&
        programStart < slotEndMinutes
      ) {
        return true;
      }

      return false;
    }

    if (
      !crossesMidnight &&
      programStart >= slotStartMinutes &&
      programStart < 1440
    ) {
      return true;
    }

    if (
      !crossesMidnight &&
      programStart < slotStartMinutes &&
      programEnd > slotStartMinutes
    ) {
      return true;
    }

    if (crossesMidnight && programStart >= slotStartMinutes) {
      return true;
    }

    return false;
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
    const isNightSlot = this.isNightTimeSlot(currentHours);
    const crossesMidnight = this.programCrossesMidnight(programa);

    if (isNightSlot && slotStartMinutes === 0) {
      if (crossesMidnight) {
        return 1;
      } else if (programStartMinutes >= 0 && programStartMinutes < 180) {
        const slotIndex = Math.floor(
          programStartMinutes / UI_CONFIG.MINUTES_PER_SLOT
        );
        return Math.max(1, Math.min(UI_CONFIG.MAX_GRID_COLUMNS, slotIndex + 1));
      } else {
        return 1;
      }
    }

    if (isNightSlot && slotStartMinutes === 1260) {
      if (programStartMinutes >= 1260) {
        const minutesFromSlotStart = programStartMinutes - slotStartMinutes;
        const columnIndex = Math.floor(
          minutesFromSlotStart / UI_CONFIG.MINUTES_PER_SLOT
        );
        return Math.max(
          1,
          Math.min(UI_CONFIG.MAX_GRID_COLUMNS, columnIndex + 1)
        );
      } else if (
        programStartMinutes < UI_CONFIG.NIGHT_SLOT_END_MINUTES &&
        crossesMidnight
      ) {
        const minutesFromMidnight = programStartMinutes;
        const slotIndex = Math.floor(
          minutesFromMidnight / UI_CONFIG.MINUTES_PER_SLOT
        );
        const midnightColumn =
          Math.floor((1440 - slotStartMinutes) / UI_CONFIG.MINUTES_PER_SLOT) +
          1;
        return Math.max(
          midnightColumn,
          Math.min(UI_CONFIG.MAX_GRID_COLUMNS, midnightColumn + slotIndex)
        );
      }
    }

    if (programStartMinutes < slotStartMinutes) {
      return 1;
    }

    const minutesFromSlotStart = programStartMinutes - slotStartMinutes;
    const columnIndex = Math.floor(
      minutesFromSlotStart / UI_CONFIG.MINUTES_PER_SLOT
    );

    return Math.max(1, Math.min(UI_CONFIG.MAX_GRID_COLUMNS, columnIndex + 1));
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

    let effectiveProgramEndMinutes: number;

    const programInVisibleSlot = this.isProgramInVisibleSlot(
      programa,
      slotStartMinutes,
      slotEndMinutes,
      isNightSlot
    );

    if (!programInVisibleSlot) {
      effectiveProgramEndMinutes = programEndMinutes;
    } else if (isNightSlot && crossesMidnight) {
      effectiveProgramEndMinutes = programEndMinutes;
    } else if (isNightSlot) {
      if (crossesMidnight) {
        effectiveProgramEndMinutes = Math.min(
          programEndMinutes,
          slotEndMinutes
        );
      } else if (programEndMinutes < 1440) {
        effectiveProgramEndMinutes = programEndMinutes;
      } else {
        effectiveProgramEndMinutes = Math.min(
          programEndMinutes,
          slotEndMinutes
        );
      }
    } else {
      effectiveProgramEndMinutes = Math.min(programEndMinutes, slotEndMinutes);
    }

    return this.calculateGridColumnEnd(
      programa,
      programStartMinutes,
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
    const startColumn = this.getProgramGridColumn(programa);

    if (isNightSlot && slotStartMinutes === 0 && crossesMidnight) {
      const durationInCurrentSlot = Math.min(effectiveEndMinutes, 180);
      const slotsNeeded = Math.ceil(
        durationInCurrentSlot / UI_CONFIG.MINUTES_PER_SLOT
      );
      const endColumn = startColumn + slotsNeeded;

      return Math.max(startColumn + 1, Math.min(8, endColumn));
    }

    if (isNightSlot && crossesMidnight) {
      const durationUntilMidnight =
        1440 - Math.max(programStartMinutes, slotStartMinutes);
      const durationAfterMidnight = effectiveEndMinutes;
      const totalVisibleMinutes = durationUntilMidnight + durationAfterMidnight;

      const totalSlotsNeeded = Math.ceil(
        totalVisibleMinutes / UI_CONFIG.MINUTES_PER_SLOT
      );
      const endColumn = startColumn + totalSlotsNeeded;

      return Math.max(startColumn + 1, Math.min(8, endColumn));
    }

    const visibleStartMinutes = Math.max(programStartMinutes, slotStartMinutes);

    let endMinutesFromSlotStart: number;
    if (isNightSlot) {
      endMinutesFromSlotStart = effectiveEndMinutes - slotStartMinutes;
      if (endMinutesFromSlotStart < 0) {
        endMinutesFromSlotStart = 1440 - slotStartMinutes + effectiveEndMinutes;
      }
    } else {
      endMinutesFromSlotStart = effectiveEndMinutes - slotStartMinutes;
    }

    const endColumnIndex = Math.ceil(
      endMinutesFromSlotStart / UI_CONFIG.MINUTES_PER_SLOT
    );
    const finalEndColumn = endColumnIndex + 1;

    return Math.max(startColumn + 1, Math.min(8, finalEndColumn));
  }
  /**
   * Obtiene programas organizados en capas sin solapamientos
   * VERSIÓN CORREGIDA: Usa el nuevo sistema de detección de solapamientos
   * @param programs - Array de programas a organizar
   * @returns Array de arrays, cada uno representando una capa
   */
  public getProgramLayers(programs: IProgramItem[]): ProgramWithPosition[][] {
    if (!programs?.length) return [];

    const visiblePrograms = this.getVisiblePrograms(programs);
    if (!visiblePrograms.length) return [];

    // Calcular posiciones para cada programa
    const programsWithPositions: ProgramWithPosition[] = visiblePrograms.map(
      (programa) => ({
        ...programa,
        gridColumnStart: this.getProgramGridColumn(programa),
        gridColumnEnd: this.getProgramGridColumnEnd(programa),
        layerIndex: 0, // Se asignará después
        visibleStartTime: this.getProgramVisibleStartTime(programa),
        visibleEndTime: this.getProgramVisibleEndTime(programa),
        isCutAtStart: this.isProgramCutAtStart(programa),
        isCutAtEnd: this.isProgramCutAtEnd(programa),
      })
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
    // Dos programas se solapan si sus columnas se intersectan
    return !(
      program1.gridColumnEnd <= program2.gridColumnStart ||
      program2.gridColumnEnd <= program1.gridColumnStart
    );
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
    if (!programa.stop) return 0;
    try {
      const startDate = new Date(programa.start);
      const endDate = new Date(programa.stop);

      // CORRECCIÓN: Usar UTC en lugar de local para evitar problemas de zona horaria
      const startMinutes =
        startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
      const endMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();

      // Verificar si las fechas son diferentes (programa cruza a otro día)
      const startDay = startDate.getUTCDate();
      const endDay = endDate.getUTCDate();

      // Si es el día siguiente, añadir 24 horas
      if (
        endDay > startDay ||
        (endDay < startDay && endMinutes < startMinutes)
      ) {
        return endMinutes + 1440;
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
      const startDate = new Date(programa.start);
      const endDate = new Date(programa.stop);

      // Verificar si las fechas son diferentes (programa cruza a otro día)
      const startDay = startDate.getUTCDate();
      const endDay = endDate.getUTCDate();

      // Si es el día siguiente, es porque cruza medianoche
      if (endDay > startDay) return true;

      // También verificar por diferencia de minutos calculados
      const startMinutes = this.getProgramStartMinutes(programa);
      const endMinutes = this.getProgramEndMinutes(programa);

      // Si endMinutes > 1440, significa que se calculó como día siguiente
      return endMinutes > 1440;
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

  /**
   * Maneja el cambio de día
   * @param dayIndex - Índice del día seleccionado
   */
  public onDayChanged(dayIndex: number): void {
    if (this.activeDay() === dayIndex) return;

    const dayInfo = this.daysInfo()[dayIndex];
    if (!dayInfo) return;

    this.activeDay.set(dayIndex);
    this.showTimeIndicator.set(dayIndex === 0);

    if (dayIndex === 0) {
      const currentSlot = this.facade.getCurrentTimeSlot();
      this.onTimeSlotChanged(currentSlot);
    }

    this.dayChanged.emit({ dayIndex, dayInfo });
    this.cdr.markForCheck();
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

    // Debug simplificado solo para el primer canal en franja 00:00
    if (selectedSlot[0] === '00:00') {
      console.clear();
      const canales = this.canalesConProgramas();
      if (canales.length > 0 && canales[0].channels.length > 0) {
        const currentHours = this.currentHours();
        const isNightSlot = this.isNightTimeSlot(currentHours);
        const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
        const slotEndMinutes = this.getSlotEndMinutes(currentHours);

        console.log(
          `📺 DEBUG - Canal: ${
            canales[0].channel?.name || 'Canal 1'
          } | Franja: ${
            selectedSlot[0]
          } (${slotStartMinutes}-${slotEndMinutes}min) | Noche: ${isNightSlot}`
        );

        // Mostrar todos los programas RAW para comparar
        console.log('\n📄 TODOS LOS PROGRAMAS RAW (primeros 10):');
        canales[0].channels.slice(0, 10).forEach((programa, idx) => {
          const startTime = new Date(programa.start).toLocaleTimeString(
            'es-ES',
            {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
            }
          );
          const stopTime = new Date(programa.stop).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
          });
          const programStart = this.getProgramStartMinutes(programa);
          const programEnd = this.getProgramEndMinutes(programa);
          const crossesMidnight = this.programCrossesMidnight(programa);
          const title = this.getProgramTitle(programa);

          console.log(
            `  ${
              idx + 1
            }. ${title} | RAW: ${startTime}-${stopTime} | Min: ${programStart}-${programEnd} | Crosses: ${crossesMidnight}`
          );
        });

        // Mostrar programas visibles filtrados
        const visiblePrograms = this.getVisiblePrograms(canales[0].channels);
        console.log(
          `\n🎯 PROGRAMAS VISIBLES FILTRADOS: ${visiblePrograms.length}/${canales[0].channels.length}`
        );

        if (visiblePrograms.length > 0) {
          visiblePrograms.forEach((programa, idx) => {
            const startTime = new Date(programa.start).toLocaleTimeString(
              'es-ES',
              {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
              }
            );
            const stopTime = new Date(programa.stop).toLocaleTimeString(
              'es-ES',
              {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
              }
            );
            const gridColumn = this.getProgramGridColumn(programa);
            const gridColumnEnd = this.getProgramGridColumnEnd(programa);
            const title = this.getProgramTitle(programa);
            const programStart = this.getProgramStartMinutes(programa);
            const programEnd = this.getProgramEndMinutes(programa);
            const crossesMidnight = this.programCrossesMidnight(programa);

            console.log(
              `  ${
                idx + 1
              }. ${title} | ${startTime}-${stopTime} | Grid: ${gridColumn}-${gridColumnEnd} | Crosses: ${crossesMidnight}`
            );
          });
        } else {
          console.log('❌ No hay programas visibles en esta franja');
        }
      }
    }

    if (this.showTimeIndicator()) {
      this.updateTimeIndicator();
    }

    this.cdr.markForCheck();
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
   * Verifica si un programa está cortado al inicio
   * @param programa - Programa a verificar
   * @returns true si está cortado
   */
  public isProgramCutAtStart(programa: IProgramItem): boolean {
    const currentHours = this.currentHours();
    if (!currentHours.length) return false;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const programStartMinutes = this.getProgramStartMinutes(programa);

    return programStartMinutes < slotStartMinutes;
  }

  /**
   * Verifica si un programa está cortado al final
   * @param programa - Programa a verificar
   * @returns true si está cortado
   */
  public isProgramCutAtEnd(programa: IProgramItem): boolean {
    const currentHours = this.currentHours();
    if (!currentHours.length) return false;

    const isNightSlot = this.isNightTimeSlot(currentHours);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);

    if (isNightSlot) {
      if (crossesMidnight) {
        return programEndMinutes > UI_CONFIG.NIGHT_SLOT_END_MINUTES;
      }
      return programEndMinutes > 1440;
    }

    const lastSlotHour = currentHours[currentHours.length - 1];
    const slotEndMinutes =
      this.parseTimeToMinutes(lastSlotHour) + UI_CONFIG.MINUTES_PER_SLOT;
    return programEndMinutes > slotEndMinutes;
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
    const hours = now.getUTCHours().toString().padStart(2, '0');
    const minutes = now.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // ===============================================
  // UI HELPER METHODS
  // ===============================================

  /**
   * Calcula la altura dinámica de un canal basado en el número de capas
   * NUEVO MÉTODO: Ajusta la altura según las capas necesarias
   * @param canal - Datos del canal
   * @param index - Índice del canal
   * @returns Altura en píxeles
   */
  public getChannelHeight(canal: IProgramListData, index: number): number {
    const layers = this.getProgramLayers(canal.channels);
    const layerCount = layers.length || 1;
    const baseHeight = UI_CONFIG.LAYER_HEIGHT * layerCount;

    if (this.isChannelExpanded(index) && this.selectedProgram()) {
      return baseHeight + UI_CONFIG.EXPANDED_BANNER_HEIGHT;
    }

    return baseHeight;
  }

  /**
   * Obtiene el número de capas para un canal
   * NUEVO MÉTODO: Para determinar altura del contenedor
   * @param canal - Datos del canal
   * @returns Número de capas necesarias
   */
  public getLayerCount(canal: IProgramListData): number {
    const layers = this.getProgramLayers(canal.channels);
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
   * Obtiene tiempo visible de inicio de programa
   * @param programa - Programa a evaluar
   * @returns Tiempo formateado
   */
  public getProgramVisibleStartTime(programa: IProgramItem): string {
    const currentHours = this.currentHours();
    if (!currentHours.length) return this.formatProgramTime(programa.start);

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const programStartMinutes = this.getProgramStartMinutes(programa);

    if (programStartMinutes < slotStartMinutes) {
      return currentHours[0];
    }

    return this.formatProgramTime(programa.start);
  }

  /**
   * Obtiene tiempo visible de fin de programa
   * @param programa - Programa a evaluar
   * @returns Tiempo formateado
   */
  public getProgramVisibleEndTime(programa: IProgramItem): string {
    const currentHours = this.currentHours();
    if (!currentHours.length) return this.formatProgramTime(programa.stop);

    const isNightSlot = this.isNightTimeSlot(currentHours);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);

    // CORRECCIÓN: Solo limitar visualmente programas que realmente cruzan medianoche
    // Y que terminan después del final de la franja nocturna visible
    if (isNightSlot && crossesMidnight) {
      // Para programas que cruzan medianoche en franja nocturna,
      // mostrar el tiempo real del programa, no limitarlo artificialmente
      const slotEndMinutes = this.getSlotEndMinutes(currentHours);
      if (programEndMinutes > slotEndMinutes) {
        // Solo mostrar la hora límite de la franja si el programa se extiende más allá
        const slotEndHour = Math.floor(slotEndMinutes / 60);
        const slotEndMin = slotEndMinutes % 60;
        return `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin
          .toString()
          .padStart(2, '0')}`;
      }
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
