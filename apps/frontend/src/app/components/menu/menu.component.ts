import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MenuStateService } from '../../services/menu-state.service';
import { TvGuideService } from '../../services/tv-guide.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class MenuComponent implements OnInit, OnDestroy {
  public activeKey: string = 'home';
  public routes = this.menuState.routes;
  public userRoutes = this.menuState.getUserRoutes();
  public isAuthenticated$ = this.userService.isAuthenticated$;

  private unsuscribe$ = new Subject<void>();

  constructor(
    public router: Router,
    private guiaTvService: TvGuideService,
    private menuState: MenuStateService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Sincroniza estado inicial según la URL
    this.setActiveFromUrl(this.router.url);

    // Suscribirse al estado global del menú
    this.menuState
      .getActive()
      .pipe(takeUntil(this.unsuscribe$))
      .subscribe((key) => {
        if (key) this.activeKey = key;
      });

    // Escuchar cambios del router para mantener el estado activo
    this.router.events.pipe(takeUntil(this.unsuscribe$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setActiveFromUrl(event.urlAfterRedirects || event.url);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsuscribe$.next();
    this.unsuscribe$.complete();
  }

  public navigateTo(): void {
    this.navigate('/programacion-tv/que-ver-hoy', 'que-ver-hoy');
  }

  private setActiveFromUrl(url: string): void {
    const key = this.menuState.resolveActiveKeyFromUrl(url);
    this.activeKey = key || 'home';
    this.menuState.setActive(this.activeKey);

    if (this.activeKey === 'peliculas') {
      this.guiaTvService.setIsMovies();
    } else if (this.activeKey === 'series') {
      this.guiaTvService.setIsSeries();
    }
  }

  /**
   * Navega a la ruta absoluta y sincroniza estado.
   */
  public navigate(path: string, key?: string): void {
    if (key === 'peliculas') {
      this.guiaTvService.setIsMovies();
    } else if (key === 'series') {
      this.guiaTvService.setIsSeries();
    }

    this.router.navigateByUrl(path).then(() => {
      this.menuState.setMobile(false);
      this.setActiveFromUrl(this.router.url);
      if (key) this.menuState.setActive(key);
    });
  }

  /**
   * Handler para las entradas del menú.
   */
  public onItemClick(path: string, key?: string): void {
    this.navigate(path, key);
  }

  public isActive(key: string): boolean {
    return !!key && this.activeKey === key;
  }

  public getColor(key: string): string | undefined {
    return this.menuState.getColorForKey(key);
  }

  public logout(): void {
    this.userService.logout();
    this.menuState.setActive('home');
    this.router.navigateByUrl('/iniciar-sesion');
  }
}
