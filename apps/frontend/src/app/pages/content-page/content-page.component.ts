import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router, RouterModule } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { CatalogCardComponent } from '../../components/catalog-card/catalog-card.component';
import { CatalogFiltersComponent } from '../../components/catalog-filters/catalog-filters.component';
import { CatalogRailComponent } from '../../components/catalog-rail/catalog-rail.component';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { APP_PATHS } from '../../config/route-map';
import {
  CatalogContentType,
  CatalogItem,
  CatalogPlatform,
  CatalogQuery,
  CatalogResponse,
  CatalogService,
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
    NavBarComponent,
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
  public filters: CatalogQuery = {};
  public items: CatalogItem[] = [];
  public liveItems: CatalogItem[] = [];
  public genres: string[] = [];
  public platforms: CatalogPlatform[] = [];
  public hasMore = false;
  public total = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly metaService: MetaService,
    private readonly catalogService: CatalogService,
    private readonly filtersService: CatalogFiltersService
  ) {}

  ngOnInit(): void {
    this.catalogService
      .getPlatforms()
      .pipe(takeUntil(this.destroy$))
      .subscribe((platforms) => {
        this.platforms = platforms;
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
      .query(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CatalogResponse) => {
          this.items = response.items || [];
          this.genres = response.availableGenres || [];
          this.platforms = response.availablePlatforms?.length
            ? response.availablePlatforms
            : this.platforms;
          this.total = response.meta?.total || 0;
          this.hasMore = Boolean(response.meta?.hasMore);
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
      .query({
        types: [this.fixedCatalogType],
        availability: ['live'],
        sort: 'airtime',
        limit: 8,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        this.liveItems = response.items || [];
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
}
