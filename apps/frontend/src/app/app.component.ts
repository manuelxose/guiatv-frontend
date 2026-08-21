import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthLoginModalComponent } from './components/auth-login-modal/auth-login-modal.component';
import { AppPublicLayoutShellComponent } from './components/app-public-layout-shell/app-public-layout-shell.component';
import { ModalComponent } from './components/modal/modal.component';
import { UnifiedChatShellComponent } from './components/unified-chat-shell/unified-chat-shell.component';
import { AnalyticsService } from './services/analytics.service';
import { ChatService } from './services/chat.service';
import { MetaService } from './services/meta.service';
import { environment } from '../environments/environment';
import { APP_PATHS, normalizePath as normalizeRoutePath } from './config/route-map';
import {
  PORTAL_ACCOUNT_DESTINATIONS,
  PORTAL_MOBILE_MORE_DESTINATIONS,
  PORTAL_MOBILE_PRIMARY_DESTINATIONS,
  PortalMobileDestination,
} from './config/portal-navigation.config';
import { ThemeMode, ThemeService } from './services/theme.service';

type AppLayoutMode = 'portal-page' | 'public-shell' | 'minimal-shell' | 'private-shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    AppPublicLayoutShellComponent,
    ModalComponent,
    AuthLoginModalComponent,
    UnifiedChatShellComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public currentPath = '/';
  public currentLayout: AppLayoutMode = 'public-shell';
  public isChatbotOpen = false;
  public isChatMinimized = false;
  public chatPanelWidth = 440;
  public swipeOffsetY = 0;
  public swipeAnimating = false;
  public readonly mobileTabs = PORTAL_MOBILE_PRIMARY_DESTINATIONS;
  public readonly moreDestinations = PORTAL_MOBILE_MORE_DESTINATIONS;
  public readonly accountDestinations = PORTAL_ACCOUNT_DESTINATIONS;
  public mobileMoreOpen = false;
  public readonly theme = inject(ThemeService);
  @ViewChild('mobileMoreTrigger') private readonly mobileMoreTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('mobileMoreSheet') private readonly mobileMoreSheet?: ElementRef<HTMLElement>;

  public readonly aiChatbotEnabled = environment.ai.chatbotEnabled;

  private swipeStartY = 0;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private resizeMoveHandler: ((e: MouseEvent) => void) | null = null;
  private resizeUpHandler: (() => void) | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly analytics = inject(AnalyticsService);

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly metaService: MetaService,
    private readonly chatService: ChatService
  ) {
    void this.chatService;
    // Select the same router-outlet branch before the first render on SSR and
    // in the hydrating browser. Deferring this until ngOnInit makes hydration
    // briefly instantiate the default public shell for portal routes.
    this.applyRouteState(this.router.url);
  }

  ngOnInit(): void {
    this.analytics.init();

    this.chatService.requestOpenChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.canRenderChatbot()) {
          this.isChatbotOpen = true;
          this.isChatMinimized = false;
        }
      });

    this.applyRobotsMeta();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        const url = navEnd.urlAfterRedirects || navEnd.url;
        this.applyRouteState(url);
        this.analytics.trackPageView(url);
        this.applyRobotsMeta();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupResizeListeners();
    this.document.body.classList.remove('portal-overlay-open');
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.canRenderChatbot()) {
      this.closeChatbot();
    }
  }

  public toggleChatbot(): void {
    if (!this.canRenderChatbot()) {
      return;
    }
    this.isChatbotOpen = !this.isChatbotOpen;
  }

  public closeChatbot(): void {
    this.isChatbotOpen = false;
    this.isChatMinimized = false;
  }

  public minimizeChatbot(): void {
    this.isChatMinimized = true;
  }

  public restoreChatbot(): void {
    this.isChatMinimized = false;
    this.isChatbotOpen = true;
  }

  public onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.chatPanelWidth;

    this.resizeMoveHandler = (moveEvent: MouseEvent) => {
      const delta = this.resizeStartX - moveEvent.clientX;
      const maxWidth = Math.max(420, this.document.defaultView?.innerWidth || 1280) - 40;
      this.chatPanelWidth = Math.max(360, Math.min(maxWidth, this.resizeStartWidth + delta));
    };

    this.resizeUpHandler = () => this.cleanupResizeListeners();

    this.document.addEventListener('mousemove', this.resizeMoveHandler);
    this.document.addEventListener('mouseup', this.resizeUpHandler);
  }

  public onSwipePanelStart(event: TouchEvent): void {
    this.swipeAnimating = false;
    this.swipeStartY = event.touches[0].clientY;
    this.swipeOffsetY = 0;
  }

  public onSwipePanelMove(event: TouchEvent): void {
    const delta = event.touches[0].clientY - this.swipeStartY;
    this.swipeOffsetY = Math.max(0, delta);
  }

  public onSwipePanelEnd(): void {
    this.swipeAnimating = true;
    if (this.swipeOffsetY > 120) {
      this.swipeOffsetY = this.document.defaultView?.innerHeight || 0;
      setTimeout(() => {
        this.minimizeChatbot();
        this.swipeOffsetY = 0;
        this.swipeAnimating = false;
      }, 300);
      return;
    }

    this.swipeOffsetY = 0;
    setTimeout(() => {
      this.swipeAnimating = false;
    }, 300);
  }

  // Deliberately not gated on viewport.isMobile(): that signal starts at a
  // guessed default and only settles after client-side hydration, which
  // raced with SSR/first paint and could leave desktop visitors with no
  // visible chat entry point (FAB hidden by CSS, launcher not yet rendered)
  // until the guess corrected itself. The FAB/launcher pair's CSS already
  // fully owns the 768px breakpoint (see .app-shell__chat-fab /
  // .app-shell__chat-launcher in app.component.scss), so both can render
  // unconditionally here and let CSS be the single source of truth for
  // which one is visible at a given width — matching how the mobile/desktop
  // chat panels already resolve their own visibility.
  public shouldShowMobileChatbotFab(): boolean {
    return this.canRenderChatbot() && !this.isChatbotOpen && !this.isChatMinimized;
  }

  public shouldShowDesktopChatbotLauncher(): boolean {
    return this.canRenderChatbot();
  }

  public shouldShowMobileNavigation(): boolean {
    return this.currentLayout !== 'minimal-shell';
  }

  public isMobileTabActive(tab: PortalMobileDestination): boolean {
    const path = normalizeRoutePath(this.currentPath);
    if (tab.id === 'more') {
      return this.mobileMoreOpen || path.startsWith(APP_PATHS.platforms) || path.startsWith(APP_PATHS.streamingComparison) || path.startsWith(APP_PATHS.blog) || path.startsWith(APP_PATHS.stats);
    }
    if (tab.id === 'home') return path === '/';
    if (tab.id === 'live') {
      return path.startsWith('/programacion-tv/guia-canales') || path.startsWith('/canales/');
    }
    if (tab.id === 'discover') {
      return path.startsWith('/programacion-tv/que-ver-hoy') || path.startsWith('/programas/') || path.startsWith('/peliculas/') || path.startsWith('/series/');
    }
    return Boolean(tab.path && path.startsWith(normalizeRoutePath(tab.path)));
  }

  public toggleMobileMore(): void {
    if (this.mobileMoreOpen) {
      this.closeMobileMore();
      return;
    }
    this.mobileMoreOpen = true;
    this.document.body.classList.add('portal-overlay-open');
    setTimeout(() => {
      const first = this.getMoreSheetFocusables()[0];
      if (first) first.focus();
      else this.mobileMoreSheet?.nativeElement.focus();
    });
  }

  public closeMobileMore(): void {
    if (!this.mobileMoreOpen) return;
    this.mobileMoreOpen = false;
    this.document.body.classList.remove('portal-overlay-open');
    setTimeout(() => this.mobileMoreTrigger?.nativeElement.focus());
  }

  public setTheme(mode: ThemeMode | string): void {
    if (mode === 'light' || mode === 'dark' || mode === 'system') {
      this.theme.setMode(mode);
    }
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    this.closeMobileMore();
    if (this.isChatbotOpen) {
      this.closeChatbot();
    }
  }

  @HostListener('document:keydown', ['$event'])
  public trapMobileMoreFocus(event: KeyboardEvent): void {
    if (!this.mobileMoreOpen || event.key !== 'Tab') return;
    const focusable = this.getMoreSheetFocusables();
    if (!focusable.length) {
      event.preventDefault();
      this.mobileMoreSheet?.nativeElement.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && (active === first || !this.mobileMoreSheet?.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private cleanupResizeListeners(): void {
    if (this.resizeMoveHandler) {
      this.document.removeEventListener('mousemove', this.resizeMoveHandler);
    }
    if (this.resizeUpHandler) {
      this.document.removeEventListener('mouseup', this.resizeUpHandler);
    }
    this.resizeMoveHandler = null;
    this.resizeUpHandler = null;
  }

  private getMoreSheetFocusables(): HTMLElement[] {
    const sheet = this.mobileMoreSheet?.nativeElement;
    if (!sheet) return [];
    return Array.from(
      sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
  }

  private applyRouteState(url: string): void {
    this.currentPath = normalizePath(url);
    this.currentLayout = this.resolveCurrentLayout();
    if (!this.canRenderChatbot()) {
      this.closeChatbot();
    }
  }

  private resolveCurrentLayout(): AppLayoutMode {
    let route = this.activatedRoute;
    let resolvedLayout: AppLayoutMode = 'public-shell';

    while (route.firstChild) {
      const candidate = route.snapshot.data['layout'] as AppLayoutMode | undefined;
      if (candidate) {
        resolvedLayout = candidate;
      }
      route = route.firstChild;
    }

    const finalCandidate = route.snapshot.data['layout'] as AppLayoutMode | undefined;
    return finalCandidate || resolvedLayout;
  }

  private applyRobotsMeta(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const routeData = route.snapshot.data;
    if (routeData['robots']) {
      this.metaService.setMetaTags({
        title: routeData['title'] || route.snapshot.title || 'Guía TV',
        description: '',
        robots: routeData['robots'],
      });
    }
  }

  private canRenderChatbot(): boolean {
    return (
      this.aiChatbotEnabled &&
      this.currentLayout !== 'minimal-shell'
    );
  }
}

function normalizePath(value: string): string {
  const raw = String(value || '')
    .split('?')[0]
    .split('#')[0]
    .trim();
  if (!raw || raw === '/') {
    return '/';
  }
  return raw.replace(/\/+$/, '') || '/';
}
