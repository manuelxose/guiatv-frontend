import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { PortalPublicShellSection } from '../../config/portal-navigation.config';
import { APP_PATHS, normalizePath } from '../../config/route-map';
import { UnifiedPortalShellComponent } from '../unified-portal-shell/unified-portal-shell.component';

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

  if (path.startsWith(APP_PATHS.stats)) {
    return 'editorial';
  }

  return 'generic';
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
