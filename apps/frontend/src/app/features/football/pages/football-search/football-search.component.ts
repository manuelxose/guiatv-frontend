import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballSearchDTO } from '@app/features/football/football.models';
import { FootballMatchRowComponent } from '@app/features/football/components/football-match-row/football-match-row.component';
import { FootballCompetitionCardComponent } from '@app/features/football/components/football-competition-card/football-competition-card.component';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballTeamBadgeComponent } from '@app/features/football/components/football-team-badge/football-team-badge.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

const EMPTY_RESULT: FootballSearchDTO = { query: '', matches: [], teams: [], competitions: [], news: [], meta: {} };

/**
 * Legacy deep-link fallback for old `/deportes/futbol/buscar` URLs.
 * New discovery starts in the app-wide search, which now includes these
 * football entities alongside TV and catalogue results.
 */
@Component({
  selector: 'app-football-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FootballMatchRowComponent,
    FootballCompetitionCardComponent,
    FootballNewsCardComponent,
    FootballTeamBadgeComponent,
    FootballSectionHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-search.component.html',
  styleUrl: './football-search.component.scss',
})
export class FootballSearchComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  // The query lives in the URL (shareable, back/forward-safe) — not local
  // component state.
  readonly query = signal('');
  readonly inputValue = signal('');
  readonly teamsOnly = signal(false);

  private readonly result = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({ q: (params.get('q') || '').trim(), teamsOnly: params.get('tipo') === 'equipos' })),
      switchMap(({ q, teamsOnly }) => {
        this.teamsOnly.set(teamsOnly);
        this.query.set(q);
        this.inputValue.set(q);
        return q ? this.facade.search(q) : of(EMPTY_RESULT);
      })
    ),
    { initialValue: null as FootballSearchDTO | null }
  );

  readonly loading = computed(() => this.result() === null && this.query().length > 0);
  readonly hasResults = computed(() => {
    const r = this.result();
    if (!r) return false;
    if (this.teamsOnly()) return r.teams.length > 0;
    return r.matches.length > 0 || r.teams.length > 0 || r.competitions.length > 0 || r.news.length > 0;
  });

  readonly teams = computed(() => this.result()?.teams ?? []);
  readonly matches = computed(() => this.teamsOnly() ? [] : this.result()?.matches ?? []);
  readonly competitions = computed(() => this.teamsOnly() ? [] : this.result()?.competitions ?? []);
  readonly news = computed(() => this.teamsOnly() ? [] : this.result()?.news ?? []);

  safeLdHtml: SafeHtml | null = null;

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Buscar en fútbol - Guía TV',
      description: 'Busca equipos, partidos, competiciones y noticias de fútbol.',
      canonicalUrl: '/deportes/futbol/buscar',
      robots: 'noindex, follow',
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(
        generateFootballBreadcrumbSchema(
          [
            { name: 'Inicio', path: '/' },
            { name: 'Fútbol', path: '/deportes/futbol' },
            { name: 'Buscar', path: '/deportes/futbol/buscar' },
          ],
          baseUrl
        )
      )}</script>`
    );
  }

  onSubmit(): void {
    const q = this.inputValue().trim();
    void this.router.navigate(['/deportes/futbol/buscar'], {
      queryParams: { ...(q ? { q } : {}), ...(this.teamsOnly() ? { tipo: 'equipos' } : {}) },
    });
  }

  trackByTeam(_index: number, team: { slug: string }): string {
    return team.slug;
  }

  trackByMatch(_index: number, match: { id: string }): string {
    return match.id;
  }

  trackByCompetition(_index: number, competition: { slug: string }): string {
    return competition.slug;
  }

  trackByArticle(_index: number, article: { slug: string }): string {
    return article.slug;
  }
}
