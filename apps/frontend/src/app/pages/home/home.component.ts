import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, combineLatest, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { CatalogRailComponent } from '../../components/catalog-rail/catalog-rail.component';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { APP_PATHS } from '../../config/route-map';
import { CatalogItem, CatalogPlatform, CatalogService } from '../../services/catalog.service';
import { MetaService } from '../../services/meta.service';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../interfaces/user.interface';

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
    NavBarComponent,
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
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Inicio - Guía TV',
      description:
        'Descubre qué ver hoy en televisión y streaming con recomendaciones personalizadas, plataformas disponibles y emisiones en directo.',
      canonicalUrl: '/',
    });

    combineLatest([this.userService.isAuthenticated$, this.userService.getProfile()])
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of([false, null] as [boolean, UserProfile | null]))
      )
      .subscribe(([isAuthenticated, profile]) => {
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
    const preferredPlatforms = profile?.preferredPlatforms || [];

    forkJoin({
      personalized: this.catalogService.getForYou(12).pipe(catchError(() => of([]))),
      platformItems: this.catalogService
        .query({
          types: ['movie', 'series'],
          platforms: preferredPlatforms.slice(0, 3),
          availability: ['streaming'],
          sort: 'popular',
          limit: 12,
        })
        .pipe(catchError(() => of(null))),
      freeItems: this.catalogService
        .query({
          availability: ['free'],
          sort: 'popular',
          limit: 12,
        })
        .pipe(catchError(() => of(null))),
      liveItems: this.catalogService
        .query({
          types: ['program'],
          availability: ['live'],
          sort: 'airtime',
          limit: 12,
        })
        .pipe(catchError(() => of(null))),
      trendingItems: this.catalogService
        .query({
          types: ['movie', 'series'],
          sort: 'popular',
          limit: 12,
        })
        .pipe(catchError(() => of(null))),
      platforms: this.catalogService.getPlatforms().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (result) => {
        const personalized = this.mapRecommendationItems(result.personalized);
        this.sections = {
          personalized: isAuthenticated ? personalized : [],
          platformItems: result.platformItems?.items || [],
          freeItems: result.freeItems?.items || [],
          liveItems: result.liveItems?.items || [],
          trendingItems: result.trendingItems?.items || [],
          platforms: result.platforms || [],
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
}
