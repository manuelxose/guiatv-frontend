import { DeepLinkBuildInput, DeepLinkBuildResult, DeepLinkStrategyUnavailableError, IDeepLinkStrategy } from './types';

/**
 * Network-hosted redirect endpoint (the AWIN/Partnerize-style "?url=<encoded
 * target>&clickref=<id>" shape). The resolved secret names the network's
 * ready-to-use redirect base (e.g. "https://track.example-network.com/
 * redirect?id=12345&url=") — this file is the only place that knows redirect
 * endpoints look like this; the resolver just calls `.build()`.
 */
export class NetworkRedirectStrategy implements IDeepLinkStrategy {
  readonly strategy = 'network_redirect' as const;

  build(input: DeepLinkBuildInput): DeepLinkBuildResult {
    if (!input.secret) {
      throw new DeepLinkStrategyUnavailableError('missing_secret', 'network_redirect strategy requires a resolved secret');
    }

    const target = encodeURIComponent(input.offer.destination.url);
    const separator = input.secret.includes('?') ? '&' : '?';
    const hasUrlParam = /[?&]url=/.test(input.secret);
    const base = hasUrlParam ? `${input.secret}${target}` : `${input.secret}${separator}url=${target}`;
    const url = `${base}&clickref=${encodeURIComponent(input.clickId)}`;

    return { url, relationship: 'affiliate_configured' };
  }
}
