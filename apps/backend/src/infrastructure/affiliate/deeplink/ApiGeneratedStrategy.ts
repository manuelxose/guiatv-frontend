import { DeepLinkBuildInput, DeepLinkBuildResult, DeepLinkStrategyUnavailableError, IDeepLinkStrategy } from './types';

/**
 * Placeholder for a future network-API-backed one-off link generation
 * (e.g. calling out to a network's REST API for a per-click token instead of
 * building the URL locally). Not implemented in Phase 3 — always degrades so
 * the resolver falls back to a safe direct destination rather than breaking
 * the redirect, per the reliability mandate.
 */
export class ApiGeneratedStrategy implements IDeepLinkStrategy {
  readonly strategy = 'api_generated' as const;

  build(_input: DeepLinkBuildInput): DeepLinkBuildResult {
    throw new DeepLinkStrategyUnavailableError(
      'strategy_not_implemented',
      'api_generated strategy requires a network API integration that is not yet implemented'
    );
  }
}
