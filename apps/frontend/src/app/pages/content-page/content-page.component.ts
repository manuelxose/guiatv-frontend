import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router, RouterModule } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { CatalogCardComponent } from '../../components/catalog-card/catalog-card.component';
import { CatalogFiltersComponent } from '../../components/catalog-filters/catalog-filters.component';
import { CatalogRailComponent } from '../../components/catalog-rail/catalog-rail.component';
import { APP_PATHS } from '../../config/route-map';
import {
  CatalogContentType,
  CatalogItem,
  CatalogPlatform,
  CatalogQuery,
  CatalogResponse,
  CatalogService,
  FALLBACK_CATALOG_GENRES,
} from '../../services/catalog.service';
import { CatalogFiltersService } from '../../services/catalog-filters.service';
import { MetaService } from '../../services/meta.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { FaqSectionComponent, FaqItem } from '../../components/faq-section/faq-section.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

type ContentPageType = 'series' | 'movies';

@Component({
  selector: 'app-content-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CatalogFiltersComponent,
    CatalogCardComponent,
    CatalogRailComponent,
    BreadcrumbComponent,
    FaqSectionComponent,
  ],
  templateUrl: './content-page.component.html',
  styleUrls: ['./content-page.component.scss'],
})
export class ContentPageComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public contentType: ContentPageType = 'movies';
  public loading = true;
  public error: string | null = null;
  public degradedFilters = false;
  public degradedMessage: string | null = null;
  public catalogUnavailable = false;
  public filters: CatalogQuery = {};
  public items: CatalogItem[] = [];
  public liveItems: CatalogItem[] = [];
  public genres: string[] = [];
  public platforms: CatalogPlatform[] = [];
  public hasMore = false;
  public total = 0;
  public breadcrumbItems: BreadcrumbItem[] = [];
  public safeLdHtml: SafeHtml | null = null;

  public readonly moviesFaq: FaqItem[] = [
    {
      question: '¿Dónde puedo ver películas gratis en España?',
      answer: 'Canales de TDT como Antena 3, Telecinco, La 1, Atrescine y DePelícula emiten películas a diario sin coste. También existen plataformas de streaming gratuitas con publicidad como Pluto TV y Rakuten TV.',
    },
    {
      question: '¿Cómo sé en qué plataforma está disponible una película?',
      answer: 'Cada ficha de película muestra las plataformas donde está disponible, ya sea en streaming, alquiler o emisión lineal. Puedes filtrar por plataforma para ver solo el catálogo que te interese.',
    },
    {
      question: '¿Puedo filtrar por género o plataforma de streaming?',
      answer: 'Sí. Usa los filtros de esta página para seleccionar el género (acción, comedia, drama, thriller…) y la plataforma (Netflix, Prime Video, Disney+, Movistar+ y más).',
    },
    {
      question: '¿Qué películas se emiten hoy en televisión?',
      answer: 'En la sección «En directo» de esta página puedes ver las películas que se están emitiendo ahora mismo en los canales de televisión españoles.',
    },
  ];

  public readonly seriesFaq: FaqItem[] = [
    {
      question: '¿Dónde puedo ver series en streaming en España?',
      answer: 'Las principales plataformas son Netflix, HBO Max, Disney+, Amazon Prime Video, Movistar Plus+, Atresplayer y RTVE Play. Cada una ofrece catálogos diferentes con series originales y de producción internacional.',
    },
    {
      question: '¿Cómo encuentro series según mis gustos?',
      answer: 'Utiliza los filtros de esta página: selecciona tu género favorito (drama, comedia, thriller, ciencia ficción…) y la plataforma que prefieras. También puedes ordenar por popularidad o valoración.',
    },
    {
      question: '¿Qué series se emiten hoy en la televisión española?',
      answer: 'En la sección «En directo» de esta página aparecen las series que se están emitiendo ahora mismo en los canales de TV. También puedes consultar la guía de programación para ver la parrilla completa.',
    },
    {
      question: '¿Se pueden filtrar series por plataforma?',
      answer: 'Sí. El filtro de plataformas te permite ver únicamente las series disponibles en Netflix, HBO Max, Disney+, Prime Video, Movistar+ u otras plataformas de tu elección.',
    },
  ];

  private readonly destroy$ = new Subject<void>();
  private remotePlatformsDegraded = false;
  private catalogStateDegraded = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly metaService: MetaService,
    private readonly catalogService: CatalogService,
    private readonly filtersService: CatalogFiltersService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.catalogService
      .getPlatformsState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.platforms = result.data || [];
        this.remotePlatformsDegraded = result.unavailable || result.stale;
        this.syncDegradedFilters();
        if ((result.unavailable || result.stale) && !this.degradedMessage) {
          this.degradedMessage =
            'Las plataformas remotas no respondieron. Se muestran filtros locales para no bloquear esta vista.';
        }
      });

    combineLatest([this.route.data, this.route.queryParamMap])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([data, params]) => {
        this.contentType = (data['type'] || 'movies') as ContentPageType;
        this.filters = this.resolveFilters(this.paramMapToParams(params));
        this.updateMeta();
        this.loadContent();
        this.loadLiveItems();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltersChange(next: CatalogQuery): void {
    this.filters = {
      ...this.filters,
      ...next,
      types: [this.fixedCatalogType],
      page: 1,
    };
    this.navigateWithFilters();
  }

  resetFilters(): void {
    this.filters = this.buildDefaultFilters();
    this.navigateWithFilters();
  }

  loadMore(): void {
    this.filters = {
      ...this.filters,
      limit: Number(this.filters.limit || 24) + 24,
    };
    this.navigateWithFilters();
  }

  get pageTitle(): string {
    return this.contentType === 'series' ? 'Series en TV y streaming' : 'Películas en TV y streaming';
  }

  get pageSubtitle(): string {
    return this.contentType === 'series'
      ? 'Series en emisión, bajo demanda y ordenadas por plataforma, valoración y disponibilidad.'
      : 'Películas en directo, catálogo streaming y opciones gratuitas desde un mismo explorador.';
  }

  get fixedCatalogType(): CatalogContentType {
    return this.contentType === 'series' ? 'series' : 'movie';
  }

  get faqItems(): FaqItem[] {
    return this.contentType === 'series' ? this.seriesFaq : this.moviesFaq;
  }

  retryCurrentView(): void {
    this.loadContent();
    this.loadLiveItems();
  }

  private resolveFilters(params: Params): CatalogQuery {
    const defaults = this.buildDefaultFilters();
    const filters = this.filtersService.fromQueryParams(params, defaults);
    filters.types = [this.fixedCatalogType];
    filters.limit = filters.limit || 24;
    return filters;
  }

  private buildDefaultFilters(): CatalogQuery {
    return {
      types: [this.fixedCatalogType],
      availability: [],
      genres: [],
      platforms: [],
      sort: 'popular',
      limit: 24,
      page: 1,
    };
  }

  private navigateWithFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.filtersService.toQueryParams(this.filters),
      queryParamsHandling: '',
    });
  }

  private loadContent(): void {
    this.loading = true;
    this.error = null;

    this.catalogService
      .queryState(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const response = result.data as CatalogResponse;
          this.items = response.items || [];
          this.genres = response.availableGenres?.length
            ? response.availableGenres
            : FALLBACK_CATALOG_GENRES;
          this.platforms = response.availablePlatforms?.length
            ? response.availablePlatforms
            : this.platforms;
          this.total = response.meta?.total || 0;
          this.hasMore = Boolean(response.meta?.hasMore);
          this.catalogUnavailable =
            result.unavailable && !result.stale && !(response.items || []).length;
          this.catalogStateDegraded = result.unavailable || result.stale;
          this.syncDegradedFilters();
          this.buildItemListLd();
          if (result.stale) {
            this.degradedMessage =
              'Mostrando la última versión disponible mientras esta colección se actualiza.';
          } else if (this.catalogUnavailable) {
            this.degradedMessage =
              'Esta colección no pudo consultar el catálogo remoto. Conservamos tus filtros para que puedas reintentar.';
          } else if (this.remotePlatformsDegraded) {
            this.degradedMessage =
              'Las plataformas se están resolviendo con datos locales mientras recuperamos el catálogo completo.';
          } else {
            this.degradedMessage = null;
          }
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar este contenido.';
          this.loading = false;
        },
      });
  }

  private loadLiveItems(): void {
    this.catalogService
      .queryState({
        types: [this.fixedCatalogType],
        availability: ['live'],
        sort: 'airtime',
        limit: 8,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.liveItems = result.data.items || [];
      });
  }

  private updateMeta(): void {
    const label = this.contentType === 'series' ? 'Series' : 'Películas';
    this.breadcrumbItems = [
      { name: 'Inicio', url: '/' },
      { name: label, url: this.router.url.split('?')[0] },
    ];
    this.metaService.setMetaTags({
      title: `${this.pageTitle} - Guía TV`,
      description: this.pageSubtitle,
      canonicalUrl: this.router.url,
    });
  }

  private paramMapToParams(paramMap: ParamMap): Params {
    const params: Params = {};
    for (const key of paramMap.keys) {
      params[key] = paramMap.get(key);
    }
    return params;
  }

  private syncDegradedFilters(): void {
    this.degradedFilters = this.remotePlatformsDegraded || this.catalogStateDegraded;
  }

  private buildItemListLd(): void {
    if (!this.items.length) {
      this.safeLdHtml = null;
      return;
    }
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: this.pageTitle,
      description: this.pageSubtitle,
      url: `${baseUrl}${this.router.url.split('?')[0]}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: this.total,
        itemListElement: this.items.slice(0, 20).map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.title,
          url: `${baseUrl}${item.detailPath || '/contenido/' + item.catalogId}`,
        })),
      },
    };
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
}
