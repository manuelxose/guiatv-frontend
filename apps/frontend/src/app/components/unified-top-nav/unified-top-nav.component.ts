import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  PLATFORM_ID,
  inject,
  input,
  output,
} from '@angular/core';
import { Params } from '@angular/router';
import { RouterModule } from '@angular/router';
import { APP_PATHS } from '../../config/route-map';
import { PORTAL_ICON_PATHS, PORTAL_PRIMARY_DESTINATIONS } from '../../config/portal-navigation.config';
import { ViewportService } from '../../services/viewport.service';
import { UnifiedSearchComponent } from '../unified-search/unified-search.component';

export interface UnifiedTopNavTab {
  id: 'live' | 'discover' | 'streaming' | 'sports';
  label: string;
  path: string;
  hint: string;
  iconPath: string;
}

export interface UnifiedTopNavShortcut {
  label: string;
  path: string;
  iconPath: string;
  queryParams?: Params;
  description?: string;
}

@Component({
  selector: 'app-unified-top-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, UnifiedSearchComponent],
  templateUrl: './unified-top-nav.component.html',
  styleUrl: './unified-top-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedTopNavComponent {
  readonly appPaths = APP_PATHS;
  private readonly viewport = inject(ViewportService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly activeTab = input<UnifiedTopNavTab['id'] | null>(null);
  readonly searchQuery = input('');
  readonly isAuthenticated = input(false);
  readonly profileName = input('Cuenta');
  readonly showLeftRail = input(true);
  readonly showRightRail = input(false);
  readonly rightRailLabel = input('Panel contextual');

  readonly tabChange = output<UnifiedTopNavTab['id']>();
  readonly searchChange = output<string>();
  readonly searchSubmit = output<string>();
  readonly leftRailToggle = output<void>();
  readonly rightRailToggle = output<void>();

  readonly homePath = APP_PATHS.home;
  readonly loginPath = APP_PATHS.login;
  readonly profilePath = APP_PATHS.profile;
  readonly iconPaths = PORTAL_ICON_PATHS;
  isShrunk = false;
  readonly tabs: UnifiedTopNavTab[] = PORTAL_PRIMARY_DESTINATIONS.map((destination) => ({
    id: destination.id as UnifiedTopNavTab['id'],
    label: destination.label,
    path: destination.path,
    hint: destination.hint,
    iconPath: destination.iconPath,
  }));

  get currentStatusLabel(): string {
    if (this.activeTab() === 'streaming') {
      return 'Catálogo en foco';
    }
    if (this.activeTab() === 'discover') {
      return 'Discovery activo';
    }
    if (this.activeTab() === 'sports') {
      return 'Agenda en vivo';
    }
    return 'En directo ahora';
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isBrowser) {
      return;
    }
    const shouldShrink = this.viewport.shouldShrinkTopNav() && window.scrollY > 48;
    if (shouldShrink !== this.isShrunk) {
      this.isShrunk = shouldShrink;
    }
  }

  trackByTab(_index: number, tab: UnifiedTopNavTab): string {
    return tab.id;
  }
}
