import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballMatchDTO } from '@app/features/football/football.models';
import { FootballTeamBadgeComponent } from '@app/features/football/components/football-team-badge/football-team-badge.component';

export type FootballMatchCardVariant = 'default' | 'live' | 'compact' | 'schedule' | 'featured';

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Purpose-built football match card. NOT a program/poster card: a match reads
 * as "who plays, when, score/status, where to watch".
 */
@Component({
  selector: 'app-football-match-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FootballTeamBadgeComponent],
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
        <img *ngIf="match.competition.logo" [src]="match.competition.logo" [alt]="''" class="card__comp-logo" />
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
          <span *ngIf="primaryBroadcast" class="card__broadcast">
            {{ primaryBroadcast.channelName }}
          </span>
        </span>
      </span>
    </a>
  `,
  styles: `
    :host { display: block; }
    .card {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.18));
      border-radius: 0.75rem;
      background: var(--football-card-bg, rgba(15, 23, 42, 0.6));
      color: inherit;
      text-decoration: none;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .card:hover { border-color: rgba(34, 197, 94, 0.4); }
    .card--live { border-left: 3px solid #ef4444; }
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
      color: var(--football-text-muted, #94a3b8);
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
      color: var(--football-text, #f1f5f9);
    }
    .card--live .card__score-value { color: #ef4444; }
    .card__score-sep { color: var(--football-text-muted, #64748b); }
    .card__time {
      font-size: 0.875rem;
      font-weight: 750;
      color: var(--football-text, #f1f5f9);
      white-space: nowrap;
    }

    .card__meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--football-text-muted, #94a3b8);
    }
    .card__live-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 9999px;
      background: #ef4444;
      animation: pulse 1.4s ease-in-out infinite;
    }
    .card__status { font-weight: 650; }
    .card--live .card__status { color: #fca5a5; }
    .card__broadcast { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `,
})
export class FootballMatchCardComponent {
  @Input({ required: true }) match!: FootballMatchDTO;
  @Input() variant: FootballMatchCardVariant = 'default';

  @Output() selected = new EventEmitter<FootballMatchDTO>();

  get link(): string {
    return `/deportes/futbol/partido/${this.match.slug || this.match.id}`;
  }

  get isLive(): boolean {
    return this.match.status === 'live' || this.match.status === 'halftime';
  }

  get hasScore(): boolean {
    return this.match.score?.home != null && this.match.score?.away != null;
  }

  get statusLabel(): string {
    if (this.match.status === 'live') return this.match.minute ? `${this.match.minute}'` : 'En directo';
    if (this.match.status === 'halftime') return 'Descanso';
    if (this.match.status === 'finished') return 'Final';
    if (this.match.status === 'postponed') return 'Aplazado';
    if (this.match.status === 'suspended') return 'Suspendido';
    if (this.match.status === 'cancelled') return 'Cancelado';
    return formatTime(this.match.kickoffAt);
  }

  get primaryBroadcast() {
    return this.match.broadcasts?.find((broadcast) => broadcast.confidence !== 'low') ?? null;
  }

  /**
   * Accessible sentence: "Real Madrid contra Barcelona, en directo, 2 a 1,
   * Movistar LaLiga" — not an incoherent run of numbers.
   */
  get accessibleLabel(): string {
    const teams = `${this.match.homeTeam.name} contra ${this.match.awayTeam.name}`;
    const score = this.hasScore ? `, ${this.match.score.home} a ${this.match.score.away}` : '';
    const status = this.isLive
      ? this.match.minute
        ? `, minuto ${this.match.minute}`
        : ', en directo'
      : this.match.status === 'finished'
        ? ', finalizado'
        : '';
    const broadcast = this.primaryBroadcast ? `, ${this.primaryBroadcast.channelName}` : '';
    return `${teams}${score}${status}${broadcast}`;
  }

  onSelect(): void {
    this.selected.emit(this.match);
  }
}
