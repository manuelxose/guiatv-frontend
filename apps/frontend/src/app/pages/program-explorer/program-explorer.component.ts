import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router, RouterModule } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { CatalogCardComponent } from '../../components/catalog-card/catalog-card.component';
import { CatalogFiltersComponent } from '../../components/catalog-filters/catalog-filters.component';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { APP_PATHS } from '../../config/route-map';
import {
  CatalogItem,
  CatalogPlatform,
  CatalogQuery,
  CatalogResponse,
  CatalogService,
} from '../../services/catalog.service';
import {
  CatalogDiscoveryDefaults,
  CatalogFiltersService,
} from '../../services/catalog-filters.service';
import { MetaService } from '../../services/meta.service';
import { UserProfile } from '../../interfaces/user.interface';
import { UserService } from '../../services/user.service';

type ExplorerMode = 'live' | 'featured' | 'platforms';

@Component({
  selector: 'app-program-explorer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavBarComponent,
    CatalogFiltersComponent,
    CatalogCardComponent,
  ],
  templateUrl: './program-explorer.component.html',
  styleUrls: ['./program-explorer.component.scss'],
})
export class ProgramExplorerComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly isAuthenticated$ = this.userService.isAuthenticated$;

  public mode: ExplorerMode = 'featured';
  public loading = true;
  public error: string | null = null;
  public filters: CatalogQuery = {};
  public items: CatalogItem[] = [];
  public platforms: CatalogPlatform[] = [];
  public genres: string[] = [];
  public total = 0;
  public hasMore = false;

  private readonly destroy$ = new Subject<void>();
  private currentProfile: UserProfile | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly metaService: MetaService,
    private readonly catalogService: CatalogService,
    private readonly filtersService: CatalogFiltersService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.catalogService
      .getPlatforms()
      .pipe(takeUntil(this.destroy$))
      .subscribe((platforms) => {
        this.platforms = platforms;
      });

    combineLatest([
      this.route.data,
      this.route.queryParamMap,
      this.userService.getProfile(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([data, params, profile]) => {
        this.mode = (data['mode'] || 'featured') as ExplorerMode;
        this.currentProfile = profile;
        this.filters = this.resolveFilters(this.paramMapToParams(params), profile);
        this.updateMeta();
        this.loadCatalog();
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
      page: 1,
    };
    this.persistAndNavigate();
  }

  resetFilters(): void {
    this.filters = this.filtersFromDefaults(this.resolveModeDefaults(this.currentProfile));
    this.persistAndNavigate();
  }

  saveDefaults(): void {
    if (!this.userService.isAuthenticatedSync() || this.mode === 'live') {
      return;
    }

    const defaults = this.filtersService.toDiscoveryDefaults(this.filters);
    this.userService.saveDiscoveryDefaults(defaults).subscribe();
  }

  selectPlatform(platformName: string): void {
    this.onFiltersChange({
      platforms: [platformName],
      availability: ['streaming'],
      types: ['movie', 'series'],
    });
  }

  loadMore(): void {
    const nextLimit = Number(this.filters.limit || 24) + 24;
    this.filters = {
      ...this.filters,
      limit: nextLimit,
    };
    this.persistAndNavigate();
  }

  get pageTitle(): string {
    if (this.mode === 'live') return 'En directo ahora';
    if (this.mode === 'platforms') return 'Catálogo por plataformas';
    return 'Explorar todo';
  }

  get pageSubtitle(): string {
    if (this.mode === 'live') {
      return 'Programación en emisión y próximas franjas horarias con disponibilidad adicional en streaming cuando exista.';
    }
    if (this.mode === 'platforms') {
      return 'Navega por Netflix, Prime Video, Disney+, Max, Movistar+ y el resto del ecosistema streaming de España.';
    }
    return 'Un solo catálogo para TV, streaming y contenido gratuito, con filtros persistentes y recomendaciones personalizadas.';
  }

  get pageEyebrow(): string {
    if (this.mode === 'live') return 'Guía TV';
    if (this.mode === 'platforms') return 'Streaming';
    return 'Explorar';
  }

  get showSaveDefaults(): boolean {
    return this.userService.isAuthenticatedSync() && this.mode !== 'live';
  }

  get activePlatforms(): CatalogPlatform[] {
    if (this.filters.platforms?.length) {
      return this.platforms.filter((platform) =>
        this.filters.platforms?.includes(platform.name)
      );
    }
    return this.platforms.slice(0, 10);
  }

  private resolveFilters(params: Params, profile: UserProfile | null): CatalogQuery {
    const defaults = this.resolveModeDefaults(profile);
    const hasQuery = Object.values(params).some((value) => String(value || '').trim() !== '');
    const restored = !hasQuery && this.mode === 'featured' ? this.filtersService.restore() : null;
    const source = restored ? { ...defaults, ...restored } : defaults;
    const filters = this.filtersService.fromQueryParams(params, source);

    if (!filters.types?.length && defaults.types?.length) {
      filters.types = [...defaults.types];
    }
    if (!filters.availability?.length && defaults.availability?.length) {
      filters.availability = [...defaults.availability];
    }
    if (!filters.platforms?.length && defaults.platforms?.length) {
      filters.platforms = [...defaults.platforms];
    }
    if (!filters.sort) {
      filters.sort = defaults.sort;
    }
    if (!filters.limit) {
      filters.limit = 24;
    }
    return filters;
  }

  private resolveModeDefaults(profile: UserProfile | null): CatalogDiscoveryDefaults {
    if (this.mode === 'live') {
      return {
        types: ['program'],
        availability: ['live'],
        platforms: [],
        sort: 'airtime',
      };
    }

    if (this.mode === 'platforms') {
      return {
        types: ['movie', 'series'],
        availability: ['streaming'],
        platforms: [],
        sort: 'popular',
      };
    }

    return {
      types: profile?.discoveryDefaults?.types?.length
        ? [...profile.discoveryDefaults.types]
        : ['program', 'movie', 'series'],
      availability: profile?.discoveryDefaults?.availability?.length
        ? [...profile.discoveryDefaults.availability]
        : [],
      platforms: profile?.discoveryDefaults?.platforms?.length
        ? [...profile.discoveryDefaults.platforms]
        : [],
      sort: profile?.discoveryDefaults?.sort || (this.userService.isAuthenticatedSync() ? 'personalized' : 'popular'),
    };
  }

  private filtersFromDefaults(defaults: CatalogDiscoveryDefaults): CatalogQuery {
    return {
      types: [...defaults.types],
      availability: [...defaults.availability],
      platforms: [...defaults.platforms],
      sort: defaults.sort,
      q: '',
      genres: [],
      limit: 24,
      page: 1,
    };
  }

  private persistAndNavigate(): void {
    if (this.mode === 'featured') {
      this.filtersService.remember(this.filters);
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.filtersService.toQueryParams(this.filters),
      queryParamsHandling: '',
    });
  }

  private loadCatalog(): void {
    this.loading = true;
    this.error = null;

    this.catalogService
      .query({
        ...this.filters,
        limit: this.filters.limit || 24,
        page: this.filters.page || 1,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CatalogResponse) => {
          this.items = response.items || [];
          this.total = response.meta?.total || 0;
          this.hasMore = Boolean(response.meta?.hasMore);
          this.genres = response.availableGenres || [];
          this.platforms = response.availablePlatforms?.length
            ? response.availablePlatforms
            : this.platforms;
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar este catálogo.';
          this.loading = false;
        },
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
