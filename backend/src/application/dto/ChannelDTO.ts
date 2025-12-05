// src/v2/application/dto/ChannelDTO.ts

/**
 * Serializable representation of a channel for API responses.
 */
export interface ChannelDTO {
  id: string;
  name: string;
  normalizedName: string;
  icon: string | null;
  type: string;
  country?: string;
  countryCode?: string;
  region?: string;
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
