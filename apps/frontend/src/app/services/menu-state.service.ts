import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PRIMARY_NAV_ROUTES,
  SECONDARY_NAV_ROUTES,
  USER_NAV_ROUTES,
  normalizePath,
} from '../config/route-map';

/**
 * Servicio para compartir el estado del menú entre Header y Menu.
 * Expone la key activa y un array de colores que puede usar el template
 * para pintar los indicadores (incluyendo el naranja de la Home).
 */
@Injectable({ providedIn: 'root' })
export class MenuStateService {
  // key activa del menú (por ejemplo: 'home', 'series', ...)
  private activeKey$ = new BehaviorSubject<string>('home');

  // Mobile menu open state
  private mobileOpen$ = new BehaviorSubject<boolean>(false);

  // array de colores para los items del menú. Por simplicidad el índice
  // no está ligado a la ruta —se usará por key en el template— pero se
  // expone para permitir cambios dinámicos si se desea.
  private colors: Record<string, string> = {
    home: '#ff7a18', // naranja principal para home
    'guia-canales': '#f97316',
    'que-ver-hoy': '#f59e0b',
    plataformas: '#38bdf8',
    series: '#06b6d4',
    peliculas: '#ea580c',
    blog: '#8b5cf6',
    'top-10': '#ef4444',
    'en-directo': '#f43f5e',
    comunidad: '#22c55e',
    'mi-cuenta': '#22c55e',
    'iniciar-sesion': '#0ea5e9',
    registro: '#38bdf8',
  };

  setActive(key: string) {
    if (!key) return;
    this.activeKey$.next(key);
  }

  // Mobile menu controls
  toggleMobile() {
    this.mobileOpen$.next(!this.mobileOpen$.value);
  }

  setMobile(open: boolean) {
    this.mobileOpen$.next(!!open);
  }

  getMobile(): Observable<boolean> {
    return this.mobileOpen$.asObservable();
  }

  getActive(): Observable<string> {
    return this.activeKey$.asObservable();
  }

  getCurrentActive(): string {
    return this.activeKey$.value;
  }

  getColorForKey(key: string): string | undefined {
    return this.colors[key];
  }

  // Permite reemplazar el map de colores si se necesitara.
  setColors(map: Record<string, string>) {
    this.colors = { ...this.colors, ...(map || {}) };
  }

  // Shared routes configuration so Header and Menu use the same source
  public readonly routes = PRIMARY_NAV_ROUTES;
  public readonly secondaryRoutes = SECONDARY_NAV_ROUTES;

  public readonly userRoutes = USER_NAV_ROUTES;

  // Subset intended for the header (mostrar solo lo más destacado)
  public getHeaderRoutes() {
    return this.routes;
  }

  public getSecondaryRoutes() {
    return this.secondaryRoutes;
  }

  public getUserRoutes() {
    return this.userRoutes;
  }

  public resolveActiveKeyFromUrl(url: string): string {
    const path = normalizePath(url);
    const allRoutes = [...this.routes, ...this.secondaryRoutes, ...this.userRoutes];
    const exact = allRoutes.find((route) => normalizePath(route.path) === path);
    if (exact) {
      return exact.key;
    }

    if (
      path.startsWith('/programacion-tv/ver-canal/') ||
      path.startsWith('/ver-canal/')
    ) {
      return 'guia-canales';
    }

    if (path.startsWith('/programacion-tv/series')) {
      return 'series';
    }

    if (path.startsWith('/programacion-tv/peliculas') || path.startsWith('/peliculas/')) {
      return 'peliculas';
    }

    if (
      path.startsWith('/programacion-tv/que-ver-hoy') ||
      path.startsWith('/programas/') ||
      path.startsWith('/contenido/')
    ) {
      return 'que-ver-hoy';
    }

    if (path.startsWith('/plataformas')) {
      return 'plataformas';
    }

    if (path.startsWith('/programacion-tv/en-directo')) {
      return 'en-directo';
    }

    if (path.startsWith('/blog/top10')) {
      return 'top-10';
    }

    if (path.startsWith('/blog')) {
      return 'blog';
    }

    if (path.startsWith('/comunidad')) {
      return 'comunidad';
    }

    if (path.startsWith('/mi-cuenta')) {
      return 'mi-cuenta';
    }

    if (path.startsWith('/iniciar-sesion')) {
      return 'iniciar-sesion';
    }

    if (path.startsWith('/registro')) {
      return 'registro';
    }

    return 'home';
  }
}
