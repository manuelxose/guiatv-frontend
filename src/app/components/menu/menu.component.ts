import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TvGuideService } from '../../services/tv-guide.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class MenuComponent implements OnInit, OnDestroy {
  public isHome: boolean = false;
  public isGuiaCanales: boolean = false;
  public isSeries: boolean = false;
  public isPeliculas: boolean = false;
  public hoy: boolean = false;
  public top: boolean = false;
  public isDirecto: boolean = false;

  // rutas expuestas al template
  public readonly routes = [
    { label: 'Inicio', path: '/', key: 'home' },
    {
      label: 'Guía canales',
      path: '/guia-canales',
      key: 'guia-canales',
    },
    {
      label: 'Qué ver hoy',
      path: '/programacion-tv/que-ver-hoy',
      key: 'que-ver-hoy',
    },
    { label: 'Series', path: '/series', key: 'series' },
    { label: 'Películas', path: '/peliculas', key: 'peliculas' },
    { label: 'Top 10', path: '/top-10', key: 'top-10' },
    { label: 'En directo', path: '/en-directo', key: 'en-directo' },
  ];

  private unsuscribe$ = new Subject<void>();

  constructor(public router: Router, private guiaTvService: TvGuideService) {}

  ngOnInit(): void {
    // Inicializar flags según la URL actual
    this.setActiveFromUrl(this.router.url);

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
    this.isHome = false;
    this.isGuiaCanales = false;
    this.isSeries = false;
    this.isPeliculas = false;
    this.top = false;
    this.hoy = false;
    this.isDirecto = false;
  }

  public navigateTo(): void {
    this.navigate('/programacion-tv/que-ver-hoy', 'que-ver-hoy');
  }

  private setActiveFromUrl(url: string): void {
    this.resetFlags();

    // obtener segmentos no vacíos y tomar el último segmento como clave
    const parts = (url || '').split('/').filter(Boolean);
    const key = parts.length ? parts[parts.length - 1] : 'home';

    switch (key) {
      case 'home':
        this.isHome = true;
        break;
      case 'guia-canales':
        this.isGuiaCanales = true;
        break;
      case 'series':
        this.isSeries = true;
        break;
      case 'peliculas':
        this.isPeliculas = true;
        break;
      case 'que-ver-hoy':
        this.hoy = true;
        break;
      case 'top-10':
        this.top = true;
        break;
      case 'en-directo':
        this.isDirecto = true;
        break;
      default:
        if (!parts.length) this.isHome = true;
        break;
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
    });
  }
}
