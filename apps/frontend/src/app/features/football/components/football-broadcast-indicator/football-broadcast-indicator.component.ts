import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FootballBroadcastDTO } from '@app/features/football/football.models';

/**
 * Compact "where to watch" indicator for dense match rows/cards — a single
 * chip, not a full list (the full breakdown lives in `football-broadcast-list`
 * on the match centre). Only non-low-confidence broadcasts are surfaced, so a
 * shaky guess never reads as a certain answer.
 */
@Component({
  selector: 'app-football-broadcast-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="indicator" *ngIf="primary as broadcast" [title]="fullTitle">
      {{ broadcast.channelName }}
      <span *ngIf="extraCount > 0" class="indicator__extra">+{{ extraCount }}</span>
    </span>
  `,
  styles: `
    .indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: var(--portal-text-muted);
      border: 1px solid var(--portal-border);
      border-radius: 9999px;
      padding: 0.1rem 0.5rem;
      white-space: nowrap;
      max-width: 8rem;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .indicator__extra { color: var(--accent-sports); }
  `,
})
export class FootballBroadcastIndicatorComponent {
  @Input() broadcasts: FootballBroadcastDTO[] = [];

  private get confident(): FootballBroadcastDTO[] {
    return this.broadcasts?.filter((broadcast) => broadcast.confidence !== 'low') ?? [];
  }

  get primary(): FootballBroadcastDTO | null {
    return this.confident[0] ?? null;
  }

  get extraCount(): number {
    return Math.max(0, this.confident.length - 1);
  }

  get fullTitle(): string {
    return this.confident.map((broadcast) => broadcast.channelName).join(', ');
  }
}
