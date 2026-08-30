import { DeepLinkBuildInput, DeepLinkBuildResult, DeepLinkStrategyUnavailableError, fillTemplate, IDeepLinkStrategy } from './types';

/**
 * Generic path-template / query-parameter substitution. Covers both
 * "URL_TEMPLATE" (a merchant-specific path shape) and "QUERY_PARAMETER"
 * (a tracking id appended as one more query param) from the brief — both are
 * the same mechanism (fill `{token}` placeholders in `offer.destination.template`
 * from `offer.destination.params` plus `{secret}`/`{clickId}`), so one
 * adapter serves both without the resolver needing to distinguish them.
 */
export class UrlTemplateStrategy implements IDeepLinkStrategy {
  readonly strategy = 'url_template' as const;

  build(input: DeepLinkBuildInput): DeepLinkBuildResult {
    const template = input.offer.destination.template;
    if (!template) {
      throw new DeepLinkStrategyUnavailableError('missing_template', 'url_template strategy requires offer.destination.template');
    }
    if (!input.secret) {
      throw new DeepLinkStrategyUnavailableError('missing_secret', 'url_template strategy requires a resolved secret');
    }

    const url = fillTemplate(template, {
      ...(input.offer.destination.params || {}),
      secret: input.secret,
      clickId: input.clickId,
      market: input.context.market,
    });

    return { url, relationship: 'affiliate_configured' };
  }
}
