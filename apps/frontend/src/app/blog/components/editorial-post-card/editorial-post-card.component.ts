import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EditorialPost } from '../../models/editorial.models';

export type EditorialPostCardVariant = 'default' | 'compact';

/**
 * Single reusable editorial card primitive. Presentation varies through
 * `variant` (default = vertical magazine card, compact = horizontal rail
 * card) and an optional `platforms` chip row, instead of separate card
 * components per section — keeps the card system to one shared surface
 * (Phase 6, "avoid excessive abstraction").
 */
@Component({
  selector: 'app-editorial-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="post?.canonicalPath"
      class="editorial-post-card group relative block overflow-hidden border border-[var(--portal-border)] bg-[var(--portal-surface)] transition-colors hover:border-[var(--portal-border-strong)]"
      [class.editorial-post-card--compact]="variant === 'compact'"
      data-vertical="editorial"
    >
      <div class="editorial-post-card__media relative overflow-hidden bg-[var(--portal-surface-strong)]">
        <img
          [src]="post?.coverImage"
          [alt]="post?.title || 'Artículo editorial'"
          width="640"
          height="400"
          class="editorial-post-card__image object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"></div>
        <div class="absolute left-3 top-3 inline-flex items-center rounded-full border border-white/25 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
          {{ post?.primaryCategory?.name || (post?.isRanking ? 'Rankings' : 'Blog') }}
        </div>
      </div>

      <div class="editorial-post-card__body space-y-3">
        <div *ngIf="platforms.length" class="flex flex-wrap gap-1.5">
          <span
            *ngFor="let platform of platforms"
            class="rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-text-soft)]"
          >
            {{ platform }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-xs text-[var(--portal-text-muted)]">
          <span>{{ post?.publishedAt | date : 'dd MMM yyyy' }}</span>
          <span>•</span>
          <span>{{ post?.readingMinutes }} min</span>
          <span
            *ngIf="post?.isRanking"
            class="inline-flex rounded-full border border-[var(--accent-sports)] bg-[var(--accent-sports-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-sports)]"
          >
            Ranking
          </span>
        </div>

        <div class="space-y-2">
          <h3 class="editorial-post-card__title font-semibold leading-tight text-[var(--portal-text)] group-hover:text-[var(--accent-editorial)]">
            {{ post?.title }}
          </h3>
          <p *ngIf="variant !== 'compact'" class="line-clamp-3 text-sm leading-6 text-[var(--portal-text-soft)]">
            {{ post?.excerptText }}
          </p>
        </div>

        <span *ngIf="variant !== 'compact'" class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-editorial)]">
          Leer artículo
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"></path>
          </svg>
        </span>
      </div>
    </a>
  `,
  styles: [
    `
      @use '../../../../styles/card-accent' as cards;

      .editorial-post-card {
        @include cards.card-vertical-accent();
        border-radius: var(--radius-md);
      }

      .editorial-post-card__body {
        padding: var(--space-5);
      }

      .editorial-post-card__media {
        aspect-ratio: 16 / 10;
      }

      .editorial-post-card__image {
        height: 100%;
        inset: 0;
        position: absolute;
        width: 100%;
      }

      .editorial-post-card__title {
        font-size: var(--text-lg);
      }

      /* Compact variant: horizontal rail card — small fixed-width thumb +
         title/meta only, no excerpt or CTA. Used for dense rails (streaming,
         collections) so every section doesn't read as the same grid. */
      .editorial-post-card--compact {
        display: grid;
        grid-template-columns: 6.5rem minmax(0, 1fr);
        gap: var(--space-3);
        align-items: stretch;
      }

      .editorial-post-card--compact .editorial-post-card__media {
        aspect-ratio: 3 / 4;
      }

      .editorial-post-card--compact .editorial-post-card__body {
        padding: var(--space-2) var(--space-3) var(--space-2) 0;
        display: grid;
        align-content: center;
        gap: var(--space-1);
      }

      .editorial-post-card--compact .editorial-post-card__title {
        font-size: var(--text-sm);
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        display: -webkit-box;
        overflow: hidden;
      }
    `,
  ],
})
export class EditorialPostCardComponent {
  @Input({ required: true }) post!: EditorialPost;
  @Input() variant: EditorialPostCardVariant = 'default';
  @Input() platforms: string[] = [];
}
