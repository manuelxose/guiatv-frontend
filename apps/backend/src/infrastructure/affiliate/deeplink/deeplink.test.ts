import test from 'node:test';
import assert from 'node:assert/strict';
import { DirectUrlStrategy } from './DirectUrlStrategy';
import { UrlTemplateStrategy } from './UrlTemplateStrategy';
import { NetworkRedirectStrategy } from './NetworkRedirectStrategy';
import { AmazonTagStrategy } from './AmazonTagStrategy';
import { ApiGeneratedStrategy } from './ApiGeneratedStrategy';
import { DeepLinkStrategyRegistry } from './DeepLinkStrategyRegistry';
import { DeepLinkBuildInput, DeepLinkStrategyUnavailableError } from './types';
import { AffiliateOffer } from '@/domain/entities/AffiliateOffer';
import { AffiliateProgram } from '@/domain/entities/AffiliateProgram';
import { AffiliateNetwork } from '@/domain/entities/AffiliateNetwork';
import { AffiliateMerchant } from '@/domain/entities/AffiliateMerchant';

const now = new Date('2026-08-26T12:00:00.000Z');

function makeInput(overrides: Partial<DeepLinkBuildInput> = {}): DeepLinkBuildInput {
  const offer: AffiliateOffer = {
    id: 'offer-1',
    merchantId: 'merchant-1',
    affiliateProgramId: 'program-1',
    market: 'ES',
    category: 'streaming',
    plan: { id: 'standard', name: 'Standard' },
    pricing: { currency: 'EUR', monthlyAmount: 9.99, annualAmount: null, monthlyLabel: '', annualLabel: '', activationFeeAmount: null },
    features: {},
    requirements: { commitmentMonths: 0, fibreRequired: false, mobileRequired: false, device: null },
    trial: { days: null },
    recommendationIntents: [],
    destination: { strategy: 'direct_url', url: 'https://merchant.example.com/plan' },
    validity: {},
    status: 'active',
    verification: { status: 'current' },
    display: { disclosure: 'Enlace directo al proveedor.' },
    createdAt: now,
    updatedAt: now,
    ...(overrides.offer || {}),
  };
  const program: AffiliateProgram = {
    id: 'program-1',
    merchantId: 'merchant-1',
    networkId: 'network-1',
    market: 'ES',
    relationship: 'direct_commercial_link',
    status: 'active',
    allowedHosts: ['merchant.example.com', 'track.example-network.com'],
    disclosure: 'Enlace afiliado.',
    verification: { status: 'approved' },
    createdAt: now,
    updatedAt: now,
    ...(overrides.program || {}),
  };
  const network: AffiliateNetwork = {
    id: 'network-1',
    slug: 'direct',
    name: 'Direct',
    trackingType: 'direct',
    markets: ['ES'],
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...(overrides.network || {}),
  };
  const merchant: AffiliateMerchant = {
    id: 'merchant-1',
    slug: 'merchant',
    canonicalProviderKey: 'merchant',
    name: 'Merchant',
    aliases: ['merchant'],
    category: 'streaming',
    officialUrl: 'https://merchant.example.com',
    markets: ['ES'],
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...(overrides.merchant || {}),
  };

  return {
    offer,
    program,
    network,
    merchant,
    secret: overrides.secret,
    clickId: overrides.clickId ?? 'click-123',
    context: overrides.context ?? { market: 'ES', placement: 'catalog-detail' },
  };
}

test('DirectUrlStrategy falls back to the static destination when no secret is configured', () => {
  const result = new DirectUrlStrategy().build(makeInput());
  assert.equal(result.url, 'https://merchant.example.com/plan');
  assert.equal(result.relationship, 'direct_commercial_link');
});

test('DirectUrlStrategy prefers a safe env-resolved override URL and marks it affiliate_configured', () => {
  const result = new DirectUrlStrategy().build(makeInput({ secret: 'https://merchant.example.com/plan?tag=aff123' }));
  assert.equal(result.url, 'https://merchant.example.com/plan?tag=aff123');
  assert.equal(result.relationship, 'affiliate_configured');
});

test('UrlTemplateStrategy fills {secret}/{clickId} tokens from the resolved secret and offer params', () => {
  const input = makeInput({
    offer: { destination: { strategy: 'url_template', url: 'https://merchant.example.com/plan', template: 'https://track.example.com/click?pid={secret}&subid={clickId}&camp={campaign}', params: { campaign: 'guiatv' } } } as never,
    program: { allowedHosts: ['track.example.com'] } as never,
    secret: 'partner-42',
  });
  const result = new UrlTemplateStrategy().build(input);
  assert.equal(result.url, 'https://track.example.com/click?pid=partner-42&subid=click-123&camp=guiatv');
  assert.equal(result.relationship, 'affiliate_configured');
});

test('UrlTemplateStrategy throws DeepLinkStrategyUnavailableError when no secret is resolved', () => {
  const input = makeInput({
    offer: { destination: { strategy: 'url_template', url: 'https://merchant.example.com/plan', template: 'https://track.example.com/click?pid={secret}' } } as never,
  });
  assert.throws(() => new UrlTemplateStrategy().build(input), DeepLinkStrategyUnavailableError);
});

test('NetworkRedirectStrategy builds a redirect-endpoint URL with the encoded target and a clickref', () => {
  const input = makeInput({ secret: 'https://track.example-network.com/redirect?id=999' });
  const result = new NetworkRedirectStrategy().build(input);
  assert.equal(
    result.url,
    'https://track.example-network.com/redirect?id=999&url=https%3A%2F%2Fmerchant.example.com%2Fplan&clickref=click-123'
  );
});

test('AmazonTagStrategy appends the resolved tag as a query param on the canonical URL', () => {
  const input = makeInput({ secret: 'guiatv-21' });
  const result = new AmazonTagStrategy().build(input);
  assert.equal(result.url, 'https://merchant.example.com/plan?tag=guiatv-21');
  assert.equal(result.relationship, 'affiliate_configured');
});

test('ApiGeneratedStrategy always degrades — not implemented in Phase 3', () => {
  assert.throws(() => new ApiGeneratedStrategy().build(makeInput()), DeepLinkStrategyUnavailableError);
});

test('DeepLinkStrategyRegistry dispatches purely by offer.destination.strategy, never by provider identity', () => {
  const registry = new DeepLinkStrategyRegistry();
  assert.ok(registry.get('direct_url') instanceof DirectUrlStrategy);
  assert.ok(registry.get('tag_param') instanceof AmazonTagStrategy);
  assert.equal(registry.get('unknown_strategy' as never), undefined);
});
