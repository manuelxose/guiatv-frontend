import test from 'node:test';
import assert from 'node:assert/strict';
import { AffiliateResolverService } from './AffiliateResolverService';
import { AffiliateCatalogService } from './AffiliateCatalogService';
import { AffiliateAnalyticsService } from './AffiliateAnalyticsService';
import { createInMemoryAffiliateRepositories } from './__testUtils__/inMemoryAffiliateRepositories';
import { migrateStaticMonetizationOffers } from './AffiliateMigrationService';
import { DeepLinkStrategyRegistry } from '../../infrastructure/affiliate/deeplink/DeepLinkStrategyRegistry';
import { NotFoundError, ValidationError } from '../../shared/errors';

const NOW = new Date('2026-08-26T12:00:00.000Z');

async function setup(options: { env?: NodeJS.ProcessEnv; trackEvent?: (event: unknown) => Promise<void> } = {}) {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const events: unknown[] = [];
  const analyticsFake = {
    trackEvent: options.trackEvent ?? (async (event: unknown) => { events.push(event); }),
  };

  const catalogService = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );
  const analytics = new AffiliateAnalyticsService(analyticsFake as never, () => NOW);
  const resolver = new AffiliateResolverService(
    catalogService,
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository,
    repos.networkRepository,
    new DeepLinkStrategyRegistry(),
    analytics,
    { env: options.env ?? {}, now: () => NOW }
  );

  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [netflixOffer] = await repos.offerRepository.findByMerchant(netflix!.id, 'ES');
  const [netflixProgram] = await repos.programRepository.list({ merchantId: netflix!.id });

  return { repos, resolver, events, netflix: netflix!, netflixOffer, netflixProgram };
}

test('AffiliateResolverService.resolveOffers returns a successful, display-ready resolution with no raw URL', async () => {
  const { resolver } = await setup();
  const result = await resolver.resolveOffers({ context: { market: 'ES', placement: 'streaming-comparison' }, intent: 'cheapest' });

  assert.ok(result.items.length > 0);
  for (const item of result.items) {
    assert.ok(item.outbound.path.startsWith('/v2/affiliate/go/'));
    assert.ok(!('destinationUrl' in item.outbound));
    assert.ok(!JSON.stringify(item).includes('http://'));
  }
});

test('AffiliateResolverService.resolveOffers returns nothing for an unknown provider alias', async () => {
  const { resolver } = await setup();
  const result = await resolver.resolveOffers({
    context: { market: 'ES', placement: 'streaming-comparison' },
    providerKeys: ['not-a-real-provider'],
  });
  assert.deepEqual(result.items, []);
});

test('AffiliateResolverService.resolveRedirect rejects an inactive program', async () => {
  const { resolver, repos, netflixOffer, netflixProgram } = await setup();
  await repos.programRepository.upsertByMerchantNetworkMarket({ ...netflixProgram, status: 'inactive' });

  await assert.rejects(
    resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'streaming-comparison' }),
    (error: unknown) => error instanceof NotFoundError
  );
});

test('AffiliateResolverService.resolveRedirect rejects an expired offer', async () => {
  const { resolver, repos, netflixOffer } = await setup();
  await repos.offerRepository.upsertByMerchantProgramPlan({
    ...netflixOffer,
    validity: { validUntil: new Date('2020-01-01T00:00:00.000Z') },
  });

  await assert.rejects(
    resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'streaming-comparison' }),
    (error: unknown) => error instanceof NotFoundError
  );
});

test('AffiliateResolverService.resolveRedirect rejects an unsupported placement', async () => {
  const { resolver, netflixOffer } = await setup();
  await assert.rejects(
    resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'not-a-real-placement' }),
    (error: unknown) => error instanceof ValidationError
  );
});

test('AffiliateResolverService.resolveRedirect rejects a destination that fails the allowlist (unsafe redirect)', async () => {
  const { resolver, repos, netflixOffer, netflixProgram } = await setup();
  await repos.programRepository.upsertByMerchantNetworkMarket({ ...netflixProgram, allowedHosts: ['some-other-host.example'] });

  await assert.rejects(
    resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'streaming-comparison' }),
    (error: unknown) => error instanceof ValidationError
  );
});

test('AffiliateResolverService.resolveRedirect degrades to the direct destination when a strategy is missing its secret', async () => {
  const { resolver, repos, netflixOffer } = await setup();
  await repos.offerRepository.upsertByMerchantProgramPlan({
    ...netflixOffer,
    destination: {
      strategy: 'url_template',
      url: netflixOffer.destination.url,
      template: 'https://track.example.com/click?pid={secret}',
    },
  });

  const result = await resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'streaming-comparison' });

  assert.equal(result.destinationUrl, netflixOffer.destination.url);
});

test('AffiliateResolverService.resolveRedirect still redirects successfully when analytics tracking fails', async () => {
  const { resolver, netflixOffer } = await setup({ trackEvent: async () => { throw new Error('analytics backend down'); } });

  const result = await resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'streaming-comparison' });
  assert.ok(result.destinationUrl.startsWith('https://'));
  assert.ok(result.clickId.length > 0);
});

test('AffiliateResolverService.resolveRedirect resolves a non-affiliate (no configured secret) provider to its direct destination', async () => {
  const { resolver, netflixOffer, netflixProgram } = await setup();
  assert.notEqual(netflixProgram.relationship, 'affiliate_configured');

  const result = await resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'streaming-comparison' });
  assert.equal(result.relationship, netflixProgram.relationship);
});

test('AffiliateResolverService.resolveOffers embeds footballMatchId/competitionId in the outbound path when present', async () => {
  const { resolver } = await setup();
  const result = await resolver.resolveOffers({
    context: {
      market: 'ES',
      placement: 'football-match',
      footballMatchId: 'match-123',
      competitionId: 'laliga',
    },
  });

  assert.ok(result.items.length > 0);
  const url = new URL(`https://example.test${result.items[0].outbound.path}`);
  assert.equal(url.searchParams.get('footballMatchId'), 'match-123');
  assert.equal(url.searchParams.get('competitionId'), 'laliga');
});

test('AffiliateResolverService.resolveOffers omits footballMatchId/competitionId from the outbound path when absent (e.g. a non-football surface)', async () => {
  const { resolver } = await setup();
  const result = await resolver.resolveOffers({ context: { market: 'ES', placement: 'streaming-comparison' } });

  assert.ok(result.items.length > 0);
  const url = new URL(`https://example.test${result.items[0].outbound.path}`);
  assert.equal(url.searchParams.has('footballMatchId'), false);
  assert.equal(url.searchParams.has('competitionId'), false);
});

test('AffiliateResolverService.resolveRedirect tracks footballMatchId/competitionId on the click/redirect events', async () => {
  const events: any[] = [];
  const { resolver, netflixOffer } = await setup({ trackEvent: async (event: any) => { events.push(event); } });

  await resolver.resolveRedirect(netflixOffer.id, {
    market: 'ES',
    placement: 'football-match',
    footballMatchId: 'match-123',
    competitionId: 'laliga',
  });

  const click = events.find((e) => e.type === 'affiliate_click');
  const redirect = events.find((e) => e.type === 'affiliate_redirect');
  assert.equal(click.data.footballMatchId, 'match-123');
  assert.equal(click.data.competitionId, 'laliga');
  assert.equal(redirect.data.footballMatchId, 'match-123');
  assert.equal(redirect.data.competitionId, 'laliga');
});

test('AffiliateResolverService.resolveRedirect leaves footballMatchId/competitionId undefined for a non-football context', async () => {
  const events: any[] = [];
  const { resolver, netflixOffer } = await setup({ trackEvent: async (event: any) => { events.push(event); } });

  await resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'streaming-comparison' });

  const click = events.find((e) => e.type === 'affiliate_click');
  assert.equal(click.data.footballMatchId, undefined);
  assert.equal(click.data.competitionId, undefined);
});

test('AffiliateResolverService.resolveOffers marks an offer sponsored only once its secret is configured', async () => {
  const { repos } = await setup();
  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [program] = await repos.programRepository.list({ merchantId: netflix!.id });

  const unconfigured = await setup();
  const withSecret = await setup({ env: { [program.attribution!.secretRef!]: 'https://www.netflix.com/es/signup?tag=aff' } });

  const before = await unconfigured.resolver.resolveOffers({ context: { market: 'ES', placement: 'streaming-comparison' } });
  const after = await withSecret.resolver.resolveOffers({ context: { market: 'ES', placement: 'streaming-comparison' } });

  const beforeItem = before.items.find((item) => item.merchant.slug === 'netflix')!;
  const afterItem = after.items.find((item) => item.merchant.slug === 'netflix')!;

  assert.equal(beforeItem.cta.sponsored, false);
  assert.equal(afterItem.cta.sponsored, true);
});

test('AffiliateResolverService.resolveOffers filters candidates by category — a blog post about Smart TVs never surfaces a streaming plan and vice versa', async () => {
  const { resolver, repos, netflixOffer } = await setup();
  const smartTvOffer = await repos.offerRepository.upsertByMerchantProgramPlan({
    ...netflixOffer,
    plan: { id: 'smart-tv-plan', name: 'Smart TV' },
    category: 'smart-tv',
  });

  const smartTvResult = await resolver.resolveOffers({ context: { market: 'ES', placement: 'blog-inline' }, category: 'smart-tv' });
  assert.ok(smartTvResult.items.some((item) => item.offerId === smartTvOffer.id));
  assert.ok(smartTvResult.items.every((item) => item.category === 'smart-tv'));

  const streamingResult = await resolver.resolveOffers({ context: { market: 'ES', placement: 'blog-inline' }, category: 'streaming' });
  assert.ok(!streamingResult.items.some((item) => item.offerId === smartTvOffer.id));
});

test('AffiliateResolverService.resolveOffers surfaces a manually pinned offer ahead of automatic ranking and marks relevance.pinned', async () => {
  const { resolver, repos } = await setup();
  const disney = await repos.merchantRepository.findBySlug('disney-plus');
  const [disneyOffer] = await repos.offerRepository.findByMerchant(disney!.id, 'ES');

  const result = await resolver.resolveOffers({
    context: { market: 'ES', placement: 'blog-inline' },
    pinnedOfferIds: [disneyOffer.id],
    maxResults: 1,
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].offerId, disneyOffer.id);
  assert.equal(result.items[0].relevance?.pinned, true);
});

test('AffiliateResolverService.resolveOffers with autoResolve:false returns only the pinned offer(s), never the automatic candidate search', async () => {
  const { resolver, netflixOffer } = await setup();

  const result = await resolver.resolveOffers({
    context: { market: 'ES', placement: 'blog-inline' },
    pinnedOfferIds: [netflixOffer.id],
    autoResolve: false,
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].offerId, netflixOffer.id);
});

test('AffiliateResolverService.resolveOffers with autoResolve:false and no pins resolves nothing — a "manual" post with no pin shows silence, never a fallback list', async () => {
  const { resolver } = await setup();

  const result = await resolver.resolveOffers({ context: { market: 'ES', placement: 'blog-inline' }, autoResolve: false });

  assert.deepEqual(result.items, []);
});

test('AffiliateResolverService.resolveOffers drops a manually pinned offer that has expired instead of surfacing a dead offer', async () => {
  const { resolver, repos, netflixOffer } = await setup();
  await repos.offerRepository.upsertByMerchantProgramPlan({
    ...netflixOffer,
    validity: { validUntil: new Date('2020-01-01T00:00:00.000Z') },
  });

  const result = await resolver.resolveOffers({
    context: { market: 'ES', placement: 'blog-inline' },
    pinnedOfferIds: [netflixOffer.id],
    autoResolve: false,
  });

  assert.deepEqual(result.items, []);
});

test('AffiliateResolverService.resolveOffers drops a manually pinned offer id that does not exist', async () => {
  const { resolver } = await setup();

  const result = await resolver.resolveOffers({
    context: { market: 'ES', placement: 'blog-inline' },
    pinnedOfferIds: ['not-a-real-offer-id'],
    autoResolve: false,
  });

  assert.deepEqual(result.items, []);
});

test('AffiliateResolverService.resolveOffers embeds blogPostId in the outbound path when present', async () => {
  const { resolver } = await setup();
  const result = await resolver.resolveOffers({ context: { market: 'ES', placement: 'blog-inline', blogPostId: 'post-1' } });

  assert.ok(result.items.length > 0);
  const url = new URL(`https://example.test${result.items[0].outbound.path}`);
  assert.equal(url.searchParams.get('blogPostId'), 'post-1');
});

test('AffiliateResolverService.resolveRedirect tracks blogPostId on the click/redirect events', async () => {
  const events: any[] = [];
  const { resolver, netflixOffer } = await setup({ trackEvent: async (event: any) => { events.push(event); } });

  await resolver.resolveRedirect(netflixOffer.id, { market: 'ES', placement: 'blog-inline', blogPostId: 'post-1' });

  const click = events.find((e) => e.type === 'affiliate_click');
  const redirect = events.find((e) => e.type === 'affiliate_redirect');
  assert.equal(click.data.blogPostId, 'post-1');
  assert.equal(redirect.data.blogPostId, 'post-1');
});
