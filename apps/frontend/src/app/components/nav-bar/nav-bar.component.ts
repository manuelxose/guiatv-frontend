import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, map, takeUntil } from 'rxjs';
import { MenuStateService } from '../../services/menu-state.service';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { APP_PATHS, AppRouteEntry } from '../../config/route-map';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
})
export class NavBarComponent implements OnDestroy {
  @Output() searchRequested = new EventEmitter<void>();

  public readonly appPaths = APP_PATHS;
  public readonly isAuthenticated$ = this.userService.isAuthenticated$;
  public readonly profile$ = this.userService.getProfile();
  public readonly unreadCount$ = this.chatService.getConversations().pipe(
    map((conversations) =>
      conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0)
    )
  );
  public readonly headerRoutes = this.menuState.getHeaderRoutes().filter(Boolean);
  public readonly secondaryRoutes = this.menuState.getSecondaryRoutes().filter(Boolean);
  public readonly resourceRoutes = this.menuState.getResourceRoutes().filter(Boolean);
  public readonly toolRoutes = this.menuState.getToolRoutes().filter(Boolean);
  public activeKey = this.menuState.getCurrentActive();
  public isMoreMenuOpen = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly router: Router,
    public readonly menuState: MenuStateService,
    private readonly userService: UserService,
    private readonly chatService: ChatService
  ) {
    this.menuState
      .getActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe((key) => {
        this.activeKey = key;
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
        this.menuState.setActive(this.menuState.resolveActiveKeyFromUrl(url));
      });
  }

  navigateTo(route: AppRouteEntry): void {
    this.isMoreMenuOpen = false;
    this.menuState.setActive(route.key);
    this.router.navigateByUrl(route.path);
  }

  isPrimaryRouteActive(route: AppRouteEntry): boolean {
    if (route.key === 'guia-canales') {
      return this.activeKey === 'guia-canales' || this.activeKey === 'en-directo';
    }

    if (route.key === 'que-ver-hoy') {
      return (
        this.activeKey === 'que-ver-hoy' ||
        this.activeKey === 'peliculas' ||
        this.activeKey === 'series'
      );
    }

    return this.activeKey === route.key;
  }

  isSecondaryRouteActive(route: AppRouteEntry): boolean {
    return this.activeKey === route.key;
  }

  getRouteAccent(route: AppRouteEntry): string {
    if (route.key === 'peliculas') return 'Movie';
    if (route.key === 'series') return 'TV';
    if (route.key === 'editorial' || route.key === 'rankings') return 'Editorial';
    if (route.key === 'tendencias') return 'Data';
    if (route.key === 'comparador-streaming') return 'Streaming';
    if (route.key === 'prensa' || route.key === 'sobre-nosotros') return 'Brand';
    if (route.key === 'developers' || route.key === 'embed') return 'Tools';
    return 'Extra';
  }

  toggleMoreMenu(): void {
    this.isMoreMenuOpen = !this.isMoreMenuOpen;
  }

  openSearch(): void {
    this.isMoreMenuOpen = false;
    this.searchRequested.emit();
  }

  openProfile(): void {
    this.isMoreMenuOpen = false;
    this.menuState.setActive('perfil');
    void this.router.navigateByUrl(APP_PATHS.profile);
  }

  formatUnreadCount(count: number | null | undefined): string {
    const safe = Number(count || 0);
    return safe > 99 ? '99+' : String(safe);
  }

  getInitials(name: string | null | undefined): string {
    const safeName = String(name || '').trim();
    if (!safeName) {
      return 'GT';
    }

    return safeName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
