import { Directive, ElementRef, Input, OnChanges, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AffiliateContext, AffiliateResolvedOffer } from '../interfaces/affiliate.interface';
import { AffiliateService } from '../services/affiliate.service';

const VIEWABILITY_THRESHOLD = 0.5;

/**
 * Fires exactly one `affiliate_impression` beacon per host element, the
 * moment the element is actually visible (IntersectionObserver, 50%
 * threshold) rather than the moment it renders — an offer scrolled past
 * without being seen is not an impression. Deliberately NOT re-triggered by
 * Angular change detection: the observer disconnects itself after the first
 * qualifying intersection, so re-renders, `*ngFor` recycling, or repeated
 * `ngOnChanges` calls for the same offer/placement never double-fire
 * (`AffiliateService.trackImpressions` also dedupes as a second layer).
 *
 * Usage:
 * ```html
 * <div [appAffiliateImpression]="offer" [appAffiliateImpressionContext]="context">
 * ```
 */
@Directive({
  selector: '[appAffiliateImpression]',
  standalone: true,
})
export class AffiliateImpressionDirective implements OnChanges, OnDestroy {
  @Input('appAffiliateImpression') offer: AffiliateResolvedOffer | null = null;
  @Input('appAffiliateImpressionContext') context: Pick<AffiliateContext, 'market' | 'placement' | 'contentType' | 'contentId' | 'footballMatchId' | 'competitionId' | 'blogPostId'> | null = null;
  /** Current page path/name, forwarded verbatim into the impression payload. */
  @Input('appAffiliateImpressionPage') page?: string;

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly affiliateService = inject(AffiliateService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private observer?: IntersectionObserver;
  private fired = false;

  ngOnChanges(): void {
    // A recycled node (trackBy reuse) can be handed a new offer for the same
    // element — allow a fresh impression for the new offer.
    this.fired = false;
    this.teardown();
    this.observe();
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  private observe(): void {
    if (!this.isBrowser || this.fired || !this.offer || !this.context) return;

    if (typeof IntersectionObserver === 'undefined') {
      // No observer support: fall back to firing immediately rather than
      // silently losing every impression on that browser.
      this.emit();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.emit();
        }
      },
      { threshold: VIEWABILITY_THRESHOLD }
    );
    this.observer.observe(this.host);
  }

  private emit(): void {
    if (this.fired || !this.offer || !this.context) return;
    this.fired = true;
    this.teardown();

    this.affiliateService.trackImpressions([
      {
        offerId: this.offer.offerId,
        placement: this.context.placement,
        market: this.context.market,
        contentType: this.context.contentType,
        contentId: this.context.contentId,
        footballMatchId: this.context.footballMatchId,
        competitionId: this.context.competitionId,
        blogPostId: this.context.blogPostId,
        page: this.page,
      },
    ]);
  }

  private teardown(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
