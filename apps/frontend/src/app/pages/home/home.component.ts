import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { CatalogRailComponent } from '../../components/catalog-rail/catalog-rail.component';
import { APP_PATHS } from '../../config/route-map';
import { CatalogItem, CatalogPlatform } from '../../services/catalog.service';
import { MetaService } from '../../services/meta.service';
import { UserService } from '../../services/user.service';
import { generateWebApplicationSchema, generateOrganizationSchema } from '../../utils/utils';
import { DiscoveryService } from '../../services/discovery.service';

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
    private readonly discoveryService: DiscoveryService,
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

    this.userService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadHome());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHome(): void {
    this.loading = true;
    this.error = null;
    this.degradedNotice = null;
    this.discoveryService
      .getHome()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.error = 'No se pudo cargar la portada ahora mismo.';
          this.loading = false;
          return of(null);
        })
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.sections = {
          personalized: result.personalized || [],
          platformItems: result.platformItems || [],
          freeItems: result.freeItems || [],
          liveItems: result.liveItems || [],
          trendingItems: result.trendingItems || [],
          platforms: result.platforms || [],
        };
        this.loading = false;
      });
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
