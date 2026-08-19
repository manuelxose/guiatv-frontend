import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballMatchDTO } from '@app/features/football/football.models';
import { FootballMatchCardComponent } from '@app/features/football/components/football-match-card/football-match-card.component';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

interface CompetitionGroup {
  competition: string;
  logo?: string;
  matches: FootballMatchDTO[];
}

@Component({
  selector: 'app-football-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FootballMatchCardComponent,
    FootballNewsCardComponent,
    FootballSectionHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>

      <header class="home__header">
        <div>
          <p class="home__eyebrow">Deportes</p>
          <h1 class="home__title">Fútbol</h1>
        </div>
        <a class="home__search" [routerLink]="['/deportes/futbol/noticias']" aria-label="Noticias de fútbol">Noticias</a>
      </header>

      <nav class="home__nav" aria-label="Navegación de fútbol">
        <a class="home__nav-item home__nav-item--active" [routerLink]="['/deportes/futbol']">Inicio</a>
        <a class="home__nav-item" [routerLink]="['/deportes/futbol/partidos-hoy']">Partidos</a>
        <a class="home__nav-item" [routerLink]="['/deportes/futbol/competiciones']">Competiciones</a>
        <a class="home__nav-item" [routerLink]="['/deportes/futbol/noticias']">Noticias</a>
      </nav>

      <main class="home__content">
        <!-- LIVE NOW -->
        <section *ngIf="home()?.liveMatches?.length" class="home__section">
          <app-football-section-header eyebrow="Ahora" title="En directo"></app-football-section-header>
          <div class="home__grid">
            <app-football-match-card
              *ngFor="let match of home()?.liveMatches"
              [match]="match"
              variant="live"
            ></app-football-match-card>
          </div>
        </section>

        <!-- TODAY -->
        <section class="home__section">
          <app-football-section-header
            eyebrow="Hoy"
            title="Partidos de hoy"
            link="/deportes/futbol/partidos-hoy"
          ></app-football-section-header>

          <div class="home__grid">
            <app-football-match-card
              *ngFor="let match of home()?.todayMatches"
              [match]="match"
            ></app-football-match-card>
          </div>

          <div *ngIf="!home()?.todayMatches?.length && !home()?.liveMatches?.length" class="home__empty">
            <p class="home__empty-title">No hay partidos en directo ahora mismo</p>
            <p class="home__empty-sub">
              Consulta los próximos partidos y las últimas noticias.
            </p>
          </div>
        </section>

        <!-- FEATURED -->
        <section *ngIf="home()?.featuredMatches?.length" class="home__section">
          <app-football-section-header eyebrow="Destacados" title="No te pierdas"></app-football-section-header>
          <div class="home__grid">
            <app-football-match-card
              *ngFor="let match of home()?.featuredMatches"
              [match]="match"
              variant="featured"
            ></app-football-match-card>
          </div>
        </section>

        <!-- NEWS -->
        <section *ngIf="home()?.latestNews?.length" class="home__section">
          <app-football-section-header
            eyebrow="Actualidad"
            title="Noticias"
            link="/deportes/futbol/noticias"
          ></app-football-section-header>
          <div class="home__news">
            <app-football-news-card
              *ngFor="let article of home()?.latestNews"
              [item]="article"
            ></app-football-news-card>
          </div>
        </section>

        <!-- UPCOMING -->
        <section *ngIf="home()?.upcomingMatches?.length" class="home__section">
          <app-football-section-header
            eyebrow="Próximos"
            title="Próximos partidos"
            link="/deportes/futbol/calendario"
          ></app-football-section-header>
          <div class="home__grid">
            <app-football-match-card
              *ngFor="let match of home()?.upcomingMatches?.slice(0, 6)"
              [match]="match"
              variant="compact"
            ></app-football-match-card>
          </div>
        </section>

        <!-- COMPETITIONS -->
        <section class="home__section">
          <app-football-section-header
            eyebrow="Torneos"
            title="Competiciones"
            link="/deportes/futbol/competiciones"
          ></app-football-section-header>
          <div class="home__competitions">
            <a
              *ngFor="let competition of home()?.featuredCompetitions"
              class="home__comp-chip"
              [routerLink]="['/deportes/futbol/competiciones', competition.slug]"
            >
              <img *ngIf="competition.logo" [src]="competition.logo" [alt]="''" />
              <span>{{ competition.shortName || competition.name }}</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: `
    .shell { max-width: 72rem; margin: 0 auto; padding: 1rem; }
    .home__header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }
    .home__eyebrow {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--football-accent, #22c55e);
    }
    .home__title {
      margin: 0;
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: var(--football-text, #f1f5f9);
    }
    .home__search {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--football-text-muted, #94a3b8);
      text-decoration: none;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.2));
      border-radius: 9999px;
      padding: 0.375rem 0.875rem;
    }

    .home__nav {
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      padding: 0.25rem 0 0.75rem;
      position: sticky;
      top: 0;
      background: var(--portal-bg, #0b1220);
      z-index: 10;
    }
    .home__nav-item {
      flex: 0 0 auto;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--football-text-muted, #94a3b8);
      text-decoration: none;
      border: 1px solid transparent;
    }
    .home__nav-item--active {
      color: #0f172a;
      background: var(--football-accent, #22c55e);
    }

    .home__content { display: flex; flex-direction: column; gap: 1.5rem; }
    .home__grid { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
    @media (min-width: 640px) { .home__grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .home__grid { grid-template-columns: repeat(3, 1fr); } }

    .home__news { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
    @media (min-width: 640px) { .home__news { grid-template-columns: repeat(2, 1fr); } }

    .home__competitions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .home__comp-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.2));
      border-radius: 9999px;
      color: var(--football-text, #e2e8f0);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 650;
      background: var(--football-card-bg, rgba(15, 23, 42, 0.6));
    }
    .home__comp-chip img { width: 1.25rem; height: 1.25rem; object-fit: contain; }
    .home__comp-chip:hover { border-color: var(--football-accent, #22c55e); }

    .home__empty {
      border: 1px dashed var(--football-border, rgba(148, 163, 184, 0.25));
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
    }
    .home__empty-title { margin: 0 0 0.25rem; font-weight: 750; color: var(--football-text, #e2e8f0); }
    .home__empty-sub { margin: 0; font-size: 0.875rem; color: var(--football-text-muted, #94a3b8); }
  `,
})
export class FootballHomeComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly home = toSignal(this.facade.getHome(), { initialValue: null });
  safeLdHtml: SafeHtml | null = null;

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Fútbol hoy: partidos en directo, horarios y dónde verlos - Guía TV',
      description:
        'Partidos de fútbol de hoy, en directo, próximos partidos, clasificaciones y dónde ver cada partido por TV y streaming.',
      canonicalUrl: '/deportes/futbol',
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    const breadcrumb = generateFootballBreadcrumbSchema(
      [
        { name: 'Inicio', path: '/' },
        { name: 'Deportes', path: '/deportes/futbol' },
        { name: 'Fútbol', path: '/deportes/futbol' },
      ],
      baseUrl
    );
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`
    );
  }
}
