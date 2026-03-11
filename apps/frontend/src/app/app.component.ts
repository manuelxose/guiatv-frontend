import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet, ActivatedRoute } from '@angular/router';
import { Subject, filter, map, takeUntil } from 'rxjs';
import { APP_PATHS, MOBILE_APP_TABS, normalizePath } from './config/route-map';
import { AuthLoginModalComponent } from './components/auth-login-modal/auth-login-modal.component';
import { DesktopChatDockComponent } from './components/desktop-chat-dock/desktop-chat-dock.component';
import { FooterComponent } from './components/footer/footer.component';
import { LeftSidebarComponent } from './components/left-sidebar/left-sidebar.component';
import { MenuComponent } from './components/menu/menu.component';
import { ModalComponent } from './components/modal/modal.component';
import { AIChatbotComponent } from './components/ai-chatbot/ai-chatbot.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { SearchOverlayComponent } from './components/search-overlay/search-overlay.component';
import { AnalyticsService } from './services/analytics.service';
import { ChatService } from './services/chat.service';
import { MenuStateService } from './services/menu-state.service';
import { MetaService } from './services/meta.service';
import { UserService } from './services/user.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    NavBarComponent,
    DesktopChatDockComponent,
    LeftSidebarComponent,
    MenuComponent,
    FooterComponent,
    ModalComponent,
    AuthLoginModalComponent,
    AIChatbotComponent,
    SearchOverlayComponent,
    NotificationBellComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public showDesktopShell = false;
  public showMobileTopBar = false;
  public showMobileBottomNav = false;
  public mobileTitle = 'Guía TV';
  public currentPath = '/';
  public isMobileViewport = false;
  public isChatbotOpen = false;
  public isChatMinimized = false;
  public chatPanelWidth = 736; // default: ~46rem
  public swipeOffsetY = 0;
  public swipeAnimating = false;
  private swipeStartY = 0;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private resizeMoveHandler: ((e: MouseEvent) => void) | null = null;
  private resizeUpHandler: (() => void) | null = null;
  public isSearchOverlayOpen = false;
  public isMobileMenuOpen = false;
  public contextRailMode: 'guide' | 'catalog' | null = null;
  public readonly appPaths = APP_PATHS;
  public readonly mobileTabs = MOBILE_APP_TABS;
  public readonly aiChatbotEnabled = environment.ai.chatbotEnabled;
  public readonly isAuthenticated$ = this.userService.isAuthenticated$;
  public readonly profile$ = this.userService.getProfile();
  public readonly unreadCount$ = this.chatService.getConversations().pipe(
    map((conversations) =>
      conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0)
    )
  );

  private readonly destroy$ = new Subject<void>();
  private readonly analytics = inject(AnalyticsService);

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly menuState: MenuStateService,
    private readonly metaService: MetaService,
    private readonly userService: UserService,
    private readonly chatService: ChatService
  ) {
    // Ensure chat realtime is initialized once app boots.
    void this.chatService;
  }

  ngOnInit(): void {
    this.analytics.init();
    this.menuState
      .getMobile()
      .pipe(takeUntil(this.destroy$))
      .subscribe((open) => {
        this.isMobileMenuOpen = open;
        this.syncBodyScrollLock();
      });

    this.updateViewportState();
    this.applyRouteState(this.router.url);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        const url = navEnd.urlAfterRedirects || navEnd.url;
        this.menuState.setMobile(false);
        this.applyRouteState(url);
        this.analytics.trackPageView(url);

        // Set default robots meta from route data for pages that don't call setMetaTags themselves
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        const routeData = route.snapshot.data;
        if (routeData['robots']) {
          this.metaService.setMetaTags({
            title: routeData['title'] || this.getRouteTitle(route),
            description: '',
            robots: routeData['robots'],
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resetCSSVariables();
    this.syncBodyScrollLock(true);
    this.cleanupResizeListeners();
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

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
    this.showDesktopShell = !this.shouldHideDesktopShell(this.currentPath) && !this.isMobileViewport;
    this.contextRailMode = this.showDesktopShell ? this.resolveContextRailMode(this.currentPath) : null;
    this.applyMobileChromeState();
  }

  public navigate(path: string): void {
    this.router.navigateByUrl(path);
  }

  private getRouteTitle(route: ActivatedRoute): string {
    return route.snapshot.title || 'Guía TV';
  }

  public openAccountOrAuth(): void {
    this.router.navigateByUrl(
      this.userService.isAuthenticatedSync() ? APP_PATHS.account : APP_PATHS.login
    );
  }

  public openSearchOverlay(): void {
    this.closeMobileMenu();
    this.isSearchOverlayOpen = true;
  }

  public closeSearchOverlay(): void {
    this.isSearchOverlayOpen = false;
  }

  public toggleMobileMenu(): void {
    this.menuState.toggleMobile();
  }

  public closeMobileMenu(): void {
    this.menuState.setMobile(false);
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

  // --- Desktop resize ---
  public onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.chatPanelWidth;

    this.resizeMoveHandler = (e: MouseEvent) => {
      const delta = this.resizeStartX - e.clientX;
      const maxWidth = window.innerWidth - 40;
      this.chatPanelWidth = Math.max(360, Math.min(maxWidth, this.resizeStartWidth + delta));
    };

    this.resizeUpHandler = () => this.cleanupResizeListeners();

    this.document.addEventListener('mousemove', this.resizeMoveHandler);
    this.document.addEventListener('mouseup', this.resizeUpHandler);
  }

  // --- Mobile swipe-to-minimize ---
  public onSwipePanelStart(event: TouchEvent): void {
    this.swipeAnimating = false;
    this.swipeStartY = event.touches[0].clientY;
    this.swipeOffsetY = 0;
  }

  public onSwipePanelMove(event: TouchEvent): void {
    const delta = event.touches[0].clientY - this.swipeStartY;
    this.swipeOffsetY = Math.max(0, delta); // only allow downward drag
  }

  public onSwipePanelEnd(): void {
    this.swipeAnimating = true;
    if (this.swipeOffsetY > 120) {
      this.swipeOffsetY = window.innerHeight;
      setTimeout(() => {
        this.minimizeChatbot();
        this.swipeOffsetY = 0;
        this.swipeAnimating = false;
      }, 300);
    } else {
      this.swipeOffsetY = 0;
      setTimeout(() => (this.swipeAnimating = false), 300);
    }
  }

  public formatUnreadCount(count: number | null | undefined, cap: number): string {
    const safeCount = Number(count || 0);
    return safeCount > cap ? `${cap}+` : String(safeCount);
  }

  public getInitials(name: string | null | undefined): string {
    const safeName = String(name || '').trim();
    if (!safeName) return 'GT';
    return safeName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  public isTabActive(path: string): boolean {
    const current = normalizePath(this.currentPath);
    const target = normalizePath(path);

    if (target === '/') {
      return current === '/';
    }

    if (target === APP_PATHS.account) {
      return (
        current === APP_PATHS.account ||
        current.startsWith(`${APP_PATHS.account}/`)
      );
    }

    if (target === APP_PATHS.guide) {
      return (
        current === APP_PATHS.guide ||
        current.startsWith(`${APP_PATHS.guide}/`)
      );
    }

    if (target === APP_PATHS.explore) {
      return (
        current === APP_PATHS.explore ||
        current.startsWith(`${APP_PATHS.explore}/`)
      );
    }

    return current === target || current.startsWith(`${target}/`);
  }

  private applyRouteState(url: string): void {
    const path = normalizePath(url);
    this.currentPath = path;
    this.menuState.setActive(this.menuState.resolveActiveKeyFromUrl(path));

    this.showDesktopShell = !this.shouldHideDesktopShell(path) && !this.isMobileViewport;
    this.contextRailMode = this.showDesktopShell ? this.resolveContextRailMode(path) : null;
    this.mobileTitle = this.resolveMobileTitle(path);
    if (!this.canRenderChatbot()) {
      this.closeChatbot();
    }
    this.closeSearchOverlay();

    this.applyMobileChromeState();
  }

  private applyMobileChromeState(): void {
    const path = normalizePath(this.currentPath);
    const hideShell = this.shouldHideMobileShell(path);
    const isAuthRoute =
      path.startsWith(APP_PATHS.login) || path.startsWith(APP_PATHS.register);

    this.showMobileTopBar = this.isMobileViewport && !hideShell;
    this.showMobileBottomNav = this.isMobileViewport && !hideShell && !isAuthRoute;
    if (!this.showMobileTopBar) {
      this.closeMobileMenu();
    }
    if (!this.canRenderChatbot()) {
      this.closeChatbot();
    }
    this.setCSSVariables();
  }

  private updateViewportState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isMobileViewport = false;
      return;
    }
    this.isMobileViewport = window.innerWidth < 768;
  }

  private setCSSVariables(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const root = this.document.documentElement;
    root.style.setProperty('--top-bar-h', this.showMobileTopBar ? '56px' : '0px');
    root.style.setProperty('--bottom-nav-h', this.showMobileBottomNav ? '64px' : '0px');
  }

  private syncBodyScrollLock(forceUnlock = false): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.body.style.overflow =
      !forceUnlock && this.isMobileMenuOpen ? 'hidden' : '';
  }

  private resetCSSVariables(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const root = this.document.documentElement;
    root.style.setProperty('--top-bar-h', '0px');
    root.style.setProperty('--bottom-nav-h', '0px');
  }

  private shouldHideMobileShell(path: string): boolean {
    return (
      path.startsWith('/admin') ||
      path.startsWith(APP_PATHS.embedProgramGuide) ||
      path.startsWith('/avisolegal') ||
      path.startsWith('/privacidad') ||
      path.startsWith('/cookies') ||
      path.startsWith('/terminos') ||
      path.startsWith('/accesibilidad') ||
      path.startsWith('/sitemap')
    );
  }

  private shouldHideDesktopShell(path: string): boolean {
    return (
      path.startsWith('/admin') ||
      path.startsWith(APP_PATHS.embedProgramGuide) ||
      path.startsWith(APP_PATHS.login) ||
      path.startsWith(APP_PATHS.register) ||
      path.startsWith('/avisolegal') ||
      path.startsWith('/privacidad') ||
      path.startsWith('/cookies') ||
      path.startsWith('/terminos') ||
      path.startsWith('/accesibilidad') ||
      path.startsWith('/sitemap')
    );
  }

  public shouldShowChatbotFab(): boolean {
    return this.shouldShowMobileChatbotFab();
  }

  public shouldShowMobileChatbotFab(): boolean {
    const path = normalizePath(this.currentPath);
    return (
      this.canRenderChatbot() &&
      this.isMobileViewport &&
      this.showMobileBottomNav &&
      !path.startsWith(APP_PATHS.community) &&
      !path.startsWith('/admin')
    );
  }

  public shouldShowDesktopChatbotLauncher(): boolean {
    return this.canRenderChatbot() && !this.isMobileViewport;
  }

  private canRenderChatbot(): boolean {
    const path = normalizePath(this.currentPath);
    return (
      this.aiChatbotEnabled &&
      !path.startsWith('/admin') &&
      !path.startsWith(APP_PATHS.login) &&
      !path.startsWith(APP_PATHS.register) &&
      !path.startsWith('/avisolegal') &&
      !path.startsWith('/privacidad') &&
      !path.startsWith('/cookies') &&
      !path.startsWith('/terminos') &&
      !path.startsWith('/accesibilidad') &&
      !path.startsWith('/sitemap') &&
      !path.startsWith(APP_PATHS.community) &&
      !path.startsWith(APP_PATHS.embedProgramGuide)
    );
  }

  private resolveMobileTitle(path: string): string {
    if (path === '/') return 'Inicio';
    if (path.startsWith(APP_PATHS.guide)) return 'Guía TV';
    if (path.startsWith(APP_PATHS.explore)) return 'Explorar';
    if (path.startsWith(APP_PATHS.live)) return 'Guía TV';
    if (path.startsWith(APP_PATHS.series)) return 'Series';
    if (path.startsWith(APP_PATHS.movies)) return 'Películas';
    if (path.startsWith(APP_PATHS.platforms)) return 'Plataformas';
    if (path.startsWith(APP_PATHS.top10)) return 'Rankings';
    if (path.startsWith(APP_PATHS.blog)) return 'Editorial';
    if (path.startsWith(APP_PATHS.streamingComparison)) return 'Comparar';
    if (path.startsWith(APP_PATHS.stats)) return 'Tendencias';
    if (path.startsWith(APP_PATHS.developers)) return 'Desarrolladores';
    if (path.startsWith(APP_PATHS.embed)) return 'Widget';
    if (path.startsWith(APP_PATHS.about)) return 'Sobre nosotros';
    if (path.startsWith(APP_PATHS.pressKit)) return 'Prensa';
    if (path.startsWith(APP_PATHS.community)) return 'Comunidad';
    if (path.startsWith(APP_PATHS.account)) return 'Mi cuenta';
    if (path.startsWith(APP_PATHS.login)) return 'Iniciar sesión';
    if (path.startsWith(APP_PATHS.register)) return 'Crear cuenta';
    return 'Guía TV';
  }

  private resolveContextRailMode(path: string): 'guide' | 'catalog' | null {
    if (
      path.startsWith(APP_PATHS.guide) ||
      path.startsWith(APP_PATHS.live) ||
      path.startsWith('/programacion-tv/ver-canal') ||
      path.startsWith('/canales/')
    ) {
      return 'guide';
    }

    if (
      path.startsWith(APP_PATHS.explore) ||
      path.startsWith(APP_PATHS.platforms) ||
      path.startsWith(APP_PATHS.movies) ||
      path.startsWith(APP_PATHS.series)
    ) {
      return 'catalog';
    }

    return null;
  }
}
