import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballCompetitionDTO } from '@app/features/football/football.models';

export type FootballCompetitionCardVariant = 'row' | 'chip';

/**
 * Competition identity card — logo/fallback initials + name + country.
 * `row` is the Competitions Hub listing style; `chip` is the compact pill
 * used inline elsewhere (e.g. Football Home's "Competiciones" section) —
 * one component instead of two near-identical hand-rolled markups.
 */
@Component({
  selector: 'app-football-competition-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="competition"
      [class.competition--chip]="variant === 'chip'"
      [routerLink]="['/deportes/futbol/competiciones', competition.slug]"
    >
      <img *ngIf="competition.logo" [src]="competition.logo" [alt]="''" class="competition__logo" />
      <span *ngIf="!competition.logo" class="competition__logo competition__logo--fallback">{{ initials }}</span>
      <span class="competition__body">
        <span class="competition__name">{{ variant === 'chip' ? (competition.shortName || competition.name) : competition.name }}</span>
        <span *ngIf="variant === 'row' && competition.country" class="competition__country">{{ competition.country }}</span>
      </span>
    </a>
  `,
  styles: `
    .competition {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 44px;
      padding: 0.875rem 1rem;
      border: 1px solid var(--portal-border);
      border-radius: 0.75rem;
      background: var(--portal-card);
      color: inherit;
      text-decoration: none;
    }
    .competition:hover, .competition:focus-visible { border-color: var(--accent-sports); }
    .competition--chip {
      display: inline-flex;
      padding: 0.5rem 0.875rem;
      border-radius: 9999px;
      gap: 0.5rem;
    }
    .competition__logo {
      width: 2.5rem;
      height: 2.5rem;
      flex: 0 0 auto;
      object-fit: contain;
      border-radius: 0.5rem;
    }
    .competition--chip .competition__logo { width: 1.25rem; height: 1.25rem; }
    .competition__logo--fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--portal-text-muted);
      background: var(--portal-surface-strong);
    }
    .competition__body { display: flex; flex-direction: column; min-width: 0; }
    .competition--chip .competition__body { flex-direction: row; }
    .competition__name {
      font-weight: 750;
      color: var(--portal-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .competition--chip .competition__name { font-size: 0.8125rem; font-weight: 650; }
    .competition__country { font-size: 0.75rem; color: var(--portal-text-muted); }
  `,
})
export class FootballCompetitionCardComponent {
  @Input({ required: true }) competition!: FootballCompetitionDTO;
  @Input() variant: FootballCompetitionCardVariant = 'row';

  get initials(): string {
    const name = this.competition?.shortName || this.competition?.name || '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  }
}
