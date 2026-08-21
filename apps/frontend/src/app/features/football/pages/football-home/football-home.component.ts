import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballHomeDTO, FootballMatchDTO } from '@app/features/football/football.models';
import { FootballMatchCardComponent } from '@app/features/football/components/football-match-card/football-match-card.component';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { FootballCompetitionCardComponent } from '@app/features/football/components/football-competition-card/football-competition-card.component';
import {
  FootballCompetitionGroupComponent,
  groupMatchesByCompetition,
} from '@app/features/football/components/football-competition-group/football-competition-group.component';
import {
  FootballLiveRefreshService,
  mergeLiveUpdates,
} from '@app/features/football/football-live-refresh.service';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

@Component({
  selector: 'app-football-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FootballMatchCardComponent,
    FootballNewsCardComponent,
    FootballSectionHeaderComponent,
    FootballCompetitionGroupComponent,
    FootballCompetitionCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-home.component.html',
  styleUrl: './football-home.component.scss',
})
export class FootballHomeComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly liveRefresh = inject(FootballLiveRefreshService);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  // Called once and shared — `home` and the live-refresh "is anything live"
  // check both read from this single subscription rather than each
  // independently re-invoking the facade (which would double the SSR fetch).
  private readonly home$ = this.facade.getHome().pipe(shareReplay({ bufferSize: 1, refCount: true }));

  readonly home = toSignal(this.home$, { initialValue: null as FootballHomeDTO | null });
  readonly loading = computed(() => this.home() === null);
  safeLdHtml: SafeHtml | null = null;

  // Live matches on the home surface get the same in-place polling as the
  // dedicated "En directo" view — a live score visible on Home that never
  // updates would be worse than not showing it live at all.
  private readonly liveUpdates = toSignal(
    this.liveRefresh.liveMatches(this.home$.pipe(map((home) => (home.liveMatches?.length ?? 0) > 0))),
    { initialValue: [] as FootballMatchDTO[] }
  );

  readonly liveMatches = computed(() => mergeLiveUpdates(this.home()?.liveMatches ?? [], this.liveUpdates()));
  readonly groupLive = computed(() => groupMatchesByCompetition(this.liveMatches()));
  readonly todayGroups = computed(() => groupMatchesByCompetition(this.home()?.todayMatches ?? []));

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Fútbol hoy: partidos en directo, horarios y dónde verlos - Guía TV',
      description:
        'Partidos de fútbol de hoy, en directo, próximos partidos, clasificaciones y dónde ver cada partido por TV y streaming.',
      canonicalUrl: '/deportes/futbol',
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    const breadcrumb = generateFootballBreadcrumbSchema(
      [
        { name: 'Inicio', path: '/' },
        { name: 'Deportes', path: '/deportes/futbol' },
        { name: 'Fútbol', path: '/deportes/futbol' },
      ],
      baseUrl
    );
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`
    );
  }

  trackByGroup(_index: number, group: { competitionSlug: string }): string {
    return group.competitionSlug;
  }
}
