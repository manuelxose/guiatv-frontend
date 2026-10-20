import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  resolveLiveSnapshot,
  shouldPollLiveTransitions,
} from '@app/features/football/football-live-refresh.service';
import { MetaService } from '@app/services/meta.service';

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

  readonly view = signal<MatchesView>('today');
  readonly filter = signal<FootballMatchFilter>('all');
  readonly loadFailed = signal(false);

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
      // The legacy /en-directo route is now a "Partidos" state, not a
      // separate destination — its filter chip defaults to "En directo" so
      // the page still opens filtered to live matches without a redundant
      // top-level nav item (§4).
      const defaultFilter: FootballMatchFilter = requestedView === 'live' ? 'live' : 'all';
      const filter = (queryParams.get('filter') as FootballMatchFilter) || defaultFilter;
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
    map((matches) => this.view() === 'live' || shouldPollLiveTransitions(matches))
  );
  private readonly liveUpdates = toSignal(this.liveRefresh.liveMatches(this.hasLiveMatches$), {
    initialValue: null as FootballMatchDTO[] | null,
  });

  readonly matches = computed(() => this.view() === 'live'
    ? resolveLiveSnapshot(this.baseMatches(), this.liveUpdates())
    : mergeLiveUpdates(this.baseMatches(), this.liveUpdates()));

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

  get metaTitle(): string {
    if (this.view() === 'live') return 'Fútbol en directo: marcadores y dónde ver cada partido | Guía TV';
    if (this.view() === 'calendar') return 'Calendario de fútbol: partidos por día y dónde verlos | Guía TV';
    return 'Partidos de fútbol hoy: horarios y dónde verlos | Guía TV';
  }

  get metaDescription(): string {
    if (this.view() === 'live') {
      return 'Partidos de fútbol en directo ahora: marcador, minuto y en qué canal o plataforma de TV y streaming se emite cada uno en España.';
    }
    if (this.view() === 'calendar') {
      return 'Agenda de partidos de fútbol por día, con horarios y dónde ver cada uno por TV y streaming en España.';
    }
    return 'Todos los partidos de fútbol de hoy por competición, con horarios y el canal o plataforma de TV y streaming que los emite en España.';
  }

  get subtitle(): string {
    if (this.view() === 'live') return 'Sigue en tiempo real los partidos de hoy: marcador, minuto y el canal o plataforma que emite cada uno. La lista se actualiza sola mientras hay partidos en juego.';
    if (this.view() === 'calendar') return 'Agenda de partidos por día, con la hora de inicio y dónde ver cada uno. Elige una fecha en el selector para consultar jornadas pasadas o próximas.';
    return 'Todos los partidos de fútbol de hoy agrupados por competición, con la hora de inicio y el canal o plataforma que los emite. Usa el selector de fecha para ver otro día y los filtros para quedarte con los partidos en directo.';
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
      title: this.metaTitle,
      description: this.metaDescription,
      canonicalUrl: this.pathForTab(this.view()),
    });

  }

  onDateChange(dateKey: string): void {
    // The date strip is now always visible (§4: date navigation lives inside
    // the unified Partidos experience). "Hoy"/"En directo" pin to today and
    // "now", so picking a different date there hands off to the calendar
    // route with that date; the calendar route itself just updates in place.
    if (this.view() === 'calendar') {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { date: dateKey },
        queryParamsHandling: 'merge',
      });
      return;
    }
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

  retryLoad(): void { globalThis.location?.reload(); }

  trackByGroup(_index: number, group: { competitionSlug: string }): string {
    return group.competitionSlug;
  }

  private pathForTab(tab: MatchesView): string {
    if (tab === 'calendar') return '/deportes/futbol/calendario';
    return '/deportes/futbol/partidos-hoy';
  }

  private loadFor(view: MatchesView, date: string) {
    if (view === 'live') {
      return this.facade.getLiveMatches().pipe(map((res) => { this.loadFailed.set(res.meta?.['loadError'] === true); return res.matches; }));
    }
    if (view === 'today') {
      return this.facade.getMatches({ date: 'today' }).pipe(map((res) => { this.loadFailed.set(res.meta?.['loadError'] === true); return res.matches; }));
    }
    return this.facade.getMatches({ date }).pipe(map((res) => { this.loadFailed.set(res.meta?.['loadError'] === true); return res.matches; }));
  }
}
