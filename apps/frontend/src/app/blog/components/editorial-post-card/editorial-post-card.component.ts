import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EditorialPost } from '../../models/editorial.models';

@Component({
  selector: 'app-editorial-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="post?.canonicalPath"
      class="editorial-post-card group relative block overflow-hidden rounded-[1.6rem] border border-[var(--portal-border)] bg-[var(--portal-surface)] transition-colors hover:border-[var(--portal-border-strong)]"
      data-vertical="editorial"
    >
      <div class="relative aspect-[16/10] overflow-hidden bg-[var(--portal-surface-strong)]">
        <img
          [src]="post?.coverImage"
          [alt]="post?.title || 'Artículo editorial'"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"></div>
        <div class="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/25 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
          {{ post?.primaryCategory?.name || (post?.isRanking ? 'Rankings' : 'Editorial') }}
        </div>
      </div>

      <div class="space-y-4 p-5">
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
          <h3 class="text-xl font-semibold leading-tight text-[var(--portal-text)] group-hover:text-[var(--accent-editorial)]">
            {{ post?.title }}
          </h3>
          <p class="line-clamp-3 text-sm leading-6 text-[var(--portal-text-soft)]">
            {{ post?.excerptText }}
          </p>
        </div>

        <span class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-editorial)]">
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
      }
    `,
  ],
})
export class EditorialPostCardComponent {
  @Input({ required: true }) post!: EditorialPost;
}
