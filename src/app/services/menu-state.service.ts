import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
    series: '#06b6d4',
    peliculas: '#ea580c',
    blog: '#8b5cf6',
    'top-10': '#ef4444',
    'en-directo': '#f43f5e',
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
  public readonly routes = [
    { label: 'Inicio', path: '/', key: 'home' },
    { label: 'Guía canales', path: '/guia-canales', key: 'guia-canales' },
    { label: 'Qué ver hoy', path: '/que-ver-hoy', key: 'que-ver-hoy' },
    { label: 'Series', path: '/series', key: 'series' },
    { label: 'Películas', path: '/peliculas', key: 'peliculas' },
    { label: 'Blog', path: '/blog', key: 'blog' },
    { label: 'Top 10', path: '/top-10', key: 'top-10' },
    { label: 'En directo', path: '/en-directo', key: 'en-directo' },
  ];

  // Subset intended for the header (mostrar solo lo más destacado)
  public getHeaderRoutes() {
    // Puede devolver un subconjunto estático o calcularlo dinámicamente
    return [
      this.routes.find((r) => r.key === 'home')!,
      this.routes.find((r) => r.key === 'guia-canales')!,
      this.routes.find((r) => r.key === 'que-ver-hoy')!,
      this.routes.find((r) => r.key === 'blog')!,
      this.routes.find((r) => r.key === 'en-directo')!,
    ];
  }
}
