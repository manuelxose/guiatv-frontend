import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballMatchDTO } from '@app/features/football/football.models';
import { FootballMatchRowComponent } from '@app/features/football/components/football-match-row/football-match-row.component';

export interface FootballCompetitionMatchGroup {
  competitionSlug: string;
  competitionName: string;
  competitionLogo?: string | null;
  country?: string;
  matches: FootballMatchDTO[];
}

/**
 * Groups match rows under one competition header (spec §14) — the primary
 * organizing unit of every match list ("Spain / LaLiga", "Europe /
 * Champions League"...). No metadata repeated per row.
 */
@Component({
  selector: 'app-football-competition-group',
  standalone: true,
  imports: [CommonModule, RouterModule, FootballMatchRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="group" [attr.aria-label]="group.competitionName">
      <a class="group__header" [routerLink]="['/deportes/futbol/competiciones', group.competitionSlug]">
        <img *ngIf="group.competitionLogo" [src]="group.competitionLogo" [alt]="''" class="group__logo" width="20" height="20" loading="lazy" decoding="async" />
        <span class="group__names">
          <span *ngIf="group.country" class="group__country">{{ group.country }}</span>
          <span class="group__title">{{ group.competitionName }}</span>
        </span>
      </a>
      <div class="group__rows">
        <app-football-match-row
          *ngFor="let match of group.matches; trackBy: trackByMatch"
          [match]="match"
        ></app-football-match-row>
      </div>
    </section>
  `,
  styles: `
    .group {
      border: 1px solid var(--portal-border);
      border-radius: 0.75rem;
      background: var(--portal-card);
      overflow: hidden;
    }
    .group + .group { margin-top: 0.75rem; }
    .group__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.75rem;
      border-bottom: 1px solid var(--portal-divider);
      background: var(--portal-surface-strong);
      color: inherit;
      text-decoration: none;
    }
    .group__header:hover .group__title { text-decoration: underline; }
    .group__logo { width: 1.25rem; height: 1.25rem; object-fit: contain; flex: 0 0 auto; }
    .group__names { display: flex; flex-direction: column; min-width: 0; }
    .group__country {
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--portal-text-faint);
    }
    .group__title {
      font-size: 0.8125rem;
      font-weight: 750;
      color: var(--portal-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .group__rows { display: flex; flex-direction: column; }
  `,
})
export class FootballCompetitionGroupComponent {
  @Input({ required: true }) group!: FootballCompetitionMatchGroup;

  trackByMatch(_index: number, match: FootballMatchDTO): string {
    return match.id;
  }
}

/**
 * Groups a flat match list by competition, preserving first-seen order
 * (matches already arrive roughly kickoff-sorted from the backend).
 */
export function groupMatchesByCompetition(matches: FootballMatchDTO[]): FootballCompetitionMatchGroup[] {
  const groups = new Map<string, FootballCompetitionMatchGroup>();
  for (const match of matches) {
    const key = match.competition.slug;
    let group = groups.get(key);
    if (!group) {
      group = {
        competitionSlug: match.competition.slug,
        competitionName: match.competition.shortName || match.competition.name,
        competitionLogo: match.competition.logo,
        matches: [],
      };
      groups.set(key, group);
    }
    group.matches.push(match);
  }
  return Array.from(groups.values());
}
