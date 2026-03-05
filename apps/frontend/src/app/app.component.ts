import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { APP_PATHS, MOBILE_APP_TABS, normalizePath } from './config/route-map';
import { AuthLoginModalComponent } from './components/auth-login-modal/auth-login-modal.component';
import { DesktopChatDockComponent } from './components/desktop-chat-dock/desktop-chat-dock.component';
import { FooterComponent } from './components/footer/footer.component';
import { LeftSidebarComponent } from './components/left-sidebar/left-sidebar.component';
import { ModalComponent } from './components/modal/modal.component';
import { RightSidebarComponent } from './components/right-sidebar/right-sidebar.component';
import { AnalyticsService } from './services/analytics.service';
import { ChatService } from './services/chat.service';
import { MenuStateService } from './services/menu-state.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LeftSidebarComponent,
    RightSidebarComponent,
    FooterComponent,
    ModalComponent,
    AuthLoginModalComponent,
    DesktopChatDockComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public hideRightSidebar = false;
  public showMobileTopBar = false;
  public showMobileBottomNav = false;
  public mobileTitle = 'Guía TV';
  public currentPath = '/';
  public readonly mobileTabs = MOBILE_APP_TABS;
  public readonly isAuthenticated$ = this.userService.isAuthenticated$;

  private readonly destroy$ = new Subject<void>();
  private isMobileViewport = false;
  private readonly analytics = inject(AnalyticsService);

  constructor(
    private readonly router: Router,
    private readonly menuState: MenuStateService,
    private readonly userService: UserService,
    private readonly chatService: ChatService
  ) {
    // Ensure chat realtime is initialized once app boots.
    void this.chatService;
  }

  ngOnInit(): void {
    this.analytics.init();
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
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
    this.applyMobileChromeState();
  }

  public navigate(path: string): void {
    this.router.navigateByUrl(path);
  }

  public openAccountOrAuth(): void {
    this.router.navigateByUrl(
      this.userService.isAuthenticatedSync() ? APP_PATHS.account : APP_PATHS.login
    );
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
        current.startsWith(`${APP_PATHS.account}/`) ||
        current === APP_PATHS.community ||
        current.startsWith(`${APP_PATHS.community}/`)
      );
    }

    return current === target || current.startsWith(`${target}/`);
  }

  private applyRouteState(url: string): void {
    const path = normalizePath(url);
    this.currentPath = path;
    this.menuState.setActive(this.menuState.resolveActiveKeyFromUrl(path));

    this.hideRightSidebar = path.startsWith('/admin') || path.startsWith('/blog');
    this.mobileTitle = this.resolveMobileTitle(path);

    this.applyMobileChromeState();
  }

  private applyMobileChromeState(): void {
    const path = normalizePath(this.currentPath);
    const hideShell = this.shouldHideMobileShell(path);
    const isAuthRoute =
      path.startsWith(APP_PATHS.login) || path.startsWith(APP_PATHS.register);
    const isAccountRoute =
      path.startsWith(APP_PATHS.account) || path.startsWith(APP_PATHS.community);

    this.showMobileTopBar = this.isMobileViewport && !hideShell;
    this.showMobileBottomNav =
      this.isMobileViewport && !hideShell && !isAuthRoute && !isAccountRoute;
  }

  private updateViewportState(): void {
    if (typeof window === 'undefined') {
      this.isMobileViewport = false;
      return;
    }
    this.isMobileViewport = window.innerWidth < 768;
  }

  private shouldHideMobileShell(path: string): boolean {
    return (
      path.startsWith('/admin') ||
      path.startsWith('/blog') ||
      path.startsWith('/avisolegal') ||
      path.startsWith('/privacidad') ||
      path.startsWith('/cookies') ||
      path.startsWith('/terminos') ||
      path.startsWith('/accesibilidad') ||
      path.startsWith('/sitemap')
    );
  }

  private resolveMobileTitle(path: string): string {
    if (path === '/') return 'Inicio';
    if (path.startsWith(APP_PATHS.guide)) return 'Guía';
    if (path.startsWith(APP_PATHS.explore)) return 'Explorar';
    if (path.startsWith(APP_PATHS.live)) return 'En directo';
    if (path.startsWith(APP_PATHS.series)) return 'Series';
    if (path.startsWith(APP_PATHS.movies)) return 'Películas';
    if (path.startsWith(APP_PATHS.community)) return 'Comunidad';
    if (path.startsWith(APP_PATHS.account)) return 'Mi cuenta';
    if (path.startsWith(APP_PATHS.login)) return 'Iniciar sesión';
    if (path.startsWith(APP_PATHS.register)) return 'Crear cuenta';
    return 'Guía TV';
  }
}
