import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PRIMARY_NAV_ROUTES,
  RESOURCE_NAV_ROUTES,
  SECONDARY_NAV_ROUTES,
  TOOL_NAV_ROUTES,
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
    deportes: '#22c55e',
    series: '#06b6d4',
    peliculas: '#ea580c',
    editorial: '#8b5cf6',
    rankings: '#ef4444',
    tendencias: '#14b8a6',
    'comparador-streaming': '#38bdf8',
    prensa: '#c084fc',
    'sobre-nosotros': '#f59e0b',
    developers: '#06b6d4',
    embed: '#10b981',
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
  public readonly resourceRoutes = RESOURCE_NAV_ROUTES;
  public readonly toolRoutes = TOOL_NAV_ROUTES;

  public readonly userRoutes = USER_NAV_ROUTES;

  // Subset intended for the header (mostrar solo lo más destacado)
  public getHeaderRoutes() {
    return this.routes;
  }

  public getSecondaryRoutes() {
    return this.secondaryRoutes;
  }

  public getResourceRoutes() {
    return this.resourceRoutes;
  }

  public getToolRoutes() {
    return this.toolRoutes;
  }

  public getUserRoutes() {
    return this.userRoutes;
  }

  public resolveActiveKeyFromUrl(url: string): string {
    const path = normalizePath(url);
    const allRoutes = [
      ...this.routes,
      ...this.secondaryRoutes,
      ...this.resourceRoutes,
      ...this.toolRoutes,
      ...this.userRoutes,
    ];
    const exact = allRoutes.find((route) => normalizePath(route.path) === path);
    if (exact) {
      return exact.key;
    }

    if (
      path.startsWith('/canales/') ||
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
      path.startsWith('/contenido/') ||
      path.startsWith('/programas/')
    ) {
      return 'que-ver-hoy';
    }

    if (path.startsWith('/plataformas')) {
      return 'plataformas';
    }

    if (path.startsWith('/deportes')) {
      return 'deportes';
    }

    if (path.startsWith('/programacion-tv/en-directo')) {
      return 'en-directo';
    }

    if (path.startsWith('/editorial/rankings')) {
      return 'rankings';
    }

    if (path.startsWith('/editorial')) {
      return 'editorial';
    }

    if (path.startsWith('/blog/top10')) {
      return 'rankings';
    }

    if (path.startsWith('/blog')) {
      return 'editorial';
    }

    if (path.startsWith('/tendencias')) {
      return 'tendencias';
    }

    if (path.startsWith('/comparador-streaming')) {
      return 'comparador-streaming';
    }

    if (path.startsWith('/prensa')) {
      return 'prensa';
    }

    if (path.startsWith('/sobre-nosotros')) {
      return 'sobre-nosotros';
    }

    if (path.startsWith('/developers')) {
      return 'developers';
    }

    if (path.startsWith('/embed')) {
      return 'embed';
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
