import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { slugify } from 'src/app/utils/utils';
import { first, filter, takeUntil, take } from 'rxjs';
import { Subject } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-lista-destacadas',
  templateUrl: './lista-destacadas.component.html',
  styleUrls: ['./lista-destacadas.component.scss'],
  standalone: true,
  imports: [CommonModule, NavBarComponent],
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

  // Control de carga inicial
  private peliculasCargadas = false;
  private seriesCargadas = false;
  private datosInicializados = false;

  constructor(
    private route: ActivatedRoute,
    private guiaSvc: TvGuideService,
    private http: HttpService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('ListaDestacadas inicializado');

    // Asegurar que empezamos con películas seleccionadas
    this.isPelicula = true;
    this.isSerie = false;

    // Inicializar datos de programación primero
    this.inicializarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los datos de programación necesarios
   */
  private inicializarDatos(): void {
    this.loading = true;

    // Intentar obtener programación actual
    this.http
      .getProgramacion('today')
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (Array.isArray(data) && data.length > 0) {
            this.procesarDatosProgramacion(data);
          } else {
            // Si no hay datos directos, escuchar el observable
            this.escucharProgramas();
          }
        },
        error: (err) => {
          console.error('Error al obtener programación:', err);
          this.escucharProgramas();
        },
      });
  }

  /**
   * Escucha cambios en los programas
   */
  private escucharProgramas(): void {
    this.http.programas$
      .pipe(
        filter((d) => Array.isArray(d) && d.length > 0),
        first(),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.procesarDatosProgramacion(data as any[]);
        },
        error: (err) => {
          console.error('Error en programas$:', err);
          this.loading = false;
          this.error = 'No se pudieron cargar los datos';
        },
      });
  }

  /**
   * Procesa los datos de programación y genera destacados
   */
  private procesarDatosProgramacion(data: any[]): void {
    console.log('Procesando datos de programación:', data.length);

    // Alimentar el servicio con los datos
    this.guiaSvc.setData(data);
    this.datosInicializados = true;

    // Generar listas de destacados
    Promise.all([
      this.guiaSvc.setPeliculasDestacadas(),
      this.guiaSvc.setSeriesDestacadas(),
    ])
      .then(() => {
        console.log('Destacados generados');
        // Ahora sí cargar las películas (que es el modo por defecto)
        this.cargarPeliculasDestacadas();
        // Precargar series en segundo plano
        this.precargarSeriesDestacadas();
      })
      .catch((err) => {
        console.error('Error al generar destacados:', err);
        this.loading = false;
      });
  }

  /**
   * Carga películas destacadas (modo principal)
   */
  private cargarPeliculasDestacadas(): void {
    if (this.peliculasCargadas) {
      this.loading = false;
      return;
    }

    this.guiaSvc
      .getPeliculasDestacadas()
      .pipe(
        filter((data) => Array.isArray(data) && data.length > 0),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.peliculasDestacadas = data || [];
          this.peliculasCargadas = true;
          this.loading = false;
          console.log(
            'Películas destacadas cargadas:',
            this.peliculasDestacadas.length
          );
        },
        error: (err) => {
          console.error('Error al cargar películas:', err);
          this.error = 'Error al cargar películas destacadas';
          this.loading = false;
        },
      });
  }

  /**
   * Precarga series en segundo plano
   */
  private precargarSeriesDestacadas(): void {
    if (this.seriesCargadas) return;

    this.guiaSvc
      .getSeriesDestacadas()
      .pipe(
        filter((data) => Array.isArray(data) && data.length > 0),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.seriesDestacadas = data || [];
          this.seriesCargadas = true;
          console.log(
            'Series destacadas precargadas:',
            this.seriesDestacadas.length
          );
        },
        error: (err) => {
          console.error('Error al precargar series:', err);
        },
      });
  }

  /**
   * Cambia a modo películas
   */
  public getPeliculasAhora(): void {
    console.log('Cambiando a películas');
    this.isPelicula = true;
    this.isSerie = false;

    if (!this.peliculasCargadas) {
      this.loading = true;
      this.cargarPeliculasDestacadas();
    }
  }

  /**
   * Cambia a modo series
   */
  public getSeriesAhora(): void {
    console.log('Cambiando a series');
    this.isPelicula = false;
    this.isSerie = true;

    if (!this.seriesCargadas) {
      this.loading = true;
      this.guiaSvc
        .getSeriesDestacadas()
        .pipe(
          filter((data) => Array.isArray(data) && data.length > 0),
          take(1),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (data) => {
            this.seriesDestacadas = data || [];
            this.seriesCargadas = true;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al cargar series:', err);
            this.error = 'Error al cargar series destacadas';
            this.loading = false;
          },
        });
    }
  }

  // ===== Template Helpers =====

  public trackById(index: number, item: any): any {
    return item?.id || item?.uuid || index;
  }

  public horaInicio(programa: any): string {
    if (!programa) return '';
    const start = programa?.start || programa?.start_time || programa?.time;
    if (!start) return '';
    try {
      const d = new Date(start);
      return d.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return String(start);
    }
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
      this.guiaSvc.setDetallesPrograma(programa);
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
        this.router.navigate(['/programas', slug]);
      }
    } else {
      const slug = slugify(programa?.name || '');
      this.router.navigate(['programacion-tv/ver-canal', slug]);
    }
  }
}
