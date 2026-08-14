import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { APP_PATHS } from '../../../config/route-map';
import { MetaService } from '../../../services/meta.service';
import { EditorialCategory, EditorialCategorySection, EditorialPost } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { generateCollectionPageSchema, generateItemListSchema } from '../../../utils/utils';
import { UnifiedPortalShellComponent } from '../../../components/unified-portal-shell/unified-portal-shell.component';
import { UnifiedTopNavTab } from '../../../components/unified-top-nav/unified-top-nav.component';
import { UserService } from '../../../services/user.service';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { PORTAL_ICON_PATHS } from '../../../config/portal-navigation.config';
import { UnifiedPortalMetric, UnifiedPortalRailSection } from '../../../models/portal-shell.models';

@Component({
  selector: 'app-top10',
  standalone: true,
  imports: [CommonModule, RouterModule, UnifiedPortalShellComponent, EditorialPostCardComponent],
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Top10Component implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly iconPaths = PORTAL_ICON_PATHS;
  public readonly searchQuery = signal('');
  public readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  public readonly profile = toSignal(this.userService.getProfile(), {
    initialValue: this.userService.getProfileSnapshot(),
  });
  public readonly topPillChips: FilterChipItem[] = [
    { id: 'all', label: 'Todos', iconPath: this.iconPaths.rankings, tone: 'discover' },
    { id: 'streaming', label: 'Streaming', iconPath: this.iconPaths.platforms, tone: 'streaming' },
    { id: 'tv', label: 'TV', iconPath: this.iconPaths.live, tone: 'live' },
    { id: 'sports', label: 'Deportes', iconPath: this.iconPaths.sports, tone: 'sports' },
  ];
  public readonly metrics: UnifiedPortalMetric[] = [
    { label: 'Rankings reales', value: 'CMS + clasificación editorial', detail: 'Las listas se nutren de señal editorial explícita y vuelven a ocupar un lugar central.', iconPath: 'M6.75 18.75h10.5M8.25 15.75h7.5M9.75 12.75h4.5' },
    { label: 'Filtro editorial', value: 'Familias de rankings', detail: 'La navegación secundaria sigue viva, pero integrada en la misma shell del portal.', iconPath: 'M4.5 6.75h15M7.5 12h9M9.75 17.25h4.5' },
    { label: 'Cruces útiles', value: 'Streaming · tendencias · catálogo', detail: 'Los rankings recuperan valor práctico dentro del sistema unificado.', iconPath: 'M7.5 15.75 10.5 12l2.25 2.25L16.5 9.75' },
  ];
  public readonly breadcrumbItems = [
    { name: 'Inicio', url: APP_PATHS.home },
    { name: 'Editorial', url: APP_PATHS.blog },
    { name: 'Rankings', url: APP_PATHS.top10 },
  ];
  public readonly leftRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'rankings-left',
      eyebrow: 'Rankings',
      title: 'Moverse por familias',
      description: 'Tops editoriales conectados con catálogo y plataformas.',
      items: [
        { id: 'rankings-left-all', label: 'Todos', description: 'Portada de rankings', iconPath: this.iconPaths.rankings, path: APP_PATHS.top10 },
        { id: 'rankings-left-editorial', label: 'Editorial', description: 'Volver a las guías', iconPath: this.iconPaths.editorial, path: APP_PATHS.blog },
        { id: 'rankings-left-platforms', label: 'Plataformas', description: 'Cruce con servicios', iconPath: this.iconPaths.platforms, path: APP_PATHS.platforms },
        { id: 'rankings-left-discover', label: 'Qué Ver', description: 'Discovery principal', iconPath: this.iconPaths.discover, path: APP_PATHS.explore },
      ],
    },
  ]);
  public readonly rightRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'rankings-right',
      eyebrow: 'Contexto',
      title: 'Usa los rankings para entrar',
      description: 'Los tops son otra puerta de entrada al producto, no una isla.',
      variant: 'compact',
      items: [
        { id: 'rankings-right-streaming', label: 'Streaming', description: 'Servicios y catálogo', iconPath: this.iconPaths.platforms, path: APP_PATHS.platforms },
        { id: 'rankings-right-trends', label: 'Tendencias', description: 'Lo que más se mueve', iconPath: this.iconPaths.trends, path: APP_PATHS.stats },
        { id: 'rankings-right-compare', label: 'Comparador', description: 'Cruzar servicios', iconPath: this.iconPaths.compare, path: APP_PATHS.streamingComparison },
      ],
    },
  ]);

  public loading = true;
  public error: string | null = null;
  public featured: EditorialPost | null = null;
  public posts: EditorialPost[] = [];
  public categories: EditorialCategory[] = [];
  public sections: EditorialCategorySection[] = [];
  public selectedCategory = 'all';
  public safeLdHtml: SafeHtml | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly editorialService: EditorialService,
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Rankings editoriales de cine, series y streaming | Guía TV',
      description:
        'Listas, tops y selecciones editoriales conectadas con la guía, el catálogo y las plataformas reales de la app.',
      canonicalUrl: '/editorial/rankings',
      image: '/assets/images/top10-og-image.jpg',
      type: 'website',
    });

    this.editorialService
      .getRankingsPageState()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          this.featured = state.featured;
          this.posts = state.posts;
          this.categories = state.categories;
          this.sections = state.sections;
          this.buildStructuredData();
          this.loading = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.error = 'No se han podido cargar los rankings editoriales.';
          this.loading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToTab(tab: UnifiedTopNavTab['id']): void {
    const pathMap: Record<UnifiedTopNavTab['id'], string> = {
      live: APP_PATHS.guide,
      discover: APP_PATHS.explore,
      streaming: APP_PATHS.platforms,
      sports: APP_PATHS.sports,
    };
    void this.router.navigateByUrl(pathMap[tab]);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onSearchSubmit(value: string): void {
    this.searchQuery.set(value);
    void this.router.navigate([APP_PATHS.explore], {
      queryParams: value ? { q: value } : {},
    });
  }

  onTopPillChange(value: string): void {
    const target = {
      all: APP_PATHS.top10,
      streaming: APP_PATHS.platforms,
      tv: APP_PATHS.guide,
      sports: APP_PATHS.sports,
    }[value];
    if (target) {
      void this.router.navigateByUrl(target);
    }
  }

  public selectCategory(slug: string): void {
    this.selectedCategory = slug;
    this.buildStructuredData();
    this.changeDetector.markForCheck();
  }

  public get filteredPosts(): EditorialPost[] {
    if (this.selectedCategory === 'all') {
      return this.posts;
    }
    return this.posts.filter((post) =>
      post.categories.some((category) => category.slug === this.selectedCategory)
    );
  }

  private buildStructuredData(): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schemas = [
      generateCollectionPageSchema(
        {
          name: 'Rankings editoriales de Guia TV',
          description:
            'Selecciones editoriales y rankings de series, peliculas y streaming conectados con la app.',
          path: '/editorial/rankings',
        },
        baseUrl
      ),
      generateItemListSchema(
        this.filteredPosts.map((post) => ({
          title: post.title,
          detailPath: post.canonicalPath,
          image: post.coverImage,
        })),
        'Rankings editoriales de Guia TV',
        baseUrl
      ),
    ];
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      schemas
        .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
        .join('')
    );
  }
}
