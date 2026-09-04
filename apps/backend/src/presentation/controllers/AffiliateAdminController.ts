import { Request, Response } from 'express';
import { AffiliateAdminService } from '../../application/services/AffiliateAdminService';
import { AffiliateAdminAnalyticsService } from '../../application/services/AffiliateAdminAnalyticsService';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { successResponse } from '../../shared/types/ApiResponse';
import { ValidationError } from '../../shared/errors';
import {
  MerchantAdminInput,
  NetworkAdminInput,
  OfferAdminInput,
  PlacementAdminInput,
  ProgramAdminInput,
} from '../../application/dto/AffiliateAdminDTO';

/**
 * Phase 9 commercial-configuration admin surface, mounted at
 * `/v2/admin/affiliate/*` behind `createAdminAccessGuard` (see
 * `admin-affiliate.routes.ts`) — every method here assumes the caller has
 * already been authorized as an admin.
 */
export class AffiliateAdminController {
  constructor(
    private readonly adminService: AffiliateAdminService,
    private readonly analyticsService: AffiliateAdminAnalyticsService
  ) {}

  // Merchants ---------------------------------------------------------

  async listMerchants(req: Request, res: Response): Promise<void> {
    const { status, category, market, search } = req.query;
    const merchants = await this.adminService.listMerchants({
      status: this.str(status) as any,
      category: this.str(category),
      market: this.str(market),
      search: this.str(search),
    });
    res.json(successResponse({ merchants }));
  }

  async getMerchant(req: Request, res: Response): Promise<void> {
    const merchant = await this.adminService.getMerchant(req.params.id);
    res.json(successResponse({ merchant }));
  }

  async createMerchant(req: Request, res: Response): Promise<void> {
    const merchant = await this.adminService.createMerchant(this.parseMerchantInput(req.body), this.actor(req));
    res.status(201).json(successResponse({ merchant }));
  }

  async updateMerchant(req: Request, res: Response): Promise<void> {
    const merchant = await this.adminService.updateMerchant(req.params.id, this.parseMerchantInput(req.body), this.actor(req));
    res.json(successResponse({ merchant }));
  }

  // Networks ------------------------------------------------------------

  async listNetworks(req: Request, res: Response): Promise<void> {
    const { status, market } = req.query;
    const networks = await this.adminService.listNetworks({ status: this.str(status) as any, market: this.str(market) });
    res.json(successResponse({ networks }));
  }

  async getNetwork(req: Request, res: Response): Promise<void> {
    const network = await this.adminService.getNetwork(req.params.id);
    res.json(successResponse({ network }));
  }

  async createNetwork(req: Request, res: Response): Promise<void> {
    const network = await this.adminService.createNetwork(this.parseNetworkInput(req.body), this.actor(req));
    res.status(201).json(successResponse({ network }));
  }

  async updateNetwork(req: Request, res: Response): Promise<void> {
    const network = await this.adminService.updateNetwork(req.params.id, this.parseNetworkInput(req.body), this.actor(req));
    res.json(successResponse({ network }));
  }

  // Programs --------------------------------------------------------------

  async listPrograms(req: Request, res: Response): Promise<void> {
    const { merchantId, networkId, market, status } = req.query;
    const programs = await this.adminService.listPrograms({
      merchantId: this.str(merchantId),
      networkId: this.str(networkId),
      market: this.str(market),
      status: this.str(status) as any,
    });
    res.json(successResponse({ programs }));
  }

  async getProgram(req: Request, res: Response): Promise<void> {
    const program = await this.adminService.getProgram(req.params.id);
    res.json(successResponse({ program }));
  }

  async createProgram(req: Request, res: Response): Promise<void> {
    const program = await this.adminService.createProgram(this.parseProgramInput(req.body), this.actor(req));
    res.status(201).json(successResponse({ program }));
  }

  async updateProgram(req: Request, res: Response): Promise<void> {
    const program = await this.adminService.updateProgram(req.params.id, this.parseProgramInput(req.body), this.actor(req));
    res.json(successResponse({ program }));
  }

  // Offers ------------------------------------------------------------------

  async listOffers(req: Request, res: Response): Promise<void> {
    const { merchantId, affiliateProgramId, market, status, category, limit, skip } = req.query;
    const { items, total } = await this.adminService.listOffers({
      merchantId: this.str(merchantId),
      affiliateProgramId: this.str(affiliateProgramId),
      market: this.str(market),
      status: this.str(status) as any,
      category: this.str(category),
      limit: this.optionalInt(limit),
      skip: this.optionalInt(skip),
    });
    res.json(successResponse({ offers: items, total }));
  }

  async getOffer(req: Request, res: Response): Promise<void> {
    const offer = await this.adminService.getOffer(req.params.id);
    res.json(successResponse({ offer }));
  }

  async createOffer(req: Request, res: Response): Promise<void> {
    const offer = await this.adminService.createOffer(this.parseOfferInput(req.body), this.actor(req));
    res.status(201).json(successResponse({ offer }));
  }

  async updateOffer(req: Request, res: Response): Promise<void> {
    const offer = await this.adminService.updateOffer(req.params.id, this.parseOfferInput(req.body), this.actor(req));
    res.json(successResponse({ offer }));
  }

  async deactivateOffer(req: Request, res: Response): Promise<void> {
    const offer = await this.adminService.deactivateOffer(req.params.id, this.actor(req));
    res.json(successResponse({ offer }));
  }

  // Placements ------------------------------------------------------------

  async listPlacements(_req: Request, res: Response): Promise<void> {
    const placements = await this.adminService.listPlacements();
    res.json(successResponse({ placements }));
  }

  async createPlacement(req: Request, res: Response): Promise<void> {
    const placement = await this.adminService.createPlacement(this.parsePlacementInput(req.body), this.actor(req));
    res.status(201).json(successResponse({ placement }));
  }

  async updatePlacement(req: Request, res: Response): Promise<void> {
    const body = req.body || {};
    const placement = await this.adminService.updatePlacement(
      req.params.id,
      {
        page: this.requireString(body.page, 'page'),
        description: this.str(body.description),
        enabled: Boolean(body.enabled),
        legacyKeys: this.optionalStringArray(body.legacyKeys),
      },
      this.actor(req)
    );
    res.json(successResponse({ placement }));
  }

  // Verification ------------------------------------------------------------

  async getVerificationQueue(req: Request, res: Response): Promise<void> {
    const items = await this.adminService.getVerificationQueue({ market: this.str(req.query.market) });
    res.json(successResponse({ items }));
  }

  // Analytics -----------------------------------------------------------------

  async getAnalyticsReport(req: Request, res: Response): Promise<void> {
    const report = await this.analyticsService.getReport({
      from: this.str(req.query.from),
      to: this.str(req.query.to),
      limit: this.optionalInt(req.query.limit),
    });
    res.json(successResponse(report));
  }

  // Parsing helpers -----------------------------------------------------------

  private parseMerchantInput(rawBody: unknown): MerchantAdminInput {
    const body = (rawBody || {}) as Record<string, unknown>;
    return {
      name: this.requireString(body.name, 'name'),
      canonicalProviderKey: this.requireString(body.canonicalProviderKey, 'canonicalProviderKey'),
      aliases: this.optionalStringArray(body.aliases) || [],
      category: this.requireString(body.category, 'category') as MerchantAdminInput['category'],
      logo: this.str(body.logo),
      officialUrl: this.requireString(body.officialUrl, 'officialUrl'),
      markets: this.optionalStringArray(body.markets) || [],
      status: (this.str(body.status) as MerchantAdminInput['status']) || 'pending',
    };
  }

  private parseNetworkInput(rawBody: unknown): NetworkAdminInput {
    const body = (rawBody || {}) as Record<string, unknown>;
    return {
      name: this.requireString(body.name, 'name'),
      trackingType: this.requireString(body.trackingType, 'trackingType') as NetworkAdminInput['trackingType'],
      markets: this.optionalStringArray(body.markets) || [],
      status: (this.str(body.status) as NetworkAdminInput['status']) || 'active',
      metadata: typeof body.metadata === 'object' && body.metadata !== null ? (body.metadata as Record<string, unknown>) : undefined,
    };
  }

  private parseProgramInput(rawBody: unknown): ProgramAdminInput {
    const body = (rawBody || {}) as Record<string, unknown>;
    const verification = (body.verification || {}) as Record<string, unknown>;
    const attribution = body.attribution as Record<string, unknown> | undefined;
    const commission = body.commission as Record<string, unknown> | undefined;
    return {
      merchantId: this.requireString(body.merchantId, 'merchantId'),
      networkId: this.requireString(body.networkId, 'networkId'),
      market: this.requireString(body.market, 'market'),
      externalProgramId: this.str(body.externalProgramId),
      relationship: this.requireString(body.relationship, 'relationship') as ProgramAdminInput['relationship'],
      status: (this.str(body.status) as ProgramAdminInput['status']) || 'pending',
      allowedHosts: this.optionalStringArray(body.allowedHosts) || [],
      disclosure: this.requireString(body.disclosure, 'disclosure'),
      commission: commission
        ? {
            type: this.str(commission.type) as any,
            value: typeof commission.value === 'number' ? commission.value : undefined,
            currency: this.str(commission.currency),
            notes: this.str(commission.notes),
          }
        : undefined,
      attribution: attribution
        ? {
            cookieDays: typeof attribution.cookieDays === 'number' ? attribution.cookieDays : undefined,
            clickIdParam: this.str(attribution.clickIdParam),
            secretRef: this.str(attribution.secretRef),
          }
        : undefined,
      verification: {
        source: this.str(verification.source),
        verifiedAt: this.str(verification.verifiedAt),
        status: (this.str(verification.status) as ProgramAdminInput['verification']['status']) || 'pending',
      },
    };
  }

  private parseOfferInput(rawBody: unknown): OfferAdminInput {
    const body = (rawBody || {}) as Record<string, unknown>;
    if (!body.pricing || typeof body.pricing !== 'object') {
      throw new ValidationError('Invalid offer', [{ field: 'pricing', message: 'pricing is required' }]);
    }
    if (!body.plan || typeof body.plan !== 'object') {
      throw new ValidationError('Invalid offer', [{ field: 'plan', message: 'plan is required' }]);
    }
    if (!body.destination || typeof body.destination !== 'object') {
      throw new ValidationError('Invalid offer', [{ field: 'destination', message: 'destination is required' }]);
    }
    const validity = (body.validity || {}) as Record<string, unknown>;
    const verification = (body.verification || {}) as Record<string, unknown>;
    const display = (body.display || {}) as Record<string, unknown>;
    const requirements = (body.requirements || {}) as Record<string, unknown>;
    const trial = (body.trial || {}) as Record<string, unknown>;

    return {
      merchantId: this.requireString(body.merchantId, 'merchantId'),
      affiliateProgramId: this.requireString(body.affiliateProgramId, 'affiliateProgramId'),
      market: this.requireString(body.market, 'market'),
      category: this.requireString(body.category, 'category') as OfferAdminInput['category'],
      plan: body.plan as OfferAdminInput['plan'],
      pricing: body.pricing as OfferAdminInput['pricing'],
      features: (typeof body.features === 'object' && body.features !== null ? body.features : {}) as Record<string, unknown>,
      requirements: {
        commitmentMonths: typeof requirements.commitmentMonths === 'number' ? requirements.commitmentMonths : 0,
        fibreRequired: Boolean(requirements.fibreRequired),
        mobileRequired: Boolean(requirements.mobileRequired),
        device: this.str(requirements.device) || null,
      },
      trial: { days: typeof trial.days === 'number' ? trial.days : null },
      recommendationIntents: this.optionalStringArray(body.recommendationIntents) || [],
      placements: this.optionalStringArray(body.placements),
      destination: body.destination as OfferAdminInput['destination'],
      validity: { validFrom: this.str(validity.validFrom), validUntil: this.str(validity.validUntil) },
      status: (this.str(body.status) as OfferAdminInput['status']) || 'draft',
      verification: {
        source: this.str(verification.source),
        verifiedAt: this.str(verification.verifiedAt),
        status: (this.str(verification.status) as OfferAdminInput['verification']['status']) || 'needs_review',
      },
      display: {
        bestFor: this.str(display.bestFor),
        highlight: this.str(display.highlight),
        disclosure: this.requireString(display.disclosure, 'display.disclosure'),
      },
    };
  }

  private parsePlacementInput(rawBody: unknown): PlacementAdminInput {
    const body = (rawBody || {}) as Record<string, unknown>;
    return {
      key: this.requireString(body.key, 'key'),
      page: this.requireString(body.page, 'page'),
      description: this.str(body.description),
      enabled: Boolean(body.enabled),
      legacyKeys: this.optionalStringArray(body.legacyKeys),
    };
  }

  private actor(req: Request): { adminId: string } {
    const user = (req as AuthenticatedRequest).user;
    return { adminId: user?.id || 'admin-key' };
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new ValidationError(`Invalid request`, [{ field, message: `${field} is required` }]);
    }
    return value.trim();
  }

  private str(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private optionalInt(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : undefined;
  }

  private optionalStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const values = value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim());
    return values;
  }
}
