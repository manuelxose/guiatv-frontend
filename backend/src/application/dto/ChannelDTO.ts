// src/v2/application/dto/ChannelDTO.ts

export interface ChannelDTO {
  id: string;
  name: string;
  normalizedName: string;
  icon: string | null;
  type: string;
  region?: string;
  isActive: boolean;
}

export interface ChannelListDTO {
  channels: ChannelDTO[];
  meta: {
    total: number;
    page?: number;
    limit?: number;
  };
}
