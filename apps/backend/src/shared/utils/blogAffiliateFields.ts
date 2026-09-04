/**
 * Pure normalization for the editorial-monetization fields on BlogPost (see
 * docs/affiliate-engine-architecture.md §15 and BlogController). Kept
 * separate from BlogController the same way `affiliateOfferValidity.ts` /
 * `affiliateRanking.ts` / `affiliateText.ts` were pulled out of the
 * Affiliate Engine services — deterministic, DB-free logic that's worth unit
 * testing on its own rather than only indirectly through a controller.
 */

export type BlogAffiliatePlacementMode = 'auto' | 'manual' | 'off';

export const BLOG_AFFILIATE_PLACEMENT_MODES: ReadonlySet<BlogAffiliatePlacementMode> = new Set([
  'auto',
  'manual',
  'off',
]);

/**
 * 'auto' = resolve contextually from relatedPlatformKeys/relatedMerchantKeys/relatedOfferCategories
 * (plus any manualAffiliateOfferIds pinned ahead of the ranking).
 * 'manual' = show only manualAffiliateOfferIds, never the automatic candidate search.
 * 'off' = no affiliate block on this post at all, regardless of any other field.
 * Unknown/missing input falls back to 'auto' — the safe default for posts written before this field existed.
 */
export function normalizeAffiliatePlacementMode(
  value: unknown,
  fallback?: BlogAffiliatePlacementMode
): BlogAffiliatePlacementMode {
  if (value === undefined) {
    return fallback ?? 'auto';
  }
  const normalized = String(value || '').trim().toLowerCase();
  return BLOG_AFFILIATE_PLACEMENT_MODES.has(normalized as BlogAffiliatePlacementMode)
    ? (normalized as BlogAffiliatePlacementMode)
    : fallback ?? 'auto';
}

/**
 * Lowercased, deduped, order-preserving list — used for `relatedOfferCategories`
 * (AffiliateOfferCategory is intentionally open-ended, see AffiliateOffer.ts,
 * so this never allowlists specific values) and `relatedMerchantKeys` (merchant
 * slugs/aliases, resolved the same way `providerKeys` already is elsewhere).
 */
export function normalizeLowercaseKeys(input: string[] | string | undefined, fallback?: string[]): string[] {
  if (input === undefined) {
    return Array.isArray(fallback) ? [...fallback] : [];
  }
  const list = Array.isArray(input) ? input : String(input || '').split(',').map((value) => value.trim());
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of list) {
    const normalized = String(raw || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

/**
 * Trimmed, deduped, order-preserving Mongo id list — used for
 * `manualAffiliateOfferIds`. Case is preserved (unlike `normalizeLowercaseKeys`):
 * these are opaque AffiliateOffer ids, not free-text keys.
 */
export function normalizeOfferIds(input: string[] | string | undefined, fallback?: string[]): string[] {
  if (input === undefined) {
    return Array.isArray(fallback) ? [...fallback] : [];
  }
  const list = Array.isArray(input) ? input : String(input || '').split(',').map((value) => value.trim());
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of list) {
    const normalized = String(raw || '').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}
