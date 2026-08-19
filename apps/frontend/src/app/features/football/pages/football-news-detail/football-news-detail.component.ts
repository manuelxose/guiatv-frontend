import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { BlogService } from '@app/services/blog.service';
import { FootballNewsDTO } from '@app/features/football/football.models';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema, generateFootballNewsSchema } from '@app/features/football/football-seo';

interface ArticleView {
  article: FootballNewsDTO;
  body: SafeHtml;
  relatedCompetition: { slug: string; name: string } | null;
}

function mapPostToArticle(post: any, sanitizer: DomSanitizer): ArticleView | null {
  if (!post) return null;
  const article: FootballNewsDTO = {
    id: String(post.id || ''),
    slug: post.slug,
    title: post.title?.rendered || post.title || '',
    excerpt: post.excerpt?.rendered || post.excerpt || '',
    contentType: post.contentType || 'news',
    author: { name: post.author?.name || (post.author?.name ?? undefined) },
    coverImage: post.featured_image?.source_url || post.seo?.ogImage || null,
    publishedAt: post.date || new Date().toISOString(),
    updatedAt: post.modified,
    sportsRelations: post.sportsRelations || { teamIds: [], competitionIds: [], matchIds: [] },
  };
  const body = sanitizer.bypassSecurityTrustHtml(post.content?.rendered || post.content || '');
  const competitionId = article.sportsRelations.competitionIds?.[0];
  const relatedCompetition = competitionId
    ? { slug: String(competitionId).replace(/^catalog:/, ''), name: '' }
    : null;
  return { article, body, relatedCompetition };
}

@Component({
  selector: 'app-football-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>

      <article *ngIf="view() as data" class="article">
        <header class="article__head">
          <p class="article__eyebrow">{{ contentTypeLabel(data.article.contentType) }}</p>
          <h1 class="article__title">{{ data.article.title }}</h1>
          <div class="article__meta">
            <span *ngIf="data.article.author?.name">Por {{ data.article.author?.name }}</span>
            <time [attr.datetime]="data.article.publishedAt">{{ formatDate(data.article.publishedAt) }}</time>
            <span *ngIf="data.article.externalSource">
              · Fuente: <a [href]="data.article.externalSource.url" target="_blank" rel="noopener">{{ data.article.externalSource.name }}</a>
            </span>
          </div>
        </header>

        <img *ngIf="data.article.coverImage" [src]="data.article.coverImage" [alt]="data.article.title" class="article__cover" />

        <div class="article__body" [innerHTML]="data.body"></div>

        <footer class="article__relations">
          <a
            *ngIf="data.relatedCompetition"
            class="relation"
            [routerLink]="['/deportes/futbol/competiciones', data.relatedCompetition.slug]"
          >
            Ver competición
          </a>
        </footer>
      </article>

      <div *ngIf="!view() && !loading()" class="empty">
        <p class="empty__title">Artículo no encontrado</p>
        <a class="empty__link" routerLink="/deportes/futbol/noticias">Ver noticias</a>
      </div>
    </div>
  `,
  styles: `
    .shell { max-width: 46rem; margin: 0 auto; padding: 1rem; }
    .article { display: flex; flex-direction: column; gap: 1rem; }
    .article__head { display: flex; flex-direction: column; gap: 0.5rem; }
    .article__eyebrow {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--football-accent, #22c55e);
    }
    .article__title { margin: 0; font-size: 1.75rem; font-weight: 900; line-height: 1.2; color: var(--football-text, #f1f5f9); }
    .article__meta { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.8125rem; color: var(--football-text-muted, #94a3b8); }
    .article__meta a { color: var(--football-accent, #22c55e); }
    .article__cover { width: 100%; border-radius: 0.75rem; object-fit: cover; }
    .article__body { color: var(--football-text, #e2e8f0); line-height: 1.7; }
    .article__relations { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid var(--football-border, rgba(148, 163, 184, 0.18)); }
    .relation {
      display: inline-block;
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.2));
      border-radius: 9999px;
      color: var(--football-text, #e2e8f0);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 650;
    }
    .relation:hover { border-color: var(--football-accent, #22c55e); }
    .empty { border: 1px dashed var(--football-border, rgba(148, 163, 184, 0.25)); border-radius: 0.75rem; padding: 2rem; text-align: center; }
    .empty__title { margin: 0 0 0.5rem; font-weight: 750; color: var(--football-text, #e2e8f0); }
    .empty__link { color: var(--football-accent, #22c55e); font-weight: 700; }
  `,
})
export class FootballNewsDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  safeLdHtml: SafeHtml | null = null;

  readonly view = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') || ''),
      switchMap((slug) =>
        this.blogService.getAllPosts().pipe(
          map((posts) => {
            const post = (posts || []).find((item: any) => item.slug === slug);
            return mapPostToArticle(post, this.sanitizer);
          })
        )
      )
    ),
    { initialValue: null as ArticleView | null }
  );

  constructor() {
    effect(() => {
      const view = this.view();
      this.loading.set(false);
      if (view) {
        this.applyMeta(view.article);
      }
    });
  }

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Noticia de fútbol - Guía TV',
      description: 'Noticias y actualidad futbolística.',
      canonicalUrl: '/deportes/futbol/noticias',
      robots: 'noindex, follow',
    });
  }

  contentTypeLabel(type: string): string {
    switch (type) {
      case 'analysis': return 'Análisis';
      case 'preview': return 'Previa';
      case 'match-report': return 'Crónica';
      case 'guide': return 'Guía';
      case 'ranking': return 'Ranking';
      case 'trend': return 'Tendencia';
      default: return 'Noticia';
    }
  }

  formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private applyMeta(article: FootballNewsDTO): void {
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
}
