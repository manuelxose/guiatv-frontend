import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import {
  PORTAL_BLOG_DESTINATIONS,
  PORTAL_PLATFORM_DESTINATIONS,
  PortalContextDestination,
} from '../../config/portal-navigation.config';
import { APP_PATHS } from '../../config/route-map';

export type PortalContextNavKind = 'blog' | 'platforms';

@Component({
  selector: 'app-portal-context-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './portal-context-nav.component.html',
  styleUrl: './portal-context-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalContextNavComponent {
  private readonly router = inject(Router);
  readonly kind = input<PortalContextNavKind>('blog');
  private readonly navigation = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    { initialValue: null }
  );

  readonly items = computed<readonly PortalContextDestination[]>(() =>
    this.kind() === 'blog' ? PORTAL_BLOG_DESTINATIONS : PORTAL_PLATFORM_DESTINATIONS
  );
  readonly label = computed(() => this.kind() === 'blog' ? 'Secciones del Blog' : 'Secciones de Plataformas');
  readonly activeId = computed(() => this.resolveActive(this.navigation()?.urlAfterRedirects || this.router.url));

  private resolveActive(url: string): string {
    const [path, fragment = ''] = url.split('?')[0].split('#');
    if (this.kind() === 'platforms') {
      return path.startsWith(APP_PATHS.streamingComparison) ? 'compare' : 'platforms';
    }
    if (path.startsWith(APP_PATHS.top10)) return 'rankings';
    if (path.startsWith(APP_PATHS.stats)) return 'trends';
    if (path.startsWith(`${APP_PATHS.blog}/categoria/`) || fragment === 'guias') return 'guides';
    return 'latest';
  }
}
