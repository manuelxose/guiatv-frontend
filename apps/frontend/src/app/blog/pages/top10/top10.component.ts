import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { APP_PATHS } from '../../../config/route-map';
import { MetaService } from '../../../services/meta.service';
import { EditorialCategory, EditorialPost } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { generateCollectionPageSchema, generateItemListSchema } from '../../../utils/utils';
import { UnifiedPortalShellComponent } from '../../../components/unified-portal-shell/unified-portal-shell.component';
import { EditorialMastheadComponent } from '../../components/editorial-masthead/editorial-masthead.component';
import { PortalContextNavComponent } from '../../../components/portal-context-nav/portal-context-nav.component';
import { UnifiedAsyncStateComponent } from '../../../components/unified-async-state/unified-async-state.component';
import { UnifiedSkeletonBlockComponent } from '../../../components/unified-skeleton-block/unified-skeleton-block.component';

@Component({
  selector: 'app-top10',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedPortalShellComponent,
    EditorialMastheadComponent,
    PortalContextNavComponent,
    UnifiedAsyncStateComponent,
    UnifiedSkeletonBlockComponent,
  ],
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Top10Component implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly breadcrumbItems = [
    { name: 'Inicio', url: APP_PATHS.home },
    { name: 'Blog', url: APP_PATHS.blog },
    { name: 'Rankings', url: APP_PATHS.top10 },
  ];

  public loading = true;
  public error: string | null = null;
  public featured: EditorialPost | null = null;
  public posts: EditorialPost[] = [];
  public categories: EditorialCategory[] = [];
  public selectedCategory = 'all';
  public safeLdHtml: SafeHtml | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly editorialService: EditorialService,
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Rankings editoriales de cine, series y streaming | Guía TV',
      description:
        'Listas, tops y selecciones editoriales conectadas con la guía, el catálogo y las plataformas reales de la app.',
      canonicalUrl: '/editorial/rankings',
      image: '/assets/images/blog-og-image.webp',
      type: 'website',
    });

    this.loadRankings();
  }

  private loadRankings(): void {
    this.loading = true;
    this.error = null;
    this.changeDetector.markForCheck();

    this.editorialService
      .getRankingsPageState()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          this.featured = state.featured;
          this.posts = state.posts;
          this.categories = state.categories;
          this.buildStructuredData();
          this.loading = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.error = 'No se han podido cargar los rankings. Comprueba tu conexión e inténtalo de nuevo.';
          this.loading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public selectCategory(slug: string): void {
    this.selectedCategory = slug;
    this.buildStructuredData();
    this.changeDetector.markForCheck();
  }

  public retry(): void {
    this.loadRankings();
  }

  public trackPost(_index: number, post: EditorialPost): string {
    return post.slug;
  }

  public get filteredPosts(): EditorialPost[] {
    if (this.selectedCategory === 'all') {
      return this.posts;
    }
    return this.posts.filter((post) =>
      post.categories.some((category) => category.slug === this.selectedCategory)
    );
  }

  public get selectedCategoryName(): string {
    if (this.selectedCategory === 'all') {
      return 'Selecciones editoriales';
    }
    const category = this.categories.find((item) => item.slug === this.selectedCategory);
    return category ? `Rankings de ${category.name}` : 'Selecciones editoriales';
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
