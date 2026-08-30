import { AffiliateDeepLinkStrategy, AffiliateOffer } from '@/domain/entities/AffiliateOffer';
import { AffiliateProgram } from '@/domain/entities/AffiliateProgram';
import { AffiliateNetwork } from '@/domain/entities/AffiliateNetwork';
import { AffiliateMerchant } from '@/domain/entities/AffiliateMerchant';
import { CommercialRelationship } from '../../../application/dto/MonetizationDTO';
import { AffiliateContext } from '../../../application/dto/AffiliateContext';

/**
 * Everything one deep-link adapter needs to build a candidate destination
 * URL. `secret` is the already-resolved value of
 * `program.attribution.secretRef` read from `process.env` at request time —
 * adapters never read `process.env` themselves and never see the secret's
 * *name*, only its resolved value (or `undefined` when unconfigured).
 */
export interface DeepLinkBuildInput {
  offer: AffiliateOffer;
  program: AffiliateProgram;
  network: AffiliateNetwork;
  merchant: AffiliateMerchant;
  /** Resolved value of program.attribution.secretRef, or undefined if not configured. */
  secret?: string;
  clickId: string;
  context: AffiliateContext;
}

export interface DeepLinkBuildResult {
  url: string;
  relationship: CommercialRelationship;
}

/**
 * Thrown by an adapter when it cannot build a destination (missing secret it
 * requires, unimplemented mechanism, malformed template, ...). The resolver
 * catches this and degrades to a safe direct fallback — it must never
 * propagate as a fatal error. `reason` is a short machine-readable code, safe
 * to log/emit in `affiliate_error` analytics (no secret values, ever).
 */
export class DeepLinkStrategyUnavailableError extends Error {
  constructor(public readonly reason: string, message?: string) {
    super(message || reason);
    this.name = 'DeepLinkStrategyUnavailableError';
  }
}

/**
 * One isolated tracking-mechanism implementation. Only this file (and its
 * siblings) may know how a particular network's URLs are shaped — the
 * resolver only ever calls `.build()` through the registry and never
 * branches on which concrete strategy it got.
 */
export interface IDeepLinkStrategy {
  readonly strategy: AffiliateDeepLinkStrategy;
  build(input: DeepLinkBuildInput): DeepLinkBuildResult;
}

/** Fills `{token}` placeholders in a template from a flat string map. Unknown tokens are left untouched. */
export function fillTemplate(template: string, tokens: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = tokens[key];
    return value !== undefined && value !== '' ? encodeURIComponent(value) : match;
  });
}

/** Appends query params to a URL without clobbering an existing query string. */
export function appendQueryParams(baseUrl: string, params: Record<string, string | undefined>): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  }
  return url.toString();
}
