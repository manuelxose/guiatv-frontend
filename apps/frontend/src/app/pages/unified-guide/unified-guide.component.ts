import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Inject,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { TvReadItemDTO } from '../../api/models';
import { FilterChipItem } from '../../components/filter-chip-bar/filter-chip-bar.component';
import { UnifiedPortalShellComponent } from '../../components/unified-portal-shell/unified-portal-shell.component';
import {
  PORTAL_GUIDE_SHELL_CONFIG,
  PORTAL_ICON_PATHS,
} from '../../config/portal-navigation.config';
import { APP_PATHS } from '../../config/route-map';
import { MetaService } from '../../services/meta.service';
import { TvDataFacade } from '../../state/tv-data.facade';
import { UserService } from '../../services/user.service';
import { UnifiedGuideStateService, UnifiedGuideTab } from '../../state/unified-guide.state';
import { UnifiedShellUiStateService } from '../../state/unified-shell-ui.state';
import { normalizeToCard } from '../../utils/tv-normalizers';
import { DiscoverViewComponent } from './views/discover-view.component';
import { LiveGuideViewComponent } from './views/live-guide-view.component';
import { SportsViewComponent } from './views/sports-view.component';
import { StreamingViewComponent } from './views/streaming-view.component';
import { UnifiedPortalRailSection } from '../../models/portal-shell.models';

const TAB_META: Record<UnifiedGuideTab, { title: string; description: string; path: string }> = {
  live: {
    title: 'TV Directo',
    description: 'Guía unificada de emisiones en directo, próximas franjas y parrilla completa.',
    path: APP_PATHS.guide,
  },
  discover: {
    title: 'Qué Ver',
    description: 'Descubre qué ver hoy mezclando TV en directo, catálogo editorial y streaming.',
    path: APP_PATHS.explore,
  },
  streaming: {
    title: 'Streaming',
    description: 'Explora plataformas, novedades y catálogo en streaming dentro del mismo sistema.',
    path: APP_PATHS.platforms,
  },
  sports: {
    title: 'Deportes',
    description: 'Sigue deporte en directo y próximos eventos desde una vertical integrada.',
    path: APP_PATHS.sports,
  },
};

@Component({
  selector: 'app-unified-guide',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedPortalShellComponent,
    LiveGuideViewComponent,
    DiscoverViewComponent,
    StreamingViewComponent,
    SportsViewComponent,
  ],
  templateUrl: './unified-guide.component.html',
  styleUrl: './unified-guide.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedGuideComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly state = inject(UnifiedGuideStateService);
  private readonly shellUi = inject(UnifiedShellUiStateService);
  private readonly meta = inject(MetaService);
  private readonly userService = inject(UserService);
  private readonly facade = inject(TvDataFacade);
  private readonly isBrowser: boolean;

  readonly activeTab = this.state.activeTab;
  readonly searchQuery = this.state.searchQuery;
  readonly iconPaths = PORTAL_ICON_PATHS;
  readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  readonly profile = toSignal(this.userService.getProfile(), {
    initialValue: this.userService.getProfileSnapshot(),
  });
  readonly livePreview = toSignal(this.facade.getLivePrograms({ date: 'today', limit: 6 }), {
    initialValue: [],
  });
  readonly tonightPreview = toSignal(this.facade.getTonightPrograms({ date: 'today', limit: 6 }), {
    initialValue: [],
  });
  readonly platformPreview = toSignal(this.facade.getPlatforms(), {
    initialValue: [],
  });
  readonly sportsLivePreview = toSignal(this.facade.getLiveSports({ date: 'today' }), {
    initialValue: [],
  });
  readonly sportsNextPreview = toSignal(this.facade.getUpcomingSports({ date: 'today' }), {
    initialValue: [],
  });
  readonly pageMeta = computed(() => TAB_META[this.activeTab()]);
  readonly shellConfig = computed(() => PORTAL_GUIDE_SHELL_CONFIG[this.activeTab()]);
  readonly topPillChips = computed<FilterChipItem[]>(() =>
    this.shellConfig().topPills.map((pill) => ({
      id: pill.id,
      label: pill.label,
      iconPath: pill.iconPath,
      tone: pill.tone,
    }))
  );
  readonly topPillLabel = computed(() => this.shellConfig().topPillLabel);
  readonly topPillSelection = computed(() => {
    if (this.activeTab() === 'live') {
      const filters = this.state.liveFilters();
      if (filters.group === 'tdt') return 'tdt';
      if (filters.group === 'deporte') return 'sports-tv';
      return filters.liveView;
    }

    if (this.activeTab() === 'discover') {
      const filters = this.state.discoverFilters();
      if (filters.intent === 'featured') return 'featured';
      if (filters.types.length === 1 && filters.types[0] === 'movie') return 'movie';
      if (filters.types.length === 1 && filters.types[0] === 'series') return 'series';
      if (filters.availability.includes('live')) return 'live';
      if (filters.availability.includes('free')) return 'free';
      return 'all';
    }

    if (this.activeTab() === 'streaming') {
      const filters = this.state.streamingFilters();
      if (filters.type === 'movie') return 'movie';
      if (filters.type === 'series') return 'series';
      if (filters.availability.includes('free')) return 'free';
      return filters.sort;
    }

    const filters = this.state.sportsFilters();
    if (filters.sport === 'Fútbol') return 'football';
    if (filters.sport === 'F1' || filters.sport === 'MotoGP') return 'motor';
    return filters.timeRange;
  });
  readonly breadcrumbItems = computed(() => [
    { name: 'Inicio', url: APP_PATHS.home },
    { name: this.pageMeta().title, url: this.pageMeta().path },
  ]);
  readonly summaryPills = computed(() => {
    if (this.activeTab() === 'live') {
      const filters = this.state.liveFilters();
      const labels = [
        filters.group,
        filters.liveView,
        filters.category,
        filters.date,
        filters.channel,
        filters.channelType,
        filters.region,
        ...filters.flags,
      ];
      if (this.state.searchQuery()) {
        labels.push(`"${this.state.searchQuery()}"`);
      }
      return labels.filter((value) => value && value !== 'all' && value !== 'today');
    }

    if (this.activeTab() === 'discover') {
      const filters = this.state.discoverFilters();
      const labels = [
        ...filters.types.filter((type) => type !== 'program'),
        ...filters.availability,
        ...filters.platforms,
        ...filters.genres,
      ];
      if (filters.intent) {
        labels.push(filters.intent);
      }
      if (filters.sort !== 'popular') {
        labels.push(filters.sort);
      }
      if (filters.date !== 'today') {
        labels.push(filters.date);
      }
      if (this.state.searchQuery()) {
        labels.push(`"${this.state.searchQuery()}"`);
      }
      return labels;
    }

    if (this.activeTab() === 'streaming') {
      const filters = this.state.streamingFilters();
      const labels = [filters.platform, filters.type, ...filters.availability, ...filters.genres];
      if (filters.sort !== 'popular') {
        labels.push(filters.sort);
      }
      if (this.state.searchQuery()) {
        labels.push(`"${this.state.searchQuery()}"`);
      }
      return labels.filter(Boolean);
    }

    const filters = this.state.sportsFilters();
    const labels = [filters.sport, filters.channel, filters.competition, filters.date, filters.timeRange];
    if (this.state.searchQuery()) {
      labels.push(`"${this.state.searchQuery()}"`);
    }
    return labels.filter((value) => value && value !== 'all' && value !== 'today');
  });
  readonly filterCount = computed(() => this.summaryPills().length);
  readonly rightRailLabel = computed(() => this.shellConfig().rightRailLabel);
  readonly leftRailSections = computed<UnifiedPortalRailSection[]>(() => {
    if (this.activeTab() === 'live') {
      const filters = this.state.liveFilters();
      return [
        {
          id: 'live-context',
          eyebrow: 'TV Directo',
          title: 'Ritmo temporal',
          description: 'La guía se mueve como una plataforma, no como un listado estático.',
          items: [
            {
              id: 'now',
              label: 'En emisión',
              description: 'Eventos y programas activos ahora mismo',
              iconPath: this.iconPaths.liveDot,
              path: APP_PATHS.guide,
              queryParams: { liveView: 'now' },
              active: filters.liveView === 'now',
            },
            {
              id: 'next',
              label: 'A continuación',
              description: 'Cambio de franja sin salir del flujo',
              iconPath: this.iconPaths.clock,
              path: APP_PATHS.guide,
              queryParams: { liveView: 'next' },
              active: filters.liveView === 'next',
            },
            {
              id: 'night',
              label: 'Esta noche',
              description: 'Prime time y bloques de noche',
              iconPath: 'M18 15.75A6.75 6.75 0 1 1 8.25 6a6 6 0 0 0 9.75 9.75Z',
              path: APP_PATHS.guide,
              queryParams: { liveView: 'night' },
              active: filters.liveView === 'night',
            },
            {
              id: 'day',
              label: 'Parrilla completa',
              description: 'EPG denso con lectura por canal',
              iconPath: this.iconPaths.channels,
              path: APP_PATHS.guide,
              queryParams: { liveView: 'day' },
              active: filters.liveView === 'day',
            },
          ],
        },
        {
          id: 'live-groups',
          eyebrow: 'Directorios',
          title: 'Accesos rápidos por grupo',
          description: 'Canales, operadores y señales rápidas sin depender solo del filtro avanzado.',
          items: [
            { id: 'tdt', label: 'TDT', description: 'Lineal abierto', iconPath: this.iconPaths.live, path: APP_PATHS.guide, queryParams: { group: 'tdt' }, active: filters.group === 'tdt' },
            { id: 'autonomico', label: 'Autonómico', description: 'Territorial y local', iconPath: this.iconPaths.channels, path: APP_PATHS.guide, queryParams: { group: 'autonomico' }, active: filters.group === 'autonomico' },
            { id: 'movistar', label: 'Movistar+', description: 'Premium y temático', iconPath: this.iconPaths.streaming, path: APP_PATHS.guide, queryParams: { group: 'movistar' }, active: filters.group === 'movistar' },
            { id: 'online', label: 'Online', description: 'Señales y streams directos', iconPath: this.iconPaths.platforms, path: APP_PATHS.guide, queryParams: { group: 'online' }, active: filters.group === 'online' },
            { id: 'sports-group', label: 'Deportes', description: 'Canales con foco deportivo', iconPath: this.iconPaths.sports, path: APP_PATHS.guide, queryParams: { group: 'deporte' }, active: filters.group === 'deporte' },
          ],
        },
      ];
    }

    if (this.activeTab() === 'discover') {
      const filters = this.state.discoverFilters();
      return [
        {
          id: 'discover-context',
          eyebrow: 'Qué Ver',
          title: 'Modos editoriales',
          description: 'Disponibilidad, mezcla lineal y capas editoriales en paralelo.',
          items: [
            { id: 'discover-all', label: 'Todo', description: 'TV, catálogo y streaming', iconPath: this.iconPaths.discover, path: APP_PATHS.explore, active: !filters.availability.length },
            { id: 'discover-live', label: 'En directo', description: 'Cruce con la parrilla actual', iconPath: this.iconPaths.liveDot, path: APP_PATHS.explore, queryParams: { availability: 'live' }, active: filters.availability.includes('live') },
            { id: 'discover-free', label: 'Gratis', description: 'Sin pago adicional', iconPath: 'M12 6v12m4.5-8.25c0-1.65-2.01-3-4.5-3s-4.5 1.35-4.5 3 2.01 3 4.5 3 4.5 1.35 4.5 3-2.01 3-4.5 3-4.5-1.35-4.5-3', path: APP_PATHS.explore, queryParams: { availability: 'free' }, active: filters.availability.includes('free') },
            { id: 'discover-editorial', label: 'Editorial', description: 'Guías y contexto útil', iconPath: this.iconPaths.editorial, path: APP_PATHS.blog },
            { id: 'discover-rankings', label: 'Rankings', description: 'Selecciones rápidas', iconPath: this.iconPaths.rankings, path: APP_PATHS.top10 },
          ],
        },
        {
          id: 'discover-platforms',
          eyebrow: 'Plataformas',
          title: 'Directorios rápidos',
          description: 'Servicios reales accesibles desde el lateral.',
          items: this.platformPreview()
            .slice(0, 6)
            .map((platform) => ({
              id: `platform-${platform.name}`,
              label: platform.name,
              description: 'Abrir catálogo filtrado',
              imageUrl: platform.logoUrl || '',
              path: APP_PATHS.platforms,
              queryParams: { platform: platform.name },
              active: filters.platforms.includes(platform.name),
            })),
        },
      ];
    }

    if (this.activeTab() === 'streaming') {
      const filters = this.state.streamingFilters();
      return [
        {
          id: 'streaming-context',
          eyebrow: 'Streaming',
          title: 'Entradas de catálogo',
          description: 'Tres puertas paralelas más comparador real de plataformas.',
          items: [
            { id: 'stream-popular', label: 'Popular ahora', description: 'Lo más movido del catálogo', iconPath: this.iconPaths.trends, path: APP_PATHS.platforms, queryParams: { sort: 'popular' }, active: filters.sort === 'popular' },
            { id: 'stream-recent', label: 'Novedades', description: 'Entradas recientes y estrenos', iconPath: this.iconPaths.clock, path: APP_PATHS.platforms, queryParams: { sort: 'recent' }, active: filters.sort === 'recent' },
            { id: 'stream-rating', label: 'Top valorado', description: 'Mejor percepción crítica', iconPath: this.iconPaths.rankings, path: APP_PATHS.platforms, queryParams: { sort: 'rating' }, active: filters.sort === 'rating' },
            { id: 'stream-compare', label: 'Comparador', description: 'Cruce de servicios, precios y perfiles', iconPath: this.iconPaths.compare, path: APP_PATHS.streamingComparison },
          ],
        },
        {
          id: 'stream-services',
          eyebrow: 'Servicios',
          title: 'Top plataformas',
          description: 'Directorio lateral persistente con marcas reales.',
          items: this.platformPreview()
            .slice(0, 6)
            .map((platform) => ({
              id: `stream-service-${platform.name}`,
              label: platform.name,
              description: 'Abrir catálogo del servicio',
              imageUrl: platform.logoUrl || '',
              path: APP_PATHS.platforms,
              queryParams: { platform: platform.name },
              active: filters.platform === platform.name,
            })),
        },
      ];
    }

    const sportFilters = this.state.sportsFilters();
    return [
      {
        id: 'sports-context',
        eyebrow: 'Deportes',
        title: 'Agenda deportiva',
        description: 'Franja, agenda y ritmo competitivo dentro de la misma navegación.',
        items: [
          { id: 'sports-live', label: 'Live now', description: 'Eventos en directo', iconPath: this.iconPaths.liveDot, path: APP_PATHS.sports, queryParams: { timeRange: 'live' }, active: sportFilters.timeRange === 'live' },
          { id: 'sports-tonight', label: 'Esta noche', description: 'Prime time deportivo', iconPath: 'M18 15.75A6.75 6.75 0 1 1 8.25 6a6 6 0 0 0 9.75 9.75Z', path: APP_PATHS.sports, queryParams: { timeRange: 'tonight' }, active: sportFilters.timeRange === 'tonight' },
          { id: 'sports-week', label: 'Esta semana', description: 'Calendario completo', iconPath: this.iconPaths.calendar, path: APP_PATHS.sports, queryParams: { timeRange: 'week' }, active: sportFilters.timeRange === 'week' },
          { id: 'sports-guide', label: 'Cruce con TV', description: 'Volver a canales y parrilla', iconPath: this.iconPaths.live, path: APP_PATHS.guide },
        ],
      },
      {
        id: 'sports-disciplines',
        eyebrow: 'Disciplinas',
        title: 'Quick sports directories',
        description: 'Fútbol y resto de deportes con prioridad real.',
        items: [
          { id: 'sport-futbol', label: 'Fútbol', description: 'Cobertura protagonista', iconPath: this.iconPaths.sports, path: APP_PATHS.sports, queryParams: { sport: 'Fútbol' }, active: sportFilters.sport === 'Fútbol' },
          { id: 'sport-baloncesto', label: 'Baloncesto', description: 'Liga y torneos', iconPath: 'M12 3.75c4.56 0 8.25 3.69 8.25 8.25S16.56 20.25 12 20.25 3.75 16.56 3.75 12 7.44 3.75 12 3.75Zm0 0v16.5m-5.83-12.38c3.9 1.67 7.76 1.67 11.66 0M6.17 16.13c3.9-1.67 7.76-1.67 11.66 0', path: APP_PATHS.sports, queryParams: { sport: 'Baloncesto' }, active: sportFilters.sport === 'Baloncesto' },
          { id: 'sport-f1', label: 'F1', description: 'Motor de precisión', iconPath: 'M3.75 15.75h5.5l1.75-4.5h9.25M6 10.5h3.75m4.5 0h5.25', path: APP_PATHS.sports, queryParams: { sport: 'F1' }, active: sportFilters.sport === 'F1' },
          { id: 'sport-tenis', label: 'Tenis', description: 'Grand slams y circuito', iconPath: 'M8.25 4.5h7.5m-7.5 15h7.5M7.5 6.75c1.8 1.8 1.8 8.7 0 10.5m9-10.5c-1.8 1.8-1.8 8.7 0 10.5', path: APP_PATHS.sports, queryParams: { sport: 'Tenis' }, active: sportFilters.sport === 'Tenis' },
          { id: 'sport-motogp', label: 'MotoGP', description: 'Velocidad y agenda', iconPath: 'M4.5 14.25h4.5l2.25-3h8.25m-10.5 5.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm10.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z', path: APP_PATHS.sports, queryParams: { sport: 'MotoGP' }, active: sportFilters.sport === 'MotoGP' },
        ],
      },
    ];
  });
  readonly rightRailSections = computed<UnifiedPortalRailSection[]>(() => {
    if (this.activeTab() === 'live') {
      const spotlightItems = [...this.livePreview().slice(0, 3), ...this.tonightPreview().slice(0, 2)]
        .slice(0, 5)
        .map((item, index) => programToRailItem(item, `live-${index}`));
      const channelItems = uniqueChannelsFromPrograms(this.livePreview()).slice(0, 5).map((channel) => ({
        id: `channel-${channel.id}`,
        label: channel.name,
        description: 'Abrir guía filtrada por canal',
        imageUrl: channel.icon,
        path: APP_PATHS.guide,
        queryParams: { channel: channel.id },
      }));

      return [
        {
          id: 'live-spotlight',
          eyebrow: 'En foco',
          title: 'Ahora y esta noche',
          description: 'Lectura rápida de lo más valioso del lineal.',
          variant: 'feature',
          items: spotlightItems,
        },
        {
          id: 'live-channels',
          eyebrow: 'Canales top',
          title: 'Zapping contextual',
          description: 'Puertas laterales para entrar a una señal concreta.',
          variant: 'logos',
          items: channelItems,
        },
      ];
    }

    if (this.activeTab() === 'discover') {
      return [
        {
          id: 'discover-live',
          eyebrow: 'Ahora mismo',
          title: 'Directo y señal editorial',
          description: 'La mezcla TV + catálogo se ve también en el panel derecho.',
          variant: 'feature',
          items: this.livePreview().slice(0, 4).map((item, index) => programToRailItem(item, `discover-live-${index}`)),
        },
        {
          id: 'discover-platforms',
          eyebrow: 'Servicios',
          title: 'Top plataformas',
          description: 'Puertas rápidas al streaming sin abandonar discovery.',
          variant: 'logos',
          items: this.platformPreview().slice(0, 5).map((platform) => ({
            id: `discover-platform-${platform.name}`,
            label: platform.name,
            description: 'Abrir servicio',
            imageUrl: platform.logoUrl || '',
            path: APP_PATHS.platforms,
            queryParams: { platform: platform.name },
          })),
        },
      ];
    }

    if (this.activeTab() === 'streaming') {
      return [
        {
          id: 'streaming-services',
          eyebrow: 'Servicios',
          title: 'Mapa de plataformas',
          description: 'Directorio premium persistente para comparar y saltar entre catálogos.',
          variant: 'logos',
          items: this.platformPreview().slice(0, 6).map((platform) => ({
            id: `platform-${platform.name}`,
            label: platform.name,
            description: 'Entrar al catálogo del servicio',
            imageUrl: platform.logoUrl || '',
            path: APP_PATHS.platforms,
            queryParams: { platform: platform.name },
            active: this.state.streamingFilters().platform === platform.name,
          })),
        },
        {
          id: 'streaming-now',
          eyebrow: 'Cruce editorial',
          title: 'Qué está moviendo la noche',
          description: 'Streaming conectado con prime time y tendencias.',
          variant: 'feature',
          items: this.tonightPreview().slice(0, 4).map((item, index) => programToRailItem(item, `streaming-tonight-${index}`)),
        },
      ];
    }

    return [
      {
        id: 'sports-live',
        eyebrow: 'Live now',
        title: 'Eventos en directo',
        description: 'La columna auxiliar vuelve a ser útil de verdad.',
        variant: 'feature',
        items: this.sportsLivePreview().slice(0, 5).map((item, index) => programToRailItem(item, `sports-live-${index}`)),
      },
      {
        id: 'sports-next',
        eyebrow: 'Agenda',
        title: 'Próximos eventos',
        description: 'La semana deportiva sigue accesible sin cambiar de vista.',
        variant: 'compact',
        items: this.sportsNextPreview().slice(0, 5).map((item, index) => programToRailItem(item, `sports-next-${index}`)),
      },
    ];
  });

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const tab = (data['tab'] || 'live') as UnifiedGuideTab;
        this.state.selectTab(tab);
        this.shellUi.closeFilterDock();
        this.state.syncFromQueryParams(this.route.snapshot.queryParams, tab);
        this.updateMeta();
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.state.syncFromQueryParams(paramMapToParams(params.keys, params), this.activeTab());
      });

    effect(() => {
      const queryParams = this.state.toQueryParams(this.activeTab());
      const current = this.route.snapshot.queryParams;
      if (sameParams(current, queryParams)) {
        return;
      }
      untracked(() => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams,
          replaceUrl: true,
          queryParamsHandling: '',
        });
      });
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.updateMeta());
  }

  navigateToTab(tab: UnifiedGuideTab): void {
    const queryParams = this.state.toQueryParams(tab);
    this.shellUi.closeFilterDock();
    if (this.isBrowser) {
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    void this.router.navigateByUrl(
      this.router.createUrlTree([this.pathForTab(tab)], {
        queryParams,
      })
    );
  }

  onTopPillChange(value: string): void {
    if (this.activeTab() === 'live') {
      if (value === 'tdt') {
        this.state.updateLiveFilters({ group: 'tdt' });
        return;
      }
      if (value === 'sports-tv') {
        this.state.updateLiveFilters({ group: 'deporte' });
        return;
      }
      if (value === 'now' || value === 'next' || value === 'night' || value === 'day') {
        this.state.updateLiveFilters({ liveView: value });
      }
      return;
    }
    if (this.activeTab() === 'discover') {
      if (value === 'movie') {
        this.state.updateDiscoverFilters({ types: ['movie'], page: 1 });
        return;
      }
      if (value === 'series') {
        this.state.updateDiscoverFilters({ types: ['series'], page: 1 });
        return;
      }
      if (value === 'featured') {
        this.state.updateDiscoverFilters({ intent: 'featured', page: 1 });
        return;
      }
      this.state.updateDiscoverFilters({
        types: ['program', 'movie', 'series'],
        intent: '',
        availability: value === 'all' ? [] : [value as any],
        page: 1,
      });
      return;
    }
    if (this.activeTab() === 'streaming') {
      if (value === 'movie' || value === 'series') {
        this.state.updateStreamingFilters({ type: value, page: 1 });
        return;
      }
      if (value === 'free') {
        this.state.updateStreamingFilters({ availability: ['free'], page: 1 });
        return;
      }
      this.state.updateStreamingFilters({ type: '', availability: [], sort: value as any, page: 1 });
      return;
    }
    if (value === 'football') {
      this.state.updateSportsFilters({ sport: 'Fútbol' });
      return;
    }
    if (value === 'motor') {
      this.state.updateSportsFilters({ sport: 'F1' });
      return;
    }
    this.state.updateSportsFilters({ sport: 'all', timeRange: value as any });
  }

  onSearchChange(value: string): void {
    this.state.setSearch(value);
  }

  onSearchSubmit(value: string): void {
    this.state.setSearch(value);
  }

  toggleFilterDock(): void {
    this.shellUi.toggleFilterDock();
  }

  private pathForTab(tab: UnifiedGuideTab): string {
    return TAB_META[tab].path;
  }

  private updateMeta(): void {
    const meta = this.pageMeta();
    this.meta.setMetaTags({
      title: `${meta.title} | Guía TV`,
      description: meta.description,
      canonicalUrl: meta.path,
      type: 'website',
    });
  }
}

function sameParams(left: Params, right: Params): boolean {
  const leftKeys = Object.keys(left || {}).filter((key) => left[key] != null).sort();
  const rightKeys = Object.keys(right || {}).filter((key) => right[key] != null).sort();
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every((key, index) => key === rightKeys[index] && String(left[key]) === String(right[key]));
}

function paramMapToParams(keys: string[], params: import('@angular/router').ParamMap): Params {
  const result: Params = {};
  keys.forEach((key) => {
    result[key] = params.get(key);
  });
  return result;
}

function programToRailItem(
  item: Parameters<typeof normalizeToCard>[0],
  fallbackId: string
): UnifiedPortalRailSection['items'][number] {
  const card = normalizeToCard(item);
  const meta = [card.channelName, card.subtitle || card.category].filter(Boolean).join(' · ');
  return {
    id: card.id || fallbackId,
    label: card.title,
    description: meta || 'Abrir detalle',
    badge: card.liveNow ? 'LIVE' : card.sport || card.category,
    imageUrl: card.channelIcon || card.image,
    iconPath: card.liveNow ? PORTAL_ICON_PATHS.liveDot : PORTAL_ICON_PATHS.play,
    path: card.detailPath,
  };
}

function uniqueChannelsFromPrograms(items: TvReadItemDTO[]) {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = item.channel.id;
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return Boolean(item.channel.name);
    })
    .map((item) => ({
      id: item.channel.id,
      name: item.channel.name,
      icon: item.assets.channelLogo?.url || item.channel.icon || '',
    }));
}
