import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, switchMap, tap } from 'rxjs';
import { AffiliateService } from '../../services/affiliate.service';
import { AffiliateContext, AffiliatePlacement, AffiliateResolvedOffer } from '../../interfaces/affiliate.interface';
import { AffiliateCTAComponent } from '../affiliate-cta/affiliate-cta.component';
import { AffiliateDisclosureComponent } from '../affiliate-disclosure/affiliate-disclosure.component';
import { AffiliateImpressionDirective } from '../../directives/affiliate-impression.directive';

/**
 * Generic "where can I watch/get this" affiliate rail for film, series,
 * programme, and general content detail surfaces. Fetches through
 * `AffiliateService.resolveMany` only — never a per-provider branch, never a
 * component hardcoded to a specific merchant. Shows only the providers the
 * resolver actually returned as relevant for this content; renders nothing
 * (not an error, not an empty-state banner) when there are none, so an
 * unmonetized title degrades to silence, not a dead section.
 */
@Component({
  selector: 'app-where-to-watch-affiliate-list',
  standalone: true,
  imports: [CommonModule, AffiliateCTAComponent, AffiliateDisclosureComponent, AffiliateImpressionDirective],
  templateUrl: './where-to-watch-affiliate-list.component.html',
  styleUrl: './where-to-watch-affiliate-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhereToWatchAffiliateListComponent {
  readonly market = input('ES');
  readonly placement = input<AffiliatePlacement>('where-to-watch');
  readonly contentType = input<string | undefined>(undefined);
  readonly contentId = input<string | undefined>(undefined);
  readonly intent = input<string | undefined>(undefined);
  readonly maxResults = input(4);
  /** Current page path, forwarded verbatim into impression payloads. */
  readonly page = input<string | undefined>(undefined);
  readonly heading = input('Dónde ver');

  private readonly affiliateService = inject(AffiliateService);

  readonly offers = signal<AffiliateResolvedOffer[]>([]);
  readonly loading = signal(true);
  readonly hasOffers = computed(() => this.offers().length > 0);
  readonly showSponsoredDisclosure = computed(() => this.offers().some((offer) => offer.cta.sponsored));

  readonly skeletonSlots = [0, 1, 2];

  /** Recomputed only when a caller-supplied input actually changes (e.g. navigating between two detail pages reuses this component instance). */
  private readonly context = computed<AffiliateContext>(() => ({
    market: this.market(),
    placement: this.placement(),
    contentType: this.contentType(),
    contentId: this.contentId(),
  }));

  constructor() {
    toObservable(this.context)
      .pipe(
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => this.loading.set(true)),
        switchMap((context) =>
          this.affiliateService.resolveMany(context, { intent: this.intent(), maxResults: this.maxResults() })
        ),
        takeUntilDestroyed()
      )
      .subscribe((offers) => {
        this.offers.set(offers);
        this.loading.set(false);
      });
  }

  trackByOfferId(_index: number, offer: AffiliateResolvedOffer): string {
    return offer.offerId;
  }

  impressionContext(): Pick<AffiliateContext, 'market' | 'placement' | 'contentType' | 'contentId'> {
    return this.context();
  }
}
