import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { APP_PATHS } from '../../../config/route-map';
import { MetaService } from '../../../services/meta.service';
import { EditorialCategorySection, EditorialPost } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { generateCollectionPageSchema } from '../../../utils/utils';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [CommonModule, RouterModule, EditorialPostCardComponent],
  templateUrl: './blog-home.component.html',
  styleUrls: ['./blog-home.component.scss'],
})
export class BlogHomeComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;

  public loading = true;
  public error: string | null = null;
  public hero: EditorialPost | null = null;
  public guidePosts: EditorialPost[] = [];
  public rankingPosts: EditorialPost[] = [];
  public trendPosts: EditorialPost[] = [];
  public categorySections: EditorialCategorySection[] = [];
  public safeLdHtml: SafeHtml | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly editorialService: EditorialService,
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Editorial de cine, series y streaming | Guía TV',
      description:
        'Reportajes, guías y rankings conectados con la app para descubrir qué ver, dónde verlo y por qué merece la pena.',
      canonicalUrl: '/editorial',
      image: '/assets/images/blog-og-image.jpg',
      type: 'website',
    });
    this.buildStructuredData();

    this.editorialService
      .getHubState()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          this.hero = state.hero;
          this.guidePosts = state.guidePosts;
          this.rankingPosts = state.rankingPosts;
          this.trendPosts = state.trendPosts;
          this.categorySections = state.categorySections;
          this.loading = false;
        },
        error: () => {
          this.error = 'No se ha podido cargar la capa editorial.';
          this.loading = false;
        },
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
        name: 'Editorial Guia TV',
        description:
          'Guias, rankings y tendencias conectadas con la programacion TV, las plataformas y el descubrimiento de la app.',
        path: '/editorial',
      },
      baseUrl
    );
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
}
