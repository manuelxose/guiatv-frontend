import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, map, switchMap, takeUntil } from 'rxjs';
import { APP_PATHS } from '../../../config/route-map';
import { MetaService } from '../../../services/meta.service';
import { EditorialCategoryPageState } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { generateCollectionPageSchema, generateItemListSchema } from '../../../utils/utils';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterModule, EditorialPostCardComponent],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;

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
    private readonly sanitizer: DomSanitizer
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
              state.featuredPost?.coverImage || '/assets/images/blog-og-image.jpg',
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
