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
      class="editorial-post-card group relative block overflow-hidden rounded-[1.6rem] border border-slate-800/80 bg-slate-950/70 transition-colors hover:border-slate-600"
      data-vertical="editorial"
    >
      <div class="relative aspect-[16/10] overflow-hidden bg-slate-900">
        <img
          [src]="post?.coverImage"
          [alt]="post?.title || 'Artículo editorial'"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"></div>
        <div class="absolute left-4 top-4 inline-flex items-center rounded-full border border-slate-700/80 bg-slate-950/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
          {{ post?.primaryCategory?.name || (post?.isRanking ? 'Rankings' : 'Editorial') }}
        </div>
      </div>

      <div class="space-y-4 p-5">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span>{{ post?.publishedAt | date : 'dd MMM yyyy' }}</span>
          <span>•</span>
          <span>{{ post?.readingMinutes }} min</span>
          <span
            *ngIf="post?.isRanking"
            class="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200"
          >
            Ranking
          </span>
        </div>

        <div class="space-y-2">
          <h3 class="text-xl font-semibold leading-tight text-white group-hover:text-red-200">
            {{ post?.title }}
          </h3>
          <p class="line-clamp-3 text-sm leading-6 text-slate-400">
            {{ post?.excerptText }}
          </p>
        </div>

        <span class="inline-flex items-center gap-2 text-sm font-semibold text-red-300">
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
