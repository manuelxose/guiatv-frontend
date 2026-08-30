import { AnalyticsService } from './AnalyticsService';
import { IAffiliateMerchantRepository } from '@/domain/repositories/IAffiliateMerchantRepository';
import { IAffiliateOfferRepository } from '@/domain/repositories/IAffiliateOfferRepository';
import { AffiliateAdminAnalyticsCount, AffiliateAdminAnalyticsQuery, AffiliateAdminAnalyticsReport } from '../dto/AffiliateAdminDTO';

const DEFAULT_RANGE_DAYS = 30;
/** Generous enough for admin reporting scale without needing a real aggregation pipeline. */
const EVENT_FETCH_LIMIT = 5000;

interface Counter {
  impressions: number;
  clicks: number;
}

/**
 * Read-only reporting over the same generic analytics event store every
 * `affiliate_impression`/`affiliate_click` beacon already writes to (see
 * `AffiliateAnalyticsService`) — no new collection, no aggregation pipeline,
 * just grouping in memory at admin-report scale. Never reports revenue: the
 * Affiliate Engine has no network payout/conversion feed, so a `revenue`
 * field would have to be fabricated. `note` says so explicitly in the response
 * so the admin UI never implies a number that doesn't exist.
 */
export class AffiliateAdminAnalyticsService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly merchantRepository: IAffiliateMerchantRepository,
    private readonly offerRepository: IAffiliateOfferRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  async getReport(query: AffiliateAdminAnalyticsQuery = {}): Promise<AffiliateAdminAnalyticsReport> {
    const to = query.to ? new Date(query.to) : this.now();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);
    const limit = Math.min(Math.max(1, query.limit || EVENT_FETCH_LIMIT), EVENT_FETCH_LIMIT);

    const [impressions, clicks] = await Promise.all([
      this.analyticsService.getRecentEvents({ type: 'affiliate_impression', from, to, limit }),
      this.analyticsService.getRecentEvents({ type: 'affiliate_click', from, to, limit }),
    ]);

    const byMerchant = new Map<string, Counter>();
    const byPlacement = new Map<string, Counter>();
    const byOffer = new Map<string, Counter>();
    const byContent = new Map<string, { contentType?: string; contentId: string; impressions: number; clicks: number }>();

    const bump = (map: Map<string, Counter>, key: string | undefined, field: keyof Counter) => {
      if (!key) return;
      const entry = map.get(key) || { impressions: 0, clicks: 0 };
      entry[field] += 1;
      map.set(key, entry);
    };

    for (const event of impressions) {
      const data = (event.data || {}) as Record<string, unknown>;
      bump(byMerchant, this.str(data.merchantId), 'impressions');
      bump(byPlacement, this.str(data.placement), 'impressions');
      bump(byOffer, this.str(data.offerId), 'impressions');
      this.bumpContent(byContent, data, 'impressions');
    }
    for (const event of clicks) {
      const data = (event.data || {}) as Record<string, unknown>;
      bump(byMerchant, this.str(data.merchantId), 'clicks');
      bump(byPlacement, this.str(data.placement), 'clicks');
      bump(byOffer, this.str(data.offerId), 'clicks');
      this.bumpContent(byContent, data, 'clicks');
    }

    const [merchantNames, offerLabels] = await Promise.all([
      this.merchantNames(Array.from(byMerchant.keys())),
      this.offerLabels(Array.from(byOffer.keys())),
    ]);

    const totalImpressions = impressions.length;
    const totalClicks = clicks.length;

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      totals: { impressions: totalImpressions, clicks: totalClicks, ctr: this.ctr(totalClicks, totalImpressions) },
      byMerchant: this.toCounts(byMerchant, (key) => merchantNames.get(key) || key),
      byPlacement: this.toCounts(byPlacement, (key) => key),
      byOffer: this.toCounts(byOffer, (key) => offerLabels.get(key) || key),
      topContent: Array.from(byContent.values())
        .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
        .slice(0, 20),
      note: 'Clicks and impressions only — the Affiliate Engine has no network revenue/conversion feed, so revenue is never shown or estimated here.',
    };
  }

  private bumpContent(
    map: Map<string, { contentType?: string; contentId: string; impressions: number; clicks: number }>,
    data: Record<string, unknown>,
    field: 'impressions' | 'clicks'
  ): void {
    const contentId = this.str(data.contentId);
    if (!contentId) return;
    const key = `${this.str(data.contentType) || 'unknown'}:${contentId}`;
    const entry = map.get(key) || { contentType: this.str(data.contentType), contentId, impressions: 0, clicks: 0 };
    entry[field] += 1;
    map.set(key, entry);
  }

  private toCounts(map: Map<string, Counter>, label: (key: string) => string): AffiliateAdminAnalyticsCount[] {
    return Array.from(map.entries())
      .map(([key, counter]) => ({
        key,
        label: label(key),
        impressions: counter.impressions,
        clicks: counter.clicks,
        ctr: this.ctr(counter.clicks, counter.impressions),
      }))
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  }

  private ctr(clicks: number, impressions: number): number {
    if (impressions <= 0) return 0;
    return Math.round((clicks / impressions) * 10000) / 100;
  }

  private async merchantNames(ids: string[]): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    await Promise.all(
      ids.map(async (id) => {
        const merchant = await this.merchantRepository.findById(id);
        if (merchant) names.set(id, merchant.name);
      })
    );
    return names;
  }

  private async offerLabels(ids: string[]): Promise<Map<string, string>> {
    const labels = new Map<string, string>();
    await Promise.all(
      ids.map(async (id) => {
        const offer = await this.offerRepository.findById(id);
        if (offer) labels.set(id, `${offer.plan.name} (${offer.market})`);
      })
    );
    return labels;
  }

  private str(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
