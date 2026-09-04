import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateStaticMonetizationOffers } from './AffiliateMigrationService';
import { createInMemoryAffiliateRepositories } from './__testUtils__/inMemoryAffiliateRepositories';
import { MONETIZATION_OFFERS, MonetizationOfferConfig } from '../data/monetizationOffers';
import { isOfferValidNow } from '@/domain/services/affiliateOfferValidity';

test('AffiliateMigrationService represents every static offer as merchant + program + offer', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const result = await migrateStaticMonetizationOffers({ repositories: repos });

  assert.equal(result.merchants.inserted, MONETIZATION_OFFERS.length);
  assert.equal(result.programs.inserted, MONETIZATION_OFFERS.length);
  assert.equal(result.offers.inserted, MONETIZATION_OFFERS.length);
  assert.equal(repos.merchantRepository.items.size, MONETIZATION_OFFERS.length);
  assert.equal(repos.offerRepository.items.size, MONETIZATION_OFFERS.length);
  assert.deepEqual(result.offers.skippedUnsafe, []);

  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [netflixOffer] = await repos.offerRepository.findByMerchant(netflix!.id, 'ES');
  assert.ok(netflixOffer);
  assert.equal(netflixOffer.category, 'streaming');
  assert.equal(netflixOffer.market, 'ES');
  assert.deepEqual(netflixOffer.recommendationIntents, ['movies', 'family']);
});

test('AffiliateMigrationService resolves provider aliases including legacy spellings ("Movistar+", "M+", "Movistar Plus")', async () => {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const canonical = await repos.merchantRepository.findBySlug('movistar-plus');
  assert.ok(canonical);

  for (const alias of ['Movistar+', 'M+', 'Movistar Plus', '  movistar+  ', 'MOVISTAR PLUS']) {
    const resolved = await repos.merchantRepository.findByAlias(alias);
    assert.ok(resolved, `expected alias "${alias}" to resolve`);
    assert.equal(resolved!.id, canonical!.id);
  }
});

test('AffiliateMigrationService leaves unknown providers unresolved', async () => {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const resolved = await repos.merchantRepository.findByAlias('Some Random Streaming Service Nobody Has Heard Of');
  assert.equal(resolved, null);
});

test('AffiliateMigrationService preserves the static defaultRelationship as the program relationship (direct vs manual-agreement)', async () => {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [netflixProgram] = await repos.programRepository.list({ merchantId: netflix!.id });
  assert.equal(netflixProgram.relationship, 'direct_commercial_link');

  const movistar = await repos.merchantRepository.findBySlug('movistar-plus');
  const [movistarProgram] = await repos.programRepository.list({ merchantId: movistar!.id });
  assert.equal(movistarProgram.relationship, 'manual_agreement_required');

  const rtve = await repos.merchantRepository.findBySlug('rtve-play');
  const [rtveProgram] = await repos.programRepository.list({ merchantId: rtve!.id });
  assert.equal(rtveProgram.relationship, 'no_affiliate_available');
});

test('AffiliateMigrationService never persists a credential value — only the env-var name', async () => {
  const secretEnvValue = 'https://partner-network.example/track?token=super-secret-token';
  process.env.AFFILIATE_NETFLIX_URL = secretEnvValue;
  try {
    const repos = createInMemoryAffiliateRepositories();
    await migrateStaticMonetizationOffers({ repositories: repos });

    const netflix = await repos.merchantRepository.findBySlug('netflix');
    const [program] = await repos.programRepository.list({ merchantId: netflix!.id });
    assert.equal(program.attribution?.secretRef, 'AFFILIATE_NETFLIX_URL');

    const serialized = JSON.stringify(Array.from(repos.programRepository.items.values())) +
      JSON.stringify(Array.from(repos.offerRepository.items.values()));
    assert.ok(!serialized.includes(secretEnvValue), 'the resolved secret value must never be persisted');
    assert.ok(!serialized.includes('super-secret-token'));
  } finally {
    delete process.env.AFFILIATE_NETFLIX_URL;
  }
});

test('AffiliateMigrationService only migrates offers whose static destination passes the host-allowlist safety gate', async () => {
  const unsafeOffer: MonetizationOfferConfig = {
    id: 'shady-plan-unsafe',
    market: 'ES',
    provider: { id: 'shady-provider', name: 'Shady Provider' },
    plan: { id: 'unsafe', name: 'Unsafe' },
    pricing: { currency: 'EUR', monthlyAmount: 1, annualAmount: null, monthlyLabel: '1 €/mes', annualLabel: 'N/A', activationFeeAmount: null },
    features: {
      simultaneousStreams: '1', maxResolution: '720p', downloads: false, ads: true, liveContent: false,
      sports: false, football: false, movies: true, series: false, family: false, fourK: false,
    },
    requirements: { commitmentMonths: 0, fibreRequired: false, mobileRequired: false, device: null },
    trialDays: null,
    bestFor: 'test',
    highlight: 'test',
    disclosure: 'test',
    recommendation: { intents: ['cheapest'] },
    // Destination host is not in allowedHosts — must be rejected by the safety gate, not migrated.
    destinationUrl: 'https://evil.example/steal',
    allowedHosts: ['shady-provider.example'],
    affiliateEnvKey: 'AFFILIATE_SHADY_PROVIDER_URL',
    defaultRelationship: 'no_affiliate_available',
    verifiedAt: '2026-08-26',
    sourceUrl: 'https://shady-provider.example/',
  };

  const repos = createInMemoryAffiliateRepositories();
  const result = await migrateStaticMonetizationOffers({ repositories: repos, offers: [unsafeOffer] });

  assert.deepEqual(result.offers.skippedUnsafe, ['shady-plan-unsafe']);
  assert.equal(repos.offerRepository.items.size, 0);
  // Merchant and program are still created (they carry no destination URL themselves); only the unsafe offer is skipped.
  assert.equal(repos.merchantRepository.items.size, 1);
});

test('AffiliateMigrationService is idempotent: a second run neither duplicates records nor overwrites them', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const first = await migrateStaticMonetizationOffers({ repositories: repos });
  assert.equal(first.offers.inserted, MONETIZATION_OFFERS.length);

  const netflix = await repos.merchantRepository.findBySlug('netflix');
  // Simulate a manually edited production record between runs.
  await repos.merchantRepository.upsertBySlug({ ...netflix!, name: 'Netflix (manually renamed by an admin)' });

  const second = await migrateStaticMonetizationOffers({ repositories: repos });

  assert.equal(second.merchants.inserted, 0);
  assert.equal(second.offers.inserted, 0);
  assert.equal(repos.merchantRepository.items.size, MONETIZATION_OFFERS.length, 'no duplicate merchants created');
  assert.equal(repos.offerRepository.items.size, MONETIZATION_OFFERS.length, 'no duplicate offers created');

  const netflixAfter = await repos.merchantRepository.findBySlug('netflix');
  assert.equal(netflixAfter!.name, 'Netflix (manually renamed by an admin)', 'manual edit must survive a repeated migration run');
});

test('AffiliateMigrationService supports an explicit overwrite pass that refreshes previously migrated records', async () => {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const netflix = await repos.merchantRepository.findBySlug('netflix');
  await repos.merchantRepository.upsertBySlug({ ...netflix!, name: 'Temporarily wrong name' });

  const overwritten = await migrateStaticMonetizationOffers({ repositories: repos, overwriteExisting: true });
  assert.equal(overwritten.merchants.updated, MONETIZATION_OFFERS.length);

  const netflixAfter = await repos.merchantRepository.findBySlug('netflix');
  assert.equal(netflixAfter!.name, 'Netflix');
});

test('AffiliateMigrationService: active/inactive program filtering excludes a deactivated program from findActiveForMerchant', async () => {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const movistar = await repos.merchantRepository.findBySlug('movistar-plus');
  const activeBefore = await repos.programRepository.findActiveForMerchant(movistar!.id, 'ES');
  assert.equal(activeBefore.length, 1);

  const [program] = await repos.programRepository.list({ merchantId: movistar!.id });
  await repos.programRepository.upsertByMerchantNetworkMarket({ ...program, status: 'inactive' });

  const activeAfter = await repos.programRepository.findActiveForMerchant(movistar!.id, 'ES');
  assert.equal(activeAfter.length, 0);
});

test('AffiliateMigrationService: market resolution only returns offers for the requested market', async () => {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const esOffers = await repos.offerRepository.findByMerchant(netflix!.id, 'ES');
  const usOffers = await repos.offerRepository.findByMerchant(netflix!.id, 'US');

  assert.equal(esOffers.length, 1);
  assert.equal(usOffers.length, 0);
});

test('AffiliateMigrationService: expired offers (validUntil in the past) are excluded from valid-offer lookups', async () => {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const netflix = await repos.merchantRepository.findBySlug('netflix');
  const [offer] = await repos.offerRepository.findByMerchant(netflix!.id, 'ES');

  const validBefore = await repos.offerRepository.findValidOffers('ES');
  assert.ok(validBefore.some((o) => o.id === offer.id));

  const expired = { ...offer, validity: { validUntil: new Date('2020-01-01T00:00:00.000Z') } };
  assert.equal(isOfferValidNow(expired.validity), false);
  await repos.offerRepository.upsertByMerchantProgramPlan(expired);

  const validAfter = await repos.offerRepository.findValidOffers('ES');
  assert.ok(!validAfter.some((o) => o.id === offer.id), 'an offer past its validUntil must not be returned as valid');
});

test('AffiliateMigrationService seeds every canonical + legacy placement key, mapping old placement strings forward', async () => {
  const repos = createInMemoryAffiliateRepositories();
  await migrateStaticMonetizationOffers({ repositories: repos });

  const streamingComparison = await repos.placementRepository.findByKey('streaming-comparison');
  assert.ok(streamingComparison);
  assert.equal(streamingComparison!.enabled, true);

  for (const legacyKey of ['comparison-card', 'comparison-table', 'comparison-selection']) {
    const resolved = await repos.placementRepository.findByKey(legacyKey);
    assert.ok(resolved, `expected legacy placement "${legacyKey}" to resolve`);
    assert.equal(resolved!.key, 'streaming-comparison');
  }

  const catalogDetail = await repos.placementRepository.findByKey('content-detail');
  assert.ok(catalogDetail);
  assert.equal(catalogDetail!.key, 'catalog-detail');
});
