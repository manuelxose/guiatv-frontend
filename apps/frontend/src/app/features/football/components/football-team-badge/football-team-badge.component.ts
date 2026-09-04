import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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
    <span class="badge" [class.badge--vertical]="layout === 'vertical'" [class.badge--reversed]="reversed">
      <span class="badge__crest" aria-hidden="true">
        <img
          *ngIf="team.crest && !crestFailed; else crestFallback"
          [src]="team.crest"
          [alt]="''"
          width="32"
          height="32"
          loading="lazy"
          decoding="async"
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
      max-width: 100%;
    }
    .badge--vertical {
      flex-direction: column;
      gap: 0.375rem;
      text-align: center;
    }
    /* Away-side rows: crest sits nearest the edge, name nearest the score. */
    .badge--reversed { flex-direction: row-reverse; text-align: right; }
    .badge__crest {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      flex: 0 0 auto;
      border-radius: var(--radius-pill);
      overflow: hidden;
      background: var(--portal-surface-strong);
      border: 1px solid var(--portal-border);
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
      color: var(--portal-text-muted);
      text-transform: uppercase;
    }
    .badge__name {
      font-weight: 650;
      color: var(--portal-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .badge--vertical .badge__name {
      max-width: 9ch;
      white-space: normal;
      line-height: 1.15;
    }
  `,
})
export class FootballTeamBadgeComponent implements OnChanges {
  @Input({ required: true }) team!: FootballTeamDTO;
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';
  /** Horizontal layout only: crest outermost, name innermost (away-side rows). */
  @Input() reversed = false;

  crestFailed = false;

  ngOnChanges(changes: SimpleChanges): void {
    // A row/card component can be reused for a different team without
    // destroying the view (e.g. *ngFor with trackBy) — reset the fallback
    // flag so a previous team's broken crest doesn't stick to the new one.
    if (changes['team']) {
      this.crestFailed = false;
    }
  }

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
    // Local view flag rather than reassigning the @Input — the fallback
    // template takes over without mutating the caller's data.
    this.crestFailed = true;
  }
}
