import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
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
import { ViewportService } from './services/viewport.service';
import { environment } from '../environments/environment';
import { MOBILE_APP_TABS, AppRouteEntry, normalizePath as normalizeRoutePath } from './config/route-map';

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
  public readonly mobileTabs: AppRouteEntry[] = MOBILE_APP_TABS;

  public readonly aiChatbotEnabled = environment.ai.chatbotEnabled;

  private swipeStartY = 0;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private resizeMoveHandler: ((e: MouseEvent) => void) | null = null;
  private resizeUpHandler: (() => void) | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly analytics = inject(AnalyticsService);
  private readonly viewport = inject(ViewportService);

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly metaService: MetaService,
    private readonly chatService: ChatService
  ) {
    void this.chatService;
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

    this.applyRouteState(this.router.url);
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

  public shouldShowMobileChatbotFab(): boolean {
    return this.canRenderChatbot() && this.viewport.isMobile() && !this.isChatbotOpen && !this.isChatMinimized;
  }

  public shouldShowDesktopChatbotLauncher(): boolean {
    return this.canRenderChatbot() && !this.viewport.isMobile();
  }

  public shouldShowMobileNavigation(): boolean {
    return this.currentLayout !== 'minimal-shell';
  }

  public isMobileTabActive(tab: AppRouteEntry): boolean {
    const path = normalizeRoutePath(this.currentPath);
    if (tab.key === 'home') return path === '/';
    if (tab.key === 'guia-canales') {
      return path.startsWith('/programacion-tv/guia-canales') || path.startsWith('/canales/');
    }
    if (tab.key === 'que-ver-hoy') {
      return path.startsWith('/programacion-tv/que-ver-hoy') || path.startsWith('/programas/') || path.startsWith('/peliculas/') || path.startsWith('/series/');
    }
    return path.startsWith(normalizeRoutePath(tab.path));
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
