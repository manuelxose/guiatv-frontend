import { isSafeAffiliateBaseUrl } from '../../../application/services/AffiliateDestinationValidator';
import { DeepLinkBuildInput, DeepLinkBuildResult, IDeepLinkStrategy } from './types';

/**
 * Today's `destinationUrl` fallback: use the offer's static destination
 * unless an env-managed secret resolves to a full override URL (the same
 * "affiliate URL overrides the public plan URL when configured" behavior
 * `MonetizationService.resolveOutbound` already implements) — the resolver's
 * safety gate re-validates whichever URL wins, regardless of source.
 */
export class DirectUrlStrategy implements IDeepLinkStrategy {
  readonly strategy = 'direct_url' as const;

  build(input: DeepLinkBuildInput): DeepLinkBuildResult {
    if (input.secret && isSafeAffiliateBaseUrl(input.secret)) {
      return { url: input.secret, relationship: 'affiliate_configured' };
    }
    return { url: input.offer.destination.url, relationship: input.program.relationship };
  }
}
