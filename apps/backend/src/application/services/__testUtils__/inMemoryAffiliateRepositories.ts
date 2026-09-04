/**
 * In-memory fakes of the Affiliate Engine domain repositories, mirroring the
 * Mongo implementations' filtering/normalization semantics closely enough to
 * unit-test AffiliateMigrationService (and repository-consumer logic) without
 * a database connection — the same "inject a fake, no real backend" pattern
 * `MonetizationService.test.ts` already uses for AnalyticsService.
 */
import { AffiliateNetwork } from '@/domain/entities/AffiliateNetwork';
import {
  AffiliateNetworkFilter,
  AffiliateNetworkUpsertInput,
  IAffiliateNetworkRepository,
} from '@/domain/repositories/IAffiliateNetworkRepository';
import { AffiliateMerchant } from '@/domain/entities/AffiliateMerchant';
import {
  AffiliateMerchantFilter,
  AffiliateMerchantUpsertInput,
  IAffiliateMerchantRepository,
} from '@/domain/repositories/IAffiliateMerchantRepository';
import { AffiliateProgram } from '@/domain/entities/AffiliateProgram';
import {
  AffiliateProgramFilter,
  AffiliateProgramUpsertInput,
  IAffiliateProgramRepository,
} from '@/domain/repositories/IAffiliateProgramRepository';
import { AffiliateOffer } from '@/domain/entities/AffiliateOffer';
import {
  AffiliateOfferAdminFilter,
  AffiliateOfferCandidateFilter,
  AffiliateOfferUpsertInput,
  IAffiliateOfferRepository,
} from '@/domain/repositories/IAffiliateOfferRepository';
import { AffiliatePlacement } from '@/domain/entities/AffiliatePlacement';
import {
  AffiliatePlacementUpsertInput,
  IAffiliatePlacementRepository,
} from '@/domain/repositories/IAffiliatePlacementRepository';
import { normalizeAffiliateText } from '@/shared/utils/affiliateText';
import { isOfferValidNow } from '@/domain/services/affiliateOfferValidity';

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `fake-id-${idCounter}`;
}

export class InMemoryAffiliateNetworkRepository implements IAffiliateNetworkRepository {
  readonly items = new Map<string, AffiliateNetwork>();

  async findById(id: string): Promise<AffiliateNetwork | null> {
    return this.items.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<AffiliateNetwork | null> {
    const normalized = slug.toLowerCase().trim();
    return Array.from(this.items.values()).find((n) => n.slug === normalized) ?? null;
  }

  async list(filter: AffiliateNetworkFilter = {}): Promise<AffiliateNetwork[]> {
    return Array.from(this.items.values()).filter(
      (n) => (!filter.status || n.status === filter.status) && (!filter.market || n.markets.includes(filter.market))
    );
  }

  async upsertBySlug(network: AffiliateNetworkUpsertInput): Promise<AffiliateNetwork> {
    const slug = network.slug.toLowerCase().trim();
    const existing = await this.findBySlug(slug);
    const now = new Date();
    const entity: AffiliateNetwork = {
      id: existing?.id ?? nextId(),
      ...network,
      slug,
      createdAt: existing?.createdAt ?? network.createdAt ?? now,
      updatedAt: network.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async create(network: AffiliateNetworkUpsertInput): Promise<AffiliateNetwork> {
    const now = new Date();
    const entity: AffiliateNetwork = {
      id: nextId(),
      ...network,
      slug: network.slug.toLowerCase().trim(),
      createdAt: network.createdAt ?? now,
      updatedAt: network.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async updateById(id: string, patch: Partial<AffiliateNetwork>): Promise<AffiliateNetwork | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    const entity: AffiliateNetwork = { ...existing, ...patch, id: existing.id, slug: existing.slug, updatedAt: new Date() };
    this.items.set(id, entity);
    return entity;
  }
}

export class InMemoryAffiliateMerchantRepository implements IAffiliateMerchantRepository {
  readonly items = new Map<string, AffiliateMerchant>();

  async findById(id: string): Promise<AffiliateMerchant | null> {
    return this.items.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<AffiliateMerchant | null> {
    const normalized = slug.toLowerCase().trim();
    return Array.from(this.items.values()).find((m) => m.slug === normalized) ?? null;
  }

  async findByCanonicalProviderKey(canonicalProviderKey: string): Promise<AffiliateMerchant | null> {
    return Array.from(this.items.values()).find((m) => m.canonicalProviderKey === canonicalProviderKey.trim()) ?? null;
  }

  async findByAlias(text: string): Promise<AffiliateMerchant | null> {
    const normalized = normalizeAffiliateText(text);
    if (!normalized) return null;
    const bySlug = Array.from(this.items.values()).find(
      (m) => m.slug === normalized.replace(/\s+/g, '-') || m.canonicalProviderKey === normalized.replace(/\s+/g, '-')
    );
    if (bySlug) return bySlug;
    return Array.from(this.items.values()).find((m) => m.aliases.includes(normalized)) ?? null;
  }

  async list(filter: AffiliateMerchantFilter = {}): Promise<AffiliateMerchant[]> {
    return Array.from(this.items.values()).filter(
      (m) =>
        (!filter.status || m.status === filter.status) &&
        (!filter.category || m.category === filter.category) &&
        (!filter.market || m.markets.includes(filter.market))
    );
  }

  async upsertBySlug(merchant: AffiliateMerchantUpsertInput): Promise<AffiliateMerchant> {
    const slug = merchant.slug.toLowerCase().trim();
    const existing = await this.findBySlug(slug);
    const now = new Date();
    const entity: AffiliateMerchant = {
      id: existing?.id ?? nextId(),
      ...merchant,
      slug,
      aliases: Array.from(new Set((merchant.aliases || []).map((a) => normalizeAffiliateText(a)).filter(Boolean))),
      createdAt: existing?.createdAt ?? merchant.createdAt ?? now,
      updatedAt: merchant.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async create(merchant: AffiliateMerchantUpsertInput): Promise<AffiliateMerchant> {
    const now = new Date();
    const entity: AffiliateMerchant = {
      id: nextId(),
      ...merchant,
      slug: merchant.slug.toLowerCase().trim(),
      aliases: Array.from(new Set((merchant.aliases || []).map((a) => normalizeAffiliateText(a)).filter(Boolean))),
      createdAt: merchant.createdAt ?? now,
      updatedAt: merchant.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async updateById(id: string, patch: Partial<AffiliateMerchant>): Promise<AffiliateMerchant | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    const entity: AffiliateMerchant = {
      ...existing,
      ...patch,
      id: existing.id,
      slug: existing.slug,
      aliases: patch.aliases
        ? Array.from(new Set(patch.aliases.map((a) => normalizeAffiliateText(a)).filter(Boolean)))
        : existing.aliases,
      updatedAt: new Date(),
    };
    this.items.set(id, entity);
    return entity;
  }
}

export class InMemoryAffiliateProgramRepository implements IAffiliateProgramRepository {
  readonly items = new Map<string, AffiliateProgram>();

  async findById(id: string): Promise<AffiliateProgram | null> {
    return this.items.get(id) ?? null;
  }

  async findActiveForMerchant(merchantId: string, market: string): Promise<AffiliateProgram[]> {
    const upperMarket = market.toUpperCase().trim();
    return Array.from(this.items.values()).filter(
      (p) => p.merchantId === merchantId && p.market === upperMarket && p.status === 'active'
    );
  }

  async list(filter: AffiliateProgramFilter = {}): Promise<AffiliateProgram[]> {
    return Array.from(this.items.values()).filter(
      (p) =>
        (!filter.merchantId || p.merchantId === filter.merchantId) &&
        (!filter.networkId || p.networkId === filter.networkId) &&
        (!filter.market || p.market === filter.market.toUpperCase().trim()) &&
        (!filter.status || p.status === filter.status) &&
        (!filter.externalProgramId || p.externalProgramId === filter.externalProgramId)
    );
  }

  async upsertByMerchantNetworkMarket(program: AffiliateProgramUpsertInput): Promise<AffiliateProgram> {
    const market = program.market.toUpperCase().trim();
    const existing = Array.from(this.items.values()).find(
      (p) => p.merchantId === program.merchantId && p.networkId === program.networkId && p.market === market
    );
    const now = new Date();
    const entity: AffiliateProgram = {
      id: existing?.id ?? nextId(),
      ...program,
      market,
      createdAt: existing?.createdAt ?? program.createdAt ?? now,
      updatedAt: program.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async create(program: AffiliateProgramUpsertInput): Promise<AffiliateProgram> {
    const now = new Date();
    const entity: AffiliateProgram = {
      id: nextId(),
      ...program,
      market: program.market.toUpperCase().trim(),
      createdAt: program.createdAt ?? now,
      updatedAt: program.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async updateById(id: string, patch: Partial<AffiliateProgram>): Promise<AffiliateProgram | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    const entity: AffiliateProgram = {
      ...existing,
      ...patch,
      id: existing.id,
      market: patch.market ? patch.market.toUpperCase().trim() : existing.market,
      updatedAt: new Date(),
    };
    this.items.set(id, entity);
    return entity;
  }
}

export class InMemoryAffiliateOfferRepository implements IAffiliateOfferRepository {
  readonly items = new Map<string, AffiliateOffer>();

  async findById(id: string): Promise<AffiliateOffer | null> {
    return this.items.get(id) ?? null;
  }

  async findByMerchant(merchantId: string, market?: string): Promise<AffiliateOffer[]> {
    return Array.from(this.items.values()).filter(
      (o) => o.merchantId === merchantId && (!market || o.market === market.toUpperCase().trim())
    );
  }

  async findByAffiliateProgram(affiliateProgramId: string): Promise<AffiliateOffer[]> {
    return Array.from(this.items.values()).filter((o) => o.affiliateProgramId === affiliateProgramId);
  }

  async findByIntent(intent: string, market: string): Promise<AffiliateOffer[]> {
    const upperMarket = market.toUpperCase().trim();
    return Array.from(this.items.values()).filter(
      (o) => o.status === 'active' && o.market === upperMarket && o.recommendationIntents.includes(intent)
    );
  }

  async findByPlacement(placementKey: string, market: string): Promise<AffiliateOffer[]> {
    const upperMarket = market.toUpperCase().trim();
    return Array.from(this.items.values()).filter(
      (o) =>
        o.status === 'active' &&
        o.market === upperMarket &&
        (!o.placements || o.placements.length === 0 || o.placements.includes(placementKey))
    );
  }

  async findCandidates(filter: AffiliateOfferCandidateFilter): Promise<AffiliateOffer[]> {
    const upperMarket = filter.market.toUpperCase().trim();
    const asOf = filter.asOf || new Date();
    return Array.from(this.items.values()).filter(
      (o) =>
        o.status === 'active' &&
        o.market === upperMarket &&
        (!filter.category || o.category === filter.category) &&
        (!filter.intents?.length || filter.intents.some((intent) => o.recommendationIntents.includes(intent))) &&
        (!filter.merchantIds?.length || filter.merchantIds.includes(o.merchantId)) &&
        isOfferValidNow(o.validity, asOf)
    );
  }

  async findValidOffers(market: string, asOf: Date = new Date()): Promise<AffiliateOffer[]> {
    const upperMarket = market.toUpperCase().trim();
    return Array.from(this.items.values()).filter(
      (o) => o.status === 'active' && o.market === upperMarket && isOfferValidNow(o.validity, asOf)
    );
  }

  async list(filter: AffiliateOfferAdminFilter = {}): Promise<AffiliateOffer[]> {
    return Array.from(this.items.values()).filter(
      (o) =>
        (!filter.merchantId || o.merchantId === filter.merchantId) &&
        (!filter.affiliateProgramId || o.affiliateProgramId === filter.affiliateProgramId) &&
        (!filter.market || o.market === filter.market.toUpperCase().trim()) &&
        (!filter.status || o.status === filter.status) &&
        (!filter.category || o.category === filter.category)
    );
  }

  async upsertByMerchantProgramPlan(offer: AffiliateOfferUpsertInput): Promise<AffiliateOffer> {
    const market = offer.market.toUpperCase().trim();
    const existing = Array.from(this.items.values()).find(
      (o) =>
        o.merchantId === offer.merchantId &&
        o.affiliateProgramId === offer.affiliateProgramId &&
        o.market === market &&
        o.plan.id === offer.plan.id
    );
    const now = new Date();
    const entity: AffiliateOffer = {
      id: existing?.id ?? nextId(),
      ...offer,
      market,
      createdAt: existing?.createdAt ?? offer.createdAt ?? now,
      updatedAt: offer.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async count(filter: AffiliateOfferAdminFilter = {}): Promise<number> {
    return (await this.list(filter)).length;
  }

  async create(offer: AffiliateOfferUpsertInput): Promise<AffiliateOffer> {
    const now = new Date();
    const entity: AffiliateOffer = {
      id: nextId(),
      ...offer,
      market: offer.market.toUpperCase().trim(),
      createdAt: offer.createdAt ?? now,
      updatedAt: offer.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async updateById(id: string, patch: Partial<AffiliateOffer>): Promise<AffiliateOffer | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    const entity: AffiliateOffer = {
      ...existing,
      ...patch,
      id: existing.id,
      market: patch.market ? patch.market.toUpperCase().trim() : existing.market,
      updatedAt: new Date(),
    };
    this.items.set(id, entity);
    return entity;
  }
}

export class InMemoryAffiliatePlacementRepository implements IAffiliatePlacementRepository {
  readonly items = new Map<string, AffiliatePlacement>();

  async findById(id: string): Promise<AffiliatePlacement | null> {
    return this.items.get(id) ?? null;
  }

  async findByKey(key: string): Promise<AffiliatePlacement | null> {
    const normalized = key.toLowerCase().trim();
    return (
      Array.from(this.items.values()).find(
        (p) => p.key === normalized || (p.legacyKeys || []).includes(normalized)
      ) ?? null
    );
  }

  async listActive(): Promise<AffiliatePlacement[]> {
    return Array.from(this.items.values()).filter((p) => p.enabled);
  }

  async list(): Promise<AffiliatePlacement[]> {
    return Array.from(this.items.values());
  }

  async upsertByKey(placement: AffiliatePlacementUpsertInput): Promise<AffiliatePlacement> {
    const key = placement.key.toLowerCase().trim();
    const existing = await this.findByKey(key);
    const now = new Date();
    const entity: AffiliatePlacement = {
      id: existing?.id ?? nextId(),
      ...placement,
      key,
      createdAt: existing?.createdAt ?? placement.createdAt ?? now,
      updatedAt: placement.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async create(placement: AffiliatePlacementUpsertInput): Promise<AffiliatePlacement> {
    const now = new Date();
    const entity: AffiliatePlacement = {
      id: nextId(),
      ...placement,
      key: placement.key.toLowerCase().trim(),
      createdAt: placement.createdAt ?? now,
      updatedAt: placement.updatedAt ?? now,
    };
    this.items.set(entity.id, entity);
    return entity;
  }

  async updateById(id: string, patch: Partial<AffiliatePlacement>): Promise<AffiliatePlacement | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    const entity: AffiliatePlacement = { ...existing, ...patch, id: existing.id, key: existing.key, updatedAt: new Date() };
    this.items.set(id, entity);
    return entity;
  }
}

export function createInMemoryAffiliateRepositories() {
  return {
    networkRepository: new InMemoryAffiliateNetworkRepository(),
    merchantRepository: new InMemoryAffiliateMerchantRepository(),
    programRepository: new InMemoryAffiliateProgramRepository(),
    offerRepository: new InMemoryAffiliateOfferRepository(),
    placementRepository: new InMemoryAffiliatePlacementRepository(),
  };
}
