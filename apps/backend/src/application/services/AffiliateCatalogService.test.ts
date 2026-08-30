import test from 'node:test';
import assert from 'node:assert/strict';
import { AffiliateCatalogService } from './AffiliateCatalogService';
import { createInMemoryAffiliateRepositories } from './__testUtils__/inMemoryAffiliateRepositories';
import { migrateStaticMonetizationOffers } from './AffiliateMigrationService';
import { invalidateAffiliateCache } from '../../infrastructure/affiliate/AffiliateCacheKeys';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';

class FakeCache implements ICacheRepository {
  store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return this.store.has(key) ? (this.store.get(key) as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.store.clear();
      return;
    }
    const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

async function seededRepositories() {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });
  return repos;
}

test('AffiliateCatalogService returns only offers backed by an active merchant + active program', async () => {
  const repos = await seededRepositories();
  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );

  const candidates = await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, {});

  assert.ok(candidates.length > 0);
  assert.ok(candidates.every((c) => c.merchant.status === 'active' && c.program.status === 'active'));
});

test('AffiliateCatalogService returns nothing for an unsupported placement', async () => {
  const repos = await seededRepositories();
  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );

  const candidates = await service.findEligibleCandidates({ market: 'ES', placement: 'not-a-real-placement' }, {});
  assert.deepEqual(candidates, []);
});

test('AffiliateCatalogService.resolveMerchantIds resolves legacy provider spellings and drops unknown aliases', async () => {
  const repos = await seededRepositories();
  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );

  const movistar = await repos.merchantRepository.findBySlug('movistar-plus');
  const ids = await service.resolveMerchantIds(['Movistar+', 'not-a-real-provider']);

  assert.deepEqual(ids, [movistar!.id]);
});

test('AffiliateCatalogService never widens back to "every merchant" when every provider hint is unknown', async () => {
  const repos = await seededRepositories();
  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );

  const merchantIds = await service.resolveMerchantIds(['totally-unknown-provider']);
  const candidates = await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, { merchantIds });

  assert.deepEqual(candidates, []);
});

test('AffiliateCatalogService excludes offers whose program has gone inactive', async () => {
  const repos = await seededRepositories();
  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [program] = await repos.programRepository.list({ merchantId: netflix!.id });
  await repos.programRepository.upsertByMerchantNetworkMarket({ ...program, status: 'inactive' });

  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );
  const candidates = await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, {});

  assert.ok(candidates.every((c) => c.merchant.slug !== 'netflix'));
});

test('AffiliateCatalogService caches candidate lookups — a second identical call is a cache hit', async () => {
  const repos = await seededRepositories();
  const cache = new FakeCache();
  let calls = 0;
  const original = repos.offerRepository.findCandidates.bind(repos.offerRepository);
  repos.offerRepository.findCandidates = async (filter) => {
    calls += 1;
    return original(filter);
  };

  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository,
    cache
  );
  await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, {});
  await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, {});

  assert.equal(calls, 1);
});

test('AffiliateCatalogService cache invalidation forces a fresh repository read', async () => {
  const repos = await seededRepositories();
  const cache = new FakeCache();
  let calls = 0;
  const original = repos.offerRepository.findCandidates.bind(repos.offerRepository);
  repos.offerRepository.findCandidates = async (filter) => {
    calls += 1;
    return original(filter);
  };

  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository,
    cache
  );
  await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, {});
  await invalidateAffiliateCache(cache);
  await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, {});

  assert.equal(calls, 2);
});

test('AffiliateCatalogService ranking is unaffected by commission — recommendation neutrality', async () => {
  const repos = await seededRepositories();
  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [program] = await repos.programRepository.list({ merchantId: netflix!.id });

  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );
  const before = (
    await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, { intent: 'cheapest' })
  ).map((c) => c.offer.id);

  await repos.programRepository.upsertByMerchantNetworkMarket({
    ...program,
    commission: { type: 'cps', value: 9999, currency: 'EUR' },
  });

  const after = (
    await service.findEligibleCandidates({ market: 'ES', placement: 'streaming-comparison' }, { intent: 'cheapest' })
  ).map((c) => c.offer.id);

  assert.deepEqual(after, before);
});

test('AffiliateCatalogService.getCandidatesByOfferIds resolves offers in the given order, deduped', async () => {
  const repos = await seededRepositories();
  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const disney = await repos.merchantRepository.findBySlug('disney-plus');
  const [netflixOffer] = await repos.offerRepository.findByMerchant(netflix!.id, 'ES');
  const [disneyOffer] = await repos.offerRepository.findByMerchant(disney!.id, 'ES');

  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );

  const candidates = await service.getCandidatesByOfferIds(
    [disneyOffer.id, netflixOffer.id, disneyOffer.id],
    { market: 'ES', placement: 'blog-inline' }
  );

  assert.deepEqual(candidates.map((c) => c.offer.id), [disneyOffer.id, netflixOffer.id]);
});

test('AffiliateCatalogService.getCandidatesByOfferIds silently drops an unknown id, a wrong-market offer, and an inactive merchant', async () => {
  const repos = await seededRepositories();
  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [netflixOffer] = await repos.offerRepository.findByMerchant(netflix!.id, 'ES');
  await repos.merchantRepository.upsertBySlug({ ...netflix!, status: 'inactive' });

  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );

  const candidates = await service.getCandidatesByOfferIds(
    ['not-a-real-offer-id', netflixOffer.id],
    { market: 'ES', placement: 'blog-inline' }
  );

  assert.deepEqual(candidates, []);
});

test('AffiliateCatalogService.getCandidatesByOfferIds drops an offer not eligible for the requested placement', async () => {
  const repos = await seededRepositories();
  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [netflixOffer] = await repos.offerRepository.findByMerchant(netflix!.id, 'ES');
  const scoped = await repos.offerRepository.upsertByMerchantProgramPlan({
    ...netflixOffer,
    plan: { id: 'comparison-only-plan', name: 'Comparison only' },
    placements: ['streaming-comparison'],
  });

  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );

  const candidates = await service.getCandidatesByOfferIds([scoped.id], { market: 'ES', placement: 'blog-inline' });

  assert.deepEqual(candidates, []);
});

test('AffiliateCatalogService.getCandidatesByOfferIds returns nothing for an empty id list or an unsupported placement', async () => {
  const repos = await seededRepositories();
  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [netflixOffer] = await repos.offerRepository.findByMerchant(netflix!.id, 'ES');

  const service = new AffiliateCatalogService(
    repos.offerRepository,
    repos.merchantRepository,
    repos.programRepository,
    repos.placementRepository
  );

  assert.deepEqual(await service.getCandidatesByOfferIds([], { market: 'ES', placement: 'blog-inline' }), []);
  assert.deepEqual(
    await service.getCandidatesByOfferIds([netflixOffer.id], { market: 'ES', placement: 'not-a-real-placement' }),
    []
  );
});
