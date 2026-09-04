import { Request, Response } from 'express';
import { MonetizationService, MonetizationQuery } from '../../application/services/MonetizationService';
import { OfferIntent } from '../../application/dto/MonetizationDTO';
import { successResponse } from '../../shared/types/ApiResponse';
import { ValidationError } from '../../shared/errors';

const INTENTS = new Set<OfferIntent>(['cheapest', 'football', 'movies', 'family', 'no-contract', 'premium']);
const FEATURES = new Set(['downloads', 'live', 'sports', 'football', 'family', '4k'] as const);
const SORTS = new Set(['recommended', 'price-asc', 'price-desc', 'provider'] as const);

export class MonetizationController {
  constructor(private readonly monetizationService: MonetizationService) {}

  async getOffers(req: Request, res: Response): Promise<void> {
    const query: MonetizationQuery = {
      market: this.optionalString(req.query.market),
      intent: this.parseEnum(req.query.intent, INTENTS, 'intent'),
      features: this.parseFeatures(req.query.features),
      maxMonthlyPrice: this.parsePrice(req.query.maxMonthlyPrice),
      sort: this.parseEnum(req.query.sort, SORTS, 'sort'),
    };
    res.status(200).json(successResponse(await this.monetizationService.listOffers(query)));
  }

  async go(req: Request, res: Response): Promise<void> {
    const providerId = String(req.params.providerId || '');
    const offerId = String(req.params.offerId || '');
    const placement = this.optionalString(req.query.placement) || 'comparison-card';
    const resolved = await this.monetizationService.trackAndResolveOutbound(providerId, offerId, placement);

    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    res.redirect(302, resolved.destinationUrl);
  }

  private optionalString(input: unknown): string | undefined {
    return typeof input === 'string' && input.trim() ? input.trim() : undefined;
  }

  private parseEnum<T extends string>(input: unknown, allowed: Set<T>, field: string): T | undefined {
    const value = this.optionalString(input);
    if (!value) return undefined;
    if (!allowed.has(value as T)) {
      throw new ValidationError(`Invalid ${field}`, [{ field, message: `${field} is not supported`, value }]);
    }
    return value as T;
  }

  private parseFeatures(input: unknown): MonetizationQuery['features'] {
    if (input === undefined) return undefined;
    const values = String(input).split(',').map((value) => value.trim()).filter(Boolean);
    const invalid = values.find((value) => !FEATURES.has(value as never));
    if (invalid) {
      throw new ValidationError('Invalid features', [{ field: 'features', message: 'Feature is not supported', value: invalid }]);
    }
    return values as MonetizationQuery['features'];
  }

  private parsePrice(input: unknown): number | undefined {
    if (input === undefined) return undefined;
    const value = Number(input);
    if (!Number.isFinite(value) || value < 0 || value > 1000) {
      throw new ValidationError('Invalid maxMonthlyPrice', [{ field: 'maxMonthlyPrice', message: 'Price must be between 0 and 1000', value: input }]);
    }
    return value;
  }
}

