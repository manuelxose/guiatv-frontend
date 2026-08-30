/**
 * A commercial entity (streaming provider, retailer, ticketing brand, ...)
 * that offers products/plans through one or more AffiliateProgram rows.
 * `aliases` is what lets any surface resolve a free-text or legacy provider
 * reference ("Movistar+", "M+", "Movistar Plus") to one canonical merchant.
 */
export type AffiliateMerchantCategory =
  | 'streaming'
  | 'smart-tv'
  | 'device'
  | 'ticketing'
  | 'event'
  | 'retail'
  | 'vpn'
  | 'other'
  | (string & {});

export type AffiliateMerchantStatus = 'active' | 'inactive' | 'pending';

export interface AffiliateMerchantProps {
  slug: string;
  /** Stable key used by legacy/static callers (e.g. today's MonetizationOfferConfig.provider.id). */
  canonicalProviderKey: string;
  name: string;
  /** Lowercased, accent-stripped alternate names/spellings resolved to this merchant. */
  aliases: string[];
  logo?: string;
  category: AffiliateMerchantCategory;
  officialUrl: string;
  markets: string[];
  status: AffiliateMerchantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateMerchant extends AffiliateMerchantProps {
  id: string;
}
