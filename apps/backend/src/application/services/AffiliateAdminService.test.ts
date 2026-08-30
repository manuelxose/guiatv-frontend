import test from 'node:test';
import assert from 'node:assert/strict';
import { AffiliateAdminService } from './AffiliateAdminService';
import { AffiliateAnalyticsService } from './AffiliateAnalyticsService';
import { createInMemoryAffiliateRepositories } from './__testUtils__/inMemoryAffiliateRepositories';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { MerchantAdminInput, OfferAdminInput, ProgramAdminInput } from '../dto/AffiliateAdminDTO';

const ACTOR = { adminId: 'admin-1' };

function service(repos: ReturnType<typeof createInMemoryAffiliateRepositories>, env: NodeJS.ProcessEnv = {}, now?: () => Date) {
  return new AffiliateAdminService(
    repos.merchantRepository,
    repos.networkRepository,
    repos.programRepository,
    repos.offerRepository,
    repos.placementRepository,
    new AffiliateAnalyticsService(),
    undefined,
    env,
    now
  );
}

function merchantInput(overrides: Partial<MerchantAdminInput> = {}): MerchantAdminInput {
  return {
    name: 'Movistar Plus+',
    canonicalProviderKey: 'movistar-plus',
    aliases: ['Movistar+', 'M+'],
    category: 'streaming',
    officialUrl: 'https://www.movistarplus.es',
    markets: ['ES'],
    status: 'active',
    ...overrides,
  };
}

async function seedMerchantAndNetwork(svc: AffiliateAdminService) {
  const merchant = await svc.createMerchant(merchantInput(), ACTOR);
  const network = await svc.createNetwork(
    { name: 'AWIN', trackingType: 'url_template', markets: ['ES'], status: 'active' },
    ACTOR
  );
  return { merchant, network };
}

function programInput(merchantId: string, networkId: string, overrides: Partial<ProgramAdminInput> = {}): ProgramAdminInput {
  return {
    merchantId,
    networkId,
    market: 'ES',
    relationship: 'affiliate_configured',
    status: 'active',
    allowedHosts: ['tienda.movistarplus.es'],
    disclosure: 'Enlace de afiliado',
    verification: { status: 'approved', verifiedAt: new Date().toISOString() },
    ...overrides,
  };
}

function offerInput(merchantId: string, affiliateProgramId: string, overrides: Partial<OfferAdminInput> = {}): OfferAdminInput {
  return {
    merchantId,
    affiliateProgramId,
    market: 'ES',
    category: 'streaming',
    plan: { id: 'basic', name: 'Plan Basico' },
    pricing: {
      currency: 'EUR',
      monthlyAmount: 9.99,
      annualAmount: null,
      monthlyLabel: '9,99€/mes',
      annualLabel: '',
      activationFeeAmount: null,
    },
    features: {},
    requirements: { commitmentMonths: 0, fibreRequired: false, mobileRequired: false, device: null },
    trial: { days: null },
    recommendationIntents: ['cheapest'],
    destination: { strategy: 'direct_url', url: 'https://tienda.movistarplus.es/basico' },
    validity: {},
    status: 'active',
    verification: { status: 'current', verifiedAt: new Date().toISOString() },
    display: { disclosure: 'Enlace de afiliado' },
    ...overrides,
  };
}

// --- Merchants --------------------------------------------------------------

test('createMerchant persists a real single document reachable by id and by alias', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);

  const merchant = await svc.createMerchant(merchantInput(), ACTOR);

  assert.ok(merchant.id);
  assert.equal(merchant.slug, 'movistar-plus');
  assert.equal(merchant.status, 'active');
  const found = await repos.merchantRepository.findByAlias('M+');
  assert.equal(found?.id, merchant.id);
});

test('createMerchant rejects a missing name', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);
  await assert.rejects(svc.createMerchant(merchantInput({ name: '' }), ACTOR), ValidationError);
});

test('updateMerchant applies a new alias set and it resolves immediately', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);
  const merchant = await svc.createMerchant(merchantInput(), ACTOR);

  const updated = await svc.updateMerchant(merchant.id, merchantInput({ aliases: ['Movistar Plus', 'Movistar TV'] }), ACTOR);

  assert.deepEqual(updated.aliases.sort(), ['movistar plus', 'movistar tv']);
  const byOldAlias = await repos.merchantRepository.findByAlias('M+');
  assert.equal(byOldAlias, null);
  const byNewAlias = await repos.merchantRepository.findByAlias('Movistar TV');
  assert.equal(byNewAlias?.id, merchant.id);
});

test('updateMerchant on an unknown id throws NotFoundError', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);
  await assert.rejects(svc.updateMerchant('missing-id', merchantInput(), ACTOR), NotFoundError);
});

// --- Programs: unsafe host rejection + secret status ------------------------

test('createProgram rejects an unsafe allowedHosts entry', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);
  const { merchant, network } = await seedMerchantAndNetwork(svc);

  await assert.rejects(
    svc.createProgram(programInput(merchant.id, network.id, { allowedHosts: ['javascript:alert(1)'] }), ACTOR),
    ValidationError
  );
  await assert.rejects(
    svc.createProgram(programInput(merchant.id, network.id, { allowedHosts: ['https://evil.example.com'] }), ACTOR),
    ValidationError
  );
  await assert.rejects(
    svc.createProgram(programInput(merchant.id, network.id, { allowedHosts: ['localhost'] }), ACTOR),
    ValidationError
  );
});

test('createProgram accepts a plain hostname and persists it', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);
  const { merchant, network } = await seedMerchantAndNetwork(svc);

  const program = await svc.createProgram(programInput(merchant.id, network.id), ACTOR);
  assert.deepEqual(program.allowedHosts, ['tienda.movistarplus.es']);
});

test('createProgram rejects a duplicate (merchant, network, market)', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);
  const { merchant, network } = await seedMerchantAndNetwork(svc);
  await svc.createProgram(programInput(merchant.id, network.id), ACTOR);

  await assert.rejects(svc.createProgram(programInput(merchant.id, network.id), ACTOR), ConflictError);
});

test('program secret status shows Configured/Missing but never the secret value', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos, { AWIN_MOVISTAR_TOKEN: 'super-secret-value' });
  const { merchant, network } = await seedMerchantAndNetwork(svc);

  const configured = await svc.createProgram(
    programInput(merchant.id, network.id, { attribution: { secretRef: 'AWIN_MOVISTAR_TOKEN' } }),
    ACTOR
  );
  assert.equal(configured.secretStatus, 'configured');
  assert.equal(configured.secretRefName, 'AWIN_MOVISTAR_TOKEN');
  assert.equal(JSON.stringify(configured).includes('super-secret-value'), false);

  const missing = await svc.createProgram(
    programInput(merchant.id, network.id, { market: 'PT', attribution: { secretRef: 'AWIN_MISSING_TOKEN' } }),
    ACTOR
  );
  assert.equal(missing.secretStatus, 'missing');

  const noSecret = await svc.createProgram(programInput(merchant.id, network.id, { market: 'FR' }), ACTOR);
  assert.equal(noSecret.secretStatus, 'not_applicable');
});

// --- Offers: deactivate, expired, stale verification ------------------------

test('deactivateOffer flips status to inactive without touching other fields', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);
  const { merchant, network } = await seedMerchantAndNetwork(svc);
  const program = await svc.createProgram(programInput(merchant.id, network.id), ACTOR);
  const offer = await svc.createOffer(offerInput(merchant.id, program.id), ACTOR);

  const deactivated = await svc.deactivateOffer(offer.id, ACTOR);
  assert.equal(deactivated.status, 'inactive');
  assert.equal(deactivated.plan.id, 'basic');
});

test('an offer past its validUntil date is flagged expired even while status stays active', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const now = () => new Date('2026-08-29T00:00:00.000Z');
  const svc = service(repos, {}, now);
  const { merchant, network } = await seedMerchantAndNetwork(svc);
  const program = await svc.createProgram(programInput(merchant.id, network.id), ACTOR);

  const offer = await svc.createOffer(
    offerInput(merchant.id, program.id, { validity: { validUntil: '2026-01-01T00:00:00.000Z' } }),
    ACTOR
  );

  assert.equal(offer.status, 'active');
  assert.equal(offer.expired, true);

  const fetched = await svc.getOffer(offer.id);
  assert.equal(fetched.expired, true);
});

test('offer verification display degrades to stale once past the staleness window, and never silently reads as current', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const now = () => new Date('2026-08-29T00:00:00.000Z');
  const svc = service(repos, {}, now);
  const { merchant, network } = await seedMerchantAndNetwork(svc);
  const program = await svc.createProgram(programInput(merchant.id, network.id), ACTOR);

  const staleOffer = await svc.createOffer(
    offerInput(merchant.id, program.id, {
      plan: { id: 'stale-plan', name: 'Plan antiguo' },
      verification: { status: 'current', verifiedAt: '2026-01-01T00:00:00.000Z' },
    }),
    ACTOR
  );
  assert.equal(staleOffer.verificationDisplay, 'stale');
  assert.ok((staleOffer.daysSinceVerified ?? 0) > 90);

  const neverVerified = await svc.createOffer(
    offerInput(merchant.id, program.id, {
      plan: { id: 'unverified-plan', name: 'Plan sin verificar' },
      verification: { status: 'current', verifiedAt: undefined },
    }),
    ACTOR
  );
  assert.equal(neverVerified.verificationDisplay, 'needs_review');
});

test('createOffer rejects an offer whose market does not match its program market', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const svc = service(repos);
  const { merchant, network } = await seedMerchantAndNetwork(svc);
  const program = await svc.createProgram(programInput(merchant.id, network.id), ACTOR);

  await assert.rejects(svc.createOffer(offerInput(merchant.id, program.id, { market: 'PT' }), ACTOR), ValidationError);
});

// --- Verification queue -----------------------------------------------------

test('getVerificationQueue surfaces needs_review and stale rows ahead of current ones', async () => {
  const repos = createInMemoryAffiliateRepositories();
  const now = () => new Date('2026-08-29T00:00:00.000Z');
  const svc = service(repos, {}, now);
  const { merchant, network } = await seedMerchantAndNetwork(svc);
  const program = await svc.createProgram(programInput(merchant.id, network.id), ACTOR);

  await svc.createOffer(offerInput(merchant.id, program.id, { plan: { id: 'current', name: 'Current plan' } }), ACTOR);
  await svc.createOffer(
    offerInput(merchant.id, program.id, {
      plan: { id: 'stale', name: 'Stale plan' },
      verification: { status: 'current', verifiedAt: '2026-01-01T00:00:00.000Z' },
    }),
    ACTOR
  );
  await svc.createOffer(
    offerInput(merchant.id, program.id, {
      plan: { id: 'needs-review', name: 'Needs review plan' },
      verification: { status: 'needs_review' },
    }),
    ACTOR
  );

  const queue = await svc.getVerificationQueue();
  const offerRows = queue.filter((row) => row.entityType === 'offer');
  assert.equal(offerRows[0].displayStatus, 'needs_review');
  assert.equal(offerRows[1].displayStatus, 'stale');
  assert.equal(offerRows[offerRows.length - 1].displayStatus, 'current');
});
