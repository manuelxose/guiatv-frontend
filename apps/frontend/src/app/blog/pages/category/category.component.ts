import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, map, switchMap, takeUntil } from 'rxjs';
import { APP_PATHS } from '../../../config/route-map';
import { UnifiedPortalShellComponent } from '../../../components/unified-portal-shell/unified-portal-shell.component';
import { UnifiedTopNavTab } from '../../../components/unified-top-nav/unified-top-nav.component';
import { MetaService } from '../../../services/meta.service';
import { UserService } from '../../../services/user.service';
import { EditorialCategoryPageState } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { generateCollectionPageSchema, generateItemListSchema } from '../../../utils/utils';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { PORTAL_ICON_PATHS } from '../../../config/portal-navigation.config';
import { UnifiedPortalRailSection } from '../../../models/portal-shell.models';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterModule, UnifiedPortalShellComponent, EditorialPostCardComponent],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly iconPaths = PORTAL_ICON_PATHS;
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
      id: 'category-left',
      eyebrow: 'Editorial',
      title: 'Cruces rápidos',
      description: 'La categoría vive dentro del mismo sistema del portal.',
      items: [
        { id: 'category-left-home', label: 'Editorial', description: 'Volver al hub', iconPath: this.iconPaths.editorial, path: APP_PATHS.blog },
        { id: 'category-left-rankings', label: 'Rankings', description: 'Top listas', iconPath: this.iconPaths.rankings, path: APP_PATHS.top10 },
        { id: 'category-left-discover', label: 'Qué Ver', description: 'Discovery principal', iconPath: this.iconPaths.discover, path: APP_PATHS.explore },
      ],
    },
  ]);
  public readonly rightRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'category-right',
      eyebrow: 'Contexto',
      title: 'Usa la categoría para entrar',
      description: 'Cruce corto con discovery, tendencias y plataformas.',
      variant: 'compact',
      items: [
        { id: 'category-right-platforms', label: 'Plataformas', description: 'Ver servicios', iconPath: this.iconPaths.platforms, path: APP_PATHS.platforms },
        { id: 'category-right-trends', label: 'Tendencias', description: 'Pulso del catálogo', iconPath: this.iconPaths.trends, path: APP_PATHS.stats },
      ],
    },
  ]);

  public loading = true;
  public error: string | null = null;
  public state: EditorialCategoryPageState | null = null;
  public safeLdHtml: SafeHtml | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly editorialService: EditorialService,
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') || ''),
        switchMap((slug) => this.editorialService.getCategoryPageState(slug)),
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
          this.metaService.setMetaTags({
            title: `${state.category.name} | Editorial Guía TV`,
            description:
              state.category.description ||
              `Artículos y rankings editoriales relacionados con ${state.category.name}.`,
            canonicalUrl: state.category.canonicalPath,
            image:
              state.featuredPost?.coverImage || '/assets/images/blog-og-image.webp',
            type: 'website',
          });
          this.buildStructuredData(state);
        },
        error: () => {
          this.error = 'No se ha podido cargar esta categoría editorial.';
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public get breadcrumbItems(): Array<{ name: string; url: string }> {
    return [
      { name: 'Inicio', url: APP_PATHS.home },
      { name: 'Editorial', url: APP_PATHS.blog },
      ...(this.state ? [{ name: this.state.category.name, url: this.state.category.canonicalPath }] : []),
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

  private buildStructuredData(state: EditorialCategoryPageState): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schemas = [
      generateCollectionPageSchema(
        {
          name: `${state.category.name} - Editorial Guia TV`,
          description:
            state.category.description ||
            `Coleccion editorial de ${state.category.name} en Guia TV.`,
          path: state.category.canonicalPath,
        },
        baseUrl
      ),
      generateItemListSchema(
        [state.featuredPost, ...state.posts]
          .filter((post): post is NonNullable<typeof post> => Boolean(post))
          .map((post) => ({
            title: post.title,
            detailPath: post.canonicalPath,
            image: post.coverImage,
          })),
        `${state.category.name} - Editorial Guia TV`,
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
