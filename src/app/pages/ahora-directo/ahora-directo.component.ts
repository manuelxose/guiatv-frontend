import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { first, filter, takeUntil, Subject } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive, getHoraInicio } from 'src/app/utils/utils';

@Component({
  selector: 'app-ahora-directo',
  standalone: true,
  imports: [CommonModule, NavBarComponent, BannerComponent],
  templateUrl: './ahora-directo.component.html',
  styleUrls: ['./ahora-directo.component.scss'],
})
export class AhoraDirectoComponent implements OnInit, OnDestroy {
  // UI state
  public isPelicula = true;
  public isSerie = false;
  public loading = true;
  public error: string | null = null;

  // Data arrays
  public programs: any[] = [];
  public peliculas_live: any[] = [];
  public series_live: any[] = [];

  // JSON-LD structured data
  public ldJson: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpService,
    private svcGuide: TvGuideService,
    private metaSvc: MetaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // SEO optimizado
    this.metaSvc.setMetaTags({
      title: 'En Directo Ahora | Películas y Series en TV España',
      description:
        'Descubre qué se emite ahora mismo en la televisión española. Películas, series y programas en directo con información actualizada en tiempo real.',
      canonicalUrl: this.router.url,
      keywords:
        'tv en directo, peliculas ahora, series ahora, television en vivo españa',
      ogImage: '/assets/images/directo-og.jpg',
    });

    this.buildJsonLd();
    this.loadProgramData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Build JSON-LD structured data for SEO
   */
  private buildJsonLd(): void {
    try {
      const pageLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Programación en Directo | TV España',
        description:
          'Guía de programación en directo de televisión en España: películas, series y programas que se emiten ahora mismo.',
        url: this.router.url,
        inLanguage: 'es-ES',
        isPartOf: {
          '@type': 'WebSite',
          name: 'Guía TV España',
          url: window.location.origin,
        },
      };

      this.ldJson = JSON.stringify(pageLd, null, 2);
    } catch (e) {
      this.ldJson = '';
    }
  }

  /**
   * Load program data from cache or fetch from API
   */
  private loadProgramData(): void {
    // Performance tracking
    const startTime = performance.now();

    this.http
      .getProgramacion('today')
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (this.isValidData(data)) {
            this.processPrograms(data);
            this.logPerformance(startTime);
          } else {
            this.waitForObservableFallback();
          }
        },
        error: (err) => {
          this.handleError(err);
          this.waitForObservableFallback();
        },
      });
  }

  /**
   * Wait for programas$ observable to emit valid data (fallback)
   */
  private waitForObservableFallback(): void {
    this.http.programas$
      .pipe(
        filter((p) => this.isValidData(p)),
        first(),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (programs) => {
          this.processPrograms(programs);
          this.loading = false;
        },
        error: (err) => {
          this.handleError(err);
          this.loading = false;
        },
      });
  }

  /**
   * Process programs and extract live content
   */
  private processPrograms(programs: any[]): void {
    try {
      this.svcGuide.setData(programs);
      this.extractLivePrograms();
      this.error = null;
    } catch (err) {
      this.handleError(err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Extract live movies and series from programs
   * Optimized for performance with single-pass filtering
   */
  private extractLivePrograms(): void {
    // Reset arrays
    this.peliculas_live = [];
    this.series_live = [];

    // Get all movies and filter live ones
    const allMovies = this.svcGuide.getAllMovies();
    this.peliculas_live = allMovies.filter((movie) => {
      // Filter out invalid entries
      if (
        !movie?.title?.value ||
        movie.title.value.toLowerCase().trim() === 'cine'
      ) {
        return false;
      }
      return isLive(movie.start, movie.stop);
    });

    // Get all series and filter live ones
    const allSeries = this.svcGuide.getAllSeries();
    this.series_live = allSeries.filter((serie) => {
      return isLive(serie.start, serie.stop);
    });

    // Limit results for better initial performance
    this.peliculas_live = this.peliculas_live.slice(0, 30);
    this.series_live = this.series_live.slice(0, 30);

    // Set default view to movies
    this.programs = [...this.peliculas_live];
  }

  /**
   * Switch to movies view
   */
  public getPeliculasAhora(): void {
    if (this.isPelicula) return; // Already showing movies

    this.isPelicula = true;
    this.isSerie = false;
    this.programs = [...this.peliculas_live];

    // Update meta for better UX
    this.metaSvc.setMetaTags({
      title: 'Películas en Directo Ahora | TV España',
      description: `${this.peliculas_live.length} películas emitiéndose ahora mismo en televisión española.`,
    });
  }

  /**
   * Switch to series view
   */
  public getSeriesAhora(): void {
    if (this.isSerie) return; // Already showing series

    this.isPelicula = false;
    this.isSerie = true;
    this.programs = [...this.series_live];

    // Update meta for better UX
    this.metaSvc.setMetaTags({
      title: 'Series en Directo Ahora | TV España',
      description: `${this.series_live.length} series emitiéndose ahora mismo en televisión española.`,
    });
  }

  /**
   * Get formatted start time from program
   */
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

  /**
   * Handle logo error - fallback to placeholder
   */
  public onLogoError(event: Event, programa: any): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.dataset['errorHandled']) {
      img.dataset['errorHandled'] = 'true';
      // Fallback to a placeholder or hide
      img.style.display = 'none';
    }
  }

  /**
   * TrackBy function for ngFor performance
   */
  public trackById(index: number, item: any): any {
    return item?.id || item?.channelId || item?.start || index;
  }

  /**
   * Validate if data is an array with content
   */
  private isValidData(data: any): boolean {
    return Array.isArray(data) && data.length > 0;
  }

  /**
   * Handle errors with user-friendly messages
   */
  private handleError(err: any): void {
    console.error('❌ AHORA-DIRECTO - Error:', err);
    this.error =
      'No se pudo cargar la programación en directo. Intenta recargar la página.';
    this.loading = false;
  }

  /**
   * Log performance metrics
   */
  private logPerformance(startTime: number): void {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(
      `⚡ AHORA-DIRECTO - Datos procesados en ${duration}ms | Películas: ${this.peliculas_live.length} | Series: ${this.series_live.length}`
    );
  }
}
