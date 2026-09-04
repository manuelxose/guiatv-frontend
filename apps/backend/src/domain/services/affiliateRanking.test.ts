import test from 'node:test';
import assert from 'node:assert/strict';
import { rankAffiliateOffers, scoreAffiliateOffer } from './affiliateRanking';
import { AffiliateOffer } from '../entities/AffiliateOffer';

function makeOffer(overrides: Partial<AffiliateOffer> = {}): AffiliateOffer {
  const now = new Date('2026-08-26T12:00:00.000Z');
  return {
    id: overrides.id ?? 'offer-1',
    merchantId: 'merchant-1',
    affiliateProgramId: 'program-1',
    market: 'ES',
    category: 'streaming',
    plan: { id: 'standard', name: 'Standard' },
    pricing: {
      currency: 'EUR',
      monthlyAmount: 9.99,
      annualAmount: null,
      monthlyLabel: '9.99€/mes',
      annualLabel: '',
      activationFeeAmount: null,
    },
    features: {},
    requirements: { commitmentMonths: 0, fibreRequired: false, mobileRequired: false, device: null },
    trial: { days: null },
    recommendationIntents: [],
    placements: undefined,
    destination: { strategy: 'direct_url', url: 'https://merchant.example.com/plan' },
    validity: {},
    status: 'active',
    verification: { status: 'current' },
    display: { disclosure: 'Enlace directo al proveedor.' },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test('scoreAffiliateOffer rewards matching intent, placement, content type, freshness, and trial availability', () => {
  const base = makeOffer({ id: 'plain' });
  const matched = makeOffer({
    id: 'matched',
    recommendationIntents: ['cheapest'],
    placements: ['catalog-detail'],
    category: 'streaming',
    trial: { days: 30 },
  });

  const context = { intent: 'cheapest', placement: 'catalog-detail', contentType: 'streaming' };
  assert.ok(scoreAffiliateOffer(matched, context) > scoreAffiliateOffer(base, context));
});

test('scoreAffiliateOffer never reads a commission/payout field — the type it accepts has none', () => {
  // Structural guarantee: AffiliateOffer carries no commission data at all (that lives on
  // AffiliateProgram, a type affiliateRanking.ts never imports), so no payout figure can leak in.
  const offer = makeOffer({ recommendationIntents: ['cheapest'] });
  const scoreA = scoreAffiliateOffer(offer, { intent: 'cheapest', placement: 'catalog-detail' });
  const scoreB = scoreAffiliateOffer({ ...offer }, { intent: 'cheapest', placement: 'catalog-detail' });
  assert.equal(scoreA, scoreB);
});

test('rankAffiliateOffers sorts by neutral relevance, highest first, tie-broken by plan name', () => {
  const low = { offer: makeOffer({ id: 'low', plan: { id: 'a', name: 'Alpha' } }) };
  const high = { offer: makeOffer({ id: 'high', plan: { id: 'z', name: 'Zed' }, recommendationIntents: ['cheapest'] }) };
  const tie = { offer: makeOffer({ id: 'tie', plan: { id: 'b', name: 'Beta' } }) };

  const ranked = rankAffiliateOffers([low, high, tie], { intent: 'cheapest', placement: 'catalog-detail' });

  assert.equal(ranked[0].offer.id, 'high');
  // low and tie score equal — tie-broken alphabetically by plan name (Alpha < Beta).
  assert.deepEqual(ranked.slice(1).map((c) => c.offer.id), ['low', 'tie']);
});
