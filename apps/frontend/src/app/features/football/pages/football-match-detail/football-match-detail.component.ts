import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballMatchDetailDTO } from '@app/features/football/football.models';
import { FootballScoreboardComponent } from '@app/features/football/components/football-scoreboard/football-scoreboard.component';
import { FootballBroadcastListComponent } from '@app/features/football/components/football-broadcast-list/football-broadcast-list.component';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema, generateFootballMatchSchema } from '@app/features/football/football-seo';

@Component({
  selector: 'app-football-match-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FootballScoreboardComponent,
    FootballBroadcastListComponent,
    FootballNewsCardComponent,
    FootballSectionHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>

      <div *ngIf="detail() as data">
        <app-football-scoreboard [match]="data.match"></app-football-scoreboard>

        <div class="grid">
          <main class="grid__main">
            <section *ngIf="data.match.broadcasts?.length" class="block">
              <app-football-broadcast-list [broadcasts]="data.match.broadcasts"></app-football-broadcast-list>
            </section>

            <section *ngIf="data.match.venue" class="block">
              <h2 class="block__title">Estadio</h2>
              <p class="block__text">{{ data.match.venue }}</p>
            </section>

            <section *ngIf="data.relatedNews?.length" class="block">
              <app-football-section-header eyebrow="Información" title="Noticias sobre este partido"></app-football-section-header>
              <div class="news-grid">
                <app-football-news-card
                  *ngFor="let article of data.relatedNews"
                  [item]="article"
                ></app-football-news-card>
              </div>
            </section>
          </main>

          <aside class="grid__aside">
            <a
              class="aside-link"
              [routerLink]="['/deportes/futbol/competiciones', data.match.competition.slug]"
            >
              Ver competición: {{ data.match.competition.name }}
            </a>
            <a class="aside-link" [routerLink]="['/deportes/futbol/equipos', data.match.homeTeam.slug]">
              {{ data.match.homeTeam.name }}
            </a>
            <a class="aside-link" [routerLink]="['/deportes/futbol/equipos', data.match.awayTeam.slug]">
              {{ data.match.awayTeam.name }}
            </a>
          </aside>
        </div>
      </div>

      <div *ngIf="loading()" class="empty">
        <p class="empty__text">Cargando partido…</p>
      </div>

      <div *ngIf="!detail() && !loading()" class="empty">
        <p class="empty__title">Partido no encontrado</p>
        <a class="empty__link" routerLink="/deportes/futbol/partidos-hoy">Ver partidos de hoy</a>
      </div>
    </div>
  `,
  styles: `
    .shell { max-width: 72rem; margin: 0 auto; padding: 1rem; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1rem; }
    @media (min-width: 768px) { .grid { grid-template-columns: minmax(0, 1fr) 18rem; } }
    .grid__main { display: flex; flex-direction: column; gap: 1rem; }
    .grid__aside { display: flex; flex-direction: column; gap: 0.5rem; }
    .block { display: flex; flex-direction: column; gap: 0.5rem; }
    .block__title { margin: 0; font-size: 0.8125rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--football-text-muted, #94a3b8); }
    .block__text { margin: 0; color: var(--football-text, #e2e8f0); }
    .news-grid { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
    .aside-link {
      display: block;
      padding: 0.75rem 1rem;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.2));
      border-radius: 0.75rem;
      color: var(--football-text, #e2e8f0);
      text-decoration: none;
      font-weight: 650;
      font-size: 0.875rem;
      background: var(--football-card-bg, rgba(15, 23, 42, 0.6));
    }
    .aside-link:hover { border-color: var(--football-accent, #22c55e); }
    .empty { border: 1px dashed var(--football-border, rgba(148, 163, 184, 0.25)); border-radius: 0.75rem; padding: 2rem; text-align: center; }
    .empty__title { margin: 0 0 0.5rem; font-weight: 750; color: var(--football-text, #e2e8f0); }
    .empty__text { margin: 0; color: var(--football-text-muted, #94a3b8); }
    .empty__link { color: var(--football-accent, #22c55e); font-weight: 700; }
  `,
})
export class FootballMatchDetailComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly detail = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') || ''),
      switchMap((slug) => this.facade.getMatch(slug))
    ),
    { initialValue: null as FootballMatchDetailDTO | null }
  );

  readonly loading = signal(true);

  safeLdHtml: SafeHtml | null = null;

  constructor() {
    effect(() => {
      const detail = this.detail();
      this.loading.set(false);
      if (detail) {
        this.applyDetailMeta(detail);
      }
    });
  }

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Partido de fútbol - Guía TV',
      description: 'Información del partido, dónde verlo y noticias relacionadas.',
      canonicalUrl: '/deportes/futbol/partido',
      robots: 'noindex, follow',
    });
  }

  private applyDetailMeta(detail: FootballMatchDetailDTO): void {
    const match = detail.match;
    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.meta.setMetaTags({
      title: `${match.homeTeam.name} - ${match.awayTeam.name} · ${match.competition.name} - Guía TV`,
      description: `Partido ${match.competition.name}: ${match.homeTeam.name} contra ${match.awayTeam.name}. Consulta horario y dónde verlo por TV y streaming.`,
      canonicalUrl: `/deportes/futbol/partido/${match.slug}`,
    });

    const schemas = [
      generateFootballMatchSchema(match, baseUrl),
      generateFootballBreadcrumbSchema(
        [
          { name: 'Inicio', path: '/' },
          { name: 'Fútbol', path: '/deportes/futbol' },
          { name: 'Partidos', path: '/deportes/futbol/partidos-hoy' },
          { name: `${match.homeTeam.name} - ${match.awayTeam.name}`, path: `/deportes/futbol/partido/${match.slug}` },
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
