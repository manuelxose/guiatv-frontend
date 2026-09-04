import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballBroadcastDTO } from '@app/features/football/football.models';
import { AffiliateService } from '@app/services/affiliate.service';
import { AffiliateCTAComponent } from '@app/components/affiliate-cta/affiliate-cta.component';
import { AffiliateDisclosureComponent } from '@app/components/affiliate-disclosure/affiliate-disclosure.component';
import { AffiliateImpressionDirective } from '@app/directives/affiliate-impression.directive';
import { AffiliateContext, AffiliatePlacementKey, AffiliateResolvedOffer } from '@app/interfaces/affiliate.interface';

/**
 * "Dónde verlo" — lists TV channels/streaming platforms for a match.
 * Only real, non-low-confidence broadcasts are shown. No illegal stream links.
 *
 * Optionally (opt-in, default off) resolves an affiliate CTA per confident
 * broadcaster: the Affiliate Engine only ever sees channel names this
 * component already knows from real broadcast data — it never guesses
 * broadcast rights, only whether a commercial relationship exists for a
 * channel that's already confirmed to carry the match. Renders nothing when
 * none of the named channels has one (free-to-air / unmapped stays silent).
 */
@Component({
  selector: 'app-football-broadcast-list',
  standalone: true,
  imports: [CommonModule, RouterModule, AffiliateCTAComponent, AffiliateDisclosureComponent, AffiliateImpressionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="broadcasts" *ngIf="broadcasts.length">
      <h2 class="broadcasts__title">Dónde verlo</h2>
      <ul class="broadcasts__list">
        <li *ngFor="let broadcast of broadcasts" class="broadcasts__item">
          <a
            class="broadcasts__link"
            [routerLink]="broadcast.channelPath"
            *ngIf="broadcast.channelPath; else plainChannel"
          >
            <span class="broadcasts__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path d="M8 2.5 12 6l4-3.5" />
              </svg>
            </span>
            {{ broadcast.channelName }}
            <span class="broadcasts__tag">{{ availabilityLabel(broadcast) }}</span>
          </a>
          <ng-template #plainChannel>
            <span class="broadcasts__plain">
              {{ broadcast.channelName }}
              <span class="broadcasts__tag">{{ availabilityLabel(broadcast) }}</span>
            </span>
          </ng-template>
        </li>
      </ul>

      <div *ngIf="affiliateOffers().length" class="broadcasts__affiliate">
        <app-affiliate-cta
          *ngFor="let offer of affiliateOffers()"
          [offer]="offer"
          variant="secondary"
          [appAffiliateImpression]="offer"
          [appAffiliateImpressionContext]="impressionContext()"
          appAffiliateImpressionPage="football-match"
        ></app-affiliate-cta>
        <app-affiliate-disclosure [sponsored]="hasSponsoredOffer()" [compact]="true"></app-affiliate-disclosure>
      </div>
    </section>
  `,
  styles: `
    .broadcasts {
      border: 1px solid var(--portal-border);
      border-radius: var(--radius-lg);
      padding: 1rem;
      background: var(--portal-card);
    }
    .broadcasts__title {
      margin: 0 0 0.625rem;
      font-size: 0.8125rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--portal-text-muted);
    }
    .broadcasts__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .broadcasts__link, .broadcasts__plain {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      color: var(--portal-text);
      text-decoration: none;
      font-weight: 650;
      font-size: 0.875rem;
    }
    .broadcasts__link:hover { text-decoration: underline; }
    .broadcasts__icon { width: 1.1rem; height: 1.1rem; color: var(--accent-sports); }
    .broadcasts__tag {
      margin-left: auto;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--portal-text-muted);
      border: 1px solid var(--portal-border);
      border-radius: var(--radius-pill);
      padding: 0.125rem 0.5rem;
    }
    .broadcasts__affiliate {
      margin-top: 0.875rem;
      padding-top: 0.875rem;
      border-top: 1px solid var(--portal-border);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.625rem;
    }
  `,
})
export class FootballBroadcastListComponent implements OnChanges {
  @Input() broadcasts: FootballBroadcastDTO[] = [];

  /**
   * Opt-in only, default off — a caller enables this only for a genuinely
   * high-intent "where do I watch this" surface (match detail, a
   * competition's single next match), never for every row in a list.
   */
  @Input() enableAffiliateCta = false;
  @Input() affiliatePlacement: AffiliatePlacementKey = 'football-match';
  @Input() footballMatchId?: string;
  @Input() competitionId?: string;

  readonly affiliateOffers = signal<AffiliateResolvedOffer[]>([]);
  private readonly affiliateService = inject(AffiliateService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['broadcasts'] || changes['enableAffiliateCta'] || changes['affiliatePlacement']) {
      this.resolveAffiliateOffers();
    }
  }

  availabilityLabel(broadcast: FootballBroadcastDTO): string {
    if (broadcast.availability === 'both') return 'TV y streaming';
    if (broadcast.availability === 'streaming') return 'Streaming';
    return 'TV';
  }

  hasSponsoredOffer(): boolean {
    return this.affiliateOffers().some((offer) => offer.cta.sponsored);
  }

  impressionContext(): Pick<AffiliateContext, 'market' | 'placement' | 'contentType' | 'contentId' | 'footballMatchId' | 'competitionId'> {
    return {
      market: 'ES',
      placement: this.affiliatePlacement,
      footballMatchId: this.footballMatchId,
      competitionId: this.competitionId,
    };
  }

  /**
   * One batched resolve for the whole broadcast list, using only the
   * *confident* channel names already shown above as provider hints — the
   * resolver's alias mapping decides whether any of them is a commercial
   * merchant. A free-to-air or unmapped channel simply yields no offer.
   */
  private resolveAffiliateOffers(): void {
    this.affiliateOffers.set([]);
    if (!this.enableAffiliateCta) return;

    const providerKeys = Array.from(
      new Set(
        this.broadcasts
          .filter((broadcast) => broadcast.confidence !== 'low')
          .map((broadcast) => broadcast.channelName)
          .filter(Boolean)
      )
    );
    if (!providerKeys.length) return;

    const context: AffiliateContext = {
      market: 'ES',
      placement: this.affiliatePlacement,
      providerKey: providerKeys[0],
      footballMatchId: this.footballMatchId,
      competitionId: this.competitionId,
    };

    this.affiliateService
      .resolveMany(context, { providerKeys, maxResults: providerKeys.length })
      .subscribe((offers) => this.affiliateOffers.set(offers));
  }
}
