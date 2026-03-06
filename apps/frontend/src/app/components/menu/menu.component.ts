import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AppRouteEntry } from '../../config/route-map';
import { MenuStateService } from '../../services/menu-state.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class MenuComponent implements OnInit, OnDestroy {
  public activeKey = 'home';
  public readonly primaryRoutes = this.menuState.getHeaderRoutes();
  public readonly secondaryRoutes = this.menuState.getSecondaryRoutes();
  public readonly userRoutes = this.menuState.getUserRoutes();
  public readonly isAuthenticated$ = this.userService.isAuthenticated$;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly menuState: MenuStateService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.syncFromUrl(this.router.url);

    this.menuState
      .getActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe((key) => {
        this.activeKey = key || 'home';
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
        this.syncFromUrl(url);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateTo(route: AppRouteEntry): void {
    this.menuState.setActive(route.key);
    this.router.navigateByUrl(route.path).then(() => {
      this.menuState.setMobile(false);
      this.syncFromUrl(this.router.url);
    });
  }

  isActive(route: AppRouteEntry): boolean {
    return this.activeKey === route.key;
  }

  logout(): void {
    this.userService.logout();
    this.menuState.setActive('home');
    this.router.navigateByUrl('/iniciar-sesion');
  }

  private syncFromUrl(url: string): void {
    const key = this.menuState.resolveActiveKeyFromUrl(url);
    this.activeKey = key || 'home';
    this.menuState.setActive(this.activeKey);
  }
}
