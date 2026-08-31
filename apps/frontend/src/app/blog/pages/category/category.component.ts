import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, combineLatest, map, of, startWith, switchMap, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { APP_PATHS } from '../../../config/route-map';
import { UnifiedPortalShellComponent } from '../../../components/unified-portal-shell/unified-portal-shell.component';
import { MetaService } from '../../../services/meta.service';
import { EditorialCategoryPageState } from '../../models/editorial.models';
import { EditorialPost } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { generateCollectionPageSchema, generateItemListSchema } from '../../../utils/utils';
import { PortalContextNavComponent } from '../../../components/portal-context-nav/portal-context-nav.component';
import { UnifiedAsyncStateComponent } from '../../../components/unified-async-state/unified-async-state.component';
import { UnifiedSkeletonBlockComponent } from '../../../components/unified-skeleton-block/unified-skeleton-block.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterModule, UnifiedPortalShellComponent, EditorialPostCardComponent, PortalContextNavComponent, UnifiedAsyncStateComponent, UnifiedSkeletonBlockComponent],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public loading = true;
  public error: string | null = null;
  public state: EditorialCategoryPageState | null = null;
  public safeLdHtml: SafeHtml | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly retryTrigger$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly editorialService: EditorialService,
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

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
          return this.editorialService.getCategoryPageState(slug).pipe(
            map((state) => ({ state, failed: false })),
            catchError(() => of({ state: null, failed: true }))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ state, failed }) => {
          if (failed) {
            this.error = 'No se ha podido cargar esta categoría. Comprueba tu conexión e inténtalo de nuevo.';
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
          this.metaService.setMetaTags({
            title: `${state.category.name} | Blog Guía TV`,
            description:
              state.category.description ||
              `Artículos y rankings editoriales relacionados con ${state.category.name}.`,
            canonicalUrl: state.category.canonicalPath,
            image:
              state.featuredPost?.coverImage || '/assets/images/blog-og-image.webp',
            type: 'website',
            robots: [state.featuredPost, ...state.posts, ...state.relatedRankings].filter(Boolean).length >= 3
              ? 'index, follow'
              : 'noindex, follow',
          });
          this.buildStructuredData(state);
          this.changeDetector.markForCheck();
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

  public trackPost(_index: number, post: EditorialPost): string {
    return post.slug;
  }

  public get breadcrumbItems(): Array<{ name: string; url: string }> {
    return [
      { name: 'Inicio', url: APP_PATHS.home },
      { name: 'Blog', url: APP_PATHS.blog },
      ...(this.state ? [{ name: this.state.category.name, url: this.state.category.canonicalPath }] : []),
    ];
  }

  private buildStructuredData(state: EditorialCategoryPageState): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schemas = [
      generateCollectionPageSchema(
        {
          name: `${state.category.name} - Blog Guía TV`,
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
        `${state.category.name} - Blog Guía TV`,
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
