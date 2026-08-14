import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, forkJoin, map, of, switchMap, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogRailComponent } from '../../../components/catalog-rail/catalog-rail.component';
import { FaqSectionComponent } from '../../../components/faq-section/faq-section.component';
import { ShareButtonsComponent } from '../../../components/share-buttons/share-buttons.component';
import { APP_PATHS } from '../../../config/route-map';
import { UnifiedPortalShellComponent } from '../../../components/unified-portal-shell/unified-portal-shell.component';
import { UnifiedTopNavTab } from '../../../components/unified-top-nav/unified-top-nav.component';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { PORTAL_ICON_PATHS } from '../../../config/portal-navigation.config';
import { getCatalogPlatformByKey } from '../../../data/catalog-platforms.data';
import { CatalogItem, CatalogService } from '../../../services/catalog.service';
import { MetaService } from '../../../services/meta.service';
import { UserService } from '../../../services/user.service';
import {
  generateBreadcrumbSchema,
  generateEditorialArticleSchema,
} from '../../../utils/utils';
import { EditorialPostPageState } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { UnifiedPortalRailSection } from '../../../models/portal-shell.models';

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
  ],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetailComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly iconPaths = PORTAL_ICON_PATHS;
  public readonly isBrowser: boolean;
  public readonly searchQuery = signal('');
  public readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  public readonly profile = toSignal(this.userService.getProfile(), {
    initialValue: this.userService.getProfileSnapshot(),
  });
  public readonly topPillChips: FilterChipItem[] = [
    { id: 'editorial', label: 'Editorial', iconPath: this.iconPaths.editorial, tone: 'discover' },
    { id: 'rankings', label: 'Rankings', iconPath: this.iconPaths.rankings, tone: 'discover' },
    { id: 'discover', label: 'Qué Ver', iconPath: this.iconPaths.discover, tone: 'discover' },
    { id: 'platforms', label: 'Plataformas', iconPath: this.iconPaths.platforms, tone: 'streaming' },
  ];
  public readonly leftRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'post-left',
      eyebrow: 'Editorial',
      title: 'Volver al flujo',
      description: 'Este artículo vive dentro del portal, no aparte.',
      items: [
        { id: 'post-left-home', label: 'Editorial', description: 'Portada editorial', iconPath: this.iconPaths.editorial, path: APP_PATHS.blog },
        { id: 'post-left-rankings', label: 'Rankings', description: 'Top listas', iconPath: this.iconPaths.rankings, path: APP_PATHS.top10 },
        { id: 'post-left-discover', label: 'Qué Ver', description: 'Discovery principal', iconPath: this.iconPaths.discover, path: APP_PATHS.explore },
      ],
    },
  ]);
  public readonly rightRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'post-right',
      eyebrow: 'Contexto',
      title: 'Siguientes pasos',
      description: 'Cruza editorial con plataformas, guía y tendencias.',
      variant: 'compact',
      items: [
        { id: 'post-right-platforms', label: 'Plataformas', description: 'Abrir servicios', iconPath: this.iconPaths.platforms, path: APP_PATHS.platforms },
        { id: 'post-right-guide', label: 'TV Directo', description: 'Ir a la guía', iconPath: this.iconPaths.live, path: APP_PATHS.guide },
        { id: 'post-right-trends', label: 'Tendencias', description: 'Pulso del catálogo', iconPath: this.iconPaths.trends, path: APP_PATHS.stats },
      ],
    },
  ]);

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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly editorialService: EditorialService,
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer,
    private readonly catalogService: CatalogService,
    private readonly userService: UserService,
    private readonly changeDetector: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') || ''),
        switchMap((slug) => this.editorialService.getPostPageState(slug)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (state) => {
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
            title: state.post.metaTitle || `${state.post.title} | Editorial Guía TV`,
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
        error: () => {
          this.error = 'No se ha podido cargar este artículo.';
          this.loading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      { name: 'Editorial', url: APP_PATHS.blog },
      ...(this.state?.post.primaryCategory
        ? [{ name: this.state.post.primaryCategory.name, url: this.state.post.primaryCategory.canonicalPath }]
        : []),
      ...(this.state ? [{ name: this.state.post.title, url: this.state.post.canonicalPath }] : []),
    ];
  }

  public navigateToTab(tab: UnifiedTopNavTab['id']): void {
    const pathMap: Record<UnifiedTopNavTab['id'], string> = {
      live: APP_PATHS.guide,
      discover: APP_PATHS.explore,
      streaming: APP_PATHS.platforms,
      sports: APP_PATHS.sports,
    };
    void this.router.navigateByUrl(pathMap[tab]);
  }

  public onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  public onSearchSubmit(value: string): void {
    this.searchQuery.set(value);
    void this.router.navigate([APP_PATHS.explore], {
      queryParams: value ? { q: value } : {},
    });
  }

  public onTopPillChange(value: string): void {
    const target = {
      editorial: APP_PATHS.blog,
      rankings: APP_PATHS.top10,
      discover: APP_PATHS.explore,
      platforms: APP_PATHS.platforms,
    }[value];
    if (target) {
      void this.router.navigateByUrl(target);
    }
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
      { name: 'Editorial', url: '/editorial' },
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
