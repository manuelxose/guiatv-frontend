import { Directive, ElementRef, Input, OnDestroy, OnChanges, inject } from '@angular/core';
import { CatalogContentType, CatalogService } from '../services/catalog.service';

export interface PrefetchDetailTarget {
  /** Slug-route path as returned by the API, e.g. "/peliculas/interstellar". */
  detailPath?: string | null;
  contentType?: CatalogContentType | null;
  /** Falls back to a direct catalogId prefetch when there's no slug route to parse. */
  catalogId?: string | null;
}

/**
 * Warms the detail-page cache ahead of navigation on a genuine signal of
 * intent: pointer hover, pointerdown (fires before a routerLink click
 * completes navigation), or keyboard focus. Deliberately NOT wired to
 * viewport visibility — prefetching every card that scrolls into view would
 * multiply backend load for content the user never opens, which is the same
 * problem this whole effort exists to fix. Hover/pointerdown/focus are cheap
 * because they fire for a handful of cards per session, not every card
 * rendered.
 *
 * Usage: `<a [appPrefetchDetail]="card" [routerLink]="card.detailPath">`
 */
@Directive({
  selector: '[appPrefetchDetail]',
  standalone: true,
})
export class PrefetchDetailDirective implements OnChanges, OnDestroy {
  @Input('appPrefetchDetail') target: PrefetchDetailTarget | null | undefined;

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly catalogService = inject(CatalogService);
  private triggered = false;
  private readonly trigger = () => this.prefetch();

  constructor() {
    // pointerenter: mouse hover intent. pointerdown: fires before the
    // routerLink navigation completes, so touch/click still gets a head
    // start. focus: keyboard navigation parity.
    this.host.addEventListener('pointerenter', this.trigger, { passive: true });
    this.host.addEventListener('pointerdown', this.trigger, { passive: true });
    this.host.addEventListener('focus', this.trigger, { passive: true });
  }

  ngOnChanges(): void {
    // A recycled card (virtual scroll / *ngFor trackBy reuse) can be handed a
    // new `target` for the same DOM node — allow it to prefetch again.
    this.triggered = false;
  }

  ngOnDestroy(): void {
    this.host.removeEventListener('pointerenter', this.trigger);
    this.host.removeEventListener('pointerdown', this.trigger);
    this.host.removeEventListener('focus', this.trigger);
  }

  private prefetch(): void {
    if (this.triggered || !this.target) {
      return;
    }
    this.triggered = true;

    const slug = this.extractSlug(this.target.detailPath);
    if (slug && this.target.contentType) {
      this.catalogService.prefetchBySlug(this.target.contentType, slug);
      return;
    }

    this.catalogService.prefetchDetail(this.target.catalogId);
  }

  private extractSlug(detailPath?: string | null): string | undefined {
    if (!detailPath) return undefined;
    const segments = detailPath.split('/').filter(Boolean);
    return segments.length ? segments[segments.length - 1] : undefined;
  }
}
