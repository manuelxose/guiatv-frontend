import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { AffiliateService, AffiliateResolveOptions } from '../../../services/affiliate.service';
import { AffiliateContext, AffiliatePlacementKey, AffiliateResolvedOffer } from '../../../interfaces/affiliate.interface';
import { AffiliateCTAComponent } from '../../../components/affiliate-cta/affiliate-cta.component';
import { AffiliateDisclosureComponent } from '../../../components/affiliate-disclosure/affiliate-disclosure.component';
import { AffiliateImpressionDirective } from '../../../directives/affiliate-impression.directive';
import { EditorialPost } from '../../models/editorial.models';

interface ResolveSpec {
  context: AffiliateContext;
  options: AffiliateResolveOptions;
}

/**
 * Editorial monetization block for `blog-inline`/`blog-footer` placements
 * (Affiliate Engine Phase 8, see docs/affiliate-engine-architecture.md §15).
 * Self-sufficient like `FootballBroadcastListComponent`: hand it the post and
 * a placement, it decides on its own whether/what to resolve from the post's
 * own fields — never a generic default set of offers.
 *
 * Editorial independence, enforced here (not by the caller):
 * - `affiliatePlacementMode: 'off'` → nothing is resolved, ever.
 * - `'manual'` → only `manualAffiliateOfferIds` are resolved; if the editor
 *   pinned nothing, this renders nothing rather than silently falling back
 *   to automatic offers the editor did not choose.
 * - `'auto'` (default) → resolves only when the post itself named a
 *   commercial signal (a platform/merchant key, an offer category, or a
 *   manual pin). A post with none of those — the common case for ordinary
 *   editorial content — never calls the resolver at all. This is the "do
 *   not inject affiliate products blindly" rule from the brief, made
 *   mechanical rather than left to each caller to remember.
 */
@Component({
  selector: 'app-blog-affiliate-block',
  standalone: true,
  imports: [AffiliateCTAComponent, AffiliateDisclosureComponent, AffiliateImpressionDirective],
  template: `
    @if (hasOffers()) {
      <section
        class="rounded-[1.75rem] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6"
        [attr.aria-label]="heading()"
      >
        <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--portal-text-muted)]">{{ heading() }}</p>
        <div class="mt-4 flex flex-wrap gap-3">
          @for (offer of offers(); track offer.offerId) {
            <app-affiliate-cta
              [offer]="offer"
              variant="secondary"
              [appAffiliateImpression]="offer"
              [appAffiliateImpressionContext]="impressionContext()"
              [appAffiliateImpressionPage]="placement()"
            />
          }
        </div>
        @if (showDisclosure()) {
          <app-affiliate-disclosure [compact]="true" class="mt-4 block" />
        }
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogAffiliateBlockComponent {
  readonly post = input<EditorialPost | null>(null);
  readonly placement = input<AffiliatePlacementKey>('blog-inline');
  readonly maxResults = input(3);
  readonly heading = input('Dónde conseguirlo');
  readonly market = input('ES');

  private readonly affiliateService = inject(AffiliateService);

  readonly offers = signal<AffiliateResolvedOffer[]>([]);
  readonly loading = signal(false);
  readonly hasOffers = computed(() => this.offers().length > 0);
  readonly showDisclosure = computed(() => this.offers().some((offer) => offer.cta.sponsored));

  /**
   * Builds the resolve call for the current post/placement, or `null` when
   * nothing should be resolved at all — see the class doc for the exact
   * editorial-independence rules this encodes.
   */
  private readonly resolveSpec = computed<ResolveSpec | null>(() => {
    const post = this.post();
    if (!post || post.affiliatePlacementMode === 'off') return null;

    const context: AffiliateContext = {
      market: this.market(),
      placement: this.placement(),
      contentType: 'editorial',
      contentId: post.id,
      blogPostId: post.id,
    };
    const pinnedOfferIds = post.manualAffiliateOfferIds.length ? post.manualAffiliateOfferIds : undefined;

    if (post.affiliatePlacementMode === 'manual') {
      // No pin in manual mode means nothing to show — never silently widen to automatic offers.
      if (!pinnedOfferIds) return null;
      return { context, options: { pinnedOfferIds, autoResolve: false, maxResults: this.maxResults() } };
    }

    const providerKeys = Array.from(new Set([...post.relatedPlatformKeys, ...post.relatedMerchantKeys])).filter(Boolean);
    const category = post.relatedOfferCategories[0];

    if (!providerKeys.length && !category && !pinnedOfferIds) return null;

    return {
      context,
      options: {
        providerKeys: providerKeys.length ? providerKeys : undefined,
        category,
        pinnedOfferIds,
        maxResults: this.maxResults(),
      },
    };
  });

  constructor() {
    toObservable(this.resolveSpec)
      .pipe(
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => this.loading.set(true)),
        switchMap((spec) => (spec ? this.affiliateService.resolveMany(spec.context, spec.options) : of([]))),
        takeUntilDestroyed()
      )
      .subscribe((offers) => {
        this.offers.set(offers);
        this.loading.set(false);
      });
  }

  impressionContext(): Pick<AffiliateContext, 'market' | 'placement' | 'contentType' | 'contentId' | 'blogPostId'> {
    const post = this.post();
    return {
      market: this.market(),
      placement: this.placement(),
      contentType: 'editorial',
      contentId: post?.id,
      blogPostId: post?.id,
    };
  }
}
