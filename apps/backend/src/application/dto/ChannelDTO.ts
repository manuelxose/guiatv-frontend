// src/v2/application/dto/ChannelDTO.ts

import type {
  CanonicalChannelCapabilities,
  CanonicalChannelAccess,
  CanonicalChannelContentFacet,
  CanonicalChannelDistribution,
  CanonicalChannelMarket,
  CanonicalChannelProvenance,
  CanonicalChannelQuality,
} from '@/shared/utils/tvMetadata';

/**
 * Serializable representation of a channel for API responses.
 */
export interface ChannelDTO {
  id: string;
  name: string;
  normalizedName: string;
  icon: string | null;
  type: string;
  aliases?: string[];
  sourceIds?: string[];
  country?: string;
  countryCode?: string;
  region?: string;
  description?: string;
  distribution?: CanonicalChannelDistribution;
  access?: CanonicalChannelAccess;
  operator?: string;
  providers?: string[];
  contentFacets?: CanonicalChannelContentFacet[];
  market?: CanonicalChannelMarket;
  quality?: CanonicalChannelQuality;
  capabilities?: CanonicalChannelCapabilities;
  provenance?: CanonicalChannelProvenance;
  isActive: boolean;
}

/**
 * Paginated response shape for lists of channels.
 */
export interface ChannelListDTO {
  channels: ChannelDTO[];
  meta: {
    total: number;
    page?: number;
    limit?: number;
  };
}
