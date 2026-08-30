import test from 'node:test';
import assert from 'node:assert/strict';
import { MonetizationService } from './MonetizationService';

test('MonetizationService exposes normalized offers with verification and internal outbound paths', async () => {
  const service = new MonetizationService(undefined, {
    env: {},
    now: () => new Date('2026-08-26T12:00:00.000Z'),
  });

  const result = await service.listOffers({ market: 'ES' });

  assert.ok(result.items.length >= 10);
  assert.equal(result.meta.market, 'ES');
  assert.ok(result.items.every((offer) => offer.provider.id && offer.plan.id));
  assert.ok(result.items.every((offer) => offer.pricing.currency === 'EUR'));
  assert.ok(result.items.every((offer) => offer.outbound.path.startsWith('/v2/monetization/go/')));
  assert.ok(result.items.every((offer) => !('destinationUrl' in offer.outbound)));
  assert.ok(result.items.every((offer) => offer.verification.sourceUrl.startsWith('https://')));
});

test('MonetizationService filters and ranks by user value without affiliate influence', async () => {
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

  const directOrder = (await direct.listOffers({ market: 'ES', intent: 'cheapest' })).items.map((item) => item.id);
  const affiliatedOrder = (await affiliated.listOffers({ market: 'ES', intent: 'cheapest' })).items.map((item) => item.id);
  const withoutCommitment = await direct.listOffers({ market: 'ES', intent: 'no-contract' });

  assert.deepEqual(affiliatedOrder, directOrder);
  assert.ok(withoutCommitment.items.every((offer) => offer.requirements.commitmentMonths === 0));
});

test('MonetizationService rejects unsafe affiliate destinations and falls back to the official link', async () => {
  const service = new MonetizationService(undefined, {
    env: {
      AFFILIATE_NETFLIX_URL: 'https://evil.example/steal?next=https://netflix.com',
    },
  });

  const resolved = await service.resolveOutbound('netflix', 'netflix-standard-with-ads', 'comparison-card');

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

test('MonetizationService refuses unknown offers and invalid placements', async () => {
  const service = new MonetizationService();

  await assert.rejects(
    () => service.resolveOutbound('netflix', 'missing-offer', 'comparison-card'),
    /not found/i
  );
  await assert.rejects(
    () => service.resolveOutbound('netflix', 'netflix-standard-with-ads', 'javascript:alert(1)'),
    /placement/i
  );
});

test('MonetizationService reads from the Affiliate Engine store when repositories are wired, and falls back to the static list when the store is empty', async () => {
  const merchant = {
    id: 'merchant-1', slug: 'netflix', name: 'Netflix', aliases: [], status: 'active' as const,
    createdAt: new Date(), updatedAt: new Date(),
  };
  const program = {
    id: 'program-1', merchantId: 'merchant-1', networkId: 'network-1', market: 'ES',
    relationship: 'affiliate_configured' as const, status: 'active' as const,
    allowedHosts: ['netflix.com'], disclosure: 'Enlace afiliado.',
    attribution: { secretRef: 'AFFILIATE_NETFLIX_URL' },
    verification: { status: 'approved' as const },
    createdAt: new Date(), updatedAt: new Date(),
  };
  const offer = {
    id: 'offer-1', merchantId: 'merchant-1', affiliateProgramId: 'program-1', market: 'ES',
    category: 'streaming' as const,
    plan: { id: 'standard-with-ads', name: 'Estándar con anuncios' },
    pricing: { currency: 'EUR', monthlyAmount: 5.99, annualAmount: null, monthlyLabel: '5,99 €/mes', annualLabel: '', activationFeeAmount: null },
    features: { downloads: true, liveContent: false, sports: false, football: false, family: true, fourK: false, movies: true, ads: true, simultaneousStreams: 2, maxResolution: 'FHD' },
    requirements: { commitmentMonths: 0, fibreRequired: false, mobileRequired: false, device: null },
    trial: { days: null },
    recommendationIntents: ['cheapest'],
    destination: { strategy: 'direct_url' as const, url: 'https://www.netflix.com/signup' },
    validity: {},
    status: 'active' as const,
    verification: { status: 'current' as const, verifiedAt: new Date('2026-08-01T00:00:00.000Z'), source: 'https://www.netflix.com/pricing' },
    display: { bestFor: 'Series', disclosure: 'Enlace afiliado.' },
    createdAt: new Date(), updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };

  const withOffers = new MonetizationService(undefined, {
    env: { AFFILIATE_NETFLIX_URL: 'https://www.netflix.com/signup?utm_source=guiatv' },
    now: () => new Date('2026-08-26T12:00:00.000Z'),
    offerRepository: { findValidOffers: async () => [offer] } as never,
    merchantRepository: { findById: async () => merchant } as never,
    programRepository: { findById: async () => program } as never,
  });

  const result = await withOffers.listOffers({ market: 'ES' });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, 'netflix-standard-with-ads');
  assert.equal(result.items[0].provider.name, 'Netflix');
  assert.equal(result.items[0].outbound.relationship, 'affiliate_configured');

  const emptyStore = new MonetizationService(undefined, {
    env: {},
    offerRepository: { findValidOffers: async () => [] } as never,
    merchantRepository: { findById: async () => null } as never,
    programRepository: { findById: async () => null } as never,
  });
  const fallback = await emptyStore.listOffers({ market: 'ES' });
  assert.ok(fallback.items.length >= 10, 'falls back to the static list when the Mongo store has no offers yet');

  const brokenStore = new MonetizationService(undefined, {
    env: {},
    offerRepository: { findValidOffers: async () => { throw new Error('mongo unreachable'); } } as never,
    merchantRepository: { findById: async () => null } as never,
    programRepository: { findById: async () => null } as never,
  });
  const degraded = await brokenStore.listOffers({ market: 'ES' });
  assert.ok(degraded.items.length >= 10, 'falls back to the static list when the Mongo store errors, never 500s a redirect');
});
