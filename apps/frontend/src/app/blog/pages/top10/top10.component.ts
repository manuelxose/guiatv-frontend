import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { APP_PATHS } from '../../../config/route-map';
import { MetaService } from '../../../services/meta.service';
import { EditorialCategory, EditorialCategorySection, EditorialPost } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { generateCollectionPageSchema, generateItemListSchema } from '../../../utils/utils';

@Component({
  selector: 'app-top10',
  standalone: true,
  imports: [CommonModule, RouterModule, EditorialPostCardComponent],
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss'],
})
export class Top10Component implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;

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
    private readonly sanitizer: DomSanitizer
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
        },
        error: () => {
          this.error = 'No se han podido cargar los rankings editoriales.';
          this.loading = false;
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
