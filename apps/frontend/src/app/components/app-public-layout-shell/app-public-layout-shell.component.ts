import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import {
  getPortalPublicRightRailLabel,
  getPortalPublicRightRailSections,
  getPortalPublicTopPillLabel,
  getPortalPublicTopPills,
  PORTAL_ICON_PATHS,
  PortalPublicShellSection,
  resolvePortalPublicTopPillTarget,
} from '../../config/portal-navigation.config';
import { APP_PATHS, normalizePath } from '../../config/route-map';
import {
  UnifiedPortalRailSection,
  UnifiedPortalShellComponent,
} from '../unified-portal-shell/unified-portal-shell.component';
import { FilterChipItem } from '../filter-chip-bar/filter-chip-bar.component';
import { UserService } from '../../services/user.service';
import { UnifiedTopNavTab } from '../unified-top-nav/unified-top-nav.component';

type PublicShellTone = 'home' | 'live' | 'discover' | 'streaming' | 'sports' | 'editorial' | 'rankings';

@Component({
  selector: 'app-public-layout-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, UnifiedPortalShellComponent],
  templateUrl: './app-public-layout-shell.component.html',
  styleUrl: './app-public-layout-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppPublicLayoutShellComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly searchQuery = signal('');
  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ),
    { initialValue: null }
  );
  readonly normalizedPath = computed(() =>
    normalizePath(this.currentUrl()?.urlAfterRedirects || this.router.url)
  );
  readonly section = computed<PortalPublicShellSection>(() => resolvePublicShellSection(this.normalizedPath()));
  readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  readonly profile = toSignal(this.userService.getProfile(), {
    initialValue: this.userService.getProfileSnapshot(),
  });
  readonly breadcrumbItems = computed(() => buildBreadcrumbItems(this.normalizedPath()));
  readonly tone = computed<PublicShellTone>(() => {
    const section = this.section();
    switch (section) {
      case 'live':
      case 'discover':
      case 'streaming':
      case 'sports':
      case 'editorial':
      case 'rankings':
        return section;
      default:
        return 'discover';
    }
  });
  readonly activeTab = computed<UnifiedTopNavTab['id'] | null>(() => {
    const section = this.section();
    switch (section) {
      case 'live':
      case 'discover':
      case 'streaming':
      case 'sports':
        return section;
      default:
        return null;
    }
  });
  readonly topPillLabel = computed(() => {
    return getPortalPublicTopPillLabel(this.section());
  });
  readonly topPillChips = computed<FilterChipItem[]>(() =>
    getPortalPublicTopPills(this.section()).map((pill) => ({
      id: pill.id,
      label: pill.label,
      iconPath: pill.iconPath,
      tone: pill.tone,
    }))
  );
  readonly topPillSelection = computed(() => this.topPillChips()[0]?.id || 'all');
  readonly rightRailLabel = computed(() => getPortalPublicRightRailLabel(this.section()));
  readonly leftRailSections = computed<UnifiedPortalRailSection[]>(() =>
    []
  );
  readonly rightRailSections = computed<UnifiedPortalRailSection[]>(() =>
    []
  );

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
    const target = resolvePortalPublicTopPillTarget(this.section(), value);
    if (!target) {
      return;
    }
    void this.router.navigate([target.path], {
      queryParams: target.queryParams,
    });
  }

  onTabChange(tab: 'live' | 'discover' | 'streaming' | 'sports'): void {
    const pathMap = {
      live: APP_PATHS.guide,
      discover: APP_PATHS.explore,
      streaming: APP_PATHS.platforms,
      sports: APP_PATHS.sports,
    } as const;
    void this.router.navigateByUrl(pathMap[tab]);
  }
}

function resolvePublicShellSection(path: string): PortalPublicShellSection {
  if (
    path.startsWith('/canales/') ||
    path.startsWith('/programacion-tv/ver-canal') ||
    path.startsWith('/programacion-tv/guia-canales')
  ) {
    return 'live';
  }

  if (
    path.startsWith(APP_PATHS.platforms) ||
    path.startsWith(APP_PATHS.streamingComparison)
  ) {
    return 'streaming';
  }

  if (path.startsWith(APP_PATHS.sports)) {
    return 'sports';
  }

  if (path.startsWith(APP_PATHS.blog) || path.startsWith(APP_PATHS.pressKit) || path.startsWith(APP_PATHS.about) || path.startsWith(APP_PATHS.developers)) {
    return path.startsWith(APP_PATHS.top10) ? 'rankings' : 'editorial';
  }

  if (
    path.startsWith(APP_PATHS.explore) ||
    path.startsWith(APP_PATHS.stats) ||
    path.startsWith(APP_PATHS.movies) ||
    path.startsWith(APP_PATHS.series) ||
    path.startsWith('/contenido/') ||
    path.startsWith('/peliculas/') ||
    path.startsWith('/series/') ||
    path.startsWith('/programas/') ||
    path.startsWith('/detalles/') ||
    path.startsWith('/pelicula-details/')
  ) {
    return 'discover';
  }

  return 'generic';
}

function buildSecondaryLeftRail(
  section: PortalPublicShellSection
): UnifiedPortalRailSection[] {
  return [
    {
      id: 'public-explore',
      eyebrow: 'Navegación',
      title: 'Explorar',
      items: [
        { id: 'public-nav-live', label: 'TV', iconPath: PORTAL_ICON_PATHS.channels, path: APP_PATHS.guide, active: section === 'live' },
        { id: 'public-nav-discover', label: 'Qué ver', iconPath: PORTAL_ICON_PATHS.sparkles, path: APP_PATHS.explore, active: section === 'discover' },
        { id: 'public-nav-platforms', label: 'Plataformas', iconPath: PORTAL_ICON_PATHS.platforms, path: APP_PATHS.platforms, active: section === 'streaming' },
        { id: 'public-nav-sports', label: 'Deportes', iconPath: PORTAL_ICON_PATHS.sports, path: APP_PATHS.sports, active: section === 'sports' },
        { id: 'public-nav-editorial', label: 'Editorial', iconPath: PORTAL_ICON_PATHS.editorial, path: APP_PATHS.blog, active: section === 'editorial' || section === 'rankings' },
      ],
    },
  ];
}

function buildBreadcrumbItems(path: string): { name: string; url: string }[] {
  if (
    path === APP_PATHS.home ||
    /^\/(peliculas|series|programas|contenido|detalles|pelicula-details)\//.test(path)
  ) {
    return [];
  }
  return [{ name: 'Inicio', url: APP_PATHS.home }];
}
