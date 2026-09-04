import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, distinctUntilChanged, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballBroadcastDTO, FootballHomeDTO, FootballMatchDTO } from '@app/features/football/football.models';
import { FootballMatchCardComponent } from '@app/features/football/components/football-match-card/football-match-card.component';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { FootballCompetitionCardComponent } from '@app/features/football/components/football-competition-card/football-competition-card.component';
import { FootballCompetitionGroupComponent, groupMatchesByCompetition } from '@app/features/football/components/football-competition-group/football-competition-group.component';
import { FootballDateStripComponent } from '@app/features/football/components/football-date-strip/football-date-strip.component';
import { applyFootballMatchFilter, FootballFilterBarComponent, FootballMatchFilter } from '@app/features/football/components/football-filter-bar/football-filter-bar.component';
import { FootballBroadcastWidgetComponent, summarizeFootballBroadcasts } from '@app/features/football/components/football-broadcast-widget/football-broadcast-widget.component';
import { FootballStandingsMiniComponent } from '@app/features/football/components/football-standings-mini/football-standings-mini.component';
import { FootballLiveRefreshService, mergeLiveUpdates, shouldPollLiveTransitions } from '@app/features/football/football-live-refresh.service';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

function toDateKey(date = new Date()): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-football-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FootballMatchCardComponent, FootballNewsCardComponent,
    FootballSectionHeaderComponent, FootballCompetitionGroupComponent, FootballCompetitionCardComponent,
    FootballDateStripComponent, FootballFilterBarComponent, FootballBroadcastWidgetComponent,
    FootballStandingsMiniComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-home.component.html',
  styleUrl: './football-home.component.scss',
})
export class FootballHomeComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly liveRefresh = inject(FootballLiveRefreshService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly home$ = this.facade.getHome().pipe(shareReplay({ bufferSize: 1, refCount: true }));
  private readonly selectedDate$ = this.route.queryParamMap.pipe(map((params) => params.get('date') || toDateKey()), distinctUntilChanged());
  private readonly selectedFilter$ = this.route.queryParamMap.pipe(map((params) => (params.get('filter') as FootballMatchFilter) || 'all'), distinctUntilChanged());
  private readonly selectedProvider$ = this.route.queryParamMap.pipe(map((params) => params.get('provider')), distinctUntilChanged());

  readonly home = toSignal(this.home$, { initialValue: null as FootballHomeDTO | null });
  readonly selectedDate = toSignal(this.selectedDate$, { initialValue: toDateKey() });
  readonly filter = toSignal(this.selectedFilter$, { initialValue: 'all' as FootballMatchFilter });
  readonly selectedProvider = toSignal(this.selectedProvider$, { initialValue: null as string | null });
  readonly loading = computed(() => this.home() === null);
  private readonly datedLoadFailed = signal(false);
  readonly loadFailed = computed(() => this.home()?.loadError === true || this.datedLoadFailed());
  safeLdHtml: SafeHtml | null = null;

  private readonly datedMatches$ = combineLatest([this.home$, this.selectedDate$]).pipe(
    switchMap(([home, date]) => {
      if (date === toDateKey()) {
        this.datedLoadFailed.set(false);
        return of(home.todayMatches ?? []);
      }
      return this.facade.getMatches({ date }).pipe(
        tap((response) => this.datedLoadFailed.set(response.meta?.['loadError'] === true)),
        map((response) => response.matches)
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  private readonly datedMatches = toSignal(this.datedMatches$, { initialValue: [] as FootballMatchDTO[] });
  private readonly liveUpdates = toSignal(
    this.liveRefresh.liveMatches(combineLatest([this.home$, this.datedMatches$]).pipe(
      map(([home, matches]) => shouldPollLiveTransitions([...(home.liveMatches ?? []), ...matches]))
    )), { initialValue: null as FootballMatchDTO[] | null }
  );

  readonly liveMatches = computed(() => this.liveUpdates() ?? this.home()?.liveMatches ?? []);
  readonly groupLive = computed(() => groupMatchesByCompetition(this.liveMatches()));
  readonly currentMatches = computed(() => mergeLiveUpdates(this.datedMatches(), this.liveUpdates()));
  readonly nonLiveCurrentMatches = computed(() => {
    // Initial live ids stay excluded after an authoritative empty snapshot;
    // otherwise their immutable dated copy would reappear with a stale
    // "live" status until the next full-page request.
    const liveIds = new Set([
      ...(this.home()?.liveMatches ?? []),
      ...this.liveMatches(),
    ].map((match) => match.id));
    return this.currentMatches().filter((match) => !liveIds.has(match.id));
  });
  readonly visibleMatches = computed(() => {
    const provider = this.selectedProvider();
    const filtered = applyFootballMatchFilter(this.nonLiveCurrentMatches(), this.filter());
    return provider
      ? filtered.filter((match) => match.broadcasts.some((broadcast) => broadcast.confidence !== 'low' && broadcast.channelName === provider))
      : filtered;
  });
  readonly matchGroups = computed(() => groupMatchesByCompetition(this.visibleMatches()));
  readonly broadcastProviders = computed(() => summarizeFootballBroadcasts(this.currentMatches()).slice(0, 7));
  readonly televisedMatches = computed(() => this.currentMatches().filter((match) => match.broadcasts.some((broadcast) => broadcast.confidence !== 'low')).slice(0, 6));
  readonly featuredMatch = computed(() => {
    const visibleIds = new Set([...this.currentMatches(), ...this.liveMatches()].map((match) => match.id));
    return this.home()?.featuredMatches?.find((match) => !visibleIds.has(match.id)) ?? null;
  });
  readonly upcomingMatches = computed(() => {
    const visibleIds = new Set([...this.currentMatches(), ...this.liveMatches()].map((match) => match.id));
    return (this.home()?.upcomingMatches ?? []).filter((match) => !visibleIds.has(match.id)).slice(0, 5);
  });
  readonly liveAnnouncement = computed(() => this.liveMatches().map((match) =>
    `${match.homeTeam.name} ${match.score.home ?? ''}, ${match.awayTeam.name} ${match.score.away ?? ''}, ${match.minute ? `minuto ${match.minute}` : 'en directo'}`
  ).join('. '));

  get selectedDateLabel(): string {
    if (this.selectedDate() === toDateKey()) return 'Partidos de hoy';
    const key = this.selectedDate();
    const date = new Date(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8)));
    return `Partidos del ${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  }

  ngOnInit(): void {
    this.meta.setMetaTags({ title: 'Fútbol hoy: partidos en directo, horarios y dónde verlos - Guía TV',
      description: 'Partidos de fútbol de hoy, en directo, próximos partidos, clasificaciones y dónde ver cada partido por TV y streaming.', canonicalUrl: '/deportes/futbol' });
    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(`<script type="application/ld+json">${JSON.stringify(
      generateFootballBreadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Fútbol', path: '/deportes/futbol' }], baseUrl)
    )}</script>`);
  }

  onDateChange(date: string): void { void this.router.navigate([], { relativeTo: this.route, queryParams: { date: date === toDateKey() ? null : date }, queryParamsHandling: 'merge' }); }
  onFilterChange(filter: FootballMatchFilter): void { void this.router.navigate([], { relativeTo: this.route, queryParams: { filter: filter === 'all' ? null : filter }, queryParamsHandling: 'merge' }); }
  onProviderSelect(provider: string | null): void { void this.router.navigate([], { relativeTo: this.route, queryParams: { provider }, queryParamsHandling: 'merge', fragment: provider ? 'partidos' : undefined }); }
  retryLoad(): void { globalThis.location?.reload(); }
  primaryConfirmedBroadcast(match: FootballMatchDTO): FootballBroadcastDTO | null {
    return match.broadcasts.find((broadcast) => broadcast.confidence !== 'low') ?? null;
  }
}
