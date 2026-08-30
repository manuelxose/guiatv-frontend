import { randomUUID } from 'crypto';
import { AnalyticsService } from './AnalyticsService';
import { logger } from '../../shared/utils/logger';

/**
 * Thin, typed wrapper over the existing `AnalyticsService.trackEvent` →
 * `IAnalyticsRepository` pipeline — the same generic event store, four new
 * `type`s. Every call is fire-and-forget: a tracking failure is logged and
 * swallowed, never allowed to block a redirect or fail a request, per the
 * Affiliate Engine reliability mandate.
 */
export interface AffiliateAnalyticsCommon {
  placement: string;
  market: string;
  contentType?: string;
  contentId?: string;
  providerKey?: string;
  page?: string;
  /** Football bounded-context dimensions — see `AffiliateContext.footballMatchId`/`competitionId`. */
  footballMatchId?: string;
  competitionId?: string;
  /** Editorial bounded-context dimension — see `AffiliateContext.blogPostId`. */
  blogPostId?: string;
}

export interface AffiliateImpressionPayload extends AffiliateAnalyticsCommon {
  merchantId: string;
  programId?: string;
  offerId: string;
}

export interface AffiliateClickPayload extends AffiliateAnalyticsCommon {
  merchantId: string;
  programId: string;
  offerId: string;
  clickId: string;
  relationship: string;
}

export interface AffiliateRedirectPayload extends AffiliateClickPayload {
  destinationHost: string;
  strategy: string;
}

export interface AffiliateErrorPayload extends Partial<AffiliateAnalyticsCommon> {
  merchantId?: string;
  offerId?: string;
  /** Short machine-readable code only — never a stack trace, never a secret value. */
  reason: string;
}

export interface AffiliateAnalyticsIdentity {
  anonId?: string;
  sessionId?: string;
}

/**
 * Phase 9 admin audit trail. Reuses this same generic event pipeline rather
 * than a new collection/service — `changedFields` names top-level keys only,
 * never values, so a secret's env-var *name* could in principle appear here
 * but its value never can (services never hold a secret value to log).
 */
export interface AffiliateAdminChangePayload {
  entityType: 'merchant' | 'network' | 'program' | 'offer' | 'placement';
  entityId: string;
  adminId: string;
  action: 'create' | 'update';
  changedFields: string[];
}

export class AffiliateAnalyticsService {
  constructor(
    private readonly analyticsService?: AnalyticsService,
    private readonly now: () => Date = () => new Date()
  ) {}

  async trackImpression(payload: AffiliateImpressionPayload, identity?: AffiliateAnalyticsIdentity): Promise<void> {
    await this.emit('affiliate_impression', payload, identity);
  }

  async trackClick(payload: AffiliateClickPayload, identity?: AffiliateAnalyticsIdentity): Promise<void> {
    await this.emit('affiliate_click', payload, identity);
  }

  async trackRedirect(payload: AffiliateRedirectPayload, identity?: AffiliateAnalyticsIdentity): Promise<void> {
    await this.emit('affiliate_redirect', payload, identity);
  }

  async trackError(payload: AffiliateErrorPayload, identity?: AffiliateAnalyticsIdentity): Promise<void> {
    await this.emit('affiliate_error', payload, identity);
  }

  async trackAdminChange(payload: AffiliateAdminChangePayload): Promise<void> {
    await this.emit('affiliate_admin_change', payload);
  }

  private async emit(
    type: 'affiliate_impression' | 'affiliate_click' | 'affiliate_redirect' | 'affiliate_error' | 'affiliate_admin_change',
    data: object,
    identity?: AffiliateAnalyticsIdentity
  ): Promise<void> {
    if (!this.analyticsService) return;

    const anonId = identity?.anonId || `affiliate:${randomUUID()}`;
    const sessionId = identity?.sessionId || anonId;

    try {
      await this.analyticsService.trackEvent({
        sessionId,
        anonId,
        type,
        name: type,
        occurredAt: this.now(),
        data,
      });
    } catch (error) {
      logger.warn('Affiliate analytics event failed; continuing', {
        type,
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }
}
