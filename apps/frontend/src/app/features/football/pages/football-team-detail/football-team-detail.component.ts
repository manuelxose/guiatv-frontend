import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballTeamDetailDTO } from '@app/features/football/football.models';
import { FootballMatchCardComponent } from '@app/features/football/components/football-match-card/football-match-card.component';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema, generateFootballTeamSchema } from '@app/features/football/football-seo';

@Component({
  selector: 'app-football-team-detail',
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

      <div *ngIf="detail() as data">
        <header class="head">
          <img
            *ngIf="data.team.crest; else crestFallback"
            [src]="data.team.crest"
            [alt]="'Escudo de ' + data.team.name"
            class="head__crest"
          />
          <ng-template #crestFallback>
            <span class="head__crest head__crest--fallback">{{ initials(data.team.name) }}</span>
          </ng-template>
          <div>
            <h1 class="head__title">{{ data.team.name }}</h1>
            <p class="head__sub" *ngIf="data.team.country">{{ data.team.country }}</p>
          </div>
        </header>

        <section *ngIf="data.nextMatch" class="block">
          <app-football-section-header eyebrow="Próximo" title="Próximo partido"></app-football-section-header>
          <app-football-match-card [match]="data.nextMatch" variant="featured"></app-football-match-card>
        </section>

        <section *ngIf="data.lastResult" class="block">
          <app-football-section-header eyebrow="Resultado" title="Último resultado"></app-football-section-header>
          <app-football-match-card [match]="data.lastResult"></app-football-match-card>
        </section>

        <section class="block">
          <app-football-section-header eyebrow="Agenda" title="Calendario"></app-football-section-header>
          <div class="grid">
            <app-football-match-card
              *ngFor="let match of data.matches"
              [match]="match"
              variant="compact"
            ></app-football-match-card>
          </div>
          <p *ngIf="!data.matches?.length" class="muted">Sin partidos próximos.</p>
        </section>

        <section *ngIf="data.news?.length" class="block">
          <app-football-section-header eyebrow="Noticias" [title]="'Últimas noticias de ' + data.team.name"></app-football-section-header>
          <div class="news-grid">
            <app-football-news-card *ngFor="let article of data.news" [item]="article"></app-football-news-card>
          </div>
        </section>
      </div>

      <div *ngIf="!detail() && !loading()" class="empty">
        <p class="empty__title">Equipo no encontrado</p>
        <a class="empty__link" routerLink="/deportes/futbol">Volver a fútbol</a>
      </div>
    </div>
  `,
  styles: `
    .shell { max-width: 72rem; margin: 0 auto; padding: 1rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .head { display: flex; align-items: center; gap: 0.875rem; }
    .head__crest {
      width: 3.5rem;
      height: 3.5rem;
      object-fit: contain;
      border-radius: 9999px;
      background: rgba(148, 163, 184, 0.14);
    }
    .head__crest--fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 900;
      color: var(--football-text-muted, #94a3b8);
      text-transform: uppercase;
    }
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
export class FootballTeamDetailComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  safeLdHtml: SafeHtml | null = null;

  readonly detail = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') || ''),
      switchMap((slug) => this.facade.getTeam(slug))
    ),
    { initialValue: null as FootballTeamDetailDTO | null }
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
      title: 'Equipo de fútbol - Guía TV',
      description: 'Próximos partidos, resultados y noticias del equipo.',
      canonicalUrl: '/deportes/futbol/equipos',
      robots: 'noindex, follow',
    });
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  }

  private applyMeta(detail: FootballTeamDetailDTO): void {
    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.meta.setMetaTags({
      title: `${detail.team.name} - partidos, resultados y noticias - Guía TV`,
      description: `${detail.team.name}: próximos partidos, últimos resultados, calendario y noticias.`,
      canonicalUrl: `/deportes/futbol/equipos/${detail.team.slug}`,
    });

    const schemas = [
      generateFootballTeamSchema(detail.team, baseUrl),
      generateFootballBreadcrumbSchema(
        [
          { name: 'Inicio', path: '/' },
          { name: 'Fútbol', path: '/deportes/futbol' },
          { name: 'Equipos', path: '/deportes/futbol/equipos' },
          { name: detail.team.name, path: `/deportes/futbol/equipos/${detail.team.slug}` },
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
