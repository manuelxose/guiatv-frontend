import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballEvent, formatKickoff } from '../../models/sports-event.model';

/**
 * Compact, football-specific match card. Deliberately NOT a poster card:
 * a broadcast match reads best as "who plays, when, where to watch" — the
 * domain is teams + time + broadcaster, not a cinematic image.
 */
@Component({
  selector: 'app-football-match-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './football-match-card.component.html',
  styleUrl: './football-match-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FootballMatchCardComponent {
  @Input({ required: true }) event!: FootballEvent;
  @Input() showCompetition = true;

  @Output() selected = new EventEmitter<FootballEvent>();

  get isLive(): boolean {
    return this.event.status === 'LIVE';
  }

  get kickoffLabel(): string {
    return formatKickoff(this.event.startAt);
  }

  get statusLabel(): string {
    if (this.event.status === 'LIVE') {
      return 'En directo';
    }
    if (this.event.status === 'FINISHED') {
      return 'Finalizado';
    }
    if (this.event.status === 'POSTPONED') {
      return 'Aplazado';
    }
    if (this.event.status === 'CANCELLED') {
      return 'Cancelado';
    }
    return this.kickoffLabel;
  }

  /**
   * Accessible label so a score/status is read as a sentence, not an
   * incoherent run of numbers ("Real Madrid contra Barcelona, en directo,
   * Movistar LaLiga").
   */
  get accessibleLabel(): string {
    const teams = this.event.awayTeam
      ? `${this.event.homeTeam} contra ${this.event.awayTeam}`
      : this.event.title;
    const status = this.isLive ? 'en directo' : `a las ${this.kickoffLabel}`;
    const channel = this.event.channel ? `, ${this.event.channel}` : '';
    return `${teams}, ${status}${channel}`;
  }

  onSelect(): void {
    this.selected.emit(this.event);
  }
}
