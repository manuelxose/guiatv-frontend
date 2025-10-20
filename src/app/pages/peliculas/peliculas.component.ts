import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { first, filter, takeUntil, Subject } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';

@Component({
  selector: 'app-peliculas',
  templateUrl: './peliculas.component.html',
  styleUrls: ['./peliculas.component.scss'],
  standalone: true,
  imports: [SliderComponent, CommonModule, BannerComponent, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimización de detección de cambios
})
export class PeliculasComponent implements OnInit, OnDestroy {
  @ViewChild('enEmisionSlider', { static: false })
  enEmisionSlider?: SliderComponent;

  @ViewChild('allSlider', { static: false })
  allSlider?: SliderComponent;

  public peliculas: any[] = [];
  public categorias: string[] = [];
  public destacada: any = null;
  public en_emision: any[] = [];
  public isLoading = true;
  public ldJson: string = '';
  // Debug payload to show in UI when console is not visible
  public debugPayload: any = null;

  // Cache de películas por categoría para evitar recalcular
  private peliculasPorCategoria = new Map<string, any[]>();

  private destroy$ = new Subject<void>();

  constructor(
    private svcGuide: TvGuideService,
    private http: HttpService,
    private metaSvc: MetaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // SEO optimizado
    this.metaSvc.setMetaTags({
      title: 'Películas en TV Hoy | Cartelera Completa de Televisión España',
      description:
        'Encuentra las mejores películas que se emiten hoy en televisión española: estrenos, clásicos, acción, comedia, drama y más. Guía actualizada con horarios.',
      canonicalUrl: this.router.url,
      keywords:
        'peliculas tv hoy, peliculas television, cartelera tv, cine en television españa',
      ogImage: '/assets/images/peliculas-og.jpg',
    });

    this.loadPeliculasData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Limpiar cache
    this.peliculasPorCategoria.clear();
  }

  private loadPeliculasData(): void {
    const loadStartTime = performance.now();

    console.log('PeliculasComponent: starting loadPeliculasData');

    this.http
      .getProgramacion('today')
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log(
            'PeliculasComponent: getProgramacion next. received:',
            Array.isArray(data) ? data.length : typeof data
          );
          if (Array.isArray(data) && data.length > 0) {
            this.manageMovies(data);
            const loadEndTime = performance.now();
            console.log(
              `⚡ Películas cargadas en ${(loadEndTime - loadStartTime).toFixed(
                2
              )}ms`
            );
            return;
          }

          // Fallback: escuchar programas$
          console.log(
            'PeliculasComponent: getProgramacion returned empty, subscribing to programas$ fallback'
          );
          this.http.programas$
            .pipe(
              filter((d) => d.length > 0),
              first(),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: (d) => {
                console.log(
                  'PeliculasComponent: programas$ fallback next. received:',
                  Array.isArray(d) ? d.length : typeof d
                );
                this.manageMovies(d);
                const loadEndTime = performance.now();
                console.log(
                  `⚡ Películas cargadas (fallback) en ${(
                    loadEndTime - loadStartTime
                  ).toFixed(2)}ms`
                );
              },
              error: (err) => {
                console.error('❌ Error al cargar datos:', err);
                this.isLoading = false;
                this.cdr.markForCheck();
              },
            });
        },
        error: (error) => {
          console.error('❌ Error al llamar getProgramacion:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private manageMovies(data: any[]): void {
    console.log(
      'PeliculasComponent: manageMovies called with data length:',
      Array.isArray(data) ? data.length : typeof data
    );
    if (Array.isArray(data) && data.length > 0) {
      console.log('PeliculasComponent: sample raw data[0]:', data[0]);
    }
    const startTime = performance.now();

    // Paso 1: Alimentar el servicio
    console.log('PeliculasComponent: setting data into TvGuideService');
    this.svcGuide.setData(data);

    // Paso 2: Obtener todas las películas (más rápido que filtrar manualmente)
    const allMovies = this.svcGuide.getAllMovies();

    // Paso 3: Filtrado y procesamiento optimizado
    const validMovies: any[] = [];
    const liveMovies: any[] = [];
    const now = Date.now();

    for (const movie of allMovies) {
      // Filtrar películas válidas
      const title = movie?.title?.value;
      if (!title || title.toLowerCase().trim() === 'cine') continue;

      validMovies.push(movie);

      // Verificar si está en emisión (optimizado)
      if (movie.start && movie.stop) {
        const startTime = new Date(movie.start).getTime();
        const stopTime = new Date(movie.stop).getTime();

        if (startTime <= now && now <= stopTime) {
          liveMovies.push(movie);
        }
      }
    }

    // Paso 4: Asignar resultados (limitar para mejor performance inicial)
    this.peliculas = validMovies;
    this.en_emision = liveMovies.slice(0, 15); // Reducir a 15 para carga más rápida

    // DEBUG: log the data we send to the sliders (counts + first few items)
    try {
      console.group('PeliculasComponent -> slider data');
      console.log('peliculas.count', this.peliculas.length);
      console.log('peliculas.sample', this.peliculas.slice(0, 3));
      console.log('en_emision.count', this.en_emision.length);
      console.log('en_emision.sample', this.en_emision.slice(0, 3));
      console.groupEnd();
    } catch (e) {
      console.log('PeliculasComponent debug log error', e);
    }

    // Also expose a debug object to the UI so the developer can inspect without the console
    try {
      this.debugPayload = {
        peliculasCount: this.peliculas.length,
        peliculasSample: this.peliculas.slice(0, 3),
        enEmisionCount: this.en_emision.length,
        enEmisionSample: this.en_emision.slice(0, 3),
        rawFirst: Array.isArray(data) && data.length > 0 ? data[0] : null,
      };
      this.cdr.markForCheck();
    } catch (_) {
      // ignore
    }

    // Paso 5: Obtener categorías (filtradas y limitadas)
    const rawCategories = this.svcGuide.getMoviesCategories();
    this.categorias = rawCategories
      .filter((cat) => cat && cat.toLowerCase().trim() !== 'otros')
      .slice(0, 6); // Reducir a 6 categorías para carga más rápida

    // Paso 6: Pre-cachear las primeras categorías de forma lazy
    requestIdleCallback(
      () => {
        this.precacheCategorias();
      },
      { timeout: 2000 }
    );

    // Paso 7: Cargar destacada (no bloquear)
    this.loadDestacada();

    // Marcar como no loading
    this.isLoading = false;
    this.cdr.markForCheck();

    const endTime = performance.now();
    console.log(
      `⚡ Procesamiento de películas: ${(endTime - startTime).toFixed(2)}ms`
    );
    console.log(
      `📊 Total películas: ${validMovies.length}, En emisión: ${liveMovies.length}`
    );
  }

  private precacheCategorias(): void {
    // Pre-cachear solo las primeras 3 categorías
    for (let i = 0; i < Math.min(3, this.categorias.length); i++) {
      const cat = this.categorias[i];
      if (!this.peliculasPorCategoria.has(cat)) {
        const movies = this.svcGuide.getMoviesByCategory(cat).slice(0, 12);
        this.peliculasPorCategoria.set(cat, movies);
      }
    }
  }

  private loadDestacada(): void {
    // Usar setTimeout para no bloquear el render inicial
    setTimeout(() => {
      this.svcGuide
        .getPeliculasDestacadas()
        .pipe(first(), takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.destacada = data?.[0] || this.peliculas[0] || null;

            // Generar JSON-LD
            if (this.destacada) {
              this.generateJsonLd();
            }

            this.cdr.markForCheck();
          },
          error: (err) => {
            console.warn('⚠️ No se pudo cargar película destacada:', err);
            this.destacada = this.peliculas[0] || null;
            this.cdr.markForCheck();
          },
        });
    }, 100);
  }

  private generateJsonLd(): void {
    try {
      const title = this.destacada?.title?.value || this.destacada?.name;
      const description =
        this.destacada?.description ||
        this.destacada?.title?.subtitle ||
        'Guía de películas en televisión';
      const image =
        this.destacada?.image ||
        this.destacada?.poster ||
        '/assets/images/peliculas-og.jpg';

      const pageLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Películas en televisión',
        description: 'Guía actualizada de películas en televisión en España',
        url: this.router.url,
        mainEntity: {
          '@type': 'Movie',
          name: title,
          description,
          image,
        },
      };

      this.ldJson = JSON.stringify(pageLd);

      // Actualizar meta tags
      this.metaSvc.setMetaTags({
        title: `${title} — Películas en TV | Guía TV`,
        description,
        canonicalUrl: this.router.url,
        keywords: `pelicula ${title}, peliculas tv, ${title} tv`,
        ogImage: image,
      });
    } catch (e) {
      this.ldJson = '';
    }
  }

  public getPeliculasByCategory(categoria: string): any[] {
    // Usar cache si existe
    if (this.peliculasPorCategoria.has(categoria)) {
      return this.peliculasPorCategoria.get(categoria)!;
    }

    // Si no está en cache, obtener y cachear
    const movies = this.svcGuide.getMoviesByCategory(categoria).slice(0, 12);
    this.peliculasPorCategoria.set(categoria, movies);

    return movies;
  }

  // TrackBy optimizado
  public trackByCategory(index: number, categoria: string): string {
    return categoria;
  }

  // TrackBy para películas (si se necesita en el template)
  public trackByMovie(index: number, movie: any): string {
    return movie?.id || movie?.uuid || `${movie?.title?.value}-${index}`;
  }
}

// Polyfill para requestIdleCallback si no existe
declare const requestIdleCallback: (
  callback: () => void,
  options?: { timeout: number }
) => number;

if (typeof requestIdleCallback === 'undefined') {
  (window as any).requestIdleCallback = (cb: () => void) => setTimeout(cb, 1);
}
