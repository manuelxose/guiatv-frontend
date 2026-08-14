import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, startWith, switchMap } from 'rxjs';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { UnifiedFilterDockComponent, UnifiedFilterDockSection } from '../../../components/unified-filter-dock/unified-filter-dock.component';
import { UnifiedEditorialModuleComponent } from '../../../components/unified-editorial-module/unified-editorial-module.component';
import { UnifiedProgramCardComponent } from '../../../components/unified-program-card/unified-program-card.component';
import { TvDataFacade, UnifiedDiscoveryItem } from '../../../state/tv-data.facade';
import { UnifiedGuideStateService } from '../../../state/unified-guide.state';
import { UnifiedShellUiStateService } from '../../../state/unified-shell-ui.state';
import { isTvReadItem, normalizeToCard } from '../../../utils/tv-normalizers';
import { UserService } from '../../../services/user.service';
import { PlatformBadgeComponent } from '../../../components/platform-badge/platform-badge.component';
import { CatalogPlatform } from '../../../services/catalog.service';
import { EditorialService } from '../../../blog/services/editorial.service';
import { APP_PATHS } from '../../../config/route-map';
import { ViewportService } from '../../../services/viewport.service';

interface DiscoverQuickDirectory {
  id: string;
  kind: 'platform' | 'genre';
  eyebrow: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    label: string;
    meta: string;
    active: boolean;
  }>;
}

interface DiscoverModule {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: UnifiedDiscoveryItem[];
}

@Component({
  selector: 'app-discover-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedFilterDockComponent,
    UnifiedEditorialModuleComponent,
    UnifiedProgramCardComponent,
    PlatformBadgeComponent,
  ],
  templateUrl: './discover-view.component.html',
  styleUrl: './discover-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverViewComponent {
  private readonly isBrowser: boolean;
  readonly selectedItem = signal<UnifiedDiscoveryItem | null>(null);
  readonly typeChips: FilterChipItem[] = [
    { id: 'program,movie,series', label: 'Todo' },
    { id: 'program', label: 'TV' },
    { id: 'movie', label: 'Películas' },
    { id: 'series', label: 'Series' },
  ];
  readonly availabilityChips: FilterChipItem[] = [
    { id: 'all', label: 'Todo' },
    { id: 'free', label: 'Gratis' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'live', label: 'En directo' },
  ];
  readonly sortChips: FilterChipItem[] = [
    { id: 'popular', label: 'Popular' },
    { id: 'rating', label: 'Mejor valorado' },
    { id: 'recent', label: 'Novedades' },
    { id: 'airtime', label: 'Hora de emisión' },
  ];
  readonly intentChips: FilterChipItem[] = [
    { id: '', label: 'Normal' },
    { id: 'featured', label: 'Destacado' },
    { id: 'popular', label: 'Popular' },
    { id: 'rating', label: 'Top' },
    { id: 'recent', label: 'Reciente' },
  ];
  readonly dateChips: FilterChipItem[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'tomorrow', label: 'Mañana' },
    { id: 'weekend', label: 'Fin de semana' },
  ];

  private readonly filters = computed(() => ({
    ...this.guideState.discoverFilters(),
    q: this.guideState.searchQuery(),
  }));
  private readonly filters$ = toObservable(this.filters).pipe(startWith(this.filters()));

  readonly discoverData = toSignal(
    this.filters$.pipe(switchMap((filters) => this.facade.discoverContent(filters))),
    {
      initialValue: {
        items: [],
        meta: { total: 0, page: 1, limit: 24, hasMore: false },
        availablePlatforms: [],
        availableGenres: [],
      },
    }
  );
  readonly nowRail = toSignal(this.facade.getLivePrograms({ date: 'today', limit: 8 }), {
    initialValue: [],
  });
  readonly tonightRail = toSignal(this.facade.getTonightPrograms({ date: 'today', limit: 12 }), {
    initialValue: [],
  });
  readonly forYou = toSignal(
    this.userService.isAuthenticated$.pipe(
      switchMap((isAuthed) => (isAuthed ? this.facade.getForYou(8) : of([])))
    ),
    { initialValue: [] }
  );
  readonly availablePlatforms = computed(() => this.discoverData().availablePlatforms.slice(0, 8));
  readonly availableGenres = computed(() => this.discoverData().availableGenres.slice(0, 10));
  readonly featureItems = computed<UnifiedDiscoveryItem[]>(() => {
    if (this.discoverData().items.length) {
      return this.discoverData().items.slice(0, 4);
    }
    return [...this.nowRail(), ...this.tonightRail()].slice(0, 4);
  });
  readonly resultsItems = computed(() => {
    const featureIds = new Set(this.featureItems().map((item) => discoveryItemId(item)));
    return this.discoverData().items.filter((item) => !featureIds.has(discoveryItemId(item)));
  });
  readonly liveHighlights = computed(() =>
    this.discoverData().items.filter((item) => isTvReadItem(item)).slice(0, 6)
  );
  readonly movieHighlights = computed(() =>
    this.discoverData().items
      .filter((item) => normalizeToCard(item).contentType === 'movie')
      .slice(0, 6)
  );
  readonly seriesHighlights = computed(() =>
    this.discoverData().items
      .filter((item) => normalizeToCard(item).contentType === 'series')
      .slice(0, 6)
  );
  readonly freeHighlights = computed(() =>
    this.discoverData().items.filter((item) => isFreeDiscoveryItem(item)).slice(0, 6)
  );
  readonly discoveryPulse = computed(() => [
    {
      label: 'Resultados activos',
      value: String(this.discoverData().meta.total || this.discoverData().items.length),
      detail: this.guideState.searchQuery() ? 'Búsqueda combinada con capas editoriales.' : 'Mix entre directo, catálogo y streaming.',
    },
    {
      label: 'Plataformas visibles',
      value: String(this.availablePlatforms().length || 0),
      detail: 'Servicios presentes en el catálogo actual.',
    },
    {
      label: 'Géneros listos',
      value: String(this.availableGenres().length || 0),
      detail: 'Quick filters para profundizar sin romper el flujo.',
    },
  ]);
  readonly quickDirectories = computed<DiscoverQuickDirectory[]>(() => [
    {
      id: 'platform-directory',
      kind: 'platform',
      eyebrow: 'Acceso rápido',
      title: 'Plataformas en foco',
      description: 'Netflix, Prime Video, Max y resto de servicios visibles antes de bajar al grid.',
      items: this.availablePlatforms().slice(0, 6).map((platform) => ({
        id: platform.name,
        label: platform.name,
        meta: this.guideState.discoverFilters().platforms.includes(platform.name)
          ? 'Activa'
          : 'Abrir mezcla por servicio',
        active: this.guideState.discoverFilters().platforms.includes(platform.name),
      })),
    },
    {
      id: 'genre-directory',
      kind: 'genre',
      eyebrow: 'Afinar',
      title: 'Géneros editoriales',
      description: 'Más profundidad sin esconder la exploración detrás de un panel.',
      items: this.availableGenres().slice(0, 8).map((genre) => ({
        id: genre,
        label: genre,
        meta: this.guideState.discoverFilters().genres.includes(genre)
          ? 'Activo'
          : 'Explorar por tono',
        active: this.guideState.discoverFilters().genres.includes(genre),
      })),
    },
  ]);
  readonly discoveryModules = computed<DiscoverModule[]>(() =>
    [
      {
        id: 'discover-live-module',
        eyebrow: 'Directo',
        title: 'Lo que está emitiendo ahora',
        description: 'La capa lineal sigue viva dentro de qué ver.',
        items: this.liveHighlights(),
      },
      {
        id: 'discover-movies-module',
        eyebrow: 'Películas',
        title: 'Cine para decidir rápido',
        description: 'Selección útil sin entrar todavía al detalle completo.',
        items: this.movieHighlights(),
      },
      {
        id: 'discover-series-module',
        eyebrow: 'Series',
        title: 'Series en foco',
        description: 'Descubrimiento por tipo, no solo por ranking global.',
        items: this.seriesHighlights(),
      },
      {
        id: 'discover-free-module',
        eyebrow: 'Disponibilidad',
        title: 'Gratis y abierto',
        description: 'Capas de disponibilidad visibles antes del panel avanzado.',
        items: this.freeHighlights(),
      },
    ].filter((module) => module.items.length)
  );
  readonly editorialHub = toSignal(this.editorialService.getHubState(), {
    initialValue: {
      hero: null,
      guidePosts: [],
      rankingPosts: [],
      trendPosts: [],
      categorySections: [],
      categories: [],
    },
  });
  readonly rankingState = toSignal(this.editorialService.getRankingsPageState(), {
    initialValue: {
      featured: null,
      posts: [],
      categories: [],
      sections: [],
    },
  });
  readonly activeFilterSummary = computed(() => {
    const filters = this.guideState.discoverFilters();
    const summary = [
      ...filters.types.filter((type) => type !== 'program').map((type) => type === 'movie' ? 'Películas' : 'Series'),
      ...filters.availability.map((value) => value === 'free' ? 'Gratis' : value === 'live' ? 'En directo' : value),
      ...filters.platforms,
      ...filters.genres,
    ];
    if (filters.sort !== 'popular') {
      summary.push(filters.sort === 'rating' ? 'Top' : filters.sort === 'recent' ? 'Novedades' : 'Emisión');
    }
    if (filters.intent) {
      summary.push(filters.intent === 'featured' ? 'Destacado' : filters.intent);
    }
    if (filters.date !== 'today') {
      summary.push(filters.date === 'tomorrow' ? 'Mañana' : filters.date === 'weekend' ? 'Fin de semana' : filters.date);
    }
    if (this.guideState.searchQuery()) {
      summary.push(`"${this.guideState.searchQuery()}"`);
    }
    return summary;
  });
  readonly selectedTitle = computed(() =>
    this.selectedItem() ? normalizeToCard(this.selectedItem()!).title : 'Detalle'
  );
  readonly filterDockSections = computed<UnifiedFilterDockSection[]>(() => [
    {
      id: 'platforms',
      title: 'Plataformas',
      description: 'Servicios presentes en los resultados',
      multiSelect: true,
      options: this.availablePlatforms().map((platform) => ({
        id: platform.name,
        label: platform.name,
        selected: this.guideState.discoverFilters().platforms.includes(platform.name),
      })),
    },
    {
      id: 'genres',
      title: 'Géneros',
      description: 'Profundiza sin sacar el contenido del primer viewport',
      multiSelect: true,
      options: this.availableGenres().map((genre) => ({
        id: genre,
        label: genre,
        selected: this.guideState.discoverFilters().genres.includes(genre),
      })),
    },
    {
      id: 'intent',
      title: 'Intención editorial',
      options: this.intentChips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.discoverFilters().intent === chip.id,
      })),
    },
    {
      id: 'sort',
      title: 'Orden',
      options: this.sortChips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.discoverFilters().sort === chip.id,
      })),
    },
    {
      id: 'date',
      title: 'Fecha',
      options: this.dateChips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.discoverFilters().date === chip.id,
      })),
    },
  ]);

  constructor(
    readonly guideState: UnifiedGuideStateService,
    private readonly facade: TvDataFacade,
    private readonly router: Router,
    private readonly userService: UserService,
    readonly shellUi: UnifiedShellUiStateService,
    private readonly editorialService: EditorialService,
    private readonly viewport: ViewportService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  selectTypes(value: string): void {
    this.guideState.updateDiscoverFilters({
      types: value.split(',').filter(Boolean) as ('program' | 'movie' | 'series')[],
      page: 1,
    });
  }

  selectAvailability(value: string): void {
    this.guideState.updateDiscoverFilters({
      availability: value === 'all' ? [] : [value as any],
      page: 1,
    });
  }

  selectSort(value: string): void {
    this.guideState.updateDiscoverFilters({
      sort: (value || 'popular') as any,
      page: 1,
    });
  }

  selectIntent(value: string): void {
    this.guideState.updateDiscoverFilters({
      intent: (value || '') as any,
      sort:
        value === 'rating' || value === 'recent' || value === 'popular'
          ? (value as any)
          : this.guideState.discoverFilters().sort,
      page: 1,
    });
  }

  selectDate(value: string): void {
    this.guideState.updateDiscoverFilters({
      date: value || 'today',
      page: 1,
    });
  }

  togglePlatform(platform: CatalogPlatform): void {
    const current = new Set(this.guideState.discoverFilters().platforms);
    if (current.has(platform.name)) {
      current.delete(platform.name);
    } else {
      current.add(platform.name);
    }
    this.guideState.updateDiscoverFilters({
      platforms: Array.from(current),
      page: 1,
    });
  }

  toggleGenre(genre: string): void {
    const current = new Set(this.guideState.discoverFilters().genres);
    if (current.has(genre)) {
      current.delete(genre);
    } else {
      current.add(genre);
    }
    this.guideState.updateDiscoverFilters({
      genres: Array.from(current),
      page: 1,
    });
  }

  clearFilters(): void {
    this.guideState.setSearch('');
    this.guideState.updateDiscoverFilters({
      types: ['program', 'movie', 'series'],
      availability: [],
      platforms: [],
      genres: [],
      intent: '',
      sort: 'popular',
      date: 'today',
      page: 1,
    });
  }

  loadMore(): void {
    this.guideState.updateDiscoverFilters({
      page: this.guideState.discoverFilters().page + 1,
    });
  }

  openItem(item: UnifiedDiscoveryItem): void {
    if (this.isBrowser && this.viewport.isMobile()) {
      this.selectedItem.set(item);
      return;
    }
    void this.router.navigateByUrl(normalizeToCard(item).detailPath);
  }

  closeSheet(): void {
    this.selectedItem.set(null);
  }

  closeDock(): void {
    this.shellUi.closeFilterDock();
  }

  applyQuickDirectory(kind: DiscoverQuickDirectory['kind'], optionId: string): void {
    if (kind === 'platform') {
      const platform = this.availablePlatforms().find((entry) => entry.name === optionId);
      if (platform) {
        this.togglePlatform(platform);
      }
      return;
    }
    this.toggleGenre(optionId);
  }

  handleDockSelect(event: { sectionId: string; optionId: string }): void {
    if (event.sectionId === 'platforms') {
      const platform = this.availablePlatforms().find((entry) => entry.name === event.optionId);
      if (platform) {
        this.togglePlatform(platform);
      }
      return;
    }
    if (event.sectionId === 'genres') {
      this.toggleGenre(event.optionId);
      return;
    }
    if (event.sectionId === 'sort') {
      this.selectSort(event.optionId);
      return;
    }
    if (event.sectionId === 'intent') {
      this.selectIntent(event.optionId);
      return;
    }
    if (event.sectionId === 'date') {
      this.selectDate(event.optionId);
    }
  }

  detailPathFor(item: UnifiedDiscoveryItem): string {
    return normalizeToCard(item).detailPath;
  }

  trackByItem(_index: number, item: UnifiedDiscoveryItem): string {
    return 'catalogId' in item ? item.catalogId : item.id;
  }

  trackByPlatform(_index: number, platform: CatalogPlatform): string {
    return platform.name;
  }

  trackByText(_index: number, value: string): string {
    return value;
  }

  readonly appPaths = APP_PATHS;
}

function isFreeDiscoveryItem(item: UnifiedDiscoveryItem): boolean {
  if (isTvReadItem(item)) {
    return Boolean(item.availability.live || item.availability.streaming);
  }
  return Boolean(item.whereToWatch?.free?.length);
}

function discoveryItemId(item: UnifiedDiscoveryItem): string {
  return 'catalogId' in item ? item.catalogId : item.id;
}
