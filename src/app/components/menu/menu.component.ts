import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TvGuideService } from '../../services/tv-guide.service';
import { MenuStateService } from '../../services/menu-state.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class MenuComponent implements OnInit, OnDestroy {
  // estado activo (clave) compartido vía servicio
  public activeKey: string = 'home';

  // rutas expuestas al template (compartidas desde el servicio)
  public get routes() {
    return this.menuState.routes;
  }

  private unsuscribe$ = new Subject<void>();

  constructor(
    public router: Router,
    private guiaTvService: TvGuideService,
    private menuState: MenuStateService
  ) {}

  ngOnInit(): void {
    // Inicializar flags según la URL actual
    this.setActiveFromUrl(this.router.url);

    // suscribirse al estado global del menú
    this.menuState
      .getActive()
      .pipe(takeUntil(this.unsuscribe$))
      .subscribe((k) => {
        if (k) this.activeKey = k;
      });

    // Suscribirse a los eventos del router para actualizar en cambios posteriores
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

  private resetFlags(): void {
    this.activeKey = '';
  }

  public navigateTo(): void {
    this.navigate('/programacion-tv/que-ver-hoy', 'que-ver-hoy');
  }

  private setActiveFromUrl(url: string): void {
    // obtener segmentos no vacíos y tomar el último segmento como clave
    const parts = (url || '').split('/').filter(Boolean);
    const key = parts.length ? parts[parts.length - 1] : 'home';

    this.activeKey = key || 'home';

    // actualizar estado compartido
    this.menuState.setActive(this.activeKey);

    // Actualizar flags del servicio de guía para películas/series si corresponde
    if (this.activeKey === 'peliculas') {
      this.guiaTvService.setIsMovies();
    } else if (this.activeKey === 'series') {
      this.guiaTvService.setIsSeries();
    }
  }

  /**
   * Navega a la ruta absoluta y actualiza flags.
   * Usar desde template: (click)="navigate(r.path, r.key)"
   */
  public navigate(path: string, key?: string): void {
    // llamadas de negocio específicas por ruta (opcional)
    if (key === 'peliculas') {
      this.guiaTvService.setIsMovies();
    }

    // navegar con path absoluto y actualizar estado al completar
    this.router.navigateByUrl(path).then(() => {
      // forzar sync del estado activo con la nueva URL
      this.setActiveFromUrl(this.router.url);
      if (key) this.menuState.setActive(key);
    });
  }

  /**
   * Handler usado desde la plantilla mejorada: navega y aplica efectos secundarios
   */
  public onItemClick(path: string, key?: string): void {
    // mantener comportamiento previo (movies/series flags)
    if (key === 'peliculas') {
      this.guiaTvService.setIsMovies();
    } else if (key === 'series') {
      this.guiaTvService.setIsSeries();
    }

    // delegar en navigate para navegación y sincronización de estado
    this.navigate(path, key);
  }

  // helper usado desde template
  public isActive(key: string): boolean {
    return !!key && this.activeKey === key;
  }

  public getColor(key: string): string | undefined {
    return this.menuState.getColorForKey(key);
  }
}
