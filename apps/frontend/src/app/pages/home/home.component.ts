import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  UnifiedPortalShellComponent,
} from '../../components/unified-portal-shell/unified-portal-shell.component';
import { FilterChipItem } from '../../components/filter-chip-bar/filter-chip-bar.component';
import { UnifiedProgramCardComponent } from '../../components/unified-program-card/unified-program-card.component';
import { HomeHeroComponent, HomeHeroItem } from '../../components/home-hero/home-hero.component';
import { PlatformBadgeComponent } from '../../components/platform-badge/platform-badge.component';
import { UnifiedEditorialModuleComponent } from '../../components/unified-editorial-module/unified-editorial-module.component';
import { UnifiedSectionHeaderComponent } from '../../components/unified-section-header/unified-section-header.component';
import { UnifiedSkeletonBlockComponent } from '../../components/unified-skeleton-block/unified-skeleton-block.component';
import {
  PORTAL_HOME_TOP_PILLS,
  PORTAL_ICON_PATHS,
} from '../../config/portal-navigation.config';
import { APP_PATHS } from '../../config/route-map';
import { UnifiedTopNavTab } from '../../components/unified-top-nav/unified-top-nav.component';
import { PortalHomeFacade } from '../../state/portal-home.facade';
import { MetaService } from '../../services/meta.service';
import { UserService } from '../../services/user.service';
import { normalizeToCard } from '../../utils/tv-normalizers';
import { generateOrganizationSchema, generateWebApplicationSchema } from '../../utils/utils';
import { UnifiedPortalRailSection } from '../../models/portal-shell.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedPortalShellComponent,
    UnifiedProgramCardComponent,
    HomeHeroComponent,
    PlatformBadgeComponent,
    UnifiedEditorialModuleComponent,
    UnifiedSectionHeaderComponent,
    UnifiedSkeletonBlockComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  public readonly appPaths = APP_PATHS;
  public readonly iconPaths = PORTAL_ICON_PATHS;
  public readonly searchQuery = signal('');
  public readonly safeLdHtml: SafeHtml | null;
  public readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  public readonly profile = toSignal(this.userService.getProfile(), {
    initialValue: this.userService.getProfileSnapshot(),
  });
  public readonly topPillChips = computed<FilterChipItem[]>(() => [...PORTAL_HOME_TOP_PILLS]);
  public readonly topPillSelection = computed(() => 'live-now');
  public readonly breadcrumbItems: { name: string; url: string }[] = [];
  public readonly error = signal<string | null>(null);
  public readonly homeState = toSignal(
    this.portalHomeFacade.getHomeState().pipe(
      catchError(() => {
        this.error.set('No se pudo cargar la portada unificada ahora mismo.');
        return of(null);
      })
    ),
    { initialValue: null }
  );
  public readonly loading = computed(() => !this.error() && !this.homeState());
  public readonly liveNow = computed(() => this.homeState()?.liveNow || []);
  public readonly tonight = computed(() => this.homeState()?.tonight || []);
  public readonly featuredPlatforms = computed(() => this.homeState()?.featuredPlatforms || []);
  public readonly streamingHighlights = computed(() => this.homeState()?.streamingHighlights.slice(0, 8) || []);
  public readonly trendingItems = computed(() => this.homeState()?.trendingItems.slice(0, 8) || []);
  public readonly editorialGuides = computed(() => this.homeState()?.editorialHub.guidePosts.slice(0, 3) || []);
  public readonly rankingHighlights = computed(() => this.homeState()?.rankingHighlights.slice(0, 4) || []);
  public readonly heroLead = computed(() =>
    this.liveNow()[0] || this.tonight()[0] || this.streamingHighlights()[0] || null
  );
  public readonly heroItems = computed<HomeHeroItem[]>(() => {
    const candidates = [
      ...this.liveNow().slice(0, 3).map((item) => ({ item, source: 'live' as const })),
      ...this.tonight().slice(0, 2).map((item) => ({ item, source: 'tonight' as const })),
      ...this.streamingHighlights().slice(0, 2).map((item) => ({ item, source: 'platform' as const })),
    ];
    const seen = new Set<string>();

    return candidates.flatMap(({ item, source }) => {
      const card = normalizeToCard(item);
      if (!card.title || !card.image || !card.detailPath || seen.has(card.detailPath)) return [];
      seen.add(card.detailPath);

      const secondaryPath = source === 'platform' ? APP_PATHS.platforms : card.channelPath;
      return [{
        id: `${source}-${card.id}`,
        eyebrow: source === 'live' ? 'En emisión' : source === 'tonight' ? 'Esta noche' : 'Estreno en plataformas',
        title: card.title,
        description: card.description,
        meta: card.subtitle || [card.channelName, card.category].filter(Boolean).join(' · '),
        image: card.image,
        progress: source === 'live' ? card.progressPercent : 0,
        primaryLabel: 'Ver programa',
        primaryPath: card.detailPath,
        secondaryLabel: source === 'platform' ? 'Ver en plataformas' : 'Abrir canal',
        secondaryPath,
      } satisfies HomeHeroItem];
    }).slice(0, 5);
  });
  public readonly rightRailLabel = 'Portada';
  public readonly leftRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'home-discover-now',
      eyebrow: 'Descubrir ahora',
      title: 'Empieza por intención',
      description: 'Lo que más se usa vive en el rail secundario, no en otra barra arriba.',
      items: [
        {
          id: 'home-live-now',
          label: 'Ahora en TV',
          description: 'Lineal vivo y zapping',
          iconPath: this.iconPaths.liveDot,
          path: APP_PATHS.guide,
          queryParams: { liveView: 'now' },
        },
        {
          id: 'home-tonight',
          label: 'Esta noche',
          description: 'Prime time y directo fuerte',
          iconPath: this.iconPaths.clock,
          path: APP_PATHS.guide,
          queryParams: { liveView: 'night' },
        },
        {
          id: 'home-sports-live',
          label: 'Deportes en vivo',
          description: 'Agenda y eventos activos',
          iconPath: this.iconPaths.sports,
          path: APP_PATHS.sports,
          queryParams: { timeRange: 'live' },
        },
        {
          id: 'home-trending',
          label: 'Tendencias',
          description: 'Lo que más se mueve ahora',
          iconPath: this.iconPaths.trends,
          path: APP_PATHS.stats,
        },
        {
          id: 'home-featured',
          label: 'Destacados',
          description: 'Mezcla editorial y catálogo',
          iconPath: this.iconPaths.sparkles,
          path: APP_PATHS.explore,
          queryParams: { intent: 'featured' },
        },
      ],
    },
    {
      id: 'home-directories',
      eyebrow: 'Directorios',
      title: 'Saltos rápidos',
      description: 'Canales, plataformas y géneros siguen accesibles sin duplicar menús.',
      items: [
        {
          id: 'home-channels',
          label: 'Canales',
          description: 'Abrir TV por señales',
          iconPath: this.iconPaths.channels,
          path: APP_PATHS.guide,
          queryParams: { liveView: 'day' },
        },
        {
          id: 'home-platforms',
          label: 'Plataformas',
          description: 'Ver servicios y catálogos',
          iconPath: this.iconPaths.platforms,
          path: APP_PATHS.platforms,
        },
        {
          id: 'home-sports',
          label: 'Deportes',
          description: 'Entrar por disciplina',
          iconPath: this.iconPaths.sports,
          path: APP_PATHS.sports,
        },
        {
          id: 'home-genres',
          label: 'Géneros',
          description: 'Explorar por tipo de contenido',
          iconPath: this.iconPaths.discover,
          path: APP_PATHS.explore,
        },
      ],
    },
  ]);
  public readonly rightRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'home-live',
      eyebrow: 'Ahora',
      title: 'TV en emisión',
      description: 'Acceso lateral a lo más vivo del lineal.',
      variant: 'feature',
      items: this.liveNow().slice(0, 4).map((item, index) => toRailProgramItem(item, `home-live-${index}`)),
    },
    {
      id: 'home-platforms',
      eyebrow: 'Servicios',
      title: 'Top plataformas',
      description: 'Directorio premium a los catálogos que más importan.',
      variant: 'logos',
      items: this.featuredPlatforms().slice(0, 5).map((platform) => ({
        id: `home-platform-${platform.name}`,
        label: platform.name,
        description: 'Abrir catálogo filtrado',
        imageUrl: platform.logoUrl || '',
        path: APP_PATHS.platforms,
        queryParams: { platform: platform.name },
      })),
    },
    {
      id: 'home-sports',
      eyebrow: 'Fútbol',
      title: 'Partidos y dónde verlos',
      description: 'La suite de fútbol con partidos en directo y dónde ver cada uno.',
      variant: 'compact',
      items: [
        {
          id: 'home-football',
          label: 'Fútbol hoy',
          description: 'Partidos en directo, horarios y dónde verlos',
          iconPath: this.iconPaths.sports,
          path: APP_PATHS.sports,
        },
      ],
    },
  ]);

  constructor(
    private readonly portalHomeFacade: PortalHomeFacade,
    private readonly metaService: MetaService,
    private readonly userService: UserService,
    private readonly sanitizer: DomSanitizer,
    private readonly router: Router
  ) {
    this.metaService.setMetaTags({
      title: 'Inicio | Guía TV',
      description:
        'Portal unificado para descubrir qué ver hoy en TV, streaming, deportes y capas editoriales desde una sola experiencia.',
      canonicalUrl: '/',
      type: 'website',
    });
    this.safeLdHtml = this.buildStructuredData();
  }

  navigateToTab(tab: UnifiedTopNavTab['id']): void {
    const pathMap: Record<UnifiedTopNavTab['id'], string> = {
      live: APP_PATHS.guide,
      discover: APP_PATHS.explore,
      streaming: APP_PATHS.platforms,
      sports: APP_PATHS.sports,
    };
    void this.router.navigateByUrl(pathMap[tab]);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onSearchSubmit(value: string): void {
    this.searchQuery.set(value);
    void this.router.navigate([APP_PATHS.explore], {
      queryParams: value ? { q: value } : {},
    });
  }

  onTopPillChange(value: string): void {
    const routeMap: Record<string, { path: string; queryParams?: Record<string, string> }> = {
      'live-now': { path: APP_PATHS.guide, queryParams: { liveView: 'now' } },
      tonight: { path: APP_PATHS.guide, queryParams: { liveView: 'night' } },
      platforms: { path: APP_PATHS.platforms },
      'sports-live': { path: APP_PATHS.sports, queryParams: { timeRange: 'live' } },
      trending: { path: APP_PATHS.stats },
      free: { path: APP_PATHS.explore, queryParams: { availability: 'free' } },
    };
    const target = routeMap[value];
    if (target) {
      void this.router.navigate([target.path], {
        queryParams: target.queryParams,
      });
    }
  }

  trackByPlatform(_index: number, platform: { name: string }): string {
    return platform.name;
  }

  private buildStructuredData(): SafeHtml {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Guía Programación TV',
        url: baseUrl,
      },
      generateOrganizationSchema(baseUrl),
      generateWebApplicationSchema(baseUrl),
    ];

    return this.sanitizer.bypassSecurityTrustHtml(
      schemas
        .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
        .join('')
    );
  }
}

function toRailProgramItem(
  item: Parameters<typeof normalizeToCard>[0],
  fallbackId: string
): UnifiedPortalRailSection['items'][number] {
  const card = normalizeToCard(item);
  return {
    id: card.id || fallbackId,
    label: card.title,
    description: [card.channelName, card.subtitle || card.category].filter(Boolean).join(' · '),
    badge: card.liveNow ? 'LIVE' : card.sport || card.category,
    imageUrl: card.channelIcon || card.image,
    iconPath: card.liveNow ? PORTAL_ICON_PATHS.liveDot : PORTAL_ICON_PATHS.play,
    path: card.detailPath,
  };
}
