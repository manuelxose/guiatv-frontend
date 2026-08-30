import { appendQueryParams, DeepLinkBuildInput, DeepLinkBuildResult, DeepLinkStrategyUnavailableError, IDeepLinkStrategy } from './types';

/**
 * Amazon-Associates-style "append a tracking tag as a query param to a
 * canonical product/storefront URL" mechanism. The resolved secret is the
 * associate tag value only (never a full URL, never an API key) — the base
 * URL is `offer.destination.url`, any static extras (linkCode, camp, ...)
 * come from `offer.destination.params`.
 */
export class AmazonTagStrategy implements IDeepLinkStrategy {
  readonly strategy = 'tag_param' as const;

  build(input: DeepLinkBuildInput): DeepLinkBuildResult {
    if (!input.secret) {
      throw new DeepLinkStrategyUnavailableError('missing_secret', 'tag_param strategy requires a resolved secret');
    }

    const url = appendQueryParams(input.offer.destination.url, {
      ...(input.offer.destination.params || {}),
      tag: input.secret,
    });

    return { url, relationship: 'affiliate_configured' };
  }
}
