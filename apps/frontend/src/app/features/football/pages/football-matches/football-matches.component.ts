import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { combineLatest, map, shareReplay, switchMap, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballMatchDTO } from '@app/features/football/football.models';
import {
  FootballCompetitionGroupComponent,
  groupMatchesByCompetition,
} from '@app/features/football/components/football-competition-group/football-competition-group.component';
import {
  FootballDateStripComponent,
} from '@app/features/football/components/football-date-strip/football-date-strip.component';
import {
  applyFootballMatchFilter,
  FootballFilterBarComponent,
  FootballMatchFilter,
} from '@app/features/football/components/football-filter-bar/football-filter-bar.component';
import {
  FootballLiveRefreshService,
  mergeLiveUpdates,
} from '@app/features/football/football-live-refresh.service';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

type MatchesView = 'live' | 'today' | 'calendar';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-football-matches',
  standalone: true,
  imports: [
    CommonModule,
    FootballCompetitionGroupComponent,
    FootballDateStripComponent,
    FootballFilterBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-matches.component.html',
  styleUrl: './football-matches.component.scss',
})
export class FootballMatchesComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly liveRefresh = inject(FootballLiveRefreshService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly view = signal<MatchesView>('today');
  readonly filter = signal<FootballMatchFilter>('all');
  safeLdHtml: SafeHtml | null = null;

  // Mirrors the sibling detail pages' loading semantics: true only until the
  // very first emission ever arrives, so a fresh page load reserves space
  // with a skeleton instead of flashing the (smaller) empty-state box, but a
  // later date/filter change doesn't re-flash a skeleton over already-visible
  // content.
  private readonly hasLoadedOnce = signal(false);
  readonly loading = computed(() => !this.hasLoadedOnce());

  // Single source of truth for "which day": the `date` QUERY param (fixes
  // the previous bug where the calendar view wrote a `day` query param but
  // read a `date` PATH param the route never actually defined).
  private readonly matches$ = combineLatest([this.route.data, this.route.queryParamMap]).pipe(
    switchMap(([data, queryParams]) => {
      const requestedView = (data?.['footballView'] as MatchesView) ?? 'today';
      this.view.set(requestedView);
      const date = queryParams.get('date') || todayKey();
      const filter = (queryParams.get('filter') as FootballMatchFilter) || 'all';
      this.filter.set(filter);
      return this.loadFor(requestedView, date);
    }),
    tap(() => this.hasLoadedOnce.set(true)),
    // Shared: both `baseMatches` and the live-refresh's "is anything live"
    // check subscribe to this — without sharing, each would independently
    // re-trigger the underlying facade call.
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly baseMatches = toSignal(this.matches$, { initialValue: [] as FootballMatchDTO[] });

  // Live polling only runs while at least one visible match is actually
  // live — no point polling a calendar page full of finished fixtures.
  private readonly hasLiveMatches$ = this.matches$.pipe(
    map((matches) => matches.some((m) => m.status === 'live' || m.status === 'halftime'))
  );
  private readonly liveUpdates = toSignal(this.liveRefresh.liveMatches(this.hasLiveMatches$), {
    initialValue: [] as FootballMatchDTO[],
  });

  readonly matches = computed(() => mergeLiveUpdates(this.baseMatches(), this.liveUpdates()));

  readonly filteredMatches = computed(() => applyFootballMatchFilter(this.matches(), this.filter()));

  readonly grouped = computed(() => groupMatchesByCompetition(this.filteredMatches()));

  get selectedDateKey(): string {
    return this.route.snapshot.queryParamMap.get('date') || todayKey();
  }

  get title(): string {
    if (this.view() === 'live') return 'Partidos en directo';
    if (this.view() === 'calendar') return 'Calendario de fútbol';
    return 'Partidos de fútbol hoy';
  }

  get subtitle(): string {
    if (this.view() === 'live') return 'Sigue en tiempo real los partidos de hoy.';
    if (this.view() === 'calendar') return 'Agenda de partidos por día.';
    return 'Todos los partidos de hoy, por competición.';
  }

  get emptyTitle(): string {
    if (this.view() === 'live') return 'No hay partidos en directo ahora mismo';
    if (this.filter() !== 'all') return 'No hay partidos para este filtro';
    return 'No hay partidos para este día';
  }

  get emptySubtitle(): string {
    if (this.view() === 'live') return 'Consulta los partidos de hoy o el calendario completo.';
    if (this.filter() !== 'all') return 'Prueba con "Todos" o cambia de día.';
    return 'Prueba con otro día o revisa las noticias.';
  }

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: `${this.title} - Guía TV`,
      description: this.subtitle,
      canonicalUrl: this.pathForTab(this.view()),
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(
        generateFootballBreadcrumbSchema(
          [
            { name: 'Inicio', path: '/' },
            { name: 'Fútbol', path: '/deportes/futbol' },
            { name: this.title, path: this.pathForTab(this.view()) },
          ],
          baseUrl
        )
      )}</script>`
    );
  }

  onDateChange(dateKey: string): void {
    void this.router.navigate(['/deportes/futbol/calendario'], {
      queryParams: { date: dateKey },
      queryParamsHandling: 'merge',
    });
  }

  onFilterChange(filter: FootballMatchFilter): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: filter === 'all' ? null : filter },
      queryParamsHandling: 'merge',
    });
  }

  trackByGroup(_index: number, group: { competitionSlug: string }): string {
    return group.competitionSlug;
  }

  private pathForTab(tab: MatchesView): string {
    if (tab === 'live') return '/deportes/futbol/en-directo';
    if (tab === 'calendar') return '/deportes/futbol/calendario';
    return '/deportes/futbol/partidos-hoy';
  }

  private loadFor(view: MatchesView, date: string) {
    if (view === 'live') {
      return this.facade.getLiveMatches().pipe(map((res) => res.matches));
    }
    if (view === 'today') {
      return this.facade.getMatches({ date: 'today' }).pipe(map((res) => res.matches));
    }
    return this.facade.getMatches({ date }).pipe(map((res) => res.matches));
  }
}
