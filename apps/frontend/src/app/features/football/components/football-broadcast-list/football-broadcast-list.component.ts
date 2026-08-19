import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballBroadcastDTO } from '@app/features/football/football.models';

/**
 * "Dónde verlo" — lists TV channels/streaming platforms for a match.
 * Only real, non-low-confidence broadcasts are shown. No illegal stream links.
 */
@Component({
  selector: 'app-football-broadcast-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="broadcasts" *ngIf="broadcasts.length">
      <h2 class="broadcasts__title">Dónde verlo</h2>
      <ul class="broadcasts__list">
        <li *ngFor="let broadcast of broadcasts" class="broadcasts__item">
          <a
            class="broadcasts__link"
            [routerLink]="broadcast.channelPath"
            *ngIf="broadcast.channelPath; else plainChannel"
          >
            <span class="broadcasts__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path d="M8 2.5 12 6l4-3.5" />
              </svg>
            </span>
            {{ broadcast.channelName }}
            <span class="broadcasts__tag">{{ availabilityLabel(broadcast) }}</span>
          </a>
          <ng-template #plainChannel>
            <span class="broadcasts__plain">
              {{ broadcast.channelName }}
              <span class="broadcasts__tag">{{ availabilityLabel(broadcast) }}</span>
            </span>
          </ng-template>
        </li>
      </ul>
    </section>
  `,
  styles: `
    .broadcasts {
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.18));
      border-radius: 0.75rem;
      padding: 1rem;
      background: var(--football-card-bg, rgba(15, 23, 42, 0.6));
    }
    .broadcasts__title {
      margin: 0 0 0.625rem;
      font-size: 0.8125rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--football-text-muted, #94a3b8);
    }
    .broadcasts__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .broadcasts__link, .broadcasts__plain {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      color: var(--football-text, #e2e8f0);
      text-decoration: none;
      font-weight: 650;
      font-size: 0.875rem;
    }
    .broadcasts__link:hover { text-decoration: underline; }
    .broadcasts__icon { width: 1.1rem; height: 1.1rem; color: var(--football-accent, #22c55e); }
    .broadcasts__tag {
      margin-left: auto;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--football-text-muted, #64748b);
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.2));
      border-radius: 9999px;
      padding: 0.125rem 0.5rem;
    }
  `,
})
export class FootballBroadcastListComponent {
  @Input() broadcasts: FootballBroadcastDTO[] = [];

  availabilityLabel(broadcast: FootballBroadcastDTO): string {
    if (broadcast.availability === 'both') return 'TV y streaming';
    if (broadcast.availability === 'streaming') return 'Streaming';
    return 'TV';
  }
}
