import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { MenuStateService } from '../../services/menu-state.service';
import { UserService } from '../../services/user.service';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';
import { APP_PATHS, AppRouteEntry } from '../../config/route-map';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, AutocompleteComponent],
})
export class NavBarComponent implements OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly isAuthenticated$ = this.userService.isAuthenticated$;
  public readonly headerRoutes = this.menuState.getHeaderRoutes().filter(Boolean);
  public activeKey = this.menuState.getCurrentActive();

  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly router: Router,
    public readonly menuState: MenuStateService,
    private readonly userService: UserService
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
    this.menuState.setActive(route.key);
    this.router.navigateByUrl(route.path);
  }

  isActive(route: AppRouteEntry): boolean {
    return this.activeKey === route.key;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
