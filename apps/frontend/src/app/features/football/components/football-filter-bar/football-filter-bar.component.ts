import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PortalLocalToolbarComponent } from '@app/components/portal-local-toolbar/portal-local-toolbar.component';

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
  imports: [PortalLocalToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-portal-local-toolbar
      [items]="filters"
      [active]="active"
      ariaLabel="Filtrar partidos"
      (itemSelect)="selectFilter($event)"
    ></app-portal-local-toolbar>
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
