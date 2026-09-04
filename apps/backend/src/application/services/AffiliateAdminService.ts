import { AffiliateMerchant } from '@/domain/entities/AffiliateMerchant';
import { AffiliateNetwork } from '@/domain/entities/AffiliateNetwork';
import { AffiliateProgram } from '@/domain/entities/AffiliateProgram';
import { AffiliateOffer } from '@/domain/entities/AffiliateOffer';
import { AffiliatePlacement } from '@/domain/entities/AffiliatePlacement';
import { IAffiliateMerchantRepository, AffiliateMerchantFilter } from '@/domain/repositories/IAffiliateMerchantRepository';
import { IAffiliateNetworkRepository, AffiliateNetworkFilter } from '@/domain/repositories/IAffiliateNetworkRepository';
import { IAffiliateProgramRepository, AffiliateProgramFilter } from '@/domain/repositories/IAffiliateProgramRepository';
import { IAffiliateOfferRepository, AffiliateOfferAdminFilter } from '@/domain/repositories/IAffiliateOfferRepository';
import { IAffiliatePlacementRepository } from '@/domain/repositories/IAffiliatePlacementRepository';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { isOfferValidNow } from '@/domain/services/affiliateOfferValidity';
import { computeAffiliateVerificationDisplay } from '@/domain/services/affiliateVerificationStatus';
import { normalizeAffiliateText } from '../../shared/utils/affiliateText';
import { invalidateAffiliateCache } from '../../infrastructure/affiliate/AffiliateCacheKeys';
import { NotFoundError, ValidationError, ConflictError, ValidationErrorDetail } from '../../shared/errors';
import { AffiliateAnalyticsService } from './AffiliateAnalyticsService';
import { isSafeAllowedHost } from './AffiliateDestinationValidator';
import {
  AffiliateAdminActor,
  MerchantAdminInput,
  NetworkAdminInput,
  OfferAdminInput,
  OfferAdminView,
  PlacementAdminInput,
  ProgramAdminInput,
  ProgramSecretView,
  VerificationQueueItem,
} from '../dto/AffiliateAdminDTO';

export type MerchantAdminRow = AffiliateMerchant;
export type ProgramAdminRow = AffiliateProgram & ProgramSecretView;
export type OfferAdminRow = AffiliateOffer & OfferAdminView;

/**
 * Owns every write path behind the Phase 9 admin UI (`/v2/admin/affiliate/*`).
 * Every mutation: (1) validates against the live catalog (merchant/network/
 * program existence, market consistency, duplicate business keys, unsafe
 * hosts), (2) writes through the real single-document `create`/`updateById`
 * repository methods (never the migration-only `upsertBy*` ones, which are
 * keyed for idempotent seeding, not identity-stable admin edits),
 * (3) busts the resolver's read cache so a change is live immediately, and
 * (4) emits an audit event — entity/admin/timestamp/changed-field-names only,
 * never a secret value, via the existing generic analytics event pipeline.
 */
export class AffiliateAdminService {
  constructor(
    private readonly merchantRepository: IAffiliateMerchantRepository,
    private readonly networkRepository: IAffiliateNetworkRepository,
    private readonly programRepository: IAffiliateProgramRepository,
    private readonly offerRepository: IAffiliateOfferRepository,
    private readonly placementRepository: IAffiliatePlacementRepository,
    private readonly analytics: AffiliateAnalyticsService,
    private readonly cache?: ICacheRepository,
    private readonly env: NodeJS.ProcessEnv = process.env,
    private readonly now: () => Date = () => new Date()
  ) {}

  // ---------------------------------------------------------------------
  // Merchants
  // ---------------------------------------------------------------------

  async listMerchants(filter: AffiliateMerchantFilter & { search?: string } = {}): Promise<MerchantAdminRow[]> {
    const { search, ...repoFilter } = filter;
    const merchants = await this.merchantRepository.list(repoFilter);
    if (!search) return merchants;
    const needle = normalizeAffiliateText(search);
    return merchants.filter(
      (m) =>
        normalizeAffiliateText(m.name).includes(needle) ||
        normalizeAffiliateText(m.canonicalProviderKey).includes(needle) ||
        m.aliases.some((alias) => alias.includes(needle))
    );
  }

  async getMerchant(id: string): Promise<MerchantAdminRow> {
    const merchant = await this.merchantRepository.findById(id);
    if (!merchant) throw new NotFoundError('AffiliateMerchant', id);
    return merchant;
  }

  async createMerchant(input: MerchantAdminInput, actor: AffiliateAdminActor): Promise<MerchantAdminRow> {
    this.assertMerchantInput(input);
    const slug = await this.generateUniqueSlug(
      (candidate) => this.merchantRepository.findBySlug(candidate),
      input.canonicalProviderKey || input.name
    );
    const now = this.now();
    const merchant = await this.merchantRepository.create({
      slug,
      canonicalProviderKey: input.canonicalProviderKey.trim(),
      name: input.name.trim(),
      aliases: input.aliases,
      logo: input.logo?.trim() || undefined,
      category: input.category,
      officialUrl: input.officialUrl.trim(),
      markets: input.markets,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    });
    await this.finishWrite('merchant', merchant.id, 'create', Object.keys(input), actor);
    return merchant;
  }

  async updateMerchant(id: string, input: MerchantAdminInput, actor: AffiliateAdminActor): Promise<MerchantAdminRow> {
    this.assertMerchantInput(input);
    const existing = await this.getMerchant(id);
    const updated = await this.merchantRepository.updateById(id, {
      canonicalProviderKey: input.canonicalProviderKey.trim(),
      name: input.name.trim(),
      aliases: input.aliases,
      logo: input.logo?.trim() || undefined,
      category: input.category,
      officialUrl: input.officialUrl.trim(),
      markets: input.markets,
      status: input.status,
    });
    if (!updated) throw new NotFoundError('AffiliateMerchant', id);
    await this.finishWrite('merchant', id, 'update', this.diffFields(existing, updated), actor);
    return updated;
  }

  private assertMerchantInput(input: MerchantAdminInput): void {
    const details: ValidationErrorDetail[] = [];
    if (!input.name?.trim()) details.push({ field: 'name', message: 'name is required' });
    if (!input.canonicalProviderKey?.trim()) details.push({ field: 'canonicalProviderKey', message: 'canonical key is required' });
    if (!input.officialUrl?.trim() || !this.isSafeUrl(input.officialUrl)) {
      details.push({ field: 'officialUrl', message: 'a valid https URL is required', value: input.officialUrl });
    }
    if (details.length) throw new ValidationError('Invalid merchant', details);
  }

  // ---------------------------------------------------------------------
  // Networks
  // ---------------------------------------------------------------------

  async listNetworks(filter: AffiliateNetworkFilter = {}): Promise<AffiliateNetwork[]> {
    return this.networkRepository.list(filter);
  }

  async getNetwork(id: string): Promise<AffiliateNetwork> {
    const network = await this.networkRepository.findById(id);
    if (!network) throw new NotFoundError('AffiliateNetwork', id);
    return network;
  }

  async createNetwork(input: NetworkAdminInput, actor: AffiliateAdminActor): Promise<AffiliateNetwork> {
    this.assertNetworkInput(input);
    const slug = await this.generateUniqueSlug((candidate) => this.networkRepository.findBySlug(candidate), input.name);
    const now = this.now();
    const network = await this.networkRepository.create({
      slug,
      name: input.name.trim(),
      trackingType: input.trackingType,
      markets: input.markets,
      status: input.status,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    });
    await this.finishWrite('network', network.id, 'create', Object.keys(input), actor);
    return network;
  }

  async updateNetwork(id: string, input: NetworkAdminInput, actor: AffiliateAdminActor): Promise<AffiliateNetwork> {
    this.assertNetworkInput(input);
    const existing = await this.getNetwork(id);
    const updated = await this.networkRepository.updateById(id, {
      name: input.name.trim(),
      trackingType: input.trackingType,
      markets: input.markets,
      status: input.status,
      metadata: input.metadata,
    });
    if (!updated) throw new NotFoundError('AffiliateNetwork', id);
    await this.finishWrite('network', id, 'update', this.diffFields(existing, updated), actor);
    return updated;
  }

  private assertNetworkInput(input: NetworkAdminInput): void {
    if (!input.name?.trim()) throw new ValidationError('Invalid network', [{ field: 'name', message: 'name is required' }]);
  }

  // ---------------------------------------------------------------------
  // Programs — secret credentials are never read into this service; only
  // `attribution.secretRef` (an env-var *name*) is persisted, and every
  // returned row carries a derived `secretStatus` instead of any value.
  // ---------------------------------------------------------------------

  async listPrograms(filter: AffiliateProgramFilter = {}): Promise<ProgramAdminRow[]> {
    const programs = await this.programRepository.list(filter);
    return programs.map((program) => this.withSecretView(program));
  }

  async getProgram(id: string): Promise<ProgramAdminRow> {
    const program = await this.programRepository.findById(id);
    if (!program) throw new NotFoundError('AffiliateProgram', id);
    return this.withSecretView(program);
  }

  async createProgram(input: ProgramAdminInput, actor: AffiliateAdminActor): Promise<ProgramAdminRow> {
    await this.assertProgramInput(input);
    const duplicates = await this.programRepository.list({
      merchantId: input.merchantId,
      networkId: input.networkId,
      market: input.market,
    });
    if (duplicates.length > 0) {
      throw new ConflictError('A program already exists for this merchant, network and market');
    }

    const now = this.now();
    const program = await this.programRepository.create({
      merchantId: input.merchantId,
      networkId: input.networkId,
      market: input.market,
      externalProgramId: input.externalProgramId?.trim() || undefined,
      relationship: input.relationship,
      status: input.status,
      allowedHosts: input.allowedHosts,
      disclosure: input.disclosure.trim(),
      commission: input.commission,
      attribution: input.attribution,
      verification: {
        source: input.verification.source?.trim() || undefined,
        verifiedAt: this.parseOptionalDate(input.verification.verifiedAt),
        status: input.verification.status,
      },
      createdAt: now,
      updatedAt: now,
    });
    await this.finishWrite('program', program.id, 'create', Object.keys(input), actor);
    return this.withSecretView(program);
  }

  async updateProgram(id: string, input: ProgramAdminInput, actor: AffiliateAdminActor): Promise<ProgramAdminRow> {
    await this.assertProgramInput(input);
    const existing = await this.programRepository.findById(id);
    if (!existing) throw new NotFoundError('AffiliateProgram', id);

    const updated = await this.programRepository.updateById(id, {
      merchantId: input.merchantId,
      networkId: input.networkId,
      market: input.market,
      externalProgramId: input.externalProgramId?.trim() || undefined,
      relationship: input.relationship,
      status: input.status,
      allowedHosts: input.allowedHosts,
      disclosure: input.disclosure.trim(),
      commission: input.commission,
      attribution: input.attribution,
      verification: {
        source: input.verification.source?.trim() || undefined,
        verifiedAt: this.parseOptionalDate(input.verification.verifiedAt),
        status: input.verification.status,
      },
    });
    if (!updated) throw new NotFoundError('AffiliateProgram', id);
    await this.finishWrite('program', id, 'update', this.diffFields(existing, updated), actor);
    return this.withSecretView(updated);
  }

  private async assertProgramInput(input: ProgramAdminInput): Promise<void> {
    const details: ValidationErrorDetail[] = [];
    if (!input.merchantId) details.push({ field: 'merchantId', message: 'merchant is required' });
    if (!input.networkId) details.push({ field: 'networkId', message: 'network is required' });
    if (!input.market?.trim()) details.push({ field: 'market', message: 'market is required' });
    if (!input.disclosure?.trim()) details.push({ field: 'disclosure', message: 'disclosure copy is required' });
    if (!input.allowedHosts || input.allowedHosts.length === 0) {
      details.push({ field: 'allowedHosts', message: 'at least one allowed host is required' });
    } else {
      const unsafe = input.allowedHosts.filter((host) => !isSafeAllowedHost(host));
      if (unsafe.length > 0) {
        details.push({ field: 'allowedHosts', message: `unsafe host rejected: ${unsafe.join(', ')}`, value: unsafe });
      }
    }
    if (details.length) throw new ValidationError('Invalid program', details);

    const [merchant, network] = await Promise.all([
      this.merchantRepository.findById(input.merchantId),
      this.networkRepository.findById(input.networkId),
    ]);
    if (!merchant) throw new NotFoundError('AffiliateMerchant', input.merchantId);
    if (!network) throw new NotFoundError('AffiliateNetwork', input.networkId);
  }

  private withSecretView(program: AffiliateProgram): ProgramAdminRow {
    const secretRefName = program.attribution?.secretRef;
    const secretStatus: ProgramSecretView['secretStatus'] = !secretRefName
      ? 'not_applicable'
      : this.env[secretRefName]
        ? 'configured'
        : 'missing';
    return { ...program, secretRefName, secretStatus };
  }

  // ---------------------------------------------------------------------
  // Offers
  // ---------------------------------------------------------------------

  async listOffers(filter: AffiliateOfferAdminFilter = {}): Promise<{ items: OfferAdminRow[]; total: number }> {
    const [offers, total] = await Promise.all([this.offerRepository.list(filter), this.offerRepository.count(filter)]);
    return { items: offers.map((offer) => this.withOfferView(offer)), total };
  }

  async getOffer(id: string): Promise<OfferAdminRow> {
    const offer = await this.offerRepository.findById(id);
    if (!offer) throw new NotFoundError('AffiliateOffer', id);
    return this.withOfferView(offer);
  }

  async createOffer(input: OfferAdminInput, actor: AffiliateAdminActor): Promise<OfferAdminRow> {
    await this.assertOfferInput(input);
    const duplicates = (await this.offerRepository.list({
      merchantId: input.merchantId,
      affiliateProgramId: input.affiliateProgramId,
      market: input.market,
    })).filter((offer) => offer.plan.id === input.plan.id);
    if (duplicates.length > 0) {
      throw new ConflictError('An offer already exists for this merchant, program, market and plan');
    }

    const now = this.now();
    const offer = await this.offerRepository.create({
      ...this.normalizeOfferInput(input),
      createdAt: now,
      updatedAt: now,
    });
    await this.finishWrite('offer', offer.id, 'create', Object.keys(input), actor);
    return this.withOfferView(offer);
  }

  async updateOffer(id: string, input: OfferAdminInput, actor: AffiliateAdminActor): Promise<OfferAdminRow> {
    await this.assertOfferInput(input);
    const existing = await this.offerRepository.findById(id);
    if (!existing) throw new NotFoundError('AffiliateOffer', id);

    const updated = await this.offerRepository.updateById(id, this.normalizeOfferInput(input));
    if (!updated) throw new NotFoundError('AffiliateOffer', id);
    await this.finishWrite('offer', id, 'update', this.diffFields(existing, updated), actor);
    return this.withOfferView(updated);
  }

  /** Convenience one-field mutation for the list view's "deactivate" action. */
  async deactivateOffer(id: string, actor: AffiliateAdminActor): Promise<OfferAdminRow> {
    const existing = await this.offerRepository.findById(id);
    if (!existing) throw new NotFoundError('AffiliateOffer', id);
    const updated = await this.offerRepository.updateById(id, { status: 'inactive' });
    if (!updated) throw new NotFoundError('AffiliateOffer', id);
    await this.finishWrite('offer', id, 'update', ['status'], actor);
    return this.withOfferView(updated);
  }

  private normalizeOfferInput(input: OfferAdminInput) {
    return {
      merchantId: input.merchantId,
      affiliateProgramId: input.affiliateProgramId,
      market: input.market,
      category: input.category,
      plan: input.plan,
      pricing: input.pricing,
      features: input.features || {},
      requirements: input.requirements,
      trial: input.trial,
      recommendationIntents: input.recommendationIntents || [],
      placements: input.placements,
      destination: input.destination,
      validity: {
        validFrom: this.parseOptionalDate(input.validity.validFrom),
        validUntil: this.parseOptionalDate(input.validity.validUntil),
      },
      status: input.status,
      verification: {
        source: input.verification.source?.trim() || undefined,
        verifiedAt: this.parseOptionalDate(input.verification.verifiedAt),
        status: input.verification.status,
      },
      display: input.display,
    };
  }

  private async assertOfferInput(input: OfferAdminInput): Promise<void> {
    const details: ValidationErrorDetail[] = [];
    if (!input.merchantId) details.push({ field: 'merchantId', message: 'merchant is required' });
    if (!input.affiliateProgramId) details.push({ field: 'affiliateProgramId', message: 'program is required' });
    if (!input.market?.trim()) details.push({ field: 'market', message: 'market is required' });
    if (!input.plan?.id?.trim() || !input.plan?.name?.trim()) {
      details.push({ field: 'plan', message: 'plan id and name are required' });
    }
    if (!input.destination?.url || !this.isSafeUrl(input.destination.url)) {
      details.push({ field: 'destination.url', message: 'a valid https destination URL is required', value: input.destination?.url });
    }
    if (!input.display?.disclosure?.trim()) {
      details.push({ field: 'display.disclosure', message: 'disclosure copy is required' });
    }
    if (details.length) throw new ValidationError('Invalid offer', details);

    const [merchant, program] = await Promise.all([
      this.merchantRepository.findById(input.merchantId),
      this.programRepository.findById(input.affiliateProgramId),
    ]);
    if (!merchant) throw new NotFoundError('AffiliateMerchant', input.merchantId);
    if (!program) throw new NotFoundError('AffiliateProgram', input.affiliateProgramId);
    if (program.market !== input.market.toUpperCase().trim()) {
      throw new ValidationError('Offer market must match its program market', [
        { field: 'market', message: 'market must match the selected program', value: input.market },
      ]);
    }
  }

  private withOfferView(offer: AffiliateOffer): OfferAdminRow {
    const expired = !isOfferValidNow(offer.validity, this.now());
    const { displayStatus, daysSinceVerified } = computeAffiliateVerificationDisplay(
      offer.verification.status,
      offer.verification.verifiedAt,
      this.now()
    );
    return { ...offer, expired, verificationDisplay: displayStatus, daysSinceVerified };
  }

  // ---------------------------------------------------------------------
  // Placements
  // ---------------------------------------------------------------------

  async listPlacements(): Promise<AffiliatePlacement[]> {
    return this.placementRepository.list();
  }

  async createPlacement(input: PlacementAdminInput, actor: AffiliateAdminActor): Promise<AffiliatePlacement> {
    this.assertPlacementInput(input);
    const existing = await this.placementRepository.findByKey(input.key);
    if (existing) throw new ConflictError(`Placement key '${input.key}' already exists`);

    const now = this.now();
    const placement = await this.placementRepository.create({
      key: input.key.toLowerCase().trim(),
      page: input.page.trim(),
      description: input.description?.trim() || undefined,
      enabled: input.enabled,
      legacyKeys: input.legacyKeys,
      createdAt: now,
      updatedAt: now,
    });
    await this.finishWrite('placement', placement.id, 'create', Object.keys(input), actor);
    return placement;
  }

  async updatePlacement(id: string, input: Omit<PlacementAdminInput, 'key'>, actor: AffiliateAdminActor): Promise<AffiliatePlacement> {
    if (!input.page?.trim()) throw new ValidationError('Invalid placement', [{ field: 'page', message: 'page is required' }]);
    const existing = await this.placementRepository.findById(id);
    if (!existing) throw new NotFoundError('AffiliatePlacement', id);

    const updated = await this.placementRepository.updateById(id, {
      page: input.page.trim(),
      description: input.description?.trim() || undefined,
      enabled: input.enabled,
      legacyKeys: input.legacyKeys,
    });
    if (!updated) throw new NotFoundError('AffiliatePlacement', id);
    await this.finishWrite('placement', id, 'update', this.diffFields(existing, updated), actor);
    return updated;
  }

  private assertPlacementInput(input: PlacementAdminInput): void {
    const details: ValidationErrorDetail[] = [];
    if (!input.key?.trim()) details.push({ field: 'key', message: 'key is required' });
    if (!input.page?.trim()) details.push({ field: 'page', message: 'page is required' });
    if (details.length) throw new ValidationError('Invalid placement', details);
  }

  // ---------------------------------------------------------------------
  // Verification queue — Programs and Offers merged into one review list.
  // ---------------------------------------------------------------------

  async getVerificationQueue(filter: { market?: string } = {}): Promise<VerificationQueueItem[]> {
    const [programs, offers, merchants, networks] = await Promise.all([
      this.programRepository.list(filter.market ? { market: filter.market } : {}),
      this.offerRepository.list(filter.market ? { market: filter.market } : {}),
      this.merchantRepository.list(),
      this.networkRepository.list(),
    ]);
    const merchantById = new Map(merchants.map((m) => [m.id, m]));
    const networkById = new Map(networks.map((n) => [n.id, n]));
    const now = this.now();

    const programItems: VerificationQueueItem[] = programs.map((program) => {
      const { displayStatus, daysSinceVerified } = computeAffiliateVerificationDisplay(
        program.verification.status,
        program.verification.verifiedAt,
        now
      );
      const merchant = merchantById.get(program.merchantId);
      const network = networkById.get(program.networkId);
      return {
        entityType: 'program',
        entityId: program.id,
        merchantId: program.merchantId,
        merchantName: merchant?.name || 'Unknown merchant',
        label: `${merchant?.name || 'Unknown merchant'} — ${network?.name || 'Unknown network'} (${program.market})`,
        market: program.market,
        sourceUrl: program.verification.source,
        verifiedAt: program.verification.verifiedAt?.toISOString(),
        daysSinceVerified,
        displayStatus,
      };
    });

    const offerItems: VerificationQueueItem[] = offers.map((offer) => {
      const { displayStatus, daysSinceVerified } = computeAffiliateVerificationDisplay(
        offer.verification.status,
        offer.verification.verifiedAt,
        now
      );
      const merchant = merchantById.get(offer.merchantId);
      return {
        entityType: 'offer',
        entityId: offer.id,
        merchantId: offer.merchantId,
        merchantName: merchant?.name || 'Unknown merchant',
        label: `${merchant?.name || 'Unknown merchant'} — ${offer.plan.name} (${offer.market})`,
        market: offer.market,
        sourceUrl: offer.verification.source,
        verifiedAt: offer.verification.verifiedAt?.toISOString(),
        daysSinceVerified,
        displayStatus,
      };
    });

    const severity: Record<VerificationQueueItem['displayStatus'], number> = { needs_review: 0, stale: 1, current: 2 };
    return [...programItems, ...offerItems].sort((a, b) => {
      const bySeverity = severity[a.displayStatus] - severity[b.displayStatus];
      if (bySeverity !== 0) return bySeverity;
      return (b.daysSinceVerified ?? 0) - (a.daysSinceVerified ?? 0);
    });
  }

  // ---------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------

  private async finishWrite(
    entityType: 'merchant' | 'network' | 'program' | 'offer' | 'placement',
    entityId: string,
    action: 'create' | 'update',
    changedFields: string[],
    actor: AffiliateAdminActor
  ): Promise<void> {
    await invalidateAffiliateCache(this.cache);
    await this.analytics.trackAdminChange({ entityType, entityId, adminId: actor.adminId, action, changedFields });
  }

  private diffFields(before: object, after: object): string[] {
    const beforeRecord = before as Record<string, unknown>;
    const afterRecord = after as Record<string, unknown>;
    const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]);
    const changed: string[] = [];
    for (const key of keys) {
      if (key === 'updatedAt' || key === 'createdAt' || key === 'id') continue;
      if (JSON.stringify(beforeRecord[key]) !== JSON.stringify(afterRecord[key])) changed.push(key);
    }
    return changed;
  }

  private isSafeUrl(rawUrl: string): boolean {
    try {
      return new URL(rawUrl).protocol === 'https:';
    } catch {
      return false;
    }
  }

  private parseOptionalDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private async generateUniqueSlug(
    findBySlug: (candidate: string) => Promise<{ id: string } | null>,
    base: string
  ): Promise<string> {
    const root = this.slugify(base) || 'entity';
    let candidate = root;
    let suffix = 2;
    while (await findBySlug(candidate)) {
      candidate = `${root}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private slugify(value: string): string {
    return normalizeAffiliateText(value)
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}
