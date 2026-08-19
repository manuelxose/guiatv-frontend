import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FootballStandingRowDTO } from '@app/features/football/football.models';

/**
 * Mobile-friendly standings table. Key columns always visible; secondary
 * stats hidden on narrow viewports.
 */
@Component({
  selector: 'app-football-standings-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="standings" role="table" aria-label="Clasificación">
      <div class="standings__head" role="row">
        <span class="standings__pos" role="columnheader">#</span>
        <span class="standings__team" role="columnheader">Equipo</span>
        <span class="standings__cell" role="columnheader">PJ</span>
        <span class="standings__cell" role="columnheader">DG</span>
        <span class="standings__cell standings__pts" role="columnheader">Pts</span>
      </div>
      <div
        *ngFor="let row of standings; trackBy: trackByPosition"
        class="standings__row"
        role="row"
      >
        <span class="standings__pos" role="cell">{{ row.position }}</span>
        <span class="standings__team" role="cell">
          <span class="standings__name">{{ row.team.shortName || row.team.name }}</span>
          <span *ngIf="row.form" class="standings__form">{{ row.form }}</span>
        </span>
        <span class="standings__cell" role="cell">{{ row.played }}</span>
        <span class="standings__cell" role="cell">{{ signed(row.goalDifference) }}</span>
        <span class="standings__cell standings__pts" role="cell">{{ row.points }}</span>
      </div>
      <div *ngIf="!standings.length" class="standings__empty">
        Clasificación no disponible para esta competición.
      </div>
    </div>
  `,
  styles: `
    .standings {
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.18));
      border-radius: 0.75rem;
      overflow: hidden;
      background: var(--football-card-bg, rgba(15, 23, 42, 0.6));
    }
    .standings__head, .standings__row {
      display: grid;
      grid-template-columns: 2rem 1fr 2.25rem 2.25rem 2.5rem;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
    }
    .standings__head {
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--football-text-muted, #94a3b8);
      border-bottom: 1px solid var(--football-border, rgba(148, 163, 184, 0.18));
    }
    .standings__row {
      font-size: 0.875rem;
      color: var(--football-text, #e2e8f0);
      border-bottom: 1px solid var(--football-border, rgba(148, 163, 184, 0.1));
    }
    .standings__row:last-child { border-bottom: none; }
    .standings__pos {
      font-weight: 750;
      color: var(--football-text-muted, #94a3b8);
      text-align: center;
    }
    .standings__team {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .standings__name { font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .standings__form {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--football-text-muted, #64748b);
    }
    .standings__cell { text-align: center; font-variant-numeric: tabular-nums; }
    .standings__pts { font-weight: 850; color: var(--football-accent, #22c55e); }
    .standings__empty { padding: 1.25rem; text-align: center; color: var(--football-text-muted, #94a3b8); font-size: 0.875rem; }
  `,
})
export class FootballStandingsTableComponent {
  @Input() standings: FootballStandingRowDTO[] = [];

  signed(value: number): string {
    return value > 0 ? `+${value}` : String(value);
  }

  trackByPosition(_index: number, row: FootballStandingRowDTO): number {
    return row.position;
  }
}
