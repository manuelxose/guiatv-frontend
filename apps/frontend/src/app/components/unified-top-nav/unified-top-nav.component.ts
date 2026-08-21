import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { APP_PATHS } from '../../config/route-map';
import {
  PORTAL_ICON_PATHS,
  PORTAL_PRIMARY_DESTINATIONS,
  PortalPrimaryDestinationId,
  resolvePortalPrimaryDestination,
} from '../../config/portal-navigation.config';
import { ThemeService } from '../../services/theme.service';
import { ViewportService } from '../../services/viewport.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { UnifiedSearchComponent } from '../unified-search/unified-search.component';

export interface UnifiedTopNavTab {
  id: PortalPrimaryDestinationId;
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
  imports: [CommonModule, RouterModule, UnifiedSearchComponent, NotificationBellComponent],
  templateUrl: './unified-top-nav.component.html',
  styleUrl: './unified-top-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedTopNavComponent {
  readonly appPaths = APP_PATHS;
  readonly viewport = inject(ViewportService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly theme = inject(ThemeService);
  readonly isAuthenticated = input(false);
  readonly profileName = input('Cuenta');
  readonly showLeftRail = input(true);
  readonly showRightRail = input(false);
  readonly rightRailLabel = input('Panel contextual');

  readonly leftRailToggle = output<void>();
  readonly rightRailToggle = output<void>();

  readonly homePath = APP_PATHS.home;
  readonly loginPath = APP_PATHS.login;
  readonly profilePath = APP_PATHS.profile;
  readonly iconPaths = PORTAL_ICON_PATHS;
  isShrunk = false;
  readonly mobileSearchOpen = signal(false);
  readonly searchQuery = signal('');
  @ViewChild(UnifiedSearchComponent) private readonly search?: UnifiedSearchComponent;
  @ViewChild('mobileSearchTrigger') private readonly mobileSearchTrigger?: ElementRef<HTMLButtonElement>;
  private readonly navigation = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    { initialValue: null }
  );
  readonly activeTab = computed(() =>
    resolvePortalPrimaryDestination(this.navigation()?.urlAfterRedirects || this.router.url)
  );
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

  cycleTheme(): void {
    this.theme.toggle();
  }

  openMobileSearch(): void {
    this.mobileSearchOpen.set(true);
    this.setDocumentScrollLocked(true);
    if (this.isBrowser) {
      setTimeout(() => this.search?.focusInput());
    }
  }

  closeMobileSearch(): void {
    const wasOpen = this.mobileSearchOpen();
    this.mobileSearchOpen.set(false);
    this.setDocumentScrollLocked(false);
    if (wasOpen && this.isBrowser) {
      setTimeout(() => this.mobileSearchTrigger?.nativeElement.focus());
    }
  }

  onSearchSubmit(value: string): void {
    this.closeMobileSearch();
    this.searchQuery.set(value);
    void this.router.navigate([APP_PATHS.explore], { queryParams: value ? { q: value } : {} });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileSearchOpen()) {
      this.closeMobileSearch();
    }
  }

  get themeLabel(): string {
    return this.theme.resolved === 'dark'
      ? 'Cambiar a tema claro'
      : 'Cambiar a tema oscuro';
  }

  private setDocumentScrollLocked(locked: boolean): void {
    if (this.isBrowser) {
      this.document.body.classList.toggle('portal-overlay-open', locked);
    }
  }
}
