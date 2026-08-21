import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballMatchDTO } from '@app/features/football/football.models';
import { FootballTeamBadgeComponent } from '@app/features/football/components/football-team-badge/football-team-badge.component';
import { FootballBroadcastIndicatorComponent } from '@app/features/football/components/football-broadcast-indicator/football-broadcast-indicator.component';
import {
  formatMatchAccessibleLabel,
  formatMatchStatusLabel,
  hasFinalScore,
  isLiveStatus,
} from '@app/features/football/football-status.util';

/**
 * The dense, scannable match row — the primary way matches are listed
 * (spec §15): status/time · home · score · away · broadcast, all one line.
 * The whole row is the click target (44px+ min-height, keyboard reachable).
 */
@Component({
  selector: 'app-football-match-row',
  standalone: true,
  imports: [CommonModule, RouterModule, FootballTeamBadgeComponent, FootballBroadcastIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="row" [class.row--live]="isLive" [routerLink]="link" [attr.aria-label]="accessibleLabel">
      <span class="row__status" [class.row__status--live]="isLive">
        <span *ngIf="isLive" class="row__dot" aria-hidden="true"></span>
        {{ statusLabel }}
      </span>

      <span class="row__team">
        <app-football-team-badge [team]="match.homeTeam"></app-football-team-badge>
      </span>

      <span class="row__score" aria-hidden="true">
        <ng-container *ngIf="hasScore; else noScore">
          <span class="row__score-value">{{ match.score.home }}</span>
          <span class="row__score-sep">-</span>
          <span class="row__score-value">{{ match.score.away }}</span>
        </ng-container>
        <ng-template #noScore>
          <span class="row__vs">vs</span>
        </ng-template>
      </span>

      <span class="row__team row__team--away">
        <app-football-team-badge [team]="match.awayTeam" [reversed]="true"></app-football-team-badge>
      </span>

      <span class="row__broadcast">
        <app-football-broadcast-indicator [broadcasts]="match.broadcasts"></app-football-broadcast-indicator>
      </span>
    </a>
  `,
  styles: `
    :host { display: block; }
    .row {
      display: grid;
      grid-template-columns: 3.25rem 1fr auto 1fr auto;
      align-items: center;
      gap: 0.625rem;
      min-height: 44px;
      padding: 0.5rem 0.75rem;
      color: inherit;
      text-decoration: none;
      border-radius: 0.5rem;
      transition: background 0.15s ease;
    }
    .row:hover, .row:focus-visible { background: var(--portal-surface-strong); }
    .row:focus-visible { outline: 2px solid var(--accent-sports); outline-offset: -2px; }
    .row + .row { border-top: 1px solid var(--portal-divider); }
    .row--live { background: var(--status-live-soft); }
    .row--live:hover, .row--live:focus-visible { filter: brightness(1.05); }

    .row__status {
      font-size: 0.75rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--portal-text-muted);
      display: flex;
      align-items: center;
      gap: 0.3rem;
      white-space: nowrap;
    }
    .row__status--live { color: var(--status-live); font-weight: 800; }
    .row__dot {
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 9999px;
      background: var(--status-live);
      animation: football-row-pulse 1.4s ease-in-out infinite;
      flex: 0 0 auto;
    }
    @media (prefers-reduced-motion: reduce) {
      .row__dot { animation: none; }
    }
    @keyframes football-row-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    .row__team { min-width: 0; }
    .row__team--away { justify-self: end; }

    .row__score {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      min-width: 2.5rem;
      justify-content: center;
      font-variant-numeric: tabular-nums;
    }
    .row__score-value { font-weight: 800; font-size: 1rem; color: var(--portal-text); }
    .row--live .row__score-value { color: var(--status-live); }
    .row__score-sep { color: var(--portal-text-muted); }
    .row__vs { font-size: 0.75rem; font-weight: 650; color: var(--portal-text-faint); }

    .row__broadcast { justify-self: end; }

    @media (max-width: 480px) {
      .row { grid-template-columns: 2.5rem 1fr auto 1fr; gap: 0.4rem; }
      .row__broadcast { display: none; }
    }
  `,
})
export class FootballMatchRowComponent {
  @Input({ required: true }) match!: FootballMatchDTO;

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

  get accessibleLabel(): string {
    const broadcast = this.match.broadcasts?.find((b) => b.confidence !== 'low');
    return formatMatchAccessibleLabel(this.match, broadcast?.channelName);
  }
}
