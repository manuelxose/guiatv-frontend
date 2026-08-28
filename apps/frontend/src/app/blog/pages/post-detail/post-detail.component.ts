import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, combineLatest, forkJoin, map, of, startWith, switchMap, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogRailComponent } from '../../../components/catalog-rail/catalog-rail.component';
import { FaqSectionComponent } from '../../../components/faq-section/faq-section.component';
import { ShareButtonsComponent } from '../../../components/share-buttons/share-buttons.component';
import { APP_PATHS } from '../../../config/route-map';
import { UnifiedPortalShellComponent } from '../../../components/unified-portal-shell/unified-portal-shell.component';
import { getCatalogPlatformByKey } from '../../../data/catalog-platforms.data';
import { CatalogItem, CatalogService } from '../../../services/catalog.service';
import { MetaService } from '../../../services/meta.service';
import {
  generateBreadcrumbSchema,
  generateEditorialArticleSchema,
} from '../../../utils/utils';
import { EditorialPostPageState } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { PortalContextNavComponent } from '../../../components/portal-context-nav/portal-context-nav.component';
import { UnifiedAsyncStateComponent } from '../../../components/unified-async-state/unified-async-state.component';
import { UnifiedSkeletonBlockComponent } from '../../../components/unified-skeleton-block/unified-skeleton-block.component';

interface TrendingItem {
  title: string;
  path: string;
  platform?: string;
  category?: string;
  score: number;
}

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedPortalShellComponent,
    ShareButtonsComponent,
    EditorialPostCardComponent,
    CatalogRailComponent,
    FaqSectionComponent,
    PortalContextNavComponent,
    UnifiedAsyncStateComponent,
    UnifiedSkeletonBlockComponent,
  ],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetailComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly isBrowser: boolean;
  public loading = true;
  public error: string | null = null;
  public state: EditorialPostPageState | null = null;
  public currentUrl = '';
  public safeLdHtml: SafeHtml | null = null;
  public platformRailItems: CatalogItem[] = [];
  public exploreRailItems: CatalogItem[] = [];
  public guideRailItems: CatalogItem[] = [];
  public trendingItems: TrendingItem[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly retryTrigger$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly editorialService: EditorialService,
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer,
    private readonly catalogService: CatalogService,
    private readonly changeDetector: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    combineLatest([
      this.route.paramMap,
      this.retryTrigger$.pipe(startWith(undefined)),
    ])
      .pipe(
        map(([params]) => params.get('slug') || ''),
        switchMap((slug) => {
          this.loading = true;
          this.error = null;
          this.state = null;
          this.changeDetector.markForCheck();
          return this.editorialService.getPostPageState(slug).pipe(
            map((state) => ({ state, failed: false })),
            catchError(() => of({ state: null, failed: true }))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ state, failed }) => {
          if (failed) {
            this.error = 'No se ha podido cargar este artículo. Comprueba tu conexión e inténtalo de nuevo.';
            this.loading = false;
            this.changeDetector.markForCheck();
            return;
          }
          if (!state) {
            void this.router.navigateByUrl(APP_PATHS.blog);
            return;
          }

          this.state = state;
          this.loading = false;
          this.error = null;
          this.currentUrl = this.isBrowser
            ? window.location.href
            : `https://guiaprogramaciontv.com${state.post.canonicalPath}`;

          this.metaService.setMetaTags({
            title: state.post.metaTitle || `${state.post.title} | Blog Guía TV`,
            description:
              state.post.metaDescription || state.post.excerptText || 'Artículo editorial de Guía TV.',
            canonicalUrl: state.post.canonicalPath,
            image: state.post.coverImage,
            type: 'article',
            publishedTime: state.post.publishedAt,
            modifiedTime: state.post.modifiedAt,
            section: state.post.primaryCategory?.name || state.post.contentType,
          });

          this.buildStructuredData(state);
          this.loadLinkedModules(state.post);
          this.changeDetector.markForCheck();

          if (this.isBrowser) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public retry(): void {
    this.retryTrigger$.next();
  }

  public hasRouteRelation(key: string): boolean {
    return this.state?.post.relatedRouteKeys.includes(key as any) ?? false;
  }

  public get platformCatalogQueryParams(): Record<string, string> | null {
    const relatedNames = (this.state?.post.relatedPlatformKeys || [])
      .map((key) => getCatalogPlatformByKey(key)?.name)
      .filter((name): name is string => Boolean(name));
    if (!relatedNames.length) {
      return null;
    }
    return {
      platforms: relatedNames.join(','),
      availability: 'streaming',
      types: 'movie,series',
    };
  }

  public get breadcrumbItems(): Array<{ name: string; url: string }> {
    return [
      { name: 'Inicio', url: APP_PATHS.home },
      { name: 'Blog', url: APP_PATHS.blog },
      ...(this.state?.post.primaryCategory
        ? [{ name: this.state.post.primaryCategory.name, url: this.state.post.primaryCategory.canonicalPath }]
        : []),
      ...(this.state ? [{ name: this.state.post.title, url: this.state.post.canonicalPath }] : []),
    ];
  }

  public get showUpdatedDate(): boolean {
    const published = new Date(this.state?.post.publishedAt || 0).getTime();
    const modified = new Date(this.state?.post.modifiedAt || 0).getTime();
    return Number.isFinite(published) && Number.isFinite(modified) && modified - published >= 86_400_000;
  }

  private loadLinkedModules(post: EditorialPostPageState['post']): void {
    this.platformRailItems = [];
    this.exploreRailItems = [];
    this.guideRailItems = [];
    this.trendingItems = [];

    const platformItems$ =
      post.relatedRouteKeys.includes('platforms') && post.relatedPlatformKeys.length
        ? this.catalogService
            .queryState({
              types: ['movie', 'series'],
              platforms: post.relatedPlatformKeys,
              availability: ['streaming'],
              sort: 'popular',
              limit: 8,
            })
            .pipe(
              map((result) => result.data?.items || []),
              catchError(() => of([]))
            )
        : of([] as CatalogItem[]);

    const exploreItems$ = post.relatedRouteKeys.includes('explore')
      ? this.catalogService
          .queryState({
            types: ['movie', 'series'],
            sort: 'popular',
            limit: 8,
            ...(post.relatedPlatformKeys.length
              ? { platforms: post.relatedPlatformKeys.slice(0, 2) }
              : {}),
          })
          .pipe(
            map((result) => result.data?.items || []),
            catchError(() => of([]))
          )
      : of([] as CatalogItem[]);

    const guideItems$ = post.relatedRouteKeys.includes('guide')
      ? this.catalogService
          .queryState({
            types: ['program'],
            availability: ['live'],
            sort: 'airtime',
            limit: 8,
          })
          .pipe(
            map((result) => result.data?.items || []),
            catchError(() => of([]))
          )
      : of([] as CatalogItem[]);

    const trendingItems$ = post.relatedRouteKeys.includes('stats')
      ? this.catalogService
          .queryState({
            types: ['movie', 'series'],
            sort: 'popular',
            limit: 4,
          })
          .pipe(
            map((result) =>
              (result.data?.items || []).map((item, index) => ({
                title: item.title,
                path: item.detailPath || APP_PATHS.explore,
                platform: item.primaryPlatforms?.[0] || item.channel?.name,
                category: item.genres?.[0],
                score: Math.max(60, 100 - index * 8),
              }))
            ),
            catchError(() => of([] as TrendingItem[]))
          )
      : of([] as TrendingItem[]);

    forkJoin({
      platformRailItems: platformItems$,
      exploreRailItems: exploreItems$,
      guideRailItems: guideItems$,
      trendingItems: trendingItems$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((modules) => {
        this.platformRailItems = modules.platformRailItems;
        this.exploreRailItems = modules.exploreRailItems;
        this.guideRailItems = modules.guideRailItems;
        this.trendingItems = modules.trendingItems.slice(0, 4);
        this.changeDetector.markForCheck();
      });
  }

  private buildStructuredData(state: EditorialPostPageState): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const breadcrumbItems = [
      { name: 'Blog', url: '/editorial' },
      ...(state.post.primaryCategory
        ? [{ name: state.post.primaryCategory.name, url: state.post.primaryCategory.canonicalPath }]
        : []),
      { name: state.post.title, url: state.post.canonicalPath },
    ];
    const schemas = [
      generateEditorialArticleSchema(
        {
          title: state.post.title,
          excerptText: state.post.excerptText,
          coverImage: state.post.coverImage,
          publishedAt: state.post.publishedAt,
          modifiedAt: state.post.modifiedAt,
          canonicalPath: state.post.canonicalPath,
          contentType: state.post.contentType,
          targetQuery: state.post.targetQuery,
          author: state.post.author,
        },
        baseUrl
      ),
      generateBreadcrumbSchema(breadcrumbItems, baseUrl),
    ];
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      schemas
        .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
        .join('')
    );
  }
}
