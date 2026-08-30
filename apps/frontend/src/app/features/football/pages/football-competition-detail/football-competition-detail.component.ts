import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballCompetitionDetailDTO, FootballMatchDTO } from '@app/features/football/football.models';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballStandingsTableComponent } from '@app/features/football/components/football-standings-table/football-standings-table.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { FootballMatchRowComponent } from '@app/features/football/components/football-match-row/football-match-row.component';
import { FootballBroadcastListComponent } from '@app/features/football/components/football-broadcast-list/football-broadcast-list.component';
import {
  applyFootballMatchFilter,
  FootballFilterBarComponent,
  FootballMatchFilter,
} from '@app/features/football/components/football-filter-bar/football-filter-bar.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';
import { PortalLocalToolbarComponent } from '@app/components/portal-local-toolbar/portal-local-toolbar.component';
import { PortalContextDestination } from '@app/config/portal-navigation.config';

type CompetitionTab = 'resumen' | 'calendario' | 'clasificacion';

type CompetitionState =
  | { status: 'loading' }
  | { status: 'found'; detail: FootballCompetitionDetailDTO }
  | { status: 'not-found' };

interface RoundGroup {
  round: string;
  matches: FootballMatchDTO[];
}

export function groupByRound(matches: FootballMatchDTO[]): RoundGroup[] {
  const groups = new Map<string, FootballMatchDTO[]>();
  for (const match of matches) {
    const key = match.round || 'Partidos';
    const list = groups.get(key) || [];
    list.push(match);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([round, matches]) => ({ round, matches }));
}

@Component({
  selector: 'app-football-competition-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FootballNewsCardComponent,
    FootballStandingsTableComponent,
    FootballSectionHeaderComponent,
    FootballMatchRowComponent,
    FootballBroadcastListComponent,
    FootballFilterBarComponent,
    PortalLocalToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-competition-detail.component.html',
  styleUrl: './football-competition-detail.component.scss',
})
export class FootballCompetitionDetailComponent {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly tabs: readonly PortalContextDestination[] = [
    { id: 'resumen', label: 'Resumen', kind: 'action' },
    { id: 'calendario', label: 'Calendario', kind: 'action' },
    { id: 'clasificacion', label: 'Clasificación', kind: 'action' },
  ];
  readonly activeTab = signal<CompetitionTab>('resumen');
  readonly filter = signal<FootballMatchFilter>('all');

  // Same discriminated state as football-match-detail — and for the same
  // reason: a naive "set noindex, then clear it once data arrives" ordering
  // is exactly what shipped every match page as noindex to crawlers before
  // that fix. This never sets meta at all until the real outcome is known.
  readonly state = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') || ''),
      switchMap((slug) =>
        this.facade.getCompetition(slug).pipe(
          map((detail): CompetitionState => (detail ? { status: 'found', detail } : { status: 'not-found' }))
        )
      )
    ),
    { initialValue: { status: 'loading' } as CompetitionState }
  );

  readonly loading = computed(() => this.state().status === 'loading');
  readonly detail = computed(() => {
    const state = this.state();
    return state.status === 'found' ? state.detail : null;
  });

  private readonly matches = computed(() => this.detail()?.matches ?? []);
  readonly filteredMatches = computed(() => applyFootballMatchFilter(this.matches(), this.filter()));
  readonly roundGroups = computed(() => groupByRound(this.filteredMatches()));

  readonly upcomingPreview = computed(() =>
    this.matches()
      .filter((m) => m.status === 'scheduled')
      .slice(0, 5)
  );
  /** The single next scheduled match — the "where to watch" CTA is always scoped to it, never to the whole competition. */
  readonly nextMatch = computed(() => this.upcomingPreview()[0] ?? null);
  readonly resultsPreview = computed(() =>
    this.matches()
      .filter((m) => m.status === 'finished')
      .slice(-5)
      .reverse()
  );
  readonly standingsPreview = computed(() => (this.detail()?.standings ?? []).slice(0, 5));

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
    this.activeTab.set(tab as CompetitionTab);
  }

  onFilterChange(filter: FootballMatchFilter): void {
    this.filter.set(filter);
  }

  trackByRound(_index: number, group: RoundGroup): string {
    return group.round;
  }

  trackByMatch(_index: number, match: FootballMatchDTO): string {
    return match.id;
  }

  trackByNewsSlug(_index: number, article: { slug: string }): string {
    return article.slug;
  }

  private applyDetailMeta(detail: FootballCompetitionDetailDTO): void {
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

  private applyNotFoundMeta(): void {
    this.meta.setMetaTags({
      title: 'Competición no encontrada - Guía TV',
      description: 'Esta competición no está disponible.',
      canonicalUrl: '/deportes/futbol/competiciones',
      robots: 'noindex, follow',
    });
  }
}
