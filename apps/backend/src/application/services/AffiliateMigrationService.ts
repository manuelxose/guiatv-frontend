import { MONETIZATION_OFFERS, MonetizationOfferConfig } from '../data/monetizationOffers';
import {
  AFFILIATE_NETWORK_SEED,
  AFFILIATE_PLACEMENT_SEED,
  MERCHANT_ALIAS_OVERRIDES,
  RELATIONSHIP_TO_NETWORK_SLUG,
} from '../data/affiliateMigrationSeedData';
import { IAffiliateNetworkRepository } from '@/domain/repositories/IAffiliateNetworkRepository';
import { IAffiliateMerchantRepository } from '@/domain/repositories/IAffiliateMerchantRepository';
import { IAffiliateProgramRepository } from '@/domain/repositories/IAffiliateProgramRepository';
import { IAffiliateOfferRepository } from '@/domain/repositories/IAffiliateOfferRepository';
import { IAffiliatePlacementRepository } from '@/domain/repositories/IAffiliatePlacementRepository';
import { AffiliateNetwork } from '@/domain/entities/AffiliateNetwork';
import { AffiliateMerchant } from '@/domain/entities/AffiliateMerchant';
import { AffiliateProgram } from '@/domain/entities/AffiliateProgram';
import { MongoAffiliateNetworkRepository } from '../../infrastructure/repositories/MongoAffiliateNetworkRepository';
import { MongoAffiliateMerchantRepository } from '../../infrastructure/repositories/MongoAffiliateMerchantRepository';
import { MongoAffiliateProgramRepository } from '../../infrastructure/repositories/MongoAffiliateProgramRepository';
import { MongoAffiliateOfferRepository } from '../../infrastructure/repositories/MongoAffiliateOfferRepository';
import { MongoAffiliatePlacementRepository } from '../../infrastructure/repositories/MongoAffiliatePlacementRepository';
import { isAllowedAffiliateDestination } from './AffiliateDestinationValidator';
import { normalizeAffiliateText } from '@/shared/utils/affiliateText';
import { AffiliateMerchantModel } from '../../infrastructure/database/models/AffiliateMerchant.model';
import { logger } from '../../shared/utils/logger';

export interface AffiliateMigrationRepositories {
  networkRepository: IAffiliateNetworkRepository;
  merchantRepository: IAffiliateMerchantRepository;
  programRepository: IAffiliateProgramRepository;
  offerRepository: IAffiliateOfferRepository;
  placementRepository: IAffiliatePlacementRepository;
}

export interface AffiliateMigrationOptions {
  /** When true, re-writes fields on already-migrated documents. Default: false — never clobbers a manually edited production record. */
  overwriteExisting?: boolean;
  offers?: MonetizationOfferConfig[];
  now?: () => Date;
  repositories?: Partial<AffiliateMigrationRepositories>;
}

interface CollectionTally {
  inserted: number;
  updated: number;
  unchanged: number;
}

export interface AffiliateMigrationResult {
  networks: CollectionTally;
  merchants: CollectionTally;
  programs: CollectionTally;
  offers: CollectionTally & { skippedUnsafe: string[] };
  placements: CollectionTally;
}

const FRESHNESS_WINDOW_MS = 120 * 24 * 60 * 60 * 1000;

function freshnessStatus(verifiedAt: string, now: Date): 'current' | 'stale' {
  const age = now.getTime() - new Date(`${verifiedAt}T00:00:00.000Z`).getTime();
  return age <= FRESHNESS_WINDOW_MS ? 'current' : 'stale';
}

function emptyTally(): CollectionTally {
  return { inserted: 0, updated: 0, unchanged: 0 };
}

/**
 * Writes `entity` only if it is new, or `overwriteExisting` is set — so a
 * document that already exists (e.g. because an admin manually edited it
 * after the first migration run) is left untouched on every subsequent run.
 */
async function upsertIfNeeded<T>(
  tally: CollectionTally,
  existing: T | null,
  overwriteExisting: boolean,
  write: () => Promise<T>
): Promise<T> {
  if (existing && !overwriteExisting) {
    tally.unchanged += 1;
    return existing;
  }
  const entity = await write();
  if (existing) tally.updated += 1;
  else tally.inserted += 1;
  return entity;
}

function defaultRepositories(): AffiliateMigrationRepositories {
  return {
    networkRepository: new MongoAffiliateNetworkRepository(),
    merchantRepository: new MongoAffiliateMerchantRepository(),
    programRepository: new MongoAffiliateProgramRepository(),
    offerRepository: new MongoAffiliateOfferRepository(),
    placementRepository: new MongoAffiliatePlacementRepository(),
  };
}

/**
 * Idempotent migration from the static `MONETIZATION_OFFERS` array into the
 * persistent Affiliate Engine collections (see docs/affiliate-engine-architecture.md
 * §19). Safe to run repeatedly: re-running never creates duplicates and — by
 * default — never overwrites a document that already exists.
 *
 * Does NOT touch `monetizationOffers.ts` or any existing route — this only
 * populates Mongo so the new domain model can represent the same data the
 * static array already represents (Phase 2 scope: persistence + migration,
 * not yet routing production traffic through the new model).
 */
export async function migrateStaticMonetizationOffers(
  options: AffiliateMigrationOptions = {}
): Promise<AffiliateMigrationResult> {
  const overwriteExisting = options.overwriteExisting === true;
  const offers = options.offers ?? MONETIZATION_OFFERS;
  const now = (options.now ?? (() => new Date()))();
  const repos: AffiliateMigrationRepositories = { ...defaultRepositories(), ...options.repositories };

  const result: AffiliateMigrationResult = {
    networks: emptyTally(),
    merchants: emptyTally(),
    programs: emptyTally(),
    offers: { ...emptyTally(), skippedUnsafe: [] },
    placements: emptyTally(),
  };

  // 1. Networks — fixed placeholder set, independent of the static offers.
  const networkBySlug = new Map<string, AffiliateNetwork>();
  for (const network of AFFILIATE_NETWORK_SEED) {
    const existing = await repos.networkRepository.findBySlug(network.slug);
    const entity = await upsertIfNeeded(result.networks, existing, overwriteExisting, () =>
      repos.networkRepository.upsertBySlug({
        slug: network.slug,
        name: network.name,
        trackingType: network.trackingType,
        markets: network.markets,
        status: 'active',
      })
    );
    networkBySlug.set(network.slug, entity);
  }

  // 2. Merchants — one per distinct provider in the static offers.
  const merchantBySlug = new Map<string, AffiliateMerchant>();
  for (const offer of offers) {
    const aliasSource = new Set<string>([
      offer.provider.name,
      offer.provider.id,
      ...(MERCHANT_ALIAS_OVERRIDES[offer.provider.id] || []),
    ]);
    const aliases = Array.from(new Set(Array.from(aliasSource).map((alias) => normalizeAffiliateText(alias)).filter(Boolean)));

    const existing = await repos.merchantRepository.findBySlug(offer.provider.id);
    const entity = await upsertIfNeeded(result.merchants, existing, overwriteExisting, () =>
      repos.merchantRepository.upsertBySlug({
        slug: offer.provider.id,
        canonicalProviderKey: offer.provider.id,
        name: offer.provider.name,
        aliases,
        category: 'streaming',
        officialUrl: offer.destinationUrl,
        markets: ['ES'],
        status: 'active',
      })
    );
    merchantBySlug.set(offer.provider.id, entity);
  }

  // 3. Programs — one per (merchant, network, market) combination present in the static offers.
  // Never fabricated as "affiliate configured": that only happens at request time when the
  // env-managed secret actually resolves and passes the safety gate (§17) — this migration
  // only records the *reference* (`attribution.secretRef`), never a credential value.
  const programByMerchantId = new Map<string, AffiliateProgram>();
  for (const offer of offers) {
    const merchant = merchantBySlug.get(offer.provider.id)!;
    const networkSlug = RELATIONSHIP_TO_NETWORK_SLUG[offer.defaultRelationship];
    const network = networkBySlug.get(networkSlug);
    if (!network) {
      throw new Error(`Affiliate migration: unresolved network '${networkSlug}' for provider '${offer.provider.id}'`);
    }

    const existingList = await repos.programRepository.list({ merchantId: merchant.id, networkId: network.id, market: 'ES' });
    const existing = existingList[0] ?? null;
    const entity = await upsertIfNeeded(result.programs, existing, overwriteExisting, () =>
      repos.programRepository.upsertByMerchantNetworkMarket({
        merchantId: merchant.id,
        networkId: network.id,
        market: 'ES',
        relationship: offer.defaultRelationship,
        // Operative today (resolves to a real destination) regardless of whether an affiliate
        // deal exists yet — matches current public behavior.
        status: 'active',
        allowedHosts: offer.allowedHosts,
        disclosure: offer.disclosure,
        attribution: { secretRef: offer.affiliateEnvKey },
        verification: {
          source: offer.sourceUrl,
          verifiedAt: new Date(`${offer.verifiedAt}T00:00:00.000Z`),
          status: offer.verificationStatus === 'needs_review' ? 'needs_review' : 'approved',
        },
      })
    );
    programByMerchantId.set(merchant.id, entity);
  }

  // 4. Offers — carrying plan/pricing/features/intents verbatim from the static config.
  // The safety gate (§17) is mandatory here too: an offer whose static `destinationUrl` would
  // not itself pass the https + allowlist check is never migrated.
  for (const offer of offers) {
    const merchant = merchantBySlug.get(offer.provider.id)!;
    const program = programByMerchantId.get(merchant.id)!;

    if (!isAllowedAffiliateDestination(offer.destinationUrl, offer.allowedHosts)) {
      result.offers.skippedUnsafe.push(offer.id);
      logger.warn('Affiliate migration: skipping offer with unsafe destination', { offerId: offer.id });
      continue;
    }

    const existingList = await repos.offerRepository.list({ merchantId: merchant.id, affiliateProgramId: program.id, market: 'ES' });
    const existing = existingList.find((item) => item.plan.id === offer.plan.id) ?? null;
    await upsertIfNeeded(result.offers, existing, overwriteExisting, () =>
      repos.offerRepository.upsertByMerchantProgramPlan({
        merchantId: merchant.id,
        affiliateProgramId: program.id,
        market: 'ES',
        category: 'streaming',
        plan: offer.plan,
        pricing: offer.pricing,
        features: offer.features,
        requirements: offer.requirements,
        trial: { days: offer.trialDays },
        recommendationIntents: offer.recommendation.intents,
        destination: { strategy: 'direct_url', url: offer.destinationUrl },
        validity: {},
        status: 'active',
        verification: {
          source: offer.sourceUrl,
          verifiedAt: new Date(`${offer.verifiedAt}T00:00:00.000Z`),
          status: offer.verificationStatus ?? freshnessStatus(offer.verifiedAt, now),
        },
        display: { bestFor: offer.bestFor, highlight: offer.highlight, disclosure: offer.disclosure },
      })
    );
  }

  // 5. Placements — canonical keys + legacy-key mapping. Never overwritten by default so an
  // admin toggling `enabled` off survives a repeated migration run.
  for (const placement of AFFILIATE_PLACEMENT_SEED) {
    const existing = await repos.placementRepository.findByKey(placement.key);
    await upsertIfNeeded(result.placements, existing, overwriteExisting, () =>
      repos.placementRepository.upsertByKey(placement)
    );
  }

  return result;
}

/**
 * Runs the migration automatically on an empty affiliate merchants collection —
 * same "seed only if empty by default" convention as `ensureEditorialSeedData`.
 * Opt out with AUTO_SEED_AFFILIATE_ENGINE=false (e.g. in tests/CI).
 */
export async function ensureAffiliateSeedData(): Promise<void> {
  if (process.env.AUTO_SEED_AFFILIATE_ENGINE === 'false') {
    logger.info('Skipping affiliate engine auto-seed because AUTO_SEED_AFFILIATE_ENGINE=false');
    return;
  }

  const existingCount = await AffiliateMerchantModel.countDocuments({}).exec();
  if (existingCount > 0) {
    return;
  }

  const result = await migrateStaticMonetizationOffers();
  logger.info('Affiliate engine seed migrated on empty database', result);
}
