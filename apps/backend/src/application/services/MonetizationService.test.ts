import test from 'node:test';
import assert from 'node:assert/strict';
import { MonetizationService } from './MonetizationService';

test('MonetizationService exposes normalized offers with verification and internal outbound paths', () => {
  const service = new MonetizationService(undefined, {
    env: {},
    now: () => new Date('2026-08-26T12:00:00.000Z'),
  });

  const result = service.listOffers({ market: 'ES' });

  assert.ok(result.items.length >= 10);
  assert.equal(result.meta.market, 'ES');
  assert.ok(result.items.every((offer) => offer.provider.id && offer.plan.id));
  assert.ok(result.items.every((offer) => offer.pricing.currency === 'EUR'));
  assert.ok(result.items.every((offer) => offer.outbound.path.startsWith('/v2/monetization/go/')));
  assert.ok(result.items.every((offer) => !('destinationUrl' in offer.outbound)));
  assert.ok(result.items.every((offer) => offer.verification.sourceUrl.startsWith('https://')));
});

test('MonetizationService filters and ranks by user value without affiliate influence', () => {
  const direct = new MonetizationService(undefined, {
    env: {},
    now: () => new Date('2026-08-26T12:00:00.000Z'),
  });
  const affiliated = new MonetizationService(undefined, {
    env: {
      AFFILIATE_NETFLIX_URL: 'https://www.netflix.com/signup?utm_source=guiatv',
    },
    now: () => new Date('2026-08-26T12:00:00.000Z'),
  });

  const directOrder = direct.listOffers({ market: 'ES', intent: 'cheapest' }).items.map((item) => item.id);
  const affiliatedOrder = affiliated.listOffers({ market: 'ES', intent: 'cheapest' }).items.map((item) => item.id);
  const withoutCommitment = direct.listOffers({ market: 'ES', intent: 'no-contract' });

  assert.deepEqual(affiliatedOrder, directOrder);
  assert.ok(withoutCommitment.items.every((offer) => offer.requirements.commitmentMonths === 0));
});

test('MonetizationService rejects unsafe affiliate destinations and falls back to the official link', () => {
  const service = new MonetizationService(undefined, {
    env: {
      AFFILIATE_NETFLIX_URL: 'https://evil.example/steal?next=https://netflix.com',
    },
  });

  const resolved = service.resolveOutbound('netflix', 'netflix-standard-with-ads', 'comparison-card');

  assert.equal(resolved.relationship, 'direct_commercial_link');
  assert.equal(new URL(resolved.destinationUrl).hostname, 'www.netflix.com');
  assert.equal(resolved.rel, 'noopener noreferrer');
});

test('MonetizationService accepts an allowlisted affiliate destination and tracks minimal attribution', async () => {
  const events: Array<Record<string, unknown>> = [];
  const analytics = {
    trackEvent: async (event: Record<string, unknown>) => {
      events.push(event);
    },
  };
  const service = new MonetizationService(analytics as never, {
    env: {
      AFFILIATE_NETFLIX_URL: 'https://www.netflix.com/signup?utm_source=guiatv',
    },
    now: () => new Date('2026-08-26T12:00:00.000Z'),
  });

  const resolved = await service.trackAndResolveOutbound(
    'netflix',
    'netflix-standard-with-ads',
    'comparison-table'
  );

  assert.equal(resolved.relationship, 'affiliate_configured');
  assert.equal(resolved.rel, 'sponsored noopener noreferrer');
  assert.equal(events.length, 1);
  assert.deepEqual((events[0].data as Record<string, unknown>), {
    providerId: 'netflix',
    offerId: 'netflix-standard-with-ads',
    placement: 'comparison-table',
    relationship: 'affiliate_configured',
    destinationHost: 'www.netflix.com',
  });
  assert.equal('ip' in events[0], false);
});

test('MonetizationService still resolves the outbound offer when analytics is unavailable', async () => {
  const analytics = {
    trackEvent: async () => {
      throw new Error('analytics unavailable');
    },
  };
  const service = new MonetizationService(analytics as never, { env: {} });

  const resolved = await service.trackAndResolveOutbound(
    'netflix',
    'netflix-standard-with-ads',
    'comparison-card'
  );

  assert.equal(resolved.relationship, 'direct_commercial_link');
  assert.equal(new URL(resolved.destinationUrl).hostname, 'www.netflix.com');
});

test('MonetizationService refuses unknown offers and invalid placements', () => {
  const service = new MonetizationService();

  assert.throws(
    () => service.resolveOutbound('netflix', 'missing-offer', 'comparison-card'),
    /not found/i
  );
  assert.throws(
    () => service.resolveOutbound('netflix', 'netflix-standard-with-ads', 'javascript:alert(1)'),
    /placement/i
  );
});
