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
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { TvReadItemDTO } from '../../api/models';
import { PortalContextNavComponent, PortalContextNavKind } from '../../components/portal-context-nav/portal-context-nav.component';
import { UnifiedPortalShellComponent } from '../../components/unified-portal-shell/unified-portal-shell.component';
import {
  PORTAL_ICON_PATHS,
} from '../../config/portal-navigation.config';
import { APP_PATHS } from '../../config/route-map';
import { MetaService } from '../../services/meta.service';
import { CatalogPlatform } from '../../services/catalog.service';
import { UserService } from '../../services/user.service';
import { UnifiedGuideStateService, UnifiedGuideTab } from '../../state/unified-guide.state';
import { UnifiedShellUiStateService } from '../../state/unified-shell-ui.state';
import { normalizeToCard } from '../../utils/tv-normalizers';
import { DiscoverViewComponent } from './views/discover-view.component';
import { LiveGuideViewComponent } from './views/live-guide-view.component';
import { StreamingViewComponent } from './views/streaming-view.component';
import { StreamingComparisonComponent } from '../streaming-comparison/streaming-comparison.component';
import { UnifiedPortalRailSection } from '../../models/portal-shell.models';
import { UnifiedTopNavTab } from '../../components/unified-top-nav/unified-top-nav.component';

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
    title: 'Plataformas',
    description: 'Explora plataformas, novedades y catálogo en streaming dentro del mismo sistema.',
    path: APP_PATHS.platforms,
  },
};

@Component({
  selector: 'app-unified-guide',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedPortalShellComponent,
    PortalContextNavComponent,
    LiveGuideViewComponent,
    DiscoverViewComponent,
    StreamingViewComponent,
    StreamingComparisonComponent,
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
  private readonly isBrowser: boolean;

  readonly activeTab = this.state.activeTab;
  readonly platformMode = signal<'catalog' | 'compare'>('catalog');
  readonly searchQuery = this.state.searchQuery;
  readonly iconPaths = PORTAL_ICON_PATHS;
  readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  readonly profile = toSignal(this.userService.getProfile(), {
    initialValue: this.userService.getProfileSnapshot(),
  });

  // Desktop left/right rails are currently disabled (`[leftRailSections]="[]"`),
  // so these previews must NOT subscribe eagerly: doing so fires duplicate API
  // calls on SSR and after hydration, which was the root cause of a ~20s SSR
  // render timeout on the guide surfaces.
  readonly livePreview = signal<TvReadItemDTO[]>([]);
  readonly tonightPreview = signal<TvReadItemDTO[]>([]);
  readonly platformPreview = signal<CatalogPlatform[]>([]);
  readonly pageMeta = computed(() => {
    if (this.platformMode() === 'compare') {
      return {
        title: 'Comparador de plataformas',
        description: 'Compara precios, pantallas, resolución y funciones de las principales plataformas de streaming en España.',
        path: APP_PATHS.streamingComparison,
      };
    }
    return TAB_META[this.activeTab()];
  });
  readonly contextNavKind = computed<PortalContextNavKind>(() => {
    const tab = this.activeTab();
    return tab === 'streaming' ? 'platforms' : tab;
  });
  readonly sectionSelection = computed(() => {
    if (this.activeTab() === 'live') {
      return this.state.liveFilters().liveView;
    }

    if (this.activeTab() === 'discover') {
      const filters = this.state.discoverFilters();
      if (filters.types.length === 1 && filters.types[0] === 'movie') return 'movie';
      if (filters.types.length === 1 && filters.types[0] === 'series') return 'series';
      if (filters.availability.includes('live')) return 'live';
      if (filters.availability.includes('free')) return 'free';
      return 'all';
    }

    if (this.activeTab() === 'streaming') {
      const filters = this.state.streamingFilters();
      if (filters.availability.includes('free')) return 'free';
      return filters.sort;
    }

    return '';
  });
  readonly breadcrumbItems = computed(() => [
    { name: 'Inicio', url: APP_PATHS.home },
    { name: this.pageMeta().title, url: this.pageMeta().path },
  ]);
  readonly filterCount = computed(() => {
    if (this.activeTab() === 'live') {
      const filters = this.state.liveFilters();
      return Number(filters.group !== 'tdt') + Number(filters.category !== 'all') +
        Number(Boolean(filters.channel)) + Number(filters.channelType !== 'all') +
        Number(filters.region !== 'all') + filters.flags.length +
        Number(filters.date !== 'today') + Number(Boolean(this.state.searchQuery()));
    }

    if (this.activeTab() === 'discover') {
      const filters = this.state.discoverFilters();
      const defaultTypes = filters.types.length === 3 && ['program', 'movie', 'series'].every((type) => filters.types.includes(type as any));
      return Number(!defaultTypes) + filters.availability.length + filters.platforms.length +
        filters.genres.length + Number(Boolean(filters.intent)) + Number(filters.sort !== 'popular') +
        Number(filters.date !== 'today') + Number(Boolean(this.state.searchQuery()));
    }

    if (this.activeTab() === 'streaming') {
      const filters = this.state.streamingFilters();
      return Number(Boolean(filters.platform)) + Number(Boolean(filters.type)) +
        filters.availability.length + filters.genres.length + Number(filters.sort !== 'popular') +
        Number(Boolean(this.state.searchQuery()));
    }

    return 0;
  });
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
            { id: 'discover-editorial', label: 'Blog', description: 'Guías y contexto útil', iconPath: this.iconPaths.editorial, path: APP_PATHS.blog },
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

    return [];
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

    return [];
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
        this.platformMode.set(data['platformMode'] === 'compare' ? 'compare' : 'catalog');
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

  onSectionSelect(value: string): void {
    if (this.activeTab() === 'live') {
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
      this.state.updateDiscoverFilters({
        types: ['program', 'movie', 'series'],
        intent: '',
        availability: value === 'all' ? [] : [value as any],
        page: 1,
      });
      return;
    }
    if (this.activeTab() === 'streaming') {
      if (value === 'free') {
        this.state.updateStreamingFilters({ availability: ['free'], page: 1 });
        return;
      }
      this.state.updateStreamingFilters({ type: '', availability: [], sort: value as any, page: 1 });
      return;
    }
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
