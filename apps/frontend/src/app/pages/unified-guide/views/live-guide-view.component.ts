import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { EpgGridComponent } from '../../../components/epg-grid/epg-grid.component';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { PortalLocalToolbarComponent } from '../../../components/portal-local-toolbar/portal-local-toolbar.component';
import { UnifiedFilterDockComponent, UnifiedFilterDockSection } from '../../../components/unified-filter-dock/unified-filter-dock.component';
import { UnifiedProgramCardComponent } from '../../../components/unified-program-card/unified-program-card.component';
import { UnifiedAsyncStateComponent } from '../../../components/unified-async-state/unified-async-state.component';
import { ChannelMetaDTO, TvReadItemDTO } from '../../../api/models';
import { UnifiedGuideStateService } from '../../../state/unified-guide.state';
import { UnifiedShellUiStateService } from '../../../state/unified-shell-ui.state';
import { TvDataFacade } from '../../../state/tv-data.facade';
import { formatMadridHM } from '../../../utils/madrid-time';
import { normalizeToCard } from '../../../utils/tv-normalizers';

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

export interface MobileChannelScheduleSection {
  channel: ChannelMetaDTO;
  items: TvReadItemDTO[];
}

@Component({
  selector: 'app-live-guide-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EpgGridComponent,
    UnifiedFilterDockComponent,
    PortalLocalToolbarComponent,
    UnifiedProgramCardComponent,
    UnifiedAsyncStateComponent,
  ],
  templateUrl: './live-guide-view.component.html',
  styleUrl: './live-guide-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveGuideViewComponent {
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
    { id: 'deporte', label: 'Deportes' },
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
  private readonly retryNonce = signal(0);
  private readonly request = computed(() => ({
    filters: this.filters(),
    retryNonce: this.retryNonce(),
  }));
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  // toObservable() emits the signal's current value on subscription. A
  // startWith(this.filters()) here previously duplicated every initial API
  // request, including the expensive day and guide-surface views.
  private readonly filters$ = toObservable(this.request);

  private readonly selectedPrograms = toSignal(
    this.filters$.pipe(
      switchMap(({ filters }) => {
        this.loadState.set('loading');
        let request: Observable<TvReadItemDTO[]>;
        if (filters.q) {
          request = this.facade.searchTvPrograms({ ...filters, limit: 48 });
        } else if (filters.liveView === 'next') {
          request = this.facade.getNextPrograms({ ...filters, limit: 48 });
        } else if (filters.liveView === 'night') {
          request = this.facade.getTonightPrograms({ ...filters, limit: 48 });
        } else if (filters.liveView === 'day') {
          request = this.facade.getDaySchedule(filters);
        } else {
          request = this.facade.getLivePrograms({ ...filters, limit: 36 });
        }
        return request.pipe(
          tap(() => this.loadState.set('ready')),
          catchError(() => {
            this.loadState.set('error');
            return of([] as TvReadItemDTO[]);
          })
        );
      })
    ),
    { initialValue: [] as TvReadItemDTO[] }
  );
  readonly visiblePrograms = computed(() => this.selectedPrograms() ?? []);
  readonly allPrograms = computed(() =>
    this.guideState.liveFilters().liveView === 'day' ? this.visiblePrograms() : []
  );
  readonly channels = computed<ChannelMetaDTO[]>(() => {
    const unique = new Map<string, ChannelMetaDTO>();
    this.visiblePrograms().forEach((item) =>
      unique.set(item.channel.id, item.channel)
    );
    return Array.from(unique.values());
  });
  readonly loading = computed(() => this.loadState() === 'loading');
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
    return 'Descubre qué están emitiendo ahora y cambia de canal sin perder el hilo.';
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
  readonly dayChannelSections = computed<MobileChannelScheduleSection[]>(() =>
    this.channels()
      .map((channel) => ({
        channel,
        items: selectMobileChannelSchedule(
          this.allPrograms().filter((item) => item.channel.id === channel.id),
          this.guideState.liveFilters().date
        ),
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
  readonly activeFilters = computed(() => {
    const filters = this.guideState.liveFilters();
    const summary: Array<{ key: string; label: string }> = [];
    if (filters.group !== 'tdt') summary.push({ key: 'group', label: humanizeGroup(filters.group) });
    if (filters.category !== 'all') summary.push({ key: 'category', label: filters.category });
    if (filters.channelType !== 'all') summary.push({ key: 'channelType', label: filters.channelType });
    if (filters.region !== 'all') summary.push({ key: 'region', label: filters.region });
    if (filters.channel) {
      summary.push({
        key: 'channel',
        label: this.channels().find((channel) => channel.id === filters.channel)?.name || filters.channel,
      });
    }
    filters.flags.forEach((flag) => summary.push({
      key: `flag:${flag}`,
      label: flag === 'live' ? 'Directo' : flag === 'catchup' ? 'Catch-up' : 'Streaming',
    }));
    if (filters.date !== 'today') summary.push({ key: 'date', label: 'Mañana' });
    if (this.guideState.searchQuery()) {
      summary.push({ key: 'search', label: `"${this.guideState.searchQuery()}"` });
    }
    return summary;
  });
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
  ]);

  constructor(
    readonly guideState: UnifiedGuideStateService,
    readonly shellUi: UnifiedShellUiStateService,
    private readonly facade: TvDataFacade,
    private readonly router: Router
  ) {}

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

  clearFilters(): void {
    this.guideState.updateLiveFilters({
      group: 'all',
      category: 'all',
      liveView: 'now',
      date: 'today',
      channel: '',
      channelType: 'all',
      region: 'all',
      flags: [],
    });
  }

  retry(): void {
    this.retryNonce.update((value) => value + 1);
  }

  removeFilter(key: string): void {
    if (key.startsWith('flag:')) {
      this.toggleFlag(key.slice(5));
      return;
    }
    if (key === 'search') {
      this.guideState.setSearch('');
      return;
    }
    if (key === 'group') this.guideState.updateLiveFilters({ group: 'all' });
    if (key === 'category') this.guideState.updateLiveFilters({ category: 'all' });
    if (key === 'channel') this.guideState.updateLiveFilters({ channel: '' });
    if (key === 'channelType') this.guideState.updateLiveFilters({ channelType: 'all' });
    if (key === 'region') this.guideState.updateLiveFilters({ region: 'all' });
    if (key === 'date') this.guideState.updateLiveFilters({ date: 'today' });
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
    void this.router.navigateByUrl(normalizeToCard(item).detailPath);
  }

  detailPath(item: TvReadItemDTO): string {
    return normalizeToCard(item).detailPath;
  }

  channelPath(item: TvReadItemDTO): string {
    return normalizeToCard(item).channelPath || '/programacion-tv/guia-canales';
  }

  schedulePositionLabel(item: TvReadItemDTO, index: number): string {
    if (item.airing.liveNow) return 'En directo';
    if (index === 0) return this.guideState.liveFilters().date === 'today' ? 'Próximo' : 'Primero';
    if (index === 1) return 'A continuación';
    return 'Más tarde';
  }

  formatScheduleTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return formatMadridHM(date);
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

  trackByFilter(_index: number, filter: { key: string }): string {
    return filter.key;
  }
}

function humanizeGroup(value: string): string {
  const labels: Record<string, string> = {
    all: 'Todos los grupos',
    tdt: 'TDT',
    autonomico: 'Autonómicos',
    cable: 'Cable',
    movistar: 'Movistar+',
    online: 'Online',
    deporte: 'Deportes',
  };
  return labels[value] || value;
}

/**
 * Mobile starts at the programme that matters now instead of forcing people
 * to scan from midnight. Future dates keep their chronological first items.
 */
export function selectMobileChannelSchedule(
  items: TvReadItemDTO[],
  date: string,
  nowMs = Date.now()
): TvReadItemDTO[] {
  const sorted = [...items].sort(
    (left, right) => new Date(left.airing.start).getTime() - new Date(right.airing.start).getTime()
  );
  if (date !== 'today') return sorted.slice(0, 4);

  const liveIndex = sorted.findIndex((item) => item.airing.liveNow);
  const nextIndex = sorted.findIndex((item) => {
    const end = new Date(item.airing.end).getTime();
    return Number.isFinite(end) && end > nowMs;
  });
  const startIndex = liveIndex >= 0 ? liveIndex : nextIndex;
  return startIndex >= 0 ? sorted.slice(startIndex, startIndex + 4) : sorted.slice(-4);
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
