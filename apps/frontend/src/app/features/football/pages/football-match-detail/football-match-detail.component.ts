import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballMatchDetailDTO, FootballStandingRowDTO } from '@app/features/football/football.models';
import { FootballScoreboardComponent } from '@app/features/football/components/football-scoreboard/football-scoreboard.component';
import { FootballBroadcastListComponent } from '@app/features/football/components/football-broadcast-list/football-broadcast-list.component';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { FootballStandingsTableComponent } from '@app/features/football/components/football-standings-table/football-standings-table.component';
import {
  formatMatchAccessibleLabel,
  formatMatchStatusLabel,
  isLiveStatus,
} from '@app/features/football/football-status.util';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema, generateFootballMatchSchema } from '@app/features/football/football-seo';

type MatchDetailState =
  | { status: 'loading' }
  | { status: 'found'; detail: FootballMatchDetailDTO }
  | { status: 'not-found' };

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
    FootballStandingsTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-match-detail.component.html',
  styleUrl: './football-match-detail.component.scss',
})
export class FootballMatchDetailComponent implements AfterViewInit, OnDestroy {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @ViewChild('scoreboardAnchor') scoreboardAnchor?: ElementRef<HTMLElement>;
  private observer?: IntersectionObserver;
  readonly stickyVisible = signal(false);

  // A single discriminated state, not a bare nullable + a manually-toggled
  // loading flag — the previous version defaulted meta to `noindex` on
  // first render and only cleared it once data arrived, but that clearing
  // step never reliably won the race against SSR serialization, so every
  // match page shipped `noindex` to crawlers in production. This model
  // only ever sets `noindex` once we positively know the match is missing.
  readonly state = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') || ''),
      switchMap((slug) =>
        this.facade.getMatch(slug).pipe(
          map((detail): MatchDetailState => (detail ? { status: 'found', detail } : { status: 'not-found' }))
        )
      )
    ),
    { initialValue: { status: 'loading' } as MatchDetailState }
  );

  readonly loading = computed(() => this.state().status === 'loading');
  readonly detail = computed(() => {
    const state = this.state();
    return state.status === 'found' ? state.detail : null;
  });

  // Standings context (spec §29) — a secondary, gracefully-degrading fetch:
  // only runs once a match is found, and its failure never blocks the
  // primary scoreboard/broadcast/news content from rendering.
  private readonly competitionSlug$ = toObservable(this.state).pipe(
    map((state) => (state.status === 'found' ? state.detail.match.competition.slug : null)),
    distinctUntilChanged()
  );
  readonly standings = toSignal(
    this.competitionSlug$.pipe(
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
      // 'loading' → deliberately no meta call. SSR waits for the real
      // status before serializing, so crawlers never see this transient
      // state; setting anything here is what caused the original bug.
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.scoreboardAnchor) return;
    this.observer = new IntersectionObserver(
      ([entry]) => this.stickyVisible.set(!entry.isIntersecting),
      { threshold: 0 }
    );
    this.observer.observe(this.scoreboardAnchor.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  isLive(detail: FootballMatchDetailDTO): boolean {
    return isLiveStatus(detail.match.status);
  }

  stickyStatusLabel(detail: FootballMatchDetailDTO): string {
    return formatMatchStatusLabel(detail.match, 'short');
  }

  stickyAccessibleLabel(detail: FootballMatchDetailDTO): string {
    return formatMatchAccessibleLabel(detail.match);
  }

  trackByNewsSlug(_index: number, article: { slug: string }): string {
    return article.slug;
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

  private applyNotFoundMeta(): void {
    this.meta.setMetaTags({
      title: 'Partido no encontrado - Guía TV',
      description: 'Este partido no está disponible.',
      canonicalUrl: '/deportes/futbol/partidos-hoy',
      robots: 'noindex, follow',
    });
  }
}
