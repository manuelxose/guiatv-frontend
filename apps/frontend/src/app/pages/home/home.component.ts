import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, combineLatest, forkJoin, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { CatalogRailComponent } from '../../components/catalog-rail/catalog-rail.component';
import { APP_PATHS } from '../../config/route-map';
import { CatalogItem, CatalogPlatform, CatalogService } from '../../services/catalog.service';
import { MetaService } from '../../services/meta.service';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../interfaces/user.interface';
import { generateWebApplicationSchema, generateOrganizationSchema } from '../../utils/utils';

interface HomeSections {
  personalized: CatalogItem[];
  platformItems: CatalogItem[];
  freeItems: CatalogItem[];
  liveItems: CatalogItem[];
  trendingItems: CatalogItem[];
  platforms: CatalogPlatform[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CatalogRailComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly isAuthenticated$ = this.userService.isAuthenticated$;

  public loading = true;
  public error: string | null = null;
  public degradedNotice: string | null = null;
  public safeLdHtml: SafeHtml | null = null;
  public sections: HomeSections = {
    personalized: [],
    platformItems: [],
    freeItems: [],
    liveItems: [],
    trendingItems: [],
    platforms: [],
  };

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly catalogService: CatalogService,
    private readonly metaService: MetaService,
    private readonly userService: UserService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Guía de Programación TV — Qué ver hoy en televisión y streaming',
      description:
        'Descubre qué ver hoy en televisión y streaming con recomendaciones personalizadas, plataformas disponibles y emisiones en directo.',
      canonicalUrl: '/',
    });

    this.buildStructuredData();

    combineLatest([this.userService.isAuthenticated$, this.userService.getProfile()])
      .pipe(
        map(([isAuthenticated, profile]) => ({
          isAuthenticated,
          profile,
          signature: JSON.stringify({
            isAuthenticated,
            favoriteGenres: profile?.favoriteGenres || [],
            preferredPlatforms: profile?.preferredPlatforms || [],
            discoveryDefaults: profile?.discoveryDefaults || null,
          }),
        })),
        distinctUntilChanged((left, right) => left.signature === right.signature),
        takeUntil(this.destroy$),
        catchError(() =>
          of({
            isAuthenticated: false,
            profile: null,
            signature: 'anonymous',
          } as {
            isAuthenticated: boolean;
            profile: UserProfile | null;
            signature: string;
          })
        )
      )
      .subscribe(({ isAuthenticated, profile }) => {
        this.loadHome(isAuthenticated, profile);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHome(isAuthenticated: boolean, profile: UserProfile | null): void {
    this.loading = true;
    this.error = null;
    this.degradedNotice = null;
    const preferredPlatforms = profile?.preferredPlatforms || [];
    const emptyCatalog = {
      items: [] as CatalogItem[],
      meta: { page: 1, limit: 12, total: 0, hasMore: false },
      availableGenres: [],
      availablePlatforms: [],
    };

    forkJoin({
      personalized: (
        isAuthenticated
          ? this.catalogService.getForYouState(12)
          : of({ data: [], unavailable: false, stale: false })
      ).pipe(catchError(() => of({ data: [], unavailable: true, stale: false }))),
      platformItems: this.catalogService
        .queryState({
          types: ['movie', 'series'],
          platforms: preferredPlatforms.slice(0, 3),
          availability: ['streaming'],
          sort: 'popular',
          limit: 12,
        })
        .pipe(catchError(() => of({ data: emptyCatalog, unavailable: true, stale: false }))),
      freeItems: this.catalogService
        .queryState({
          availability: ['free'],
          sort: 'popular',
          limit: 12,
        })
        .pipe(catchError(() => of({ data: emptyCatalog, unavailable: true, stale: false }))),
      liveItems: this.catalogService
        .queryState({
          types: ['program'],
          availability: ['live'],
          sort: 'airtime',
          limit: 12,
        })
        .pipe(catchError(() => of({ data: emptyCatalog, unavailable: true, stale: false }))),
      trendingItems: this.catalogService
        .queryState({
          types: ['movie', 'series'],
          sort: 'popular',
          limit: 12,
        })
        .pipe(catchError(() => of({ data: emptyCatalog, unavailable: true, stale: false }))),
      platforms: this.catalogService.getPlatformsState().pipe(
        catchError(() => of({ data: [], unavailable: true, stale: false }))
      ),
    }).subscribe({
      next: (result) => {
        const personalized = this.mapRecommendationItems(result.personalized.data || []);
        const platformItemsUnavailable =
          result.platformItems.unavailable && !result.platformItems.stale;
        const freeUnavailable = result.freeItems.unavailable && !result.freeItems.stale;
        const liveUnavailable = result.liveItems.unavailable && !result.liveItems.stale;
        const trendingUnavailable =
          result.trendingItems.unavailable && !result.trendingItems.stale;
        const catalogUnavailable =
          platformItemsUnavailable &&
          freeUnavailable &&
          liveUnavailable &&
          trendingUnavailable;
        const platformsUnavailable = result.platforms.unavailable && !result.platforms.stale;
        const personalizedUnavailable =
          result.personalized.unavailable && !result.personalized.stale;

        if (catalogUnavailable) {
          this.degradedNotice =
            'Mostramos la última portada útil disponible mientras el catálogo híbrido se recupera.';
        } else if (isAuthenticated && result.personalized.stale) {
          this.degradedNotice =
            'Tus recomendaciones se muestran con la última actualización disponible mientras se refrescan en segundo plano.';
        } else if (personalizedUnavailable && isAuthenticated) {
          this.degradedNotice =
            'Las recomendaciones personalizadas no respondieron. El resto de la portada sigue operativo.';
        } else if (
          result.platformItems.stale ||
          result.freeItems.stale ||
          result.liveItems.stale ||
          result.trendingItems.stale
        ) {
          this.degradedNotice =
            'Parte de la portada está usando datos recientes en caché mientras se completa la actualización.';
        }

        this.sections = {
          personalized:
            isAuthenticated && !personalizedUnavailable ? personalized : [],
          platformItems: result.platformItems.data?.items || [],
          freeItems: result.freeItems.data?.items || [],
          liveItems: result.liveItems.data?.items || [],
          trendingItems: result.trendingItems.data?.items || [],
          platforms: platformsUnavailable ? [] : result.platforms.data || [],
        };
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la portada ahora mismo.';
        this.loading = false;
      },
    });
  }

  private mapRecommendationItems(items: any[]): CatalogItem[] {
    return (items || [])
      .map((entry) => entry?.item || entry)
      .filter((item): item is CatalogItem => Boolean(item?.catalogId));
  }

  private buildStructuredData(): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Guía Programación TV',
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/programacion-tv/series?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      generateOrganizationSchema(baseUrl),
      generateWebApplicationSchema(baseUrl),
    ];

    const scripts = schemas
      .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
      .join('');
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(scripts);
  }
}
