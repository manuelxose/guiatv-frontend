import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type FootballMatchFilter = 'all' | 'live' | 'upcoming' | 'finished';

const FILTERS: Array<{ id: FootballMatchFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'live', label: 'En directo' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'finished', label: 'Finalizados' },
];

/**
 * Compact All/Live/Upcoming/Finished filter (spec §12/§58) — a query-param
 * backed selection, not local-only state, so it survives reload/share.
 */
@Component({
  selector: 'app-football-filter-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar" role="tablist" aria-label="Filtrar partidos">
      <button
        *ngFor="let filter of filters"
        type="button"
        role="tab"
        class="bar__item"
        [class.bar__item--active]="active === filter.id"
        [attr.aria-selected]="active === filter.id"
        (click)="filterChange.emit(filter.id)"
      >
        {{ filter.label }}
      </button>
    </div>
  `,
  styles: `
    .bar {
      display: flex;
      gap: 0.375rem;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .bar::-webkit-scrollbar { display: none; }
    .bar__item {
      flex: 0 0 auto;
      min-height: 44px;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      border: 1px solid var(--portal-border);
      background: var(--portal-card);
      color: var(--portal-text-muted);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
    }
    .bar__item--active {
      background: var(--accent-sports);
      border-color: var(--accent-sports);
      color: var(--portal-bg-elevated);
    }
  `,
})
export class FootballFilterBarComponent {
  @Input() active: FootballMatchFilter = 'all';
  @Output() filterChange = new EventEmitter<FootballMatchFilter>();

  readonly filters = FILTERS;
}

export function applyFootballMatchFilter<T extends { status: string }>(
  matches: T[],
  filter: FootballMatchFilter
): T[] {
  if (filter === 'all') return matches;
  if (filter === 'live') return matches.filter((m) => m.status === 'live' || m.status === 'halftime');
  if (filter === 'finished') return matches.filter((m) => m.status === 'finished');
  if (filter === 'upcoming') return matches.filter((m) => m.status === 'scheduled');
  return matches;
}
