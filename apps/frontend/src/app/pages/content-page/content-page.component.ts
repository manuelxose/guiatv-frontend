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

  private readonly destroy$ = new Subject<void>();
  private remotePlatformsDegraded = false;
  private catalogStateDegraded = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly metaService: MetaService,
    private readonly catalogService: CatalogService,
    private readonly filtersService: CatalogFiltersService
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
}
