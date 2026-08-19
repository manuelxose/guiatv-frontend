import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FootballMatchDTO } from '@app/features/football/football.models';
import { FootballTeamBadgeComponent } from '@app/features/football/components/football-team-badge/football-team-badge.component';

/**
 * Match centre header: competition, round, teams, score/status, kickoff.
 * Semantically grouped so a screen reader reads a coherent sentence.
 */
@Component({
  selector: 'app-football-scoreboard',
  standalone: true,
  imports: [CommonModule, FootballTeamBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="scoreboard" [attr.aria-label]="accessibleLabel">
      <header class="scoreboard__head">
        <span class="scoreboard__competition">
          <img *ngIf="match.competition.logo" [src]="match.competition.logo" [alt]="''" />
          {{ match.competition.name }}
        </span>
        <span *ngIf="match.round" class="scoreboard__round">{{ match.round }}</span>
      </header>

      <div class="scoreboard__grid">
        <div class="scoreboard__team">
          <app-football-team-badge [team]="match.homeTeam" layout="vertical"></app-football-team-badge>
        </div>

        <div class="scoreboard__center">
          <ng-container *ngIf="hasScore; else kickoff">
            <div class="scoreboard__score">
              <span>{{ match.score.home }}</span>
              <span class="scoreboard__sep">-</span>
              <span>{{ match.score.away }}</span>
            </div>
          </ng-container>
          <ng-template #kickoff>
            <div class="scoreboard__kickoff">
              <span class="scoreboard__time">{{ kickoffTime }}</span>
              <span class="scoreboard__date">{{ kickoffDate }}</span>
            </div>
          </ng-template>

          <div class="scoreboard__status" [class.scoreboard__status--live]="isLive">
            <span *ngIf="isLive" class="scoreboard__dot"></span>
            {{ statusLabel }}
          </div>
        </div>

        <div class="scoreboard__team scoreboard__team--away">
          <app-football-team-badge [team]="match.awayTeam" layout="vertical"></app-football-team-badge>
        </div>
      </div>
    </section>
  `,
  styles: `
    .scoreboard {
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.18));
      border-radius: 1rem;
      background: var(--football-card-bg, rgba(15, 23, 42, 0.6));
      padding: 1.25rem 1rem;
    }
    .scoreboard__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .scoreboard__competition {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 750;
      color: var(--football-text, #f1f5f9);
      font-size: 0.875rem;
    }
    .scoreboard__competition img { width: 1.25rem; height: 1.25rem; object-fit: contain; }
    .scoreboard__round {
      font-size: 0.75rem;
      color: var(--football-text-muted, #94a3b8);
    }

    .scoreboard__grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 0.75rem;
    }
    .scoreboard__team--away { text-align: right; }

    .scoreboard__center { text-align: center; }
    .scoreboard__score {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-size: 2.75rem;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
      color: var(--football-text, #f1f5f9);
    }
    .scoreboard__sep { color: var(--football-text-muted, #64748b); }
    .scoreboard__kickoff { display: flex; flex-direction: column; gap: 0.125rem; }
    .scoreboard__time { font-size: 1.75rem; font-weight: 850; }
    .scoreboard__date { font-size: 0.75rem; color: var(--football-text-muted, #94a3b8); }

    .scoreboard__status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin-top: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--football-text-muted, #94a3b8);
    }
    .scoreboard__status--live { color: #fca5a5; }
    .scoreboard__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 9999px;
      background: #ef4444;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `,
})
export class FootballScoreboardComponent {
  @Input({ required: true }) match!: FootballMatchDTO;

  get isLive(): boolean {
    return this.match.status === 'live' || this.match.status === 'halftime';
  }

  get hasScore(): boolean {
    return this.match.score?.home != null && this.match.score?.away != null;
  }

  get statusLabel(): string {
    if (this.match.status === 'live') return this.match.minute ? `Minuto ${this.match.minute}` : 'En directo';
    if (this.match.status === 'halftime') return 'Descanso';
    if (this.match.status === 'finished') return 'Finalizado';
    if (this.match.status === 'postponed') return 'Aplazado';
    if (this.match.status === 'suspended') return 'Suspendido';
    if (this.match.status === 'cancelled') return 'Cancelado';
    return 'Programado';
  }

  get kickoffTime(): string {
    return this.format(this.match.kickoffAt, { hour: '2-digit', minute: '2-digit' });
  }

  get kickoffDate(): string {
    return this.format(this.match.kickoffAt, { weekday: 'long', day: 'numeric', month: 'long' });
  }

  get accessibleLabel(): string {
    const score = this.hasScore ? `${this.match.score.home} a ${this.match.score.away}` : 'pendiente';
    return `${this.match.homeTeam.name} contra ${this.match.awayTeam.name}, ${score}, ${this.statusLabel}`;
  }

  private format(iso: string, options: Intl.DateTimeFormatOptions): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', options);
  }
}
