/**
 * A generic, data-driven placement (page slot) an affiliate offer can be
 * rendered/linked into. This replaces the brittle, code-level
 * `Set(['comparison-card', ...])` in the legacy MonetizationService — adding
 * a new surface (EPG, football, blog, chatbot, ...) means inserting a row,
 * never editing resolver code.
 */
export interface AffiliatePlacementProps {
  key: string;
  page: string;
  description?: string;
  enabled: boolean;
  /** Legacy placement strings (e.g. 'comparison-card') that resolve to this key during the migration period. */
  legacyKeys?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliatePlacement extends AffiliatePlacementProps {
  id: string;
}

/**
 * Canonical placement keys named in the Affiliate Engine brief. Seeded data,
 * not a runtime allowlist — the resolver must always check the Mongo-backed
 * `AffiliatePlacement` collection (via IAffiliatePlacementRepository), never
 * this array, so new placements never require a code change.
 */
export const KNOWN_AFFILIATE_PLACEMENT_KEYS = [
  'home',
  'epg-program-card',
  'epg-program-detail',
  'channel-page',
  'catalog-card',
  'catalog-detail',
  'where-to-watch',
  'search-result',
  'chatbot-answer',
  'football-match',
  'football-competition',
  'football-home',
  'blog-inline',
  'blog-footer',
  'streaming-comparison',
  'provider-summary',
] as const;

export type KnownAffiliatePlacementKey = (typeof KNOWN_AFFILIATE_PLACEMENT_KEYS)[number];
