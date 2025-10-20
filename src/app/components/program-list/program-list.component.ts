/**
 * ProgramListComponent - SSR COMPATIBLE
 * Renderiza placeholder en servidor, contenido completo en cliente
 */

import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
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
  PLATFORM_ID,
  afterNextRender,
  Injector,
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

// Servicios y componentes
import { BannerComponent } from '../banner/banner.component';
import { ProgramListFacadeService } from '../../services/program-list/program-list-facade.service';
import { ProgramListTransformService } from '../../services/program-list-transform.service';
import { DeviceDetectorService } from '../../services/device-detector.service';
import {
  IDayChangedEvent,
  IProgramListData,
  IProgramItem,
} from 'src/app/interfaces';
import { ProgramDetailModalComponent } from '../program-detail-modal/program-detail-modal.component';

const UI_CONFIG = {
  PIXELS_PER_HOUR: 240,
  LOGO_COLUMN_WIDTH: 160,
  BASE_CHANNEL_HEIGHT: 75,
  LAYER_HEIGHT: 75,
  EXPANDED_BANNER_HEIGHT: 320,
  MINUTES_PER_SLOT: 30,
  MINUTES_PER_COLUMN: 5,
  MAX_GRID_COLUMNS: 7,
  NIGHT_SLOT_END_MINUTES: 30,
  MAX_LAYERS: 5,
  MOBILE_ITEM_SIZE: 60,
  TABLET_ITEM_SIZE: 70,
} as const;

interface ProgramWithPosition extends IProgramItem {
  gridColumnStart: number;
  gridColumnEnd: number;
  layerIndex: number;
  visibleStartTime: string;
  visibleEndTime: string;
  isCutAtStart: boolean;
  isCutAtEnd: boolean;
  _normStartMinutes?: number;
  _normEndMinutes?: number;
}

@Component({
  selector: 'app-program-list',
  templateUrl: './program-list.component.html',
  styleUrls: ['./program-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BannerComponent,
    ScrollingModule,
    ProgramDetailModalComponent,
  ],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
  ],
})
export class ProgramListComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly DEBUG = false;

  // ===============================================
  // DEPENDENCY INJECTION
  // ===============================================

  private readonly destroyRef = inject(DestroyRef);
  public readonly facade = inject(ProgramListFacadeService);
  private readonly transform = inject(ProgramListTransformService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  public readonly deviceDetector = inject(DeviceDetectorService);
  private readonly injector = inject(Injector);

  // ===============================================
  // SSR COMPATIBILITY
  // ===============================================
  public readonly isBrowser = isPlatformBrowser(this.platformId);

  // ===============================================
  // DEVICE DETECTION
  // ===============================================

  public readonly deviceInfo = computed(() => this.deviceDetector.deviceInfo());
  public readonly isMobile = computed(() => this.deviceDetector.isMobile());
  public readonly isTablet = computed(() => this.deviceDetector.isTablet());
  public readonly isDesktop = computed(() => this.deviceDetector.isDesktop());

  // ===============================================
  // COMPONENT OUTPUTS
  // ===============================================

  @Output() dayChanged = new EventEmitter<IDayChangedEvent>();
  @Output() categorySelected = new EventEmitter<string[]>();

  // ===============================================
  // VIEW REFERENCES
  // ===============================================

  @ViewChild('virtualScrollViewport')
  virtualScrollViewport!: CdkVirtualScrollViewport;

  // ===============================================
  // REACTIVE STATE SIGNALS
  // ===============================================

  public readonly canalesConProgramas = signal<IProgramListData[]>([]);
  public readonly isLoading = signal<boolean>(true);
  public readonly error = signal<string | null>(null);
  public readonly activeDay = signal<number>(0);
  public readonly activeTimeSlot = signal<number>(0);
  public readonly currentTimeSlot = signal<string>('');
  public readonly expandedChannels = signal<Set<number>>(new Set());
  public readonly selectedChannel = signal<number>(-1);
  public readonly selectedProgram = signal<IProgramItem | null>(null);
  public readonly isDayDropdownOpen = signal<boolean>(false);
  public readonly isCategoryDropdownOpen = signal<boolean>(false);
  public readonly isTimeSlotDropdownOpen = signal<boolean>(false);
  public readonly selectedCategories = signal<Set<string>>(new Set());
  public readonly showCategoryFilter = signal<boolean>(true);
  public readonly showTimeIndicator = signal<boolean>(true);

  // ===============================================
  // COMPUTED PROPERTIES
  // ===============================================

  public readonly hasChannels = computed(
    () => this.canalesConProgramas().length > 0
  );
  public readonly currentTimeSlots = computed(() => this.facade.getTimeSlots());
  public readonly currentHours = computed(() =>
    this.facade.generateHoursForSlot(this.activeTimeSlot())
  );
  public readonly daysInfo = computed(() => this.facade.generateDaysInfo());

  public readonly filteredChannels = computed(() => {
    const channels = this.transform.getFilteredChannels(
      this.canalesConProgramas(),
      this.selectedCategories()
    );

    if (this.DEBUG && !this.isMobile()) {
      console.log(
        `🔍 Canales filtrados: ${channels.length} de ${
          this.canalesConProgramas().length
        }`
      );
    }

    return channels;
  });

  /**
   * Computed para obtener información del canal del programa seleccionado
   * Necesario para el modal de detalles
   */
  public readonly modalChannelInfo = computed(() => {
    const program = this.selectedProgram();
    if (!program) return null;

    // Encontrar el canal del programa seleccionado
    const channelData = this.filteredChannels().find(
      (canal) =>
        canal.channels && canal.channels.some((p) => p.id === program.id)
    );

    if (!channelData) {
      console.warn('⚠️ No se encontró canal para el programa:', program.id);
      return null;
    }

    return {
      channelName: channelData.channel?.name || 'Canal Desconocido',
      channelLogo: this.getChannelLogoUrl(channelData) || '',
    };
  });

  public readonly availableCategories = computed(() => {
    return this.transform.getAvailableCategories(this.canalesConProgramas());
  });

  public readonly uiState = computed(() => ({
    hasData: this.hasChannels(),
    isLoading: this.isLoading(),
    hasError: this.error() !== null,
    showContent: this.hasChannels() && !this.isLoading() && !this.error(),
    showEmpty: !this.hasChannels() && !this.isLoading() && !this.error(),
  }));

  public readonly timeIndicatorPositionPx = computed(() => {
    if (!this.showTimeIndicator() || !this.isBrowser) return 0;

    const currentHours = this.currentHours();
    if (!currentHours.length) return 0;

    const now = new Date();
    const localMinutes = now.getHours() * 60 + now.getMinutes();
    const slotStartMinutes = this.parseTimeToMinutes(this.currentTimeSlot());
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);
    const slotDuration = slotEndMinutes - slotStartMinutes;

    let minutesFromSlotStart = localMinutes - slotStartMinutes;
    if (minutesFromSlotStart < 0) minutesFromSlotStart += 24 * 60;
    if (minutesFromSlotStart < 0) minutesFromSlotStart = 0;
    if (minutesFromSlotStart > slotDuration)
      minutesFromSlotStart = slotDuration;

    return (
      UI_CONFIG.LOGO_COLUMN_WIDTH +
      (minutesFromSlotStart / 60) * UI_CONFIG.PIXELS_PER_HOUR
    );
  });

  public get gridTemplateColumns(): string {
    const columnsPerSlot =
      UI_CONFIG.MINUTES_PER_SLOT / UI_CONFIG.MINUTES_PER_COLUMN;
    const totalColumns = UI_CONFIG.MAX_GRID_COLUMNS * columnsPerSlot;
    return `repeat(${totalColumns}, 1fr)`;
  }
  public readonly isMobileFallback = signal(false);

  // ===============================================
  // COMPONENT PROPERTIES
  // ===============================================

  public readonly componentId = `pl-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  private updateInterval: any;
  private channelIndexCache = new Map<string, number>();
  // Timestamp of last explicit load start to avoid spurious auto-refresh attempts
  private lastLoadTimestamp = 0;

  // ===============================================
  // LIFECYCLE METHODS
  // ===============================================

  constructor() {
    console.log('[ProgramList] Constructor - isBrowser:', this.isBrowser);

    // AÑADIR: Exponer debug en consola
    if (typeof window !== 'undefined') {
      (window as any).programListDebug = {
        state: () => this.debugLoadingState(),
        forceLoad: () => this.facade.refreshData(),
        channels: () => this.canalesConProgramas(),
        isLoading: () => this.isLoading(),
        uiState: () => this.uiState(),
      };
      console.log('🛠️ Debug disponible: programListDebug.state()');
    }
  }

  ngOnInit(): void {
    console.log('[ProgramList] ngOnInit');
    console.log('[ProgramList] isLoading inicial:', this.isLoading());

    this.initializeComponent();
    this.initializeDataStreams();

    // CRÍTICO: Setup de timeout de seguridad con verificación mejorada
    this.setupLoadingTimeout();

    // NUEVO: Log del estado después de inicialización
    setTimeout(() => {
      console.log('[ProgramList] Estado después de init:', {
        isLoading: this.isLoading(),
        hasChannels: this.hasChannels(),
        uiState: this.uiState(),
      });
    }, 1000);
  }

  ngAfterViewInit(): void {
    console.log('[ProgramList] ngAfterViewInit');
    console.log('[ProgramList] Estado actual:', {
      isLoading: this.isLoading(),
      hasChannels: this.hasChannels(),
      canales: this.canalesConProgramas().length,
    });

    this.cdr.detectChanges();

    // Inicializar detección de dispositivo
    if (!this.deviceDetector.isInitialized()) {
      console.warn(
        '⚠️ DeviceDetector no inicializado en AfterViewInit, reintentando...'
      );
      setTimeout(() => this.initializeDeviceDetection(), 100);
    }

    // CORREGIDO: Verificación del estado de carga
    if (this.hasChannels()) {
      console.log('✅ Hay canales, inicializando features');
      this.updateTimeIndicator();

      // Forzar redibujado del viewport si existe
      if (this.virtualScrollViewport) {
        setTimeout(() => {
          try {
            this.virtualScrollViewport.checkViewportSize();
          } catch (e) {
            console.warn('Error inicializando viewport:', e);
          }
        }, 100);
      }
    }

    // NUEVO: Verificación mejorada del estado de carga después de AfterViewInit
    setTimeout(() => {
      this.verifyLoadingState();
    }, 2000);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // Crear computed que use el fallback
  public readonly shouldShowMobile = computed(() => {
    return this.isMobile() || this.isMobileFallback();
  });

  // ===============================================
  // INITIALIZATION METHODS
  // ===============================================

  /**
   * NUEVO: Método para inicializar detección de dispositivo
   */
  private initializeDeviceDetection(): void {
    // Check si estamos en el navegador usando múltiples métodos
    const hasWindow = typeof window !== 'undefined';
    const hasDocument = typeof document !== 'undefined';
    const hasNavigator = typeof navigator !== 'undefined';

    console.log(
      '[ProgramList - initializeDeviceDetection] Verificando entorno:',
      {
        hasWindow,
        hasDocument,
        hasNavigator,
        platformId: this.platformId,
      }
    );

    if (hasWindow && hasDocument) {
      console.log('✅ Entorno de navegador detectado, inicializando...');

      // Forzar inicialización del DeviceDetector

      // Marcar como hidratado

      // Inicializar features del navegador
      this.initializeBrowserFeatures();

      // Forzar detección
      this.cdr.detectChanges();

      console.log('✅ Inicialización completa:', {
        isMobile: this.isMobile(),
        deviceInfo: this.deviceInfo(),
      });
    } else {
      console.log('⚠️ No se detectó entorno de navegador');
    }
  }

  private initializeComponent(): void {
    const currentSlot = this.facade.getCurrentTimeSlot();
    this.activeTimeSlot.set(currentSlot);

    const timeSlots = this.facade.getTimeSlots();
    if (timeSlots[currentSlot]) {
      this.currentTimeSlot.set(timeSlots[currentSlot][0]);
    }

    this.showTimeIndicator.set(
      this.activeDay() === 0 &&
        this.activeTimeSlot() === this.facade.getCurrentTimeSlot()
    );
  }

  private initializeDataStreams(): void {
    // Stream de programas - MEJORADO
    this.facade
      .getProgramListData()
      .pipe(
        filter((data) => data !== null && data !== undefined),
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          console.log(
            '✅ Datos recibidos del facade:',
            data?.length,
            'activeDay=',
            this.activeDay()
          );
          this.handleDataUpdate(data);
        },
        error: (error) => {
          console.error('❌ Error en stream de datos:', error);
          this.handleDataError(error);
        },
        complete: () => {
          console.log('🏁 Stream de datos completado');
          // NUEVO: Si el stream se completa sin datos, forzar loading false
          if (!this.hasChannels() && this.isLoading()) {
            console.warn('⚠️ Stream completado sin datos, deteniendo loading');
            this.isLoading.set(false);
            this.cdr.markForCheck();
          }
        },
      });

    // Stream de estado de carga - SINCRONIZADO CON FACADE
    this.facade
      .getLoadingState()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => {
        console.log('🔄 Loading state del facade:', loading);

        // CRÍTICO: Sincronizar con el facade
        this.isLoading.set(loading);
        this.cdr.markForCheck();

        // NUEVO: Si facade dice que no está cargando pero tenemos datos, asegurar que estamos en estado correcto
        if (!loading && this.hasChannels()) {
          console.log('✅ Facade: No loading + Hay datos = Estado correcto');
        }

        // NUEVO: Si facade dice que no está cargando y NO hay datos, verificar si hay error
        if (!loading && !this.hasChannels() && !this.error()) {
          const now = Date.now();
          const sinceLastLoad = now - this.lastLoadTimestamp;
          // Si la última carga fue hace menos de 2s, evitar forzar un refresh automático
          if (sinceLastLoad < 2000) {
            console.warn(
              '⚠️ Facade: No loading + No datos + No error, pero la última carga fue reciente (' +
                sinceLastLoad +
                'ms), ignorando auto-refresh'
            );
          } else {
            console.warn(
              '⚠️ Facade: No loading + No datos + No error = Posible problema, intentando forzar recarga'
            );
            setTimeout(() => {
              if (!this.hasChannels() && !this.error()) {
                console.log('🔄 Intentando forzar recarga de datos...');
                this.facade.refreshData();
              }
            }, 1000);
          }
        }
      });

    // Stream de errores - MEJORADO
    this.facade
      .getErrorState()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => {
        console.log('⚠️ Error state del facade:', error);
        this.error.set(error);

        // CRÍTICO: Si hay error, asegurar que loading está en false
        if (error && this.isLoading()) {
          console.log('❌ Error detectado, forzando isLoading = false');
          this.isLoading.set(false);
        }

        this.cdr.markForCheck();
      });
  }
  private initializeBrowserFeatures(): void {
    if (!this.isBrowser) return;

    this.facade.updateScreenDimensions();
    this.setupTimeIndicatorUpdates();
    this.loadChannelLogos();
  }

  /**
   * Debug mejorado del estado de carga
   */
  public debugLoadingState(): void {
    console.group('🔍 DEBUG LOADING STATE');
    console.log('Component State:');
    console.log('  isLoading:', this.isLoading());
    console.log('  hasChannels:', this.hasChannels());
    console.log('  canalesConProgramas:', this.canalesConProgramas().length);
    console.log('  error:', this.error());
    console.log('  uiState:', this.uiState());

    console.log('\nFacade State:');
    this.facade.getProgramListData().subscribe({
      next: (data) => {
        console.log('  Facade tiene datos:', data?.length || 0);
      },
    });

    this.facade.getLoadingState().subscribe({
      next: (loading) => {
        console.log('  Facade loading state:', loading);
      },
    });

    this.facade.getErrorState().subscribe({
      next: (error) => {
        console.log('  Facade error state:', error);
      },
    });

    console.groupEnd();
  }

  private handleDataUpdate(data: IProgramListData[]): void {
    console.log('📊 handleDataUpdate recibió datos:', data?.length);

    // CRÍTICO: SIEMPRE establecer isLoading a false cuando se reciben datos
    this.isLoading.set(false);
    this.error.set(null);
    this.channelIndexCache.clear();

    if (data && Array.isArray(data) && data.length > 0) {
      const validChannels = data.filter(
        (canal) => canal && canal.channel && Array.isArray(canal.channels)
      );

      console.log('✅ Canales válidos:', validChannels.length);
      this.canalesConProgramas.set(validChannels);

      // Forzar actualización del viewport después de cargar datos
      this.cdr.markForCheck();

      if (this.isBrowser) {
        setTimeout(() => {
          if (this.virtualScrollViewport) {
            try {
              this.virtualScrollViewport.checkViewportSize();
              console.log('✅ Viewport actualizado');
            } catch (e) {
              console.warn('Error actualizando viewport:', e);
            }
          }
        }, 100);
      }
    } else {
      console.log('⚠️ No hay datos válidos');
      this.canalesConProgramas.set([]);

      // NUEVO: Si no hay datos válidos, considerar si esto es un error
      setTimeout(() => {
        if (!this.hasChannels() && !this.error()) {
          console.warn(
            '⚠️ No hay datos después de la carga, intentando recargar...'
          );
          this.facade.refreshData();
        }
      }, 2000);
    }

    this.cdr.markForCheck();
  }

  private handleDataError(error: any): void {
    console.error('❌ handleDataError:', error);

    // CRÍTICO: Establecer isLoading a false cuando hay error
    this.isLoading.set(false);
    this.error.set(error?.message || 'Error cargando datos');
    this.canalesConProgramas.set([]);
    this.cdr.markForCheck();
  }

  // ===============================================
  // NUEVO: MÉTODOS DE VERIFICACIÓN Y SEGURIDAD
  // ===============================================

  /**
   * Timeout de seguridad mejorado - CORREGIDO
   */
  private setupLoadingTimeout(): void {
    if (!this.isBrowser) return;

    // Timeout inicial de 3 segundos para verificación rápida
    setTimeout(() => {
      if (this.isLoading()) {
        console.warn('⚠️ Loading después de 3s, verificando estado...');
        this.debugLoadingState();

        // Verificar si el facade tiene datos
        this.facade.getProgramListData().subscribe((data) => {
          if (data && data.length > 0) {
            console.log('🔄 Facade tiene datos, forzando actualización');
            this.handleDataUpdate(data);
          }
        });
      }
    }, 3000);

    // Timeout de seguridad: si después de 10 segundos sigue cargando, forzar detención
    setTimeout(() => {
      if (this.isLoading()) {
        console.error('⚠️ TIMEOUT CRÍTICO - 10 segundos de carga');
        console.error('Estado actual:', {
          hasChannels: this.hasChannels(),
          channelsLength: this.canalesConProgramas().length,
          error: this.error(),
        });

        // Forzar detención de carga
        this.isLoading.set(false);

        // Si no hay datos después del timeout, mostrar error
        if (!this.hasChannels()) {
          this.error.set(
            'Tiempo de espera agotado. Por favor, recarga la página.'
          );
        }

        this.cdr.markForCheck();
      }
    }, 10000);
  }

  /**
   * NUEVO: Verificación del estado de carga
   */
  private verifyLoadingState(): void {
    console.group('🔍 VERIFY LOADING STATE');

    const state = {
      isLoading: this.isLoading(),
      hasChannels: this.hasChannels(),
      channelsCount: this.canalesConProgramas().length,
      hasError: this.error() !== null,
      error: this.error(),
    };

    console.log('Estado actual:', state);

    // Verificar inconsistencias
    if (state.isLoading && state.hasChannels) {
      console.warn('⚠️ INCONSISTENCIA: Loading true pero hay canales');
      console.log('🔧 Corrigiendo: estableciendo loading = false');
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }

    if (state.isLoading && state.hasError) {
      console.warn('⚠️ INCONSISTENCIA: Loading true pero hay error');
      console.log('🔧 Corrigiendo: estableciendo loading = false');
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }

    if (state.isLoading && !state.hasChannels && !state.hasError) {
      console.warn('⚠️ Aún cargando sin datos ni errores');
      console.log('🔄 Verificando estado del facade...');

      // Verificar estado del facade
      this.facade.getProgramListData().subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            console.log('✅ Facade tiene datos, actualizando...');
            this.handleDataUpdate(data);
          } else {
            console.log('⚠️ Facade tampoco tiene datos');
          }
        },
        error: (err) => {
          console.error('❌ Error verificando facade:', err);
          this.handleDataError(err);
        },
      });
    }

    console.groupEnd();
  }

  // ===============================================
  // MOBILE-SPECIFIC METHODS
  // ===============================================

  public getMobileItemSize(): number {
    return this.deviceDetector.getOptimalItemSize();
  }

  public getMobileVisiblePrograms(canal: IProgramListData): IProgramItem[] {
    const programs = this.transform.getVisiblePrograms(
      canal.channels,
      this.currentHours(),
      this.activeDay()
    );

    // Si el canal no está expandido, mostrar solo 3 programas
    const channelIndex = this.getChannelIndex(canal);
    if (!this.isChannelExpanded(channelIndex)) {
      return programs.slice(0, 3);
    }

    // Si está expandido, mostrar todos los programas
    return programs;
  }

  public getChannelIndex(canal: IProgramListData): number {
    const channelId = canal.id || canal.channel?.id || '';

    if (!this.channelIndexCache.has(channelId)) {
      const index = this.filteredChannels().findIndex(
        (c) => (c.id || c.channel?.id) === channelId
      );
      this.channelIndexCache.set(channelId, index);
    }

    return this.channelIndexCache.get(channelId) || 0;
  }

  // ===============================================
  // MÉTODOS DELEGADOS AL TRANSFORM SERVICE
  // ===============================================

  private getSlotEndMinutes(currentHours: string[]): number {
    return this.transform.getSlotEndMinutes(currentHours);
  }

  private parseTimeToMinutes(timeString: string): number {
    return this.transform.parseTimeToMinutes(timeString);
  }

  public getProgramLayers(canal: IProgramListData): ProgramWithPosition[][] {
    const layers = this.transform.getProgramLayers(
      canal,
      this.activeDay(),
      this.currentHours()
    );

    if (this.DEBUG && !this.isMobile()) {
      console.log(
        `Canal ${canal.channel?.name}: ${layers.length} capas, ${layers.reduce(
          (sum, layer) => sum + layer.length,
          0
        )} programas`
      );
    }

    return layers;
  }

  public getProgramGridColumn(programa: IProgramItem): number {
    const col = this.transform.getProgramGridColumn(
      programa,
      this.currentHours()
    );
    if (this.DEBUG) {
      console.log(
        `Program "${this.getProgramTitle(programa)}" - gridColumnStart: ${col}`
      );
    }
    return col;
  }

  public getProgramGridColumnEnd(programa: IProgramItem): number {
    const col = this.transform.getProgramGridColumnEnd(
      programa,
      this.currentHours()
    );
    if (this.DEBUG) {
      console.log(
        `Program "${this.getProgramTitle(programa)}" - gridColumnEnd: ${col}`
      );
    }
    return col;
  }

  // ===============================================
  // EVENT HANDLERS
  // ===============================================

  public onDayChanged(dayIndex: number): void {
    console.log(
      '[ProgramList] onDayChanged called with',
      dayIndex,
      'current activeDay=',
      this.activeDay()
    );
    if (this.activeDay() === dayIndex) return;

    const dayInfo = this.daysInfo()[dayIndex];
    if (!dayInfo) return;

    this.activeDay.set(dayIndex);
    this.showTimeIndicator.set(
      dayIndex === 0 &&
        this.activeTimeSlot() === this.facade.getCurrentTimeSlot()
    );

    if (dayIndex === 0) {
      const currentSlot = this.facade.getCurrentTimeSlot();
      this.onTimeSlotChanged(currentSlot);
    }

    this.selectedProgram.set(null);
    this.expandedChannels.set(new Set());
    this.channelIndexCache.clear();

    // Mark the time we started loading to avoid auto-refresh races
    this.lastLoadTimestamp = Date.now();
    this.isLoading.set(true);
    this.error.set(null);

    this.facade
      .loadProgramsForDay(dayIndex)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (!result.success) {
            this.error.set(result.error || 'Error al cargar datos');
          }
          this.isLoading.set(false);
          this.cdr.detectChanges();

          if (this.isBrowser) {
            setTimeout(() => {
              try {
                this.virtualScrollViewport?.checkViewportSize();
                this.virtualScrollViewport?.scrollToIndex(0);
              } catch (e) {
                console.warn('Error reseteando scroll:', e);
              }
            }, 100);
          }
        },
        error: (err) => {
          this.error.set('Error al cambiar de día');
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
      });

    this.dayChanged.emit({ dayIndex, dayInfo });
  }

  public onTimeSlotChanged(slotIndex: number): void {
    if (this.activeTimeSlot() === slotIndex || slotIndex < 0 || slotIndex >= 8)
      return;

    const timeSlots = this.facade.getTimeSlots();
    const selectedSlot = timeSlots[slotIndex];
    if (!selectedSlot) return;

    this.activeTimeSlot.set(slotIndex);
    this.currentTimeSlot.set(selectedSlot[0]);

    this.showTimeIndicator.set(
      this.activeDay() === 0 && slotIndex === this.facade.getCurrentTimeSlot()
    );

    if (this.showTimeIndicator() && this.isBrowser) {
      this.updateTimeIndicator();
    }

    this.cdr.markForCheck();
  }

  public onProgramSelected(channelIndex: number, program: IProgramItem): void {
    console.log(
      '[ProgramList] onProgramSelected called, channelIndex=',
      channelIndex,
      'programId=',
      program?.id
    );
    this.closeAllDropdowns();

    if (
      this.selectedProgram()?.id === program.id &&
      this.isChannelExpanded(channelIndex)
    ) {
      // Si se hace clic en el mismo programa, cerrarlo
      this.selectedProgram.set(null);
      if (!this.isMobile()) {
        this.onChannelToggle(channelIndex);
      }
      return;
    }

    // Expandir canal si no está expandido
    if (!this.isChannelExpanded(channelIndex)) {
      this.onChannelToggle(channelIndex);
    }

    // En desktop, cerrar otros canales expandidos
    if (!this.isMobile()) {
      const expandedChannels = this.expandedChannels();
      expandedChannels.forEach((expandedIndex) => {
        if (expandedIndex !== channelIndex) {
          this.onChannelToggle(expandedIndex);
        }
      });
    }

    this.selectedProgram.set(program);
    this.cdr.markForCheck();
  }

  public onChannelToggle(index: number): void {
    const expanded = new Set(this.expandedChannels());

    if (expanded.has(index)) {
      // Cerrar canal
      expanded.delete(index);
      this.selectedChannel.set(-1);

      // En móvil, NO cerrar el programa seleccionado automáticamente
      if (!this.isMobile()) {
        this.selectedProgram.set(null);
      }
    } else {
      // Expandir canal
      if (this.isMobile()) {
        // En móvil, solo permitir un canal expandido a la vez
        expanded.clear();
      }
      expanded.add(index);
      this.selectedChannel.set(index);
    }

    this.expandedChannels.set(expanded);
    this.cdr.markForCheck();
  }

  // ===============================================
  // DROPDOWN METHODS
  // ===============================================

  public toggleDayDropdown(): void {
    this.isDayDropdownOpen.set(!this.isDayDropdownOpen());
    this.isCategoryDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }

  public toggleCategoryDropdown(): void {
    this.isCategoryDropdownOpen.set(!this.isCategoryDropdownOpen());
    this.isDayDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }

  public toggleTimeSlotDropdown(): void {
    this.isTimeSlotDropdownOpen.set(!this.isTimeSlotDropdownOpen());
    this.isDayDropdownOpen.set(false);
    this.isCategoryDropdownOpen.set(false);
    this.cdr.markForCheck();
  }

  public closeAllDropdowns(): void {
    this.isDayDropdownOpen.set(false);
    this.isCategoryDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }

  // ===============================================
  // CATEGORY FILTERING
  // ===============================================

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

  public clearCategoryFilter(): void {
    this.selectedCategories.set(new Set());
    this.categorySelected.emit([]);
    this.cdr.markForCheck();
  }

  // ===============================================
  // TEMPLATE HELPER METHODS
  // ===============================================

  public getCurrentSelectedDay(): string {
    const dayInfo = this.daysInfo()[this.activeDay()];
    return dayInfo
      ? `${dayInfo.diaSemana} ${dayInfo.diaNumero}`
      : 'Seleccionar día';
  }

  public getCurrentSelectedTimeSlot(): string {
    const timeSlots = this.currentTimeSlots();
    const activeSlot = this.activeTimeSlot();
    if (timeSlots && timeSlots[activeSlot]) {
      const franja = timeSlots[activeSlot];
      return `${franja[0]} - ${franja[franja.length - 1]}`;
    }
    return 'Seleccionar franja';
  }

  public getCategoryButtonText(): string {
    const selectedCategories = this.selectedCategories();
    if (selectedCategories.size === 0) return 'Todas las categorías';
    if (selectedCategories.size === 1) {
      const category = Array.from(selectedCategories)[0];
      return this.getCategoryDisplayName(category);
    }
    return `${selectedCategories.size} categorías`;
  }

  public selectDay(dayIndex: number, event?: MouseEvent): void {
    if (event) {
      try {
        event.stopPropagation();
        event.preventDefault();
      } catch {}
    }

    console.log('[ProgramList] selectDay ->', dayIndex);
    this.onDayChanged(dayIndex);
    this.isDayDropdownOpen.set(false);

    // Cerrar programa seleccionado al cambiar de día
    this.selectedProgram.set(null);
    this.expandedChannels.set(new Set());
  }

  public selectCategory(category: string | null): void {
    if (category) {
      this.onCategorySelected(category);
    } else {
      this.clearCategoryFilter();
      this.isCategoryDropdownOpen.set(false);
    }
    this.cdr.markForCheck();
  }

  public selectTimeSlot(slotIndex: number): void {
    this.onTimeSlotChanged(slotIndex);
    this.isTimeSlotDropdownOpen.set(false);

    // Cerrar programa seleccionado al cambiar de franja
    this.selectedProgram.set(null);
    this.expandedChannels.set(new Set());
  }

  // ===============================================
  // STATE CHECK METHODS
  // ===============================================

  public isChannelExpanded(index: number): boolean {
    return this.expandedChannels().has(index);
  }

  public isCategorySelected(category: string): boolean {
    return this.selectedCategories().has(category);
  }

  public isAllCategoriesSelected(): boolean {
    return this.selectedCategories().size === 0;
  }

  public isProgramCutAtStart(programa: IProgramItem): boolean {
    const currentHours = this.currentHours();
    if (!currentHours.length) return false;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotStartTs = this.transform.getSlotStartTimestamp(
      this.activeDay(),
      slotStartMinutes
    );
    const progStartTs = this.transform.getProgramStartTimestamp(programa);

    return progStartTs < slotStartTs;
  }

  public isProgramCutAtEnd(programa: IProgramItem): boolean {
    const currentHours = this.currentHours();
    if (!currentHours.length) return false;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    const slotStartTs = this.transform.getSlotStartTimestamp(
      this.activeDay(),
      slotStartMinutes
    );
    const slotEndTs =
      slotStartTs + (slotEndMinutes - slotStartMinutes) * 60_000;
    const progEndTs = this.transform.getProgramEndTimestamp(programa);

    return progEndTs > slotEndTs;
  }

  // ===============================================
  // FACADE DELEGATION METHODS
  // ===============================================

  public formatDisplayTime(timeString: string): string {
    return this.facade.formatDisplayTime(timeString);
  }

  public getCategoryBadgeClasses(categoryValue: string): string {
    return this.facade.getCategoryBadgeClasses(categoryValue);
  }

  public getCategoryDisplayName(categoryValue: string): string {
    return this.transform.normalizeCategoryName(categoryValue);
  }

  public getDayButtonClasses(dayIndex: number): string {
    return this.facade.getDayButtonClasses(dayIndex, this.activeDay());
  }

  public getTimeSlotButtonClasses(timeSlot: string): string {
    return this.facade.getTimeSlotButtonClasses(
      timeSlot,
      this.currentTimeSlot()
    );
  }

  public getChannelLogoUrl(channelData: any): string {
    if (channelData?.channel?.icon) return channelData.channel.icon;
    if (channelData?.icon) return channelData.icon;
    return this.facade.getChannelLogoUrl(channelData) || '';
  }

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

  public getCurrentTime(): string {
    if (!this.isBrowser) return '00:00';

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // ===============================================
  // UI HELPER METHODS
  // ===============================================

  public getChannelHeight(canal: IProgramListData, index: number): number {
    const layers = this.getProgramLayers(canal);
    const layerCount = layers.length || 1;
    const baseHeight = UI_CONFIG.LAYER_HEIGHT * layerCount;

    if (this.isChannelExpanded(index) && this.selectedProgram()) {
      return baseHeight + UI_CONFIG.EXPANDED_BANNER_HEIGHT;
    }

    return baseHeight;
  }

  public getLayerCount(canal: IProgramListData): number {
    const layers = this.getProgramLayers(canal);
    return Math.max(1, layers.length);
  }

  public getItemSize(): number {
    return this.deviceDetector.getOptimalItemSize();
  }

  public getProgramCutClasses(programa: IProgramItem): string {
    const classes: string[] = [];

    if (this.isProgramCutAtStart(programa)) classes.push('program-cut-start');
    if (this.isProgramCutAtEnd(programa)) classes.push('program-cut-end');

    return classes.join(' ');
  }

  public getProgramVisibleStartTime(programa: IProgramItem): string {
    const currentHours = this.currentHours();
    if (!currentHours.length) return this.formatProgramTime(programa.start);
    return this.formatProgramTime(programa.start);
  }

  public getProgramVisibleEndTime(programa: IProgramItem): string {
    const currentHours = this.currentHours();
    if (!currentHours.length) return this.formatProgramTime(programa.stop);

    const isNightSlot = this.transform.isNightTimeSlot(currentHours);
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    const progEndMinutes = this.transform.getProgramEndMinutes(programa);
    const crossesMidnight = this.transform.programCrossesMidnight(programa);

    if (isNightSlot && crossesMidnight) {
      if (progEndMinutes > slotEndMinutes) {
        return this.transform.formatMinutesToHHMM(slotEndMinutes);
      }
    }

    const progEndTs = this.transform.getProgramEndTimestamp(programa);
    const slotStartTs = this.transform.getSlotStartTimestamp(
      this.activeDay(),
      slotStartMinutes
    );
    const slotEndTs =
      slotStartTs + (slotEndMinutes - slotStartMinutes) * 60_000;

    if (progEndTs > slotEndTs) {
      return this.transform.formatMinutesToHHMM(slotEndMinutes);
    }

    return this.formatProgramTime(programa.stop);
  }

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

  public getTimeIndicatorZIndex(): number {
    const hasOpenDropdown =
      this.isDayDropdownOpen() ||
      this.isCategoryDropdownOpen() ||
      this.isTimeSlotDropdownOpen();
    return hasOpenDropdown ? 30 : 10000;
  }

  public getSelectedProgramBannerData(): any {
    return this.selectedProgram();
  }

  // ===============================================
  // DROPDOWN CSS CLASSES
  // ===============================================

  public getDayDropdownItemClasses(dayIndex: number): string {
    const isActive = dayIndex === this.activeDay();
    return isActive
      ? 'bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold'
      : '';
  }

  public getCategoryDropdownItemClasses(category: string | null): string {
    const isActive = category
      ? this.selectedCategories().has(category)
      : this.selectedCategories().size === 0;
    return isActive
      ? 'bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold'
      : '';
  }

  public getTimeSlotDropdownItemClasses(timeSlotStart: string): string {
    const isActive = timeSlotStart === this.currentTimeSlot();
    return isActive
      ? 'bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold'
      : '';
  }

  // ===============================================
  // 5. AÑADIR método para cerrar programa en móvil
  // ===============================================

  public closeMobileProgram(): void {
    this.selectedProgram.set(null);
    const expandedChannels = this.expandedChannels();
    expandedChannels.clear();
    this.expandedChannels.set(expandedChannels);
    this.cdr.markForCheck();
  }

  // ===============================================
  // MOBILE NAVIGATION METHODS
  // ===============================================

  public previousTimeSlot(): void {
    const current = this.activeTimeSlot();
    if (current > 0) {
      this.onTimeSlotChanged(current - 1);
    }
  }

  public nextTimeSlot(): void {
    const current = this.activeTimeSlot();
    if (current < 7) {
      this.onTimeSlotChanged(current + 1);
    }
  }

  public scrollToNow(): void {
    if (this.activeDay() !== 0) return;

    const currentSlot = this.facade.getCurrentTimeSlot();
    this.onTimeSlotChanged(currentSlot);
  }

  // ===============================================
  // TRACK BY FUNCTIONS
  // ===============================================

  public trackByDayIndex = (index: number): number => index;

  public trackByTimeSlot = (index: number, item: string[]): string => item[0];

  public trackByHour = (index: number, item: string): string => item;

  public trackByChannelId = (index: number, item: IProgramListData): string =>
    item.id || item.channel?.id || `channel-${index}`;

  public trackByProgramId = (index: number, item: IProgramItem): string =>
    item.id || `${item.start}-${item.stop}-${index}`;

  public trackByCategory = (index: number, category: string): string =>
    category;

  // ===============================================
  // HOST LISTENERS
  // ===============================================

  @HostListener('scroll', ['$event'])
  onScroll(event: Event): void {
    // NO cerrar el programa seleccionado al hacer scroll
    // Solo actualizar el indicador de tiempo si es necesario
    if (this.showTimeIndicator() && this.activeDay() === 0) {
      this.updateTimeIndicator();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isBrowser) return;

    const target = event.target as HTMLElement;

    // If the click happened inside the program detail modal, ignore it
    if (
      target.closest('.program-detail-modal-container') ||
      target.closest('.desktop-modal') ||
      target.closest('app-program-detail-modal')
    ) {
      return;
    }

    // No hacer nada si se hace clic dentro de dropdowns
    if (
      target.closest('.dropdown-container') ||
      target.closest('.mobile-control')
    ) {
      return;
    }

    // Cerrar dropdowns si se hace clic fuera
    if (!target.closest('.mobile-dropdown') && !target.closest('.mobile-btn')) {
      this.closeAllDropdowns();
    }

    // En móvil, NO cerrar el programa seleccionado al hacer clic fuera
    // Solo cerrarlo con el botón X
    if (this.isMobile()) {
      return;
    }

    // En desktop, cerrar programa si se hace clic fuera
    if (
      !target.closest('.channel-programs-container') &&
      !target.closest('.expanded-banner') &&
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

  private updateTimeIndicator(): void {
    if (!this.showTimeIndicator() || !this.isBrowser) return;
    this.cdr.markForCheck();
  }

  private setupTimeIndicatorUpdates(): void {
    if (!this.isBrowser) return;

    this.updateInterval = setInterval(() => {
      if (this.showTimeIndicator() && this.activeDay() === 0) {
        this.updateTimeIndicator();
      }
    }, 60000);
  }

  private loadChannelLogos(): void {
    if (!this.isBrowser) return;

    this.http
      .get<any>('/assets/canales.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.facade.updateChannelData(data || {}),
        error: (error) => console.error('Error loading channel data:', error),
      });
  }

  private cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.channelIndexCache.clear();
  }
}
