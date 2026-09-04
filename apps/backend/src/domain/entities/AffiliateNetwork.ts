/**
 * A commercial network/platform that mediates affiliate tracking for one or
 * more merchants (e.g. AWIN, Amazon Associates, or a merchant's own direct
 * "no network" program). Never stores credentials — only enough identity to
 * pick a deep-link strategy and resolve an env-managed secret at request time.
 */
export type AffiliateNetworkTrackingType =
  | 'direct'
  | 'url_template'
  | 'redirect_endpoint'
  | 'tag_param'
  | 'api';

export type AffiliateNetworkStatus = 'active' | 'paused' | 'inactive';

export interface AffiliateNetworkProps {
  slug: string;
  name: string;
  trackingType: AffiliateNetworkTrackingType;
  markets: string[];
  status: AffiliateNetworkStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateNetwork extends AffiliateNetworkProps {
  id: string;
}
