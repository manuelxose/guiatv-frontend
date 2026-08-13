import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CatalogItem } from '../../services/catalog.service';
import { CardVertical, normalizeCategory, resolveVertical } from '../../utils/tv-normalizers';
import { InteractionButtonsComponent } from '../interaction-buttons/interaction-buttons.component';

@Component({
  selector: 'app-catalog-card',
  standalone: true,
  imports: [CommonModule, RouterModule, InteractionButtonsComponent],
  template: `
    <article
      class="catalog-card group relative overflow-hidden rounded-[1.75rem] border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] shadow-[0_16px_32px_rgba(0,0,0,0.28)]"
      [ngClass]="compact ? 'min-w-[220px]' : 'h-full'"
      [attr.data-vertical]="vertical"
    >
      <a
        [routerLink]="detailLink"
        class="block"
      >
        <div class="relative aspect-[16/10] overflow-hidden bg-[var(--portal-surface)]">
          <img
            *ngIf="item?.backdrop || item?.image; else imageFallback"
            [src]="item?.backdrop || item?.image"
            [alt]="item?.title"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <ng-template #imageFallback>
            <div class="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.18),_rgba(15,23,42,0.96))] text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-soft)]">
              Guia TV
            </div>
          </ng-template>

          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"></div>

          <!-- Action overlay — compact mode: buttons over image, never blocks navigation -->
          <div
            *ngIf="showActions && compact"
            class="absolute bottom-0 inset-x-0 flex items-center gap-1.5 px-3 pb-3 pt-10 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100"
            (click)="$event.stopPropagation(); $event.preventDefault()"
            (keydown)="$event.stopPropagation()"
            tabindex="-1"
          >
            <app-interaction-buttons
              [itemId]="item.catalogId"
              [title]="item.title"
              [type]="item.contentType"
              [tmdbId]="item.tmdbId"
              [genres]="item.genres"
              [image]="item.image || item.backdrop"
              [platform]="item.primaryPlatforms?.[0]"
              [compact]="true"
            ></app-interaction-buttons>
          </div>

          <div class="absolute left-3 top-3 flex flex-wrap gap-2">
            <span
              *ngIf="item?.liveNow"
              class="rounded-full border border-red-500/50 bg-red-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white"
            >
              En directo
            </span>
            <span
              *ngIf="item?.channel?.name && !item?.liveNow"
              class="rounded-full border border-[var(--portal-border-strong)] bg-[var(--portal-surface-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--portal-text-soft)]"
            >
              {{ item?.channel?.name }}
            </span>
            <span
              *ngIf="item?.primaryPlatforms?.length"
              class="rounded-full border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] px-2.5 py-1 text-[10px] font-semibold text-[var(--portal-text)]"
            >
              {{ item?.primaryPlatforms?.[0] }}
            </span>
          </div>

          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p
                *ngIf="item?.start"
                class="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--portal-text-soft)]/90"
              >
                {{ formatTime(item?.start) }}
                <span *ngIf="item?.end"> - {{ formatTime(item?.end) }}</span>
              </p>
            </div>

            <span
              *ngIf="item?.rating"
              class="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-amber-400/20 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-amber-300"
            >
              <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.37 1.12l1.07 3.29c.3.92-.75 1.69-1.54 1.12l-2.8-2.04a1 1 0 0 0-1.17 0l-2.8 2.04c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69l1.07-3.29Z"></path>
              </svg>
              {{ item?.rating | number:'1.0-1' }}
            </span>
          </div>
        </div>
      </a>

      <div class="space-y-4 p-4">
        <div class="space-y-2">
          <div class="flex flex-wrap gap-2">
            <span
              *ngFor="let genre of (item?.genres || []).slice(0, 2)"
              class="rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface)]/90 px-2.5 py-1 text-[10px] font-medium text-[var(--portal-text-soft)]"
            >
              {{ genre }}
            </span>
          </div>
          <a
            [routerLink]="detailLink"
            class="line-clamp-2 block text-base font-semibold leading-tight text-[var(--portal-text)] transition-colors hover:text-red-300"
          >
            {{ item?.title }}
          </a>
          <p class="line-clamp-2 text-sm text-[var(--portal-text-muted)]">
            {{ item?.synopsis || buildSummary(item) }}
          </p>
        </div>

        <div *ngIf="item?.primaryPlatforms?.length" class="flex flex-wrap gap-2">
          <span
            *ngFor="let platform of item?.primaryPlatforms?.slice(0, 3)"
            class="rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] px-2.5 py-1 text-[11px] text-[var(--portal-text-soft)]"
          >
            {{ platform }}
          </span>
          <span
            *ngIf="item?.userInteraction?.status"
            class="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-100"
          >
            {{ humanStatus(item?.userInteraction?.status || '') }}
          </span>
        </div>

        <div *ngIf="showActions && !compact" class="border-t border-[var(--portal-border)] pt-3">
          <app-interaction-buttons
            [itemId]="item.catalogId"
            [title]="item.title"
            [type]="item.contentType"
            [tmdbId]="item.tmdbId"
            [genres]="item.genres"
            [image]="item.image || item.backdrop"
            [platform]="item.primaryPlatforms?.[0]"
            [compact]="compact"
          ></app-interaction-buttons>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      @use '../../../styles/card-accent' as cards;

      .catalog-card {
        @include cards.card-vertical-accent();
      }
    `,
  ],
})
export class CatalogCardComponent {
  @Input({ required: true }) item!: CatalogItem;
  @Input() compact = false;
  @Input() showActions = true;

  // PosterCard's vertical, derived from data already on CatalogItem — no
  // parallel data shape. See utils/tv-normalizers.ts and
  // styles/_card-accent.scss.
  get vertical(): CardVertical {
    return resolveVertical({
      liveNow: this.item?.liveNow,
      category: normalizeCategory(this.item?.genres?.[0] || this.item?.contentType || ''),
      platforms: this.item?.primaryPlatforms,
    });
  }

  get detailLink(): any[] {
    if (this.item?.detailPath) {
      return [this.item.detailPath];
    }
    return ['/contenido', this.item?.catalogId || ''];
  }

  formatTime(value?: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  buildSummary(item: CatalogItem): string {
    if (item.channel?.name && item.start) {
      return `${item.channel.name} · ${this.formatTime(item.start)}`;
    }
    if (item.primaryPlatforms?.length) {
      return `Disponible en ${item.primaryPlatforms.slice(0, 2).join(' · ')}`;
    }
    return item.genres?.slice(0, 2).join(' · ') || 'Catalogo Guia TV';
  }

  humanStatus(status: string): string {
    if (status === 'seen') return 'Visto';
    if (status === 'watching') return 'Viendo';
    if (status === 'pending') return 'Pendiente';
    if (status === 'dropped') return 'Abandonado';
    return status;
  }
}
