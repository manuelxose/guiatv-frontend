import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { PortalLocalToolbarComponent } from '../../../components/portal-local-toolbar/portal-local-toolbar.component';
import { UnifiedFilterDockComponent, UnifiedFilterDockSection } from '../../../components/unified-filter-dock/unified-filter-dock.component';
import { UnifiedProgramCardComponent } from '../../../components/unified-program-card/unified-program-card.component';
import { UnifiedSkeletonBlockComponent } from '../../../components/unified-skeleton-block/unified-skeleton-block.component';
import { PlatformBadgeComponent } from '../../../components/platform-badge/platform-badge.component';
import { TvDataFacade } from '../../../state/tv-data.facade';
import { UnifiedGuideStateService } from '../../../state/unified-guide.state';
import { UnifiedShellUiStateService } from '../../../state/unified-shell-ui.state';
import { CatalogItem } from '../../../services/catalog.service';
import { normalizeToCard } from '../../../utils/tv-normalizers';
import { ViewportService } from '../../../services/viewport.service';

interface StreamingDirectorySection {
  id: string;
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

interface StreamingModule {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: CatalogItem[];
}

@Component({
  selector: 'app-streaming-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedFilterDockComponent,
    UnifiedProgramCardComponent,
    UnifiedSkeletonBlockComponent,
    PlatformBadgeComponent,
    PortalLocalToolbarComponent,
  ],
  templateUrl: './streaming-view.component.html',
  styleUrl: './streaming-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamingViewComponent {
  private readonly isBrowser: boolean;
  readonly selectedItem = signal<CatalogItem | null>(null);
  readonly typeChips: FilterChipItem[] = [
    { id: '', label: 'Todo' },
    { id: 'movie', label: 'Películas' },
    { id: 'series', label: 'Series' },
  ];
  readonly sortChips: FilterChipItem[] = [
    { id: 'popular', label: 'Popular ahora' },
    { id: 'recent', label: 'Novedades' },
    { id: 'rating', label: 'Mejor valorado' },
  ];
  readonly availabilityChips: FilterChipItem[] = [
    { id: 'streaming', label: 'Streaming' },
    { id: 'free', label: 'Gratis' },
    { id: 'flatrate', label: 'Suscripción' },
    { id: 'rent', label: 'Alquiler' },
    { id: 'buy', label: 'Compra' },
  ];

  private readonly filters = computed(() => ({
    ...this.guideState.streamingFilters(),
    q: this.guideState.searchQuery(),
  }));
  private readonly filters$ = toObservable(this.filters);

  /** True while the streaming catalogue request (or a filter change) is in flight. */
  readonly gridLoading = signal(true);
  readonly platforms = toSignal(this.facade.getPlatforms(), { initialValue: [] });
  readonly gridData = toSignal(
    this.filters$.pipe(
      tap(() => this.gridLoading.set(true)),
      switchMap((filters) => this.facade.getStreamingContent(filters)),
      tap(() => this.gridLoading.set(false))
    ),
    {
      initialValue: {
        items: [],
        meta: { total: 0, page: 1, limit: 24, hasMore: false },
        availableGenres: [],
        availablePlatforms: [],
      },
    }
  );
  readonly popularRail = toSignal(this.facade.getStreamingContent({ sort: 'popular', limit: 12 }), { initialValue: { items: [], meta: { total: 0, page: 1, limit: 12, hasMore: false }, availableGenres: [], availablePlatforms: [] } });
  readonly recentRail = toSignal(this.facade.getStreamingContent({ sort: 'recent', limit: 12 }), { initialValue: { items: [], meta: { total: 0, page: 1, limit: 12, hasMore: false }, availableGenres: [], availablePlatforms: [] } });
  readonly ratingRail = toSignal(this.facade.getStreamingContent({ sort: 'rating', limit: 12 }), { initialValue: { items: [], meta: { total: 0, page: 1, limit: 12, hasMore: false }, availableGenres: [], availablePlatforms: [] } });
  readonly availableGenres = computed(() => this.gridData().availableGenres.slice(0, 10));
  readonly activePlatform = computed(() =>
    this.platforms().find((platform) => platform.name === this.guideState.streamingFilters().platform) || null
  );
  readonly featuredItem = computed(() =>
    this.gridData().items[0] ||
    this.popularRail().items[0] ||
    this.recentRail().items[0] ||
    this.ratingRail().items[0] ||
    null
  );
  readonly featuredStack = computed(() =>
    uniqueCatalogItems([
      ...this.gridData().items,
      ...this.popularRail().items,
      ...this.recentRail().items,
      ...this.ratingRail().items,
    ])
      .filter((item) => this.featuredItem()?.catalogId !== item.catalogId)
      .slice(0, 3)
  );
  readonly movieHighlights = computed(() =>
    this.gridData().items.filter((item) => item.contentType === 'movie').slice(0, 6)
  );
  readonly seriesHighlights = computed(() =>
    this.gridData().items.filter((item) => item.contentType === 'series').slice(0, 6)
  );
  readonly freeHighlights = computed(() =>
    this.gridData().items.filter((item) => hasFreeAvailability(item)).slice(0, 6)
  );
  readonly streamingPulse = computed(() => [
    {
      label: 'Servicios visibles',
      value: String(this.platforms().length || 0),
      detail: 'El hub entra por plataformas reales, no por una taxonomía genérica.',
    },
    {
      label: 'Títulos en foco',
      value: String(this.gridData().meta.total || this.gridData().items.length),
      detail: this.activePlatform()
        ? `${this.activePlatform()!.name} como capa principal del catálogo.`
        : 'Selección amplia lista para filtrar o comparar.',
    },
    {
      label: 'Géneros útiles',
      value: String(this.availableGenres().length || 0),
      detail: 'Afinado rápido por tono sin dejar la superficie principal.',
    },
  ]);
  readonly quickDirectories = computed<StreamingDirectorySection[]>(() => [
    {
      id: 'services',
      eyebrow: 'Servicios',
      title: 'Mapa de plataformas',
      description: 'Acceso rápido por marca, con identidad propia y cambio de contexto inmediato.',
      items: this.platforms().slice(0, 8).map((platform) => ({
        id: platform.name,
        label: platform.name,
        meta: this.guideState.streamingFilters().platform === platform.name ? 'Activa' : 'Abrir servicio',
        active: this.guideState.streamingFilters().platform === platform.name,
      })),
    },
    {
      id: 'genres',
      eyebrow: 'Discovery',
      title: 'Géneros y tono',
      description: 'El filtro editorial convive con el catálogo sin esconderlo.',
      items: this.availableGenres().slice(0, 8).map((genre) => ({
        id: genre,
        label: genre,
        meta: this.guideState.streamingFilters().genres.includes(genre) ? 'Activo' : 'Explorar género',
        active: this.guideState.streamingFilters().genres.includes(genre),
      })),
    },
  ]);
  readonly streamingModules = computed<StreamingModule[]>(() =>
    [
      {
        id: 'streaming-movies',
        eyebrow: 'Películas',
        title: 'Cine en catálogo',
        description: 'Selección rápida por tipo sin romper la navegación por servicio.',
        items: this.movieHighlights(),
      },
      {
        id: 'streaming-series',
        eyebrow: 'Series',
        title: 'Series para seguir explorando',
        description: 'Profundidad de discovery más allá de popular y novedades.',
        items: this.seriesHighlights(),
      },
      {
        id: 'streaming-free',
        eyebrow: 'Disponibilidad',
        title: 'Gratis y abierto',
        description: 'Una capa útil para decidir antes de entrar a detalle o comparar.',
        items: this.freeHighlights(),
      },
    ].filter((module) => module.items.length)
  );
  readonly activeFilterSummary = computed(() => {
    const filters = this.guideState.streamingFilters();
    const labels = [filters.platform, filters.type, ...filters.availability, ...filters.genres];
    if (filters.sort !== 'popular') {
      labels.push(filters.sort);
    }
    if (this.guideState.searchQuery()) {
      labels.push(`"${this.guideState.searchQuery()}"`);
    }
    return labels.filter(Boolean);
  });
  readonly showFilteredGrid = computed(() => {
    const filters = this.guideState.streamingFilters();
    return Boolean(
      filters.platform ||
      filters.type ||
      filters.genres.length ||
      filters.availability.length ||
      filters.sort !== 'popular' ||
      this.guideState.searchQuery()
    );
  });
  readonly filterDockSections = computed<UnifiedFilterDockSection[]>(() => [
    {
      id: 'platform',
      title: 'Plataforma',
      description: 'Selector de servicios con catálogo real',
      options: this.platforms().map((platform) => ({
        id: platform.name,
        label: platform.name,
        selected: this.guideState.streamingFilters().platform === platform.name,
      })),
    },
    {
      id: 'availability',
      title: 'Disponibilidad',
      description: 'Refina más allá del streaming genérico',
      options: this.availabilityChips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.streamingFilters().availability.includes(chip.id as any),
      })),
    },
    {
      id: 'genres',
      title: 'Géneros',
      description: 'Afinar sin convertir la página en un panel de gestión',
      multiSelect: true,
      options: this.availableGenres().map((genre) => ({
        id: genre,
        label: genre,
        selected: this.guideState.streamingFilters().genres.includes(genre),
      })),
    },
  ]);

  constructor(
    readonly guideState: UnifiedGuideStateService,
    private readonly facade: TvDataFacade,
    private readonly router: Router,
    readonly shellUi: UnifiedShellUiStateService,
    private readonly viewport: ViewportService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  selectType(type: string): void {
    this.guideState.updateStreamingFilters({
      type: type === 'movie' || type === 'series' ? type : '',
      page: 1,
    });
  }

  selectSort(sort: string): void {
    const nextSort = sort === 'recent' || sort === 'rating' || sort === 'popular' ? sort : 'popular';
    this.guideState.updateStreamingFilters({
      sort: nextSort,
      page: 1,
    });
  }

  selectPlatform(platform: string): void {
    this.guideState.updateStreamingFilters({
      platform: this.guideState.streamingFilters().platform === platform ? '' : platform,
      page: 1,
    });
  }

  toggleAvailability(value: string): void {
    const next = new Set(this.guideState.streamingFilters().availability);
    if (next.has(value as any)) {
      next.delete(value as any);
    } else {
      next.clear();
      next.add(value as any);
    }
    this.guideState.updateStreamingFilters({
      availability: Array.from(next) as any,
      page: 1,
    });
  }

  toggleGenre(genre: string): void {
    const current = new Set(this.guideState.streamingFilters().genres);
    if (current.has(genre)) {
      current.delete(genre);
    } else {
      current.add(genre);
    }
    this.guideState.updateStreamingFilters({
      genres: Array.from(current),
      page: 1,
    });
  }

  clearFilters(): void {
    this.guideState.updateStreamingFilters({
      platform: '',
      type: '',
      availability: [],
      genres: [],
      sort: 'popular',
      page: 1,
    });
  }

  openItem(item: CatalogItem): void {
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

  applyQuickDirectory(sectionId: StreamingDirectorySection['id'], optionId: string): void {
    if (sectionId === 'services') {
      this.selectPlatform(optionId);
      return;
    }
    this.toggleGenre(optionId);
  }

  handleDockSelect(event: { sectionId: string; optionId: string }): void {
    if (event.sectionId === 'platform') {
      this.selectPlatform(event.optionId);
      return;
    }
    if (event.sectionId === 'availability') {
      this.toggleAvailability(event.optionId);
      return;
    }
    if (event.sectionId === 'genres') {
      this.toggleGenre(event.optionId);
    }
  }

  trackByItem(_index: number, item: CatalogItem): string {
    return item.catalogId;
  }

  trackByPlatform(_index: number, platform: { name: string }): string {
    return platform.name;
  }

  trackByText(_index: number, value: string): string {
    return value;
  }
}

function hasFreeAvailability(item: CatalogItem): boolean {
  return Boolean(item.whereToWatch?.free?.length);
}

function uniqueCatalogItems(items: readonly CatalogItem[]): CatalogItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.catalogId)) {
      return false;
    }
    seen.add(item.catalogId);
    return true;
  });
}
