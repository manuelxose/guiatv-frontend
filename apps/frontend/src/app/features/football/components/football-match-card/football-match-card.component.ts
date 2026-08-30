import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballMatchDTO } from '@app/features/football/football.models';
import { FootballTeamBadgeComponent } from '@app/features/football/components/football-team-badge/football-team-badge.component';
import {
  formatMatchAccessibleLabel,
  formatMatchStatusLabel,
  hasFinalScore,
  isLiveStatus,
  primaryBroadcast,
} from '@app/features/football/football-status.util';
import { AffiliateService } from '@app/services/affiliate.service';
import { AffiliateCTAComponent } from '@app/components/affiliate-cta/affiliate-cta.component';
import { AffiliateDisclosureComponent } from '@app/components/affiliate-disclosure/affiliate-disclosure.component';
import { AffiliateImpressionDirective } from '@app/directives/affiliate-impression.directive';
import { AffiliateContext, AffiliatePlacementKey, AffiliateResolvedOffer } from '@app/interfaces/affiliate.interface';

export type FootballMatchCardVariant = 'default' | 'live' | 'compact' | 'featured';

/**
 * Purpose-built football match card. NOT a program/poster card: a match reads
 * as "who plays, when, score/status, where to watch". Used for featured/
 * secondary sections; the primary scanning list uses `football-match-row`.
 */
@Component({
  selector: 'app-football-match-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FootballTeamBadgeComponent,
    AffiliateCTAComponent,
    AffiliateDisclosureComponent,
    AffiliateImpressionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="card"
      [class.card--live]="variant === 'live' || match.status === 'live'"
      [class.card--featured]="variant === 'featured'"
      [class.card--compact]="variant === 'compact'"
      [routerLink]="link"
      [attr.aria-label]="accessibleLabel"
      (click)="onSelect()"
    >
      <span class="card__competition">
        <img *ngIf="match.competition.logo" [src]="match.competition.logo" [alt]="''" class="card__comp-logo" width="16" height="16" loading="lazy" decoding="async" />
        {{ match.competition.shortName || match.competition.name }}
      </span>

      <span class="card__body">
        <span class="card__teams">
          <span class="card__team">
            <app-football-team-badge [team]="match.homeTeam" layout="vertical"></app-football-team-badge>
          </span>

          <span class="card__score" [attr.aria-hidden]="true">
            <ng-container *ngIf="hasScore; else timeOrStatus">
              <span class="card__score-value">{{ match.score.home }}</span>
              <span class="card__score-sep">-</span>
              <span class="card__score-value">{{ match.score.away }}</span>
            </ng-container>
            <ng-template #timeOrStatus>
              <span class="card__time">{{ statusLabel }}</span>
            </ng-template>
          </span>

          <span class="card__team card__team--away">
            <app-football-team-badge [team]="match.awayTeam" layout="vertical"></app-football-team-badge>
          </span>
        </span>

        <span class="card__meta">
          <span *ngIf="isLive" class="card__live-dot" aria-hidden="true"></span>
          <span class="card__status">{{ statusLabel }}</span>
          <span *ngIf="broadcast" class="card__broadcast">
            {{ broadcast.channelName }}
          </span>
        </span>
      </span>
    </a>

    <!-- Sibling, not nested — the card above is already one big <a>, and an
         affiliate CTA is its own <a>; nesting anchors is invalid HTML. -->
    <div *ngIf="affiliateOffers().length" class="card__affiliate">
      <app-affiliate-cta
        *ngFor="let offer of affiliateOffers()"
        [offer]="offer"
        variant="secondary"
        [appAffiliateImpression]="offer"
        [appAffiliateImpressionContext]="impressionContext()"
        appAffiliateImpressionPage="football-home"
      ></app-affiliate-cta>
      <app-affiliate-disclosure [sponsored]="hasSponsoredOffer()" [compact]="true"></app-affiliate-disclosure>
    </div>
  `,
  styles: `
    :host { display: block; }
    .card {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      border: 1px solid var(--portal-border);
      border-radius: 0.75rem;
      background: var(--portal-card);
      color: inherit;
      text-decoration: none;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .card:hover, .card:focus-visible { border-color: var(--accent-sports); }
    .card:focus-visible { outline: 2px solid var(--accent-sports); outline-offset: 2px; }
    .card--live { border-left: 3px solid var(--status-live); }
    .card--featured { padding: 1.25rem; }
    .card--compact { padding: 0.625rem 0.75rem; gap: 0.375rem; }

    .card__competition {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--portal-text-muted);
    }
    .card__comp-logo { width: 1rem; height: 1rem; object-fit: contain; }

    .card__body { display: flex; flex-direction: column; gap: 0.5rem; }
    .card__teams {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 0.5rem;
    }
    .card__team { min-width: 0; }
    .card__team--away { text-align: right; }
    .card__team--away app-football-team-badge { justify-content: flex-end; }

    .card__score {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-variant-numeric: tabular-nums;
    }
    .card__score-value {
      font-size: 1.5rem;
      font-weight: 850;
      color: var(--portal-text);
    }
    .card--live .card__score-value { color: var(--status-live); }
    .card__score-sep { color: var(--portal-text-muted); }
    .card__time {
      font-size: 0.875rem;
      font-weight: 750;
      color: var(--portal-text);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .card__meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--portal-text-muted);
    }
    .card__live-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 9999px;
      background: var(--status-live);
      animation: football-pulse 1.4s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .card__live-dot { animation: none; }
    }
    .card__status { font-weight: 650; }
    .card--live .card__status { color: var(--status-live); }
    .card__broadcast { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    @keyframes football-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    .card__affiliate {
      margin-top: 0.5rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--portal-border);
      border-radius: 0.75rem;
      background: var(--portal-card);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }
  `,
})
export class FootballMatchCardComponent implements OnChanges {
  @Input({ required: true }) match!: FootballMatchDTO;
  @Input() variant: FootballMatchCardVariant = 'default';

  /**
   * Opt-in only, default off. The caller (see `football-home.component.html`)
   * sets this only on the bounded "featured matches" rail, never on every
   * card in a long list — matches the same convention used by
   * `UnifiedProgramCardComponent`/`FootballBroadcastListComponent`.
   */
  @Input() enableAffiliateCta = false;
  @Input() affiliatePlacement: AffiliatePlacementKey = 'football-home';

  @Output() selected = new EventEmitter<FootballMatchDTO>();

  readonly affiliateOffers = signal<AffiliateResolvedOffer[]>([]);
  private readonly affiliateService = inject(AffiliateService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['match'] || changes['enableAffiliateCta'] || changes['affiliatePlacement']) {
      this.resolveAffiliateOffers();
    }
  }

  hasSponsoredOffer(): boolean {
    return this.affiliateOffers().some((offer) => offer.cta.sponsored);
  }

  impressionContext(): Pick<AffiliateContext, 'market' | 'placement' | 'contentType' | 'contentId' | 'footballMatchId' | 'competitionId'> {
    return {
      market: 'ES',
      placement: this.affiliatePlacement,
      footballMatchId: this.match?.id,
      competitionId: this.match?.competition?.id,
    };
  }

  private resolveAffiliateOffers(): void {
    this.affiliateOffers.set([]);
    if (!this.enableAffiliateCta || !this.match) return;

    const providerKeys = Array.from(
      new Set(
        (this.match.broadcasts || [])
          .filter((broadcast) => broadcast.confidence !== 'low')
          .map((broadcast) => broadcast.channelName)
          .filter(Boolean)
      )
    );
    if (!providerKeys.length) return;

    const context: AffiliateContext = {
      market: 'ES',
      placement: this.affiliatePlacement,
      providerKey: providerKeys[0],
      footballMatchId: this.match.id,
      competitionId: this.match.competition.id,
    };

    this.affiliateService
      .resolveMany(context, { providerKeys, maxResults: providerKeys.length })
      .subscribe((offers) => this.affiliateOffers.set(offers));
  }

  get link(): string {
    return `/deportes/futbol/partido/${this.match.slug || this.match.id}`;
  }

  get isLive(): boolean {
    return isLiveStatus(this.match.status);
  }

  get hasScore(): boolean {
    return hasFinalScore(this.match.score);
  }

  get statusLabel(): string {
    return formatMatchStatusLabel(this.match, 'short');
  }

  get broadcast() {
    return primaryBroadcast(this.match);
  }

  get accessibleLabel(): string {
    return formatMatchAccessibleLabel(this.match, this.broadcast?.channelName);
  }

  onSelect(): void {
    this.selected.emit(this.match);
  }
}
