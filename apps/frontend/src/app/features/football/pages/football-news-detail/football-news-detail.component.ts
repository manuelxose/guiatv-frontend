import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballNewsDTO } from '@app/features/football/football.models';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema, generateFootballNewsSchema } from '@app/features/football/football-seo';

type ArticleState =
  | { status: 'loading' }
  | { status: 'found'; article: FootballNewsDTO }
  | { status: 'not-found' };

const CONTENT_TYPE_LABELS: Record<string, string> = {
  analysis: 'Análisis',
  preview: 'Previa',
  'match-report': 'Crónica',
  guide: 'Guía',
  ranking: 'Ranking',
  trend: 'Tendencia',
};

@Component({
  selector: 'app-football-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-news-detail.component.html',
  styleUrl: './football-news-detail.component.scss',
})
export class FootballNewsDetailComponent {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  // Same discriminated state as every other football detail page — meta
  // must only ever resolve to noindex once the article is positively known
  // to be missing, never as a race-prone default.
  readonly state = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') || ''),
      switchMap((slug) =>
        this.facade.getNewsItem(slug).pipe(
          map((article): ArticleState => (article ? { status: 'found', article } : { status: 'not-found' }))
        )
      )
    ),
    { initialValue: { status: 'loading' } as ArticleState }
  );

  readonly loading = computed(() => this.state().status === 'loading');
  readonly article = computed(() => {
    const state = this.state();
    return state.status === 'found' ? state.article : null;
  });

  // Only sanitize once an article is actually found — content is only
  // populated on this single-article fetch, never on list surfaces.
  readonly body = computed<SafeHtml | null>(() => {
    const content = this.article()?.content;
    return content ? this.sanitizer.bypassSecurityTrustHtml(content) : null;
  });

  safeLdHtml: SafeHtml | null = null;

  constructor() {
    effect(() => {
      const state = this.state();
      if (state.status === 'found') {
        this.applyDetailMeta(state.article);
      } else if (state.status === 'not-found') {
        this.applyNotFoundMeta();
      }
    });
  }

  contentTypeLabel(type: string): string {
    return CONTENT_TYPE_LABELS[type] ?? 'Noticia';
  }

  formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private applyDetailMeta(article: FootballNewsDTO): void {
    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.meta.setMetaTags({
      title: `${article.title} - Guía TV`,
      description: article.excerpt || 'Noticia de fútbol en Guía Programación TV.',
      canonicalUrl: `/deportes/futbol/noticias/${article.slug}`,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      section: 'Fútbol',
      ogImage: article.coverImage || undefined,
    });

    const schemas = [
      generateFootballNewsSchema(article, baseUrl),
      generateFootballBreadcrumbSchema(
        [
          { name: 'Inicio', path: '/' },
          { name: 'Fútbol', path: '/deportes/futbol' },
          { name: 'Noticias', path: '/deportes/futbol/noticias' },
          { name: article.title, path: `/deportes/futbol/noticias/${article.slug}` },
        ],
        baseUrl
      ),
    ];
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      schemas
        .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
        .join('')
    );
  }

  private applyNotFoundMeta(): void {
    this.meta.setMetaTags({
      title: 'Artículo no encontrado - Guía TV',
      description: 'Este artículo no está disponible.',
      canonicalUrl: '/deportes/futbol/noticias',
      robots: 'noindex, follow',
    });
  }
}
