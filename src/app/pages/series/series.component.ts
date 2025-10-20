import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  ViewChild,
  QueryList,
  ViewChildren,
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
  selector: 'app-series',
  templateUrl: './series.component.html',
  styleUrls: ['./series.component.scss'],
  standalone: true,
  imports: [CommonModule, SliderComponent, NavBarComponent, BannerComponent],
})
export class SeriesComponent implements OnDestroy {
  @ViewChild('sliderComponent23', { static: false })
  sliderComponent23?: SliderComponent;
  @ViewChild('sliderComponent', { static: false })
  sliderComponent?: SliderComponent;
  @ViewChildren('sliderComponent1')
  sliderComponents!: QueryList<SliderComponent>;

  public series: any[] = [];
  public categorias: any[] = [];
  public destacada: any = null;
  public en_emision: any[] = [];
  public isLoading = true;
  // Structured data (JSON-LD) for page + featured series
  public ldJson: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private svcGuide: TvGuideService,
    private http: HttpService,
    private metaSvc: MetaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // SEO mejorado
    this.metaSvc.setMetaTags({
      title: 'Series de TV en España Hoy | Guía Completa de Programación',
      description:
        'Descubre todas las series que se emiten hoy en TV: dramas, comedias, thrillers y más. Guía actualizada de series en televisión española con horarios.',
      canonicalUrl: this.router.url,
      keywords:
        'series tv hoy, series television españa, programacion series, guia tv series',
      ogImage: '/assets/images/series-og.jpg', // Añade una imagen OG si la tienes
    });

    this.loadSeriesData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSeriesData(): void {
    // First, attempt to fetch today's programming directly (useful when landing on this page)
    this.http
      .getProgramacion('today')
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (Array.isArray(data) && data.length > 0) {
            this.manageSeries(data);
            this.isLoading = false;
            return;
          }
          // If direct fetch returned empty, listen to the global programas$ (some other part may populate it)
          this.http.programas$
            .pipe(
              filter((d) => d.length > 0),
              first(),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: (d) => {
                this.manageSeries(d);
                this.isLoading = false;
              },
              error: (err) => {
                console.error(
                  '❌ SERIES - Error al cargar datos desde programas$:',
                  err
                );
                this.isLoading = false;
              },
            });
        },
        error: (error) => {
          console.error('❌ SERIES - Error al llamar getProgramacion:', error);
          // fallback: still try to listen to programas$ in case another loader fills it
          this.http.programas$
            .pipe(
              filter((d) => d.length > 0),
              first(),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: (d) => {
                this.manageSeries(d);
                this.isLoading = false;
              },
              error: (err) => {
                console.error(
                  '❌ SERIES - Error al cargar datos desde programas$ fallback:',
                  err
                );
                this.isLoading = false;
              },
            });
        },
      });
  }

  private manageSeries(data: any[]): void {
    // Performance: procesar datos de forma más eficiente
    const startTime = performance.now();

    this.svcGuide.setData(data);

    // Obtener todas las series de una vez
    this.series = this.svcGuide.getAllSeries();

    // Filtrar series en emisión de forma más eficiente
    this.en_emision = this.series.filter((serie) =>
      isLive(serie.start, serie.stop)
    );

    // Limitar series en emisión para mejor performance inicial
    this.en_emision = this.en_emision.slice(0, 20);

    // Obtener categorías filtradas
    this.categorias = this.svcGuide
      .getSeriesCategories()
      .filter((cat) => cat && cat.toLowerCase().trim() !== 'otros')
      .slice(0, 8); // Limitar a 8 categorías principales

    // Cargar destacada de forma asíncrona
    this.loadDestacada();

    const endTime = performance.now();
    console.log(
      `⚡ SERIES - Procesamiento completado en ${(endTime - startTime).toFixed(
        2
      )}ms`
    );
  }

  private loadDestacada(): void {
    // Ensure the service has attempted to load featured series (if Home or other pages
    // didn't trigger it). `setSeriesDestacadas` is idempotent / guarded internally so
    // it's safe to call here and will avoid missing featured items.
    try {
      this.svcGuide.setSeriesDestacadas();
    } catch (e) {
      // ignore - service is defensive
    }

    this.svcGuide
      .getSeriesDestacadas()
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.destacada = data?.[0] || null;
          // Build JSON-LD and update meta tags similar to Películas page
          try {
            const pageName = 'Series en televisión';
            const pageDescription =
              'Guía actualizada de series en televisión en España: horarios, canales y detalles de emisión.';

            const pageLd: any = {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: pageName,
              description: pageDescription,
              url: this.router.url,
            };

            if (this.destacada) {
              const title =
                this.destacada?.title?.value || this.destacada?.name;
              const description =
                this.destacada?.description ||
                this.destacada?.title?.subtitle ||
                pageDescription;
              const image =
                this.destacada?.image ||
                this.destacada?.poster ||
                this.destacada?.thumb ||
                '/assets/images/series-og.jpg';

              const seriesLd: any = {
                '@type': 'TVSeries',
                name: title,
                description,
                image,
              };

              pageLd.mainEntity = seriesLd;

              // Update meta tags to reflect featured series
              this.metaSvc.setMetaTags({
                title: `${title} — Series en TV | Guía TV`,
                description,
                canonicalUrl: this.router.url,
                keywords: `serie ${title}, series tv, ${title} tv`,
                ogImage: image,
              });
            }

            this.ldJson = JSON.stringify(pageLd, null, 2);
          } catch (e) {
            this.ldJson = '';
          }
        },
        error: (err) =>
          console.warn('⚠️ No se pudo cargar serie destacada:', err),
      });
  }

  public getSeriesByCategory(categoria: string): any[] {
    // Limitar resultados por categoría para mejor performance
    return this.svcGuide.getSeriesByCategory(categoria).slice(0, 15);
  }

  // Método para lazy loading de categorías adicionales si es necesario
  public loadMoreCategories(): void {
    // Implementar si se necesita carga progresiva
  }

  /**
   * TrackBy function para optimizar el rendering de categorías
   * Evita re-renderizados innecesarios cuando los datos no cambian
   */
  public trackByCategory(index: number, categoria: string): string {
    return categoria;
  }
}
