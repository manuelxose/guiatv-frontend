import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CatalogItem } from '../../services/catalog.service';
import { CatalogCardComponent } from '../catalog-card/catalog-card.component';

@Component({
  selector: 'app-catalog-rail',
  standalone: true,
  imports: [CommonModule, RouterModule, CatalogCardComponent],
  template: `
    <section class="group/rail relative space-y-4">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p *ngIf="eyebrow" class="text-[11px] uppercase tracking-[0.35em] text-[var(--portal-text-muted)]">
            {{ eyebrow }}
          </p>
          <h2 class="text-2xl font-semibold text-[var(--portal-text)]">{{ title }}</h2>
          <p *ngIf="subtitle" class="mt-1 text-sm text-[var(--portal-text-muted)]">{{ subtitle }}</p>
        </div>
        <a
          *ngIf="linkLabel && linkPath"
          [routerLink]="linkPath"
          [queryParams]="linkQueryParams"
          class="min-h-[40px] rounded-full border border-[var(--portal-border)] px-4 py-2 text-sm font-semibold text-[var(--portal-text-soft)] transition-colors hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)]"
        >
          {{ linkLabel }}
        </a>
      </div>

      <div class="relative">
        <!--
          Dragging a horizontal rail with a mouse is fiddly on desktop —
          click arrows are the expected desktop affordance (touch swipe
          already covers mobile). Hidden below md since touch handles it
          there; shown on hover/focus of the rail on larger viewports.
        -->
        <button
          *ngIf="items.length > 2"
          type="button"
          aria-label="Desplazar hacia la izquierda"
          class="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-2 text-[var(--portal-text)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity group-hover/rail:opacity-100 focus-visible:opacity-100 md:flex"
          (click)="scrollBy(-1)"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="m12.5 4.5-5 5.5 5 5.5" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path>
          </svg>
        </button>

        <div #scrollEl class="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-2">
          <div *ngFor="let item of items" class="w-[280px] flex-shrink-0">
            <app-catalog-card [item]="item" [compact]="true"></app-catalog-card>
          </div>
        </div>

        <button
          *ngIf="items.length > 2"
          type="button"
          aria-label="Desplazar hacia la derecha"
          class="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-2 text-[var(--portal-text)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity group-hover/rail:opacity-100 focus-visible:opacity-100 md:flex"
          (click)="scrollBy(1)"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="m7.5 4.5 5 5.5-5 5.5" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path>
          </svg>
        </button>
      </div>
    </section>
  `,
})
export class CatalogRailComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() linkLabel = '';
  @Input() linkPath: any[] | string | null = null;
  @Input() linkQueryParams: Record<string, string> | null = null;
  @Input() items: CatalogItem[] = [];

  @ViewChild('scrollEl') private readonly scrollEl?: ElementRef<HTMLElement>;

  scrollBy(direction: 1 | -1): void {
    const el = this.scrollEl?.nativeElement;
    if (!el) {
      return;
    }
    // ~85% of the visible width per click — one comfortable "page" of cards
    // rather than a fixed pixel amount that under/over-shoots on other
    // viewport widths.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  }
}
