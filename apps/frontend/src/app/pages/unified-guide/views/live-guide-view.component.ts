import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { startWith, switchMap } from 'rxjs';
import { BottomSheetComponent } from '../../../components/bottom-sheet/bottom-sheet.component';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { UnifiedFilterDockComponent, UnifiedFilterDockSection } from '../../../components/unified-filter-dock/unified-filter-dock.component';
import { UnifiedProgramCardComponent } from '../../../components/unified-program-card/unified-program-card.component';
import { ChannelMetaDTO, TvReadItemDTO } from '../../../api/models';
import { UnifiedGuideStateService } from '../../../state/unified-guide.state';
import { UnifiedShellUiStateService } from '../../../state/unified-shell-ui.state';
import { TvDataFacade } from '../../../state/tv-data.facade';
import { normalizeToCard } from '../../../utils/tv-normalizers';
import { ViewportService } from '../../../services/viewport.service';

interface EpgRow {
  channelId: string;
  channelName: string;
  channelIcon: string;
  items: Array<{
    item: TvReadItemDTO;
    left: number;
    width: number;
    label: string;
  }>;
}

interface LiveDirectorySection {
  id: string;
  kind: 'group' | 'category' | 'flag';
  eyebrow: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    label: string;
    meta: string;
    iconPath?: string;
    active: boolean;
  }>;
}

interface LiveSpotlightModule {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  actionView: 'now' | 'next' | 'night' | 'day';
  items: TvReadItemDTO[];
}

@Component({
  selector: 'app-live-guide-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BottomSheetComponent,
    UnifiedFilterDockComponent,
    UnifiedProgramCardComponent,
  ],
  templateUrl: './live-guide-view.component.html',
  styleUrl: './live-guide-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveGuideViewComponent {
  private readonly isBrowser: boolean;
  readonly selectedItem = signal<TvReadItemDTO | null>(null);

  readonly categoryChips: FilterChipItem[] = [
    { id: 'all', label: 'Todo' },
    { id: 'Cine', label: 'Cine' },
    { id: 'Series', label: 'Series' },
    { id: 'Deportes', label: 'Deportes' },
    { id: 'Entretenimiento', label: 'Entretenimiento' },
    { id: 'Noticias', label: 'Noticias' },
    { id: 'Infantil', label: 'Infantil' },
  ];
  readonly groupChips: FilterChipItem[] = [
    { id: 'all', label: 'Todos' },
    { id: 'tdt', label: 'TDT' },
    { id: 'autonomico', label: 'Autonómico' },
    { id: 'cable', label: 'Cable' },
    { id: 'movistar', label: 'Movistar+' },
    { id: 'online', label: 'Online' },
  ];
  readonly liveFlagChips: FilterChipItem[] = [
    { id: 'live', label: 'Directo' },
    { id: 'catchup', label: 'Catch-up' },
    { id: 'streaming', label: 'Streaming' },
  ];

  private readonly filters = computed(() => ({
    ...this.guideState.liveFilters(),
    q: this.guideState.searchQuery(),
  }));
  private readonly filters$ = toObservable(this.filters).pipe(startWith(this.filters()));

  readonly surface = toSignal(
    this.filters$.pipe(switchMap((filters) => this.facade.getGuideSurface(filters))),
    { initialValue: null }
  );
  readonly nowPrograms = toSignal(
    this.filters$.pipe(
      switchMap((filters) =>
        filters.q
          ? this.facade.searchTvPrograms({ ...filters, limit: 48 })
          : this.facade.getLivePrograms({ ...filters, limit: 36 })
      )
    ),
    { initialValue: [] as TvReadItemDTO[] }
  );
  readonly nextPrograms = toSignal(
    this.filters$.pipe(switchMap((filters) => this.facade.getNextPrograms({ ...filters, limit: 36 }))),
    { initialValue: [] as TvReadItemDTO[] }
  );
  readonly nightPrograms = toSignal(
    this.filters$.pipe(switchMap((filters) => this.facade.getTonightPrograms({ ...filters, limit: 48 }))),
    { initialValue: [] as TvReadItemDTO[] }
  );
  readonly allPrograms = toSignal(
    this.filters$.pipe(switchMap((filters) => this.facade.getAllPrograms({ ...filters, limit: 240 }))),
    { initialValue: [] as TvReadItemDTO[] }
  );
  readonly channels = toSignal(
    this.filters$.pipe(switchMap((filters) => this.facade.getChannels(filters.group, filters.date))),
    { initialValue: [] as ChannelMetaDTO[] }
  );

  readonly visiblePrograms = computed(() => {
    const view = this.guideState.liveFilters().liveView;
    if (view === 'next') return this.nextPrograms();
    if (view === 'night') return this.nightPrograms();
    if (view === 'day') return this.allPrograms();
    return this.nowPrograms();
  });
  readonly sectionTitle = computed(() => {
    const view = this.guideState.liveFilters().liveView;
    if (view === 'next') return 'A continuación';
    if (view === 'night') return 'Esta noche';
    if (view === 'day') return 'Parrilla completa en formato feed';
    return 'En emisión ahora';
  });
  readonly sectionDescription = computed(() => {
    const view = this.guideState.liveFilters().liveView;
    if (view === 'next') return 'El siguiente salto de zapping aparece primero y sin interfaz densa.';
    if (view === 'night') return 'Prime time y bloques fuertes con lectura rápida por contenido.';
    if (view === 'day') return 'Todo el día se lee como catálogo por canal y franja, no como EPG clásica.';
    return 'La emisión activa entra antes que filtros, métricas o paneles pesados.';
  });
  readonly leadPrograms = computed(() => this.visiblePrograms().slice(0, 4));
  readonly leadProgram = computed(() =>
    this.guideState.liveFilters().liveView === 'day' ? null : this.visiblePrograms()[0] || null
  );
  readonly supportingPrograms = computed(() =>
    this.guideState.liveFilters().liveView === 'day' ? [] : this.visiblePrograms().slice(1, 4)
  );
  readonly gridPrograms = computed(() => {
    const currentView = this.guideState.liveFilters().liveView;
    if (currentView === 'day') {
      return this.visiblePrograms();
    }
    return this.visiblePrograms().slice(this.leadProgram() ? 4 : 0);
  });
  readonly topChannels = computed(() => this.channels().slice(0, 12));
  readonly dayChannelSections = computed(() =>
    this.topChannels()
      .map((channel) => ({
        channel,
        items: this.allPrograms()
          .filter((item) => item.channel.id === channel.id)
          .slice(0, 4),
      }))
      .filter((entry) => entry.items.length)
  );
  readonly epgRows = computed(() => buildEpgRows(this.allPrograms()));
  readonly currentTimePercent = computed(() => {
    if (this.guideState.liveFilters().date !== 'today') {
      return null;
    }
    const now = new Date();
    return ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
  });
  readonly availableChannelTypes = computed(() =>
    Array.from(
      new Set(
        this.channels()
          .map((channel) => String(channel.type || '').trim())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right, 'es'))
  );
  readonly availableRegions = computed(() =>
    Array.from(
      new Set(
        this.channels()
          .map((channel) => String(channel.region || channel.country || '').trim())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right, 'es'))
  );
  readonly activeFilterSummary = computed(() => {
    const filters = this.guideState.liveFilters();
    const summary = [
      filters.group !== 'all' ? filters.group : '',
      filters.category !== 'all' ? filters.category : '',
      filters.channelType !== 'all' ? filters.channelType : '',
      filters.region !== 'all' ? filters.region : '',
      filters.channel ? this.channels().find((channel) => channel.id === filters.channel)?.name || filters.channel : '',
      ...filters.flags.map((flag) => flag === 'live' ? 'Directo' : flag === 'catchup' ? 'Catch-up' : 'Streaming'),
      filters.date !== 'today' ? 'Mañana' : '',
    ].filter(Boolean);
    if (this.guideState.searchQuery()) {
      summary.push(`"${this.guideState.searchQuery()}"`);
    }
    return summary;
  });
  readonly quickAccessSections = computed<LiveDirectorySection[]>(() => {
    const filters = this.guideState.liveFilters();
    return [
      {
        id: 'groups',
        kind: 'group',
        eyebrow: 'Directorio',
        title: 'Grupos de canal',
        description: 'TDT, cable, autonómico y operadores principales accesibles desde el primer scroll.',
        items: this.groupChips.map((chip) => ({
          id: chip.id,
          label: chip.label,
          meta: describeLiveGroup(chip.id),
          iconPath: chip.iconPath,
          active: filters.group === chip.id,
        })),
      },
      {
        id: 'categories',
        kind: 'category',
        eyebrow: 'Editorial',
        title: 'Categorías rápidas',
        description: 'Cine, series, deportes y otros bloques útiles sin abrir el panel avanzado.',
        items: this.categoryChips.map((chip) => ({
          id: chip.id,
          label: chip.label,
          meta: describeLiveCategory(chip.id),
          iconPath: chip.iconPath,
          active: filters.category === chip.id,
        })),
      },
      {
        id: 'flags',
        kind: 'flag',
        eyebrow: 'Señales',
        title: 'Disponibilidad',
        description: 'Directo, catch-up y streaming viven como capa secundaria, no como reemplazo del contenido.',
        items: this.liveFlagChips.map((chip) => ({
          id: chip.id,
          label: chip.label,
          meta: describeLiveFlag(chip.id),
          iconPath: chip.iconPath,
          active: filters.flags.includes(chip.id as 'live' | 'catchup' | 'streaming'),
        })),
      },
    ];
  });
  readonly spotlightModules = computed<LiveSpotlightModule[]>(() => [
    {
      id: 'spotlight-now',
      eyebrow: 'Ahora',
      title: 'En emisión',
      description: 'Lectura inmediata del lineal activo con acceso directo a detalle.',
      actionLabel: 'Ver ahora',
      actionView: 'now',
      items: this.nowPrograms().slice(0, 4),
    },
    {
      id: 'spotlight-next',
      eyebrow: 'Siguiente',
      title: 'A continuación',
      description: 'El siguiente bloque de zapping aparece sin perder el primer viewport.',
      actionLabel: 'Abrir siguiente',
      actionView: 'next',
      items: this.nextPrograms().slice(0, 4),
    },
    {
      id: 'spotlight-night',
      eyebrow: 'Prime time',
      title: 'Esta noche',
      description: 'Cine, series y deportes del tramo fuerte desde una vista editorial.',
      actionLabel: 'Ir a noche',
      actionView: 'night',
      items: this.nightPrograms().slice(0, 4),
    },
  ]);
  readonly filterDockSections = computed<UnifiedFilterDockSection[]>(() => [
    {
      id: 'group',
      title: 'Grupo de canal',
      options: this.groupChips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.liveFilters().group === chip.id,
      })),
    },
    {
      id: 'category',
      title: 'Categoría',
      options: this.categoryChips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.liveFilters().category === chip.id,
      })),
    },
    {
      id: 'channelType',
      title: 'Tipo de canal',
      options: [
        { id: 'all', label: 'Todos', selected: this.guideState.liveFilters().channelType === 'all' },
        ...this.availableChannelTypes().map((type) => ({
          id: type,
          label: type,
          selected: this.guideState.liveFilters().channelType === type,
        })),
      ],
    },
    {
      id: 'region',
      title: 'Región',
      options: [
        { id: 'all', label: 'Todas', selected: this.guideState.liveFilters().region === 'all' },
        ...this.availableRegions().map((region) => ({
          id: region,
          label: region,
          selected: this.guideState.liveFilters().region === region,
        })),
      ],
    },
    {
      id: 'flags',
      title: 'Disponibilidad',
      description: 'Señales útiles de directo, catch-up y streaming',
      multiSelect: true,
      options: this.liveFlagChips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.liveFilters().flags.includes(chip.id as 'live' | 'catchup' | 'streaming'),
      })),
    },
    {
      id: 'channel',
      title: 'Canal',
      description: 'Directorio rápido dentro del mismo flujo',
      options: [
        { id: '', label: 'Todos los canales', selected: !this.guideState.liveFilters().channel },
        ...this.topChannels().map((channel) => ({
          id: channel.id,
          label: channel.name,
          selected: this.guideState.liveFilters().channel === channel.id,
        })),
      ],
    },
  ]);

  constructor(
    readonly guideState: UnifiedGuideStateService,
    readonly shellUi: UnifiedShellUiStateService,
    private readonly facade: TvDataFacade,
    private readonly router: Router,
    private readonly viewport: ViewportService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  selectView(liveView: string): void {
    if (liveView === 'now' || liveView === 'next' || liveView === 'night' || liveView === 'day') {
      this.guideState.updateLiveFilters({ liveView });
    }
  }

  selectChannel(channelId: string): void {
    this.guideState.updateLiveFilters({
      channel: this.guideState.liveFilters().channel === channelId ? '' : channelId,
    });
  }

  selectGroup(group: string): void {
    this.guideState.updateLiveFilters({
      group: this.guideState.liveFilters().group === group ? 'all' : group,
    });
  }

  selectCategory(category: string): void {
    this.guideState.updateLiveFilters({
      category: this.guideState.liveFilters().category === category ? 'all' : category,
    });
  }

  toggleFlag(flag: string): void {
    const nextFlags = new Set(this.guideState.liveFilters().flags);
    if (nextFlags.has(flag as 'live' | 'catchup' | 'streaming')) {
      nextFlags.delete(flag as 'live' | 'catchup' | 'streaming');
    } else {
      nextFlags.add(flag as 'live' | 'catchup' | 'streaming');
    }
    this.guideState.updateLiveFilters({ flags: Array.from(nextFlags) });
  }

  applyQuickAccess(kind: LiveDirectorySection['kind'], optionId: string): void {
    if (kind === 'group') {
      this.selectGroup(optionId);
      return;
    }
    if (kind === 'category') {
      this.selectCategory(optionId);
      return;
    }
    this.toggleFlag(optionId);
  }

  clearFilters(): void {
    this.guideState.updateLiveFilters({
      group: 'tdt',
      category: 'all',
      liveView: 'now',
      date: 'today',
      channel: '',
      channelType: 'all',
      region: 'all',
      flags: [],
    });
  }

  closeDock(): void {
    this.shellUi.closeFilterDock();
  }

  handleDockSelect(event: { sectionId: string; optionId: string }): void {
    if (event.sectionId === 'group') {
      this.guideState.updateLiveFilters({ group: event.optionId || 'all' });
      return;
    }
    if (event.sectionId === 'category') {
      this.guideState.updateLiveFilters({ category: event.optionId || 'all' });
      return;
    }
    if (event.sectionId === 'channelType') {
      this.guideState.updateLiveFilters({ channelType: event.optionId || 'all' });
      return;
    }
    if (event.sectionId === 'region') {
      this.guideState.updateLiveFilters({ region: event.optionId || 'all' });
      return;
    }
    if (event.sectionId === 'channel') {
      this.guideState.updateLiveFilters({ channel: event.optionId || '' });
      return;
    }
    if (event.sectionId === 'flags') {
      this.toggleFlag(event.optionId);
    }
  }

  openItem(item: TvReadItemDTO): void {
    if (this.isBrowser && this.viewport.isMobile()) {
      this.selectedItem.set(item);
      return;
    }
    void this.router.navigateByUrl(normalizeToCard(item).detailPath);
  }

  closeSheet(): void {
    this.selectedItem.set(null);
  }

  trackByItem(_index: number, item: TvReadItemDTO): string {
    return item.id;
  }

  trackByChannel(_index: number, channel: ChannelMetaDTO): string {
    return channel.id;
  }

  trackByChannelSection(_index: number, section: { channel: ChannelMetaDTO }): string {
    return section.channel.id;
  }

  trackByText(_index: number, value: string): string {
    return value;
  }
}

function buildEpgRows(items: TvReadItemDTO[]): EpgRow[] {
  const rows = new Map<string, EpgRow>();
  const sorted = [...items].sort((left, right) => {
    const channelOrder = Number(left.channel.sortOrder || 999) - Number(right.channel.sortOrder || 999);
    if (channelOrder !== 0) {
      return channelOrder;
    }
    return new Date(left.airing.start).getTime() - new Date(right.airing.start).getTime();
  });

  sorted.forEach((item) => {
    const channelId = item.channel.id;
    const start = new Date(item.airing.start);
    const end = new Date(item.airing.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    let endMinutes = end.getHours() * 60 + end.getMinutes();
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    const row = rows.get(channelId) || {
      channelId,
      channelName: item.channel.name,
      channelIcon: item.assets.channelLogo?.url || item.channel.icon || '',
      items: [],
    };
    row.items.push({
      item,
      left: (startMinutes / (24 * 60)) * 100,
      width: Math.max(((endMinutes - startMinutes) / (24 * 60)) * 100, 4),
      label: `${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
    });
    rows.set(channelId, row);
  });

  return Array.from(rows.values());
}

function describeLiveGroup(group: string): string {
  if (group === 'all') return 'Todos los accesos';
  if (group === 'tdt') return 'Canales abiertos y generalistas';
  if (group === 'autonomico') return 'Lectura territorial y local';
  if (group === 'cable') return 'Temáticos y pago';
  if (group === 'movistar') return 'Operador premium';
  if (group === 'online') return 'Señales web y streaming';
  return 'Grupo de canal';
}

function describeLiveCategory(category: string): string {
  if (category === 'all') return 'Mezcla editorial completa';
  if (category === 'Cine') return 'Películas y sesiones destacadas';
  if (category === 'Series') return 'Series y ficción';
  if (category === 'Deportes') return 'Eventos, partidos y agenda';
  if (category === 'Entretenimiento') return 'Programas y formatos generalistas';
  if (category === 'Noticias') return 'Actualidad y directo informativo';
  if (category === 'Infantil') return 'Programación familiar';
  return 'Filtro editorial';
}

function describeLiveFlag(flag: string): string {
  if (flag === 'live') return 'Emisión en directo';
  if (flag === 'catchup') return 'Disponible a la carta';
  if (flag === 'streaming') return 'También en streaming';
  return 'Señal adicional';
}
