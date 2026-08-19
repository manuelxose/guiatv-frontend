import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballCompetitionDetailDTO } from '@app/features/football/football.models';
import { FootballMatchCardComponent } from '@app/features/football/components/football-match-card/football-match-card.component';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballStandingsTableComponent } from '@app/features/football/components/football-standings-table/football-standings-table.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

@Component({
  selector: 'app-football-competition-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FootballMatchCardComponent,
    FootballNewsCardComponent,
    FootballStandingsTableComponent,
    FootballSectionHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>

      <div *ngIf="detail() as data">
        <header class="head">
          <img *ngIf="data.competition.logo" [src]="data.competition.logo" [alt]="''" class="head__logo" />
          <div>
            <h1 class="head__title">{{ data.competition.name }}</h1>
            <p class="head__sub">{{ data.competition.country }}</p>
          </div>
        </header>

        <section *ngIf="data.standings?.length" class="block">
          <app-football-section-header eyebrow="Tabla" title="Clasificación"></app-football-section-header>
          <app-football-standings-table [standings]="data.standings"></app-football-standings-table>
        </section>

        <section class="block">
          <app-football-section-header eyebrow="Partidos" title="Partidos y resultados"></app-football-section-header>
          <div class="grid">
            <app-football-match-card
              *ngFor="let match of data.matches"
              [match]="match"
              variant="compact"
            ></app-football-match-card>
          </div>
          <p *ngIf="!data.matches?.length" class="muted">Sin partidos disponibles para esta competición.</p>
        </section>

        <section *ngIf="data.news?.length" class="block">
          <app-football-section-header eyebrow="Actualidad" title="Noticias"></app-football-section-header>
          <div class="news-grid">
            <app-football-news-card *ngFor="let article of data.news" [item]="article"></app-football-news-card>
          </div>
        </section>
      </div>

      <div *ngIf="!detail() && !loading()" class="empty">
        <p class="empty__title">Competición no encontrada</p>
        <a class="empty__link" routerLink="/deportes/futbol/competiciones">Ver competiciones</a>
      </div>
    </div>
  `,
  styles: `
    .shell { max-width: 72rem; margin: 0 auto; padding: 1rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .head { display: flex; align-items: center; gap: 0.875rem; }
    .head__logo { width: 3rem; height: 3rem; object-fit: contain; }
    .head__title { margin: 0; font-size: 1.5rem; font-weight: 900; color: var(--football-text, #f1f5f9); }
    .head__sub { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--football-text-muted, #94a3b8); }
    .block { display: flex; flex-direction: column; gap: 0.625rem; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
    @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    .news-grid { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
    @media (min-width: 640px) { .news-grid { grid-template-columns: repeat(2, 1fr); } }
    .muted { color: var(--football-text-muted, #94a3b8); font-size: 0.875rem; }
    .empty { border: 1px dashed var(--football-border, rgba(148, 163, 184, 0.25)); border-radius: 0.75rem; padding: 2rem; text-align: center; }
    .empty__title { margin: 0 0 0.5rem; font-weight: 750; color: var(--football-text, #e2e8f0); }
    .empty__link { color: var(--football-accent, #22c55e); font-weight: 700; }
  `,
})
export class FootballCompetitionDetailComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  safeLdHtml: SafeHtml | null = null;

  readonly detail = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') || ''),
      switchMap((slug) => this.facade.getCompetition(slug))
    ),
    { initialValue: null as FootballCompetitionDetailDTO | null }
  );

  constructor() {
    effect(() => {
      const detail = this.detail();
      this.loading.set(false);
      if (detail) {
        this.applyMeta(detail);
      }
    });
  }

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Competición de fútbol - Guía TV',
      description: 'Partidos, clasificación y noticias de la competición.',
      canonicalUrl: '/deportes/futbol/competiciones',
      robots: 'noindex, follow',
    });
  }

  private applyMeta(detail: FootballCompetitionDetailDTO): void {
    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.meta.setMetaTags({
      title: `${detail.competition.name} - partidos, clasificación y dónde verlos - Guía TV`,
      description: `${detail.competition.name}: partidos, resultados, clasificación y noticias.`,
      canonicalUrl: `/deportes/futbol/competiciones/${detail.competition.slug}`,
    });
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(
        generateFootballBreadcrumbSchema(
          [
            { name: 'Inicio', path: '/' },
            { name: 'Fútbol', path: '/deportes/futbol' },
            { name: 'Competiciones', path: '/deportes/futbol/competiciones' },
            { name: detail.competition.name, path: `/deportes/futbol/competiciones/${detail.competition.slug}` },
          ],
          baseUrl
        )
      )}</script>`
    );
  }
}
