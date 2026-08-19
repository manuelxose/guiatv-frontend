import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FootballTeamDTO } from '@app/features/football/football.models';

/**
 * Team crest + name with graceful fallback when no crest image exists.
 * Never blocks the UI on a missing image.
 */
@Component({
  selector: 'app-football-team-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class.badge--vertical]="layout === 'vertical'">
      <span class="badge__crest" aria-hidden="true">
        <img
          *ngIf="team.crest; else crestFallback"
          [src]="team.crest"
          [alt]="''"
          loading="lazy"
          (error)="onCrestError()"
        />
        <ng-template #crestFallback>
          <span class="badge__fallback">{{ initials }}</span>
        </ng-template>
      </span>
      <span class="badge__name">{{ team.shortName || team.name }}</span>
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }
    .badge--vertical {
      flex-direction: column;
      gap: 0.375rem;
      text-align: center;
    }
    .badge__crest {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      flex: 0 0 auto;
      border-radius: 9999px;
      overflow: hidden;
      background: var(--football-crest-bg, rgba(148, 163, 184, 0.16));
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.2));
    }
    .badge__crest img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .badge__fallback {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: var(--football-text-muted, #94a3b8);
      text-transform: uppercase;
    }
    .badge__name {
      font-weight: 650;
      color: var(--football-text, #e2e8f0);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 12ch;
    }
    .badge--vertical .badge__name {
      max-width: 9ch;
      white-space: normal;
      line-height: 1.15;
    }
  `,
})
export class FootballTeamBadgeComponent {
  @Input({ required: true }) team!: FootballTeamDTO;
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';

  get initials(): string {
    const name = this.team.shortName || this.team.name || '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  }

  onCrestError(): void {
    // Fallback is handled via the `else` template; simply clear the src.
    this.team = { ...this.team, crest: null };
  }
}
