import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

@Component({
  selector: 'app-football-news',
  standalone: true,
  imports: [CommonModule, FootballNewsCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>

      <header class="head">
        <h1 class="head__title">Noticias de fútbol</h1>
        <p class="head__sub">Última hora, previas, crónicas y análisis.</p>
      </header>

      <div class="grid">
        <app-football-news-card *ngFor="let article of news()" [item]="article"></app-football-news-card>
      </div>

      <div *ngIf="!news()?.length" class="empty">
        <p class="empty__title">Todavía no hay noticias</p>
        <p class="empty__sub">Las noticias de fútbol aparecerán aquí cuando estén disponibles.</p>
      </div>
    </div>
  `,
  styles: `
    .shell { max-width: 72rem; margin: 0 auto; padding: 1rem; }
    .head { margin-bottom: 1rem; }
    .head__title { margin: 0; font-size: 1.5rem; font-weight: 900; color: var(--football-text, #f1f5f9); }
    .head__sub { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--football-text-muted, #94a3b8); }
    .grid { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
    @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    .empty { border: 1px dashed var(--football-border, rgba(148, 163, 184, 0.25)); border-radius: 0.75rem; padding: 2rem; text-align: center; }
    .empty__title { margin: 0 0 0.25rem; font-weight: 750; color: var(--football-text, #e2e8f0); }
    .empty__sub { margin: 0; font-size: 0.875rem; color: var(--football-text-muted, #94a3b8); }
  `,
})
export class FootballNewsComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly news = toSignal(this.facade.getNews({ limit: 24 }), { initialValue: [] });
  safeLdHtml: SafeHtml | null = null;

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Noticias de fútbol: última hora, previas y crónicas - Guía TV',
      description: 'Noticias de fútbol: última hora, previas, crónicas y análisis de LaLiga, Champions y más.',
      canonicalUrl: '/deportes/futbol/noticias',
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(
        generateFootballBreadcrumbSchema(
          [
            { name: 'Inicio', path: '/' },
            { name: 'Fútbol', path: '/deportes/futbol' },
            { name: 'Noticias', path: '/deportes/futbol/noticias' },
          ],
          baseUrl
        )
      )}</script>`
    );
  }
}
