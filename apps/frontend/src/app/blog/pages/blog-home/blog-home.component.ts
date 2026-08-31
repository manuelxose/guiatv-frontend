import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, combineLatest, forkJoin, map, of, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UnifiedPortalShellComponent } from '../../../components/unified-portal-shell/unified-portal-shell.component';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { EditorialMastheadComponent } from '../../components/editorial-masthead/editorial-masthead.component';
import { CatalogRailComponent } from '../../../components/catalog-rail/catalog-rail.component';
import { APP_PATHS } from '../../../config/route-map';
import { MetaService } from '../../../services/meta.service';
import { CatalogItem, CatalogService } from '../../../services/catalog.service';
import { getCatalogPlatformByKey } from '../../../data/catalog-platforms.data';
import {
  EditorialCategorySection,
  EditorialPost,
} from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { generateCollectionPageSchema } from '../../../utils/utils';
import { PortalContextNavComponent } from '../../../components/portal-context-nav/portal-context-nav.component';
import { UnifiedAsyncStateComponent } from '../../../components/unified-async-state/unified-async-state.component';
import { UnifiedSkeletonBlockComponent } from '../../../components/unified-skeleton-block/unified-skeleton-block.component';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedPortalShellComponent,
    EditorialPostCardComponent,
    EditorialMastheadComponent,
    CatalogRailComponent,
    PortalContextNavComponent,
    UnifiedAsyncStateComponent,
    UnifiedSkeletonBlockComponent,
  ],
  templateUrl: './blog-home.component.html',
  styleUrls: ['./blog-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogHomeComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly breadcrumbItems = [
    { name: 'Inicio', url: APP_PATHS.home },
    { name: 'Blog', url: APP_PATHS.blog },
  ];

  public loading = true;
  public error: string | null = null;
  public hero: EditorialPost | null = null;
  public latestPosts: EditorialPost[] = [];
  public latestStories: EditorialPost[] = [];
  public trendPosts: EditorialPost[] = [];
  public rankingPosts: EditorialPost[] = [];
  public cineSection: EditorialCategorySection | null = null;
  public seriesSection: EditorialCategorySection | null = null;
  public streamingSection: EditorialCategorySection | null = null;
  public streamingPlatforms: Record<string, string[]> = {};
  public collections: EditorialCategorySection[] = [];
  public safeLdHtml: SafeHtml | null = null;

  // "Qué ver hoy" — real catalog data, same CatalogService.queryState pattern
  // already used by the article page's linked modules. No fabricated content.
  public moviesToday: CatalogItem[] = [];
  public seriesTonight: CatalogItem[] = [];
  public tvTonight: CatalogItem[] = [];
  public watchTodayLoaded = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly editorialService: EditorialService,
    private readonly catalogService: CatalogService,
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Editorial | Cine, series y streaming — Guía TV',
      description:
        'Reportajes, guías y rankings de cine, series, television y streaming, conectados con la programación y el catálogo reales de Guía TV.',
      canonicalUrl: '/editorial',
      image: '/assets/images/blog-og-image.webp',
      type: 'website',
    });
    this.buildStructuredData();

    this.loadHub();
    this.loadWatchToday();
  }

  public retry(): void {
    this.loadHub();
  }

  public trackPost(index: number, post: EditorialPost): string {
    return post.id || `${post.slug}-${index}`;
  }

  public platformsFor(post: EditorialPost): string[] {
    return this.streamingPlatforms[post.slug] || [];
  }

  private loadHub(): void {
    this.loading = true;
    this.error = null;
    combineLatest([
      this.editorialService.getHubState(),
      this.editorialService.getEditorialSections(),
      this.editorialService.getPosts(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([hub, sections, posts]) => {
          this.hero = hub.hero;
          this.latestPosts = hub.latestPosts;
          this.trendPosts = hub.trendPosts;
          this.rankingPosts = hub.rankingPosts;

          this.cineSection = sections.cine;
          this.seriesSection = sections.series;
          this.streamingSection = sections.streaming;
          this.collections = sections.collections;
          this.streamingPlatforms = {};
          sections.streaming?.posts.forEach((post) => {
            this.streamingPlatforms[post.slug] = post.relatedPlatformKeys
              .map((key) => getCatalogPlatformByKey(key)?.name)
              .filter((name): name is string => Boolean(name));
          });

          const featuredSlugs = new Set([
            hub.hero?.slug,
            ...hub.latestPosts.map((post) => post.slug),
          ].filter(Boolean) as string[]);
          this.latestStories = posts.filter((post) => !featuredSlugs.has(post.slug)).slice(0, 6);

          this.loading = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.error = 'No se han podido cargar las publicaciones. Comprueba tu conexión e inténtalo de nuevo.';
          this.loading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  private loadWatchToday(): void {
    const moviesToday$ = this.catalogService
      .queryState({ types: ['movie'], sort: 'popular', limit: 10 })
      .pipe(
        map((result) => result.data?.items || []),
        catchError(() => of([] as CatalogItem[]))
      );
    const seriesTonight$ = this.catalogService
      .queryState({ types: ['series'], sort: 'rating', limit: 10 })
      .pipe(
        map((result) => result.data?.items || []),
        catchError(() => of([] as CatalogItem[]))
      );
    const tvTonight$ = this.catalogService
      .queryState({ types: ['program'], availability: ['live'], sort: 'airtime', limit: 10 })
      .pipe(
        map((result) => result.data?.items || []),
        catchError(() => of([] as CatalogItem[]))
      );

    forkJoin({ moviesToday: moviesToday$, seriesTonight: seriesTonight$, tvTonight: tvTonight$ })
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.moviesToday = data.moviesToday;
        this.seriesTonight = data.seriesTonight;
        this.tvTonight = data.tvTonight;
        this.watchTodayLoaded = true;
        this.changeDetector.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildStructuredData(): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schema = generateCollectionPageSchema(
      {
        name: 'Editorial Guía TV',
        description:
          'Guías, rankings y tendencias de cine, series y streaming conectadas con la programación TV, las plataformas y el descubrimiento de la app.',
        path: '/editorial',
      },
      baseUrl
    );
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
}
