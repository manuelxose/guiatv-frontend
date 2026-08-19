import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

@Component({
  selector: 'app-football-competitions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>

      <header class="head">
        <h1 class="head__title">Competiciones de fútbol</h1>
        <p class="head__sub">Ligas, copas y torneos internacionales.</p>
      </header>

      <div class="grid">
        <a
          *ngFor="let competition of competitions()"
          class="card"
          [routerLink]="['/deportes/futbol/competiciones', competition.slug]"
        >
          <img *ngIf="competition.logo" [src]="competition.logo" [alt]="''" class="card__logo" />
          <span *ngIf="!competition.logo" class="card__logo card__logo--fallback">{{ competition.shortName || competition.name }}</span>
          <span class="card__body">
            <span class="card__name">{{ competition.name }}</span>
            <span class="card__country">{{ competition.country }}</span>
          </span>
        </a>
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
    .card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.18));
      border-radius: 0.75rem;
      background: var(--football-card-bg, rgba(15, 23, 42, 0.6));
      color: inherit;
      text-decoration: none;
    }
    .card:hover { border-color: var(--football-accent, #22c55e); }
    .card__logo {
      width: 2.5rem;
      height: 2.5rem;
      flex: 0 0 auto;
      object-fit: contain;
      border-radius: 0.5rem;
    }
    .card__logo--fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--football-text-muted, #94a3b8);
      background: rgba(148, 163, 184, 0.14);
    }
    .card__body { display: flex; flex-direction: column; min-width: 0; }
    .card__name { font-weight: 750; color: var(--football-text, #e2e8f0); }
    .card__country { font-size: 0.75rem; color: var(--football-text-muted, #94a3b8); }
  `,
})
export class FootballCompetitionsComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly competitions = toSignal(this.facade.getCompetitions(), { initialValue: [] });
  safeLdHtml: SafeHtml | null = null;

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Competiciones de fútbol: LaLiga, Champions, Premier - Guía TV',
      description: 'Todas las competiciones de fútbol: LaLiga, Champions League, Europa League, Copa del Rey y más.',
      canonicalUrl: '/deportes/futbol/competiciones',
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(
        generateFootballBreadcrumbSchema(
          [
            { name: 'Inicio', path: '/' },
            { name: 'Fútbol', path: '/deportes/futbol' },
            { name: 'Competiciones', path: '/deportes/futbol/competiciones' },
          ],
          baseUrl
        )
      )}</script>`
    );
  }
}
