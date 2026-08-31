import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballStandingRowDTO, FootballTeamDetailDTO } from '@app/features/football/football.models';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { FootballMatchRowComponent } from '@app/features/football/components/football-match-row/football-match-row.component';
import { FootballStandingsTableComponent } from '@app/features/football/components/football-standings-table/football-standings-table.component';
import {
  applyFootballMatchFilter,
  FootballFilterBarComponent,
  FootballMatchFilter,
} from '@app/features/football/components/football-filter-bar/football-filter-bar.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema, generateFootballTeamSchema } from '@app/features/football/football-seo';
import { PortalLocalToolbarComponent } from '@app/components/portal-local-toolbar/portal-local-toolbar.component';
import { PortalContextDestination } from '@app/config/portal-navigation.config';

type TeamTab = 'resumen' | 'partidos';

type TeamState =
  | { status: 'loading' }
  | { status: 'found'; detail: FootballTeamDetailDTO }
  | { status: 'not-found' };

@Component({
  selector: 'app-football-team-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FootballNewsCardComponent,
    FootballSectionHeaderComponent,
    FootballMatchRowComponent,
    FootballStandingsTableComponent,
    FootballFilterBarComponent,
    PortalLocalToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-team-detail.component.html',
  styleUrl: './football-team-detail.component.scss',
})
export class FootballTeamDetailComponent {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly tabs: readonly PortalContextDestination[] = [
    { id: 'resumen', label: 'Resumen', kind: 'action' },
    { id: 'partidos', label: 'Partidos', kind: 'action' },
  ];
  readonly activeTab = signal<TeamTab>('resumen');
  readonly filter = signal<FootballMatchFilter>('all');

  // Same discriminated state as the match/competition detail pages, for the
  // same reason: meta must only ever resolve to noindex once we positively
  // know the team is missing, never as a default that races SSR.
  readonly state = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') || ''),
      switchMap((slug) =>
        this.facade.getTeam(slug).pipe(
          map((detail): TeamState => (detail ? { status: 'found', detail } : { status: 'not-found' }))
        )
      )
    ),
    { initialValue: { status: 'loading' } as TeamState }
  );

  readonly loading = computed(() => this.state().status === 'loading');
  readonly detail = computed(() => {
    const state = this.state();
    return state.status === 'found' ? state.detail : null;
  });

  readonly filteredMatches = computed(() => applyFootballMatchFilter(this.detail()?.matches ?? [], this.filter()));

  // League position (spec §40): resolved from whichever competition the
  // team's next/last match belongs to — the DTO itself has no direct
  // "primary competition" concept, so this is the best real signal
  // available. Degrades to nothing if neither exists or standings don't.
  private readonly contextCompetitionSlug$ = toObservable(this.state).pipe(
    map((state) => {
      if (state.status !== 'found') return null;
      return state.detail.nextMatch?.competition.slug ?? state.detail.lastResult?.competition.slug ?? null;
    }),
    distinctUntilChanged()
  );
  readonly standingsContext = toSignal(
    this.contextCompetitionSlug$.pipe(
      switchMap((slug) => (slug ? this.facade.getCompetition(slug).pipe(map((c) => c?.standings ?? [])) : of([])))
    ),
    { initialValue: [] as FootballStandingRowDTO[] }
  );

  safeLdHtml: SafeHtml | null = null;

  constructor() {
    effect(() => {
      const state = this.state();
      if (state.status === 'found') {
        this.applyDetailMeta(state.detail);
      } else if (state.status === 'not-found') {
        this.applyNotFoundMeta();
      }
    });
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab as TeamTab);
  }

  onFilterChange(filter: FootballMatchFilter): void {
    this.filter.set(filter);
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  }

  trackByMatch(_index: number, match: { id: string }): string {
    return match.id;
  }

  trackByNewsSlug(_index: number, article: { slug: string }): string {
    return article.slug;
  }

  private applyDetailMeta(detail: FootballTeamDetailDTO): void {
    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.meta.setMetaTags({
      title: `${detail.team.name} - partidos, resultados y noticias - Guía TV`,
      description: `${detail.team.name}: próximos partidos, últimos resultados, calendario y noticias.`,
      canonicalUrl: `/deportes/futbol/equipos/${detail.team.slug}`,
      robots: 'noindex, follow',
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

  private applyNotFoundMeta(): void {
    this.meta.setMetaTags({
      title: 'Equipo no encontrado - Guía TV',
      description: 'Este equipo no está disponible.',
      canonicalUrl: '/deportes/futbol',
      robots: 'noindex, follow',
    });
  }
}
