import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterChipBarComponent, FilterChipItem } from '@app/components/filter-chip-bar/filter-chip-bar.component';

export type FootballMatchFilter = 'all' | 'live' | 'tv' | 'upcoming' | 'finished';

const FILTERS: FilterChipItem[] = [
  { id: 'all', label: 'Todos' },
  { id: 'live', label: 'En directo' },
  { id: 'tv', label: 'TV' },
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
  imports: [FilterChipBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-filter-chip-bar
      [chips]="filters"
      [active]="active"
      ariaLabel="Filtrar partidos"
      (chipSelect)="selectFilter($event)"
    ></app-filter-chip-bar>
  `,
  styles: `:host { display: block; min-width: 0; }`,
})
export class FootballFilterBarComponent {
  @Input() active: FootballMatchFilter = 'all';
  @Output() filterChange = new EventEmitter<FootballMatchFilter>();

  readonly filters = FILTERS;

  selectFilter(id: string): void {
    this.filterChange.emit(id as FootballMatchFilter);
  }
}

export function applyFootballMatchFilter<T extends { status: string; broadcasts?: Array<{ confidence?: string }> }>(
  matches: T[],
  filter: FootballMatchFilter
): T[] {
  if (filter === 'all') return matches;
  if (filter === 'live') return matches.filter((m) => m.status === 'live' || m.status === 'halftime');
  if (filter === 'tv') return matches.filter((m) => m.broadcasts?.some((broadcast) => broadcast.confidence !== 'low'));
  if (filter === 'finished') return matches.filter((m) => m.status === 'finished');
  if (filter === 'upcoming') return matches.filter((m) => m.status === 'scheduled');
  return matches;
}
