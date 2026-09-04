import { AffiliateNetworkTrackingType } from '@/domain/entities/AffiliateNetwork';
import { CommercialRelationship } from '../dto/MonetizationDTO';
import { KNOWN_AFFILIATE_PLACEMENT_KEYS } from '@/domain/entities/AffiliatePlacement';

/**
 * Data feeding the one-time migration from `monetizationOffers.ts` (static
 * array) to the persistent Affiliate Engine domain (see
 * docs/affiliate-engine-architecture.md §19). Kept separate from the
 * migration/seed logic itself so provider-specific knowledge (aliases,
 * network placeholders) lives as data, not branches in resolver/service code.
 */

/**
 * One AffiliateNetwork placeholder per distinct commercial-relationship shape
 * seen in the static data today. All `trackingType: 'direct'` because none of
 * the current 10 offers use a network redirect/template/tag mechanism yet —
 * future providers on a real network register their own row instead of
 * reusing these.
 */
export const AFFILIATE_NETWORK_SEED: Array<{
  slug: string;
  name: string;
  trackingType: AffiliateNetworkTrackingType;
  markets: string[];
}> = [
  { slug: 'direct', name: 'Direct commercial link', trackingType: 'direct', markets: ['ES'] },
  { slug: 'manual-agreement-pending', name: 'Manual agreement pending', trackingType: 'direct', markets: ['ES'] },
  { slug: 'no-affiliate-network', name: 'No affiliate program available', trackingType: 'direct', markets: ['ES'] },
];

/** Maps a static offer's `defaultRelationship` to the network placeholder that represents it. */
export const RELATIONSHIP_TO_NETWORK_SLUG: Record<CommercialRelationship, string> = {
  direct_commercial_link: 'direct',
  manual_agreement_required: 'manual-agreement-pending',
  no_affiliate_available: 'no-affiliate-network',
  affiliate_configured: 'direct',
  unknown: 'no-affiliate-network',
};

/**
 * Extra alias spellings per legacy `provider.id`, beyond the provider name
 * itself (always included automatically). Lets `findByAlias` resolve
 * real-world variants like "Movistar+" / "M+" / "Movistar Plus" to one
 * canonical merchant.
 */
export const MERCHANT_ALIAS_OVERRIDES: Record<string, string[]> = {
  netflix: ['netflix'],
  'prime-video': ['amazon prime video', 'amazon prime', 'prime video', 'amazonprime'],
  'disney-plus': ['disney plus', 'disneyplus', 'disney+'],
  max: ['hbo max', 'hbo'],
  'movistar-plus': ['movistar+', 'm+', 'movistar plus', 'movistar plus+'],
  skyshowtime: ['sky showtime', 'skyshowtime'],
  'apple-tv-plus': ['apple tv+', 'appletv+', 'apple tv plus', 'apple tv'],
  filmin: ['filmin'],
  atresplayer: ['atres player', 'antena3player'],
  'rtve-play': ['rtve', 'rtve play'],
  'pluto-tv': ['plutotv', 'pluto'],
};

/**
 * Placement lookup rows for every canonical key named in the Affiliate
 * Engine brief, plus the legacy strings the pre-migration `PLACEMENTS` Set in
 * `MonetizationService.ts` accepted — mapped 1:1 per
 * docs/affiliate-engine-architecture.md §20 so old query strings keep
 * resolving during the migration period.
 */
export const AFFILIATE_PLACEMENT_SEED: Array<{
  key: string;
  page: string;
  description: string;
  enabled: boolean;
  legacyKeys?: string[];
}> = KNOWN_AFFILIATE_PLACEMENT_KEYS.map((key) => ({
  key,
  page: key,
  description: `Affiliate placement: ${key}`,
  enabled: true,
  ...(key === 'streaming-comparison'
    ? { legacyKeys: ['comparison-card', 'comparison-table', 'comparison-selection'] }
    : key === 'catalog-detail'
    ? { legacyKeys: ['content-detail'] }
    : {}),
}));
