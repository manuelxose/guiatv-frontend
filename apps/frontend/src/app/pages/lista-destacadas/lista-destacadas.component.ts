import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { slugify } from 'src/app/utils/utils';
import { forkJoin, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { CardListComponent } from 'src/app/components/card-list/card-list.component';
import { getHoraInicio } from 'src/app/utils/utils';
import { DiscoveryService } from 'src/app/services/discovery.service';

@Component({
  selector: 'app-lista-destacadas',
  templateUrl: './lista-destacadas.component.html',
  styleUrls: ['./lista-destacadas.component.scss'],
  standalone: true,
  imports: [CommonModule, CardListComponent],
})
export class ListaDestacadasComponent implements OnInit, OnDestroy {
  // Separar arrays para películas y series
  public peliculasDestacadas: any[] = [];
  public seriesDestacadas: any[] = [];

  // Por defecto mostrar películas destacadas (inicializar correctamente)
  public isPelicula: boolean = true;
  public isSerie: boolean = false;

  // UI helpers
  public loading: boolean = false;
  public error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private discoveryService: DiscoveryService,
    private router: Router
  ) {}

  ngOnInit() {
    // Asegurar que empezamos con películas seleccionadas
    this.isPelicula = true;
    this.isSerie = false;

    this.cargarDestacados();
  }

  public goToDetails(item: any): void {
    const title =
      (item?.title && item.title.value) || item?.title || 'contenido';
    const slug = slugify(title);
    // Navegar segun si es pelicula o serie destacada
    this.router.navigate(
      this.isPelicula ? ['/peliculas', slug] : ['/series', slug],
      { state: { item } }
    );
  }

  public horaInicio(item: any): string {
    try {
      const start =
        item?.start || item?.startDate || item?.date || item?.start_time;
      if (!start) return '';
      return getHoraInicio(start);
    } catch {
      return '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDestacados(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      peliculas: this.discoveryService.browse({
        type: 'movie',
        limit: 12,
        sort: 'popular',
      }),
      series: this.discoveryService.browse({
        type: 'series',
        limit: 12,
        sort: 'popular',
      }),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ peliculas, series }) => {
          this.peliculasDestacadas = peliculas.items || [];
          this.seriesDestacadas = series.items || [];
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar los destacados';
          this.loading = false;
        },
      });
  }

  /**
   * Cambia a modo películas
   */
  public getPeliculasAhora(): void {
    this.isPelicula = true;
    this.isSerie = false;
  }

  /**
   * Cambia a modo series
   */
  public getSeriesAhora(): void {
    this.isPelicula = false;
    this.isSerie = true;
  }

  // ===== Template Helpers =====

  public trackById(index: number, item: any): any {
    return item?.id || item?.uuid || index;
  }

  public getChannelName(programa: any): string {
    if (!programa) return 'Canal desconocido';
    const ch =
      programa.channel ??
      programa.network ??
      programa.channelName ??
      programa?.channel?.name;
    if (!ch) return 'Canal desconocido';
    if (typeof ch === 'string') return ch;
    if (typeof ch === 'object') {
      return (ch.name || ch.title || ch.label || ch.id || 'Canal').toString();
    }
    return String(ch);
  }

  public getCategory(programa: any): string {
    const cat = programa?.category ?? programa?.category?.value;
    if (!cat) return '';
    let raw = '';
    if (typeof cat === 'string') raw = cat;
    else if (Array.isArray(cat)) raw = cat.join(',');
    else if (typeof cat === 'object')
      raw = cat.value || cat.name || Object.values(cat).join(',');
    else raw = String(cat);
    const parts = raw.split(',');
    return (parts[1]?.trim() || parts[0]?.trim() || '').toString();
  }

  public onLogoError(event: any, item: any): void {
    const img: HTMLImageElement = event?.target;
    if (img) {
      // Set a neutral fallback channel logo from assets so layout remains intact
      img.src = '/assets/images/channels/antena3.svg';
      img.alt = (this.getChannelName(item) || 'Canal') + ' logo';
    }
  }

  /**
   * Abre la ficha completa del programa (misma lógica que en Slider.manageData)
   */
  public openDetails(programa: any): void {
    if (!programa) return;
    if (programa?.channel) {
      const title = (programa?.title?.value || programa?.name || '').trim();
      const slug = slugify(title);

      // Si el componente está mostrando películas (modo por defecto en esta página),
      // siempre navegar a la ruta de detalle de película para mantener coherencia UX.
      if (this.isPelicula) {
        this.router.navigate(['/peliculas', slug]);
        return;
      }

      const cat = programa?.category || programa?.category?.value || '';
      const looksLikeMovie =
        (typeof cat === 'string' && cat.startsWith('Cine')) ||
        !!programa?.poster ||
        !!programa?.tmdbId;
      if (looksLikeMovie) {
        this.router.navigate(['/peliculas', slug]);
      } else {
        this.router.navigate(['/series', slug]);
      }
    } else {
      const slug = slugify(programa?.name || '');
      this.router.navigate(['/canales', slug]);
    }
  }
}
