import { AffiliateDeepLinkStrategy } from '@/domain/entities/AffiliateOffer';
import { IDeepLinkStrategy } from './types';
import { DirectUrlStrategy } from './DirectUrlStrategy';
import { UrlTemplateStrategy } from './UrlTemplateStrategy';
import { NetworkRedirectStrategy } from './NetworkRedirectStrategy';
import { AmazonTagStrategy } from './AmazonTagStrategy';
import { ApiGeneratedStrategy } from './ApiGeneratedStrategy';

/**
 * The only place that knows which concrete adapter handles which
 * `AffiliateOffer.destination.strategy`. `AffiliateResolverService` looks up
 * a strategy by key and calls `.build()` — it never imports, names, or
 * branches on Amazon/AWIN/Partnerize/any concrete adapter itself. Adding a
 * network never touches the resolver, only this registry (and, for a truly
 * new mechanism, one new adapter file).
 */
export class DeepLinkStrategyRegistry {
  private readonly strategies = new Map<AffiliateDeepLinkStrategy, IDeepLinkStrategy>();

  constructor(strategies: IDeepLinkStrategy[] = DeepLinkStrategyRegistry.defaults()) {
    for (const strategy of strategies) {
      this.strategies.set(strategy.strategy, strategy);
    }
  }

  static defaults(): IDeepLinkStrategy[] {
    return [
      new DirectUrlStrategy(),
      new UrlTemplateStrategy(),
      new NetworkRedirectStrategy(),
      new AmazonTagStrategy(),
      new ApiGeneratedStrategy(),
    ];
  }

  get(strategy: AffiliateDeepLinkStrategy): IDeepLinkStrategy | undefined {
    return this.strategies.get(strategy);
  }
}
