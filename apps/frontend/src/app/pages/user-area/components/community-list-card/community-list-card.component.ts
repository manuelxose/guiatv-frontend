import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommunityList } from '../../../../interfaces/user.interface';
import { APP_PATHS } from '../../../../config/route-map';

const COVER_GRADIENTS = [
  'from-[var(--accent-live)]/40 to-[var(--accent-live-strong)]/60',
  'from-[var(--spotify-warning)]/40 to-[var(--spotify-warning)]/60',
  'from-[var(--accent-streaming)]/40 to-[var(--accent-streaming)]/60',
  'from-[var(--accent-discover)]/40 to-[var(--accent-discover)]/60',
  'from-violet-600/40 to-violet-900/60',
  'from-sky-600/40 to-sky-900/60',
  'from-rose-600/40 to-rose-900/60',
  'from-teal-600/40 to-teal-900/60',
];

@Component({
  selector: 'app-community-list-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="profilePath"
      class="group block overflow-hidden rounded-[1.6rem] border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] transition-colors hover:border-[var(--portal-border-strong)]"
    >
      <!-- Cover area -->
      <div class="relative aspect-[16/10] overflow-hidden">
        <img
          *ngIf="list?.cover"
          [src]="list!.cover"
          [alt]="list!.title"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <!-- Poster mosaic when no cover but has preview posters -->
        <div
          *ngIf="!list?.cover && list?.previewPosters?.length"
          class="h-full w-full grid gap-px"
          [ngClass]="list!.previewPosters.length >= 4 ? 'grid-cols-2 grid-rows-2' : list!.previewPosters.length >= 2 ? 'grid-cols-2' : ''"
        >
          <img
            *ngFor="let poster of (list!.previewPosters || []).slice(0, 4)"
            [src]="poster"
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <!-- Gradient fallback -->
        <div
          *ngIf="!list?.cover && !list?.previewPosters?.length"
          class="h-full w-full bg-gradient-to-br"
          [ngClass]="getGradientClass()"
        >
          <div class="h-full w-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[var(--portal-text)]/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"></div>
        <div class="absolute left-4 top-4 inline-flex items-center rounded-full border border-[var(--accent-discover)]/30 bg-[var(--accent-discover)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-discover)]">
          {{ list?.itemsCount || 0 }} items
        </div>
      </div>

      <div class="space-y-3 p-5">
        <h3 class="text-lg font-semibold leading-tight text-[var(--portal-text)] group-hover:text-[var(--accent-live)] line-clamp-1">
          {{ list?.title }}
        </h3>
        <p *ngIf="list?.description" class="line-clamp-2 text-sm text-[var(--portal-text-muted)]">
          {{ list!.description }}
        </p>
        <div *ngIf="list?.user" class="flex items-center gap-2">
          <img
            [src]="list!.user!.avatar"
            [alt]="list!.user!.name"
            class="h-6 w-6 rounded-full object-cover border border-[var(--portal-border)]"
          />
          <span class="text-xs text-[var(--portal-text-muted)] truncate">{{ list!.user!.name }}</span>
        </div>
      </div>
    </a>
  `,
})
export class CommunityListCardComponent {
  @Input() list: CommunityList | null = null;

  readonly profilePath = APP_PATHS.profile;

  getGradientClass(): string {
    const title = this.list?.title || '';
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
    }
    return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
  }
}
