import {
  CatalogAssetRefDTO,
  CatalogAssetSetDTO,
  CatalogSourceProvenanceDTO,
  CatalogTimingContextDTO,
} from './CatalogDTO';

export type TvReadView = 'now' | 'next' | 'night' | 'day' | 'search';

export interface TvReadChannelDTO {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  sourceIds: string[];
  type: string;
  group: 'tdt' | 'cable' | 'autonomico' | 'movistar' | 'online' | 'deporte';
  subgroups: string[];
  sortOrder: number;
  icon?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  description?: string;
}

export interface TvReadProgramDTO {
  brandKey: string;
  title: string;
  subtitle?: string;
  normalizedTitle: string;
  titleAliases: string[];
  editorialCategory: string;
  genre?: string;
  subgenre?: string;
  sportFacet?: 'Fútbol' | 'Baloncesto' | 'F1' | 'Tenis' | 'MotoGP' | 'Más';
  tmdbId?: number;
  description?: string;
  titleResolutionState?:
    | 'specific_source_title'
    | 'specific_from_registry'
    | 'specific_from_manual_override'
    | 'generic_unresolved'
    | 'generic_suppressed';
  isResolvedTitle?: boolean;
}

export interface TvReadAiringDTO {
  id: string;
  date: string;
  start: string;
  end: string;
  durationMinutes: number;
  liveNow: boolean;
  partOfDay: 'madrugada' | 'manana' | 'tarde' | 'noche';
  timeSlotKey: string;
}

export interface TvReadAvailabilityDTO {
  live: boolean;
  catchup: boolean;
  streaming: boolean;
}

export interface TvReadRelevanceDTO {
  score: number;
  reason: string;
}

export interface TvReadTrustDecisionDTO {
  confidence: 'high' | 'medium' | 'low';
  sourceAgreement: 'merged' | 'primary_only' | 'secondary_only' | 'single_source';
  featuredSuppressed: boolean;
  consumerSuppressed?: boolean;
  suppressionReason?: string;
  reasons: string[];
}

export interface TvReadItemDTO {
  id: string;
  channel: TvReadChannelDTO;
  program: TvReadProgramDTO;
  airing: TvReadAiringDTO;
  assets: CatalogAssetSetDTO;
  availability: TvReadAvailabilityDTO;
  sourceProvenance: CatalogSourceProvenanceDTO;
  timingContext: CatalogTimingContextDTO;
  relevance: TvReadRelevanceDTO;
  trustDecision?: TvReadTrustDecisionDTO;
}

export interface TvReadChannelSummaryDTO {
  channel: TvReadChannelDTO;
  current?: TvReadItemDTO;
  next?: TvReadItemDTO;
  tonight?: TvReadItemDTO[];
  counts: {
    total: number;
    live: number;
    tonight: number;
  };
}

export interface TvReadResponseDTO {
  date: string;
  view: TvReadView;
  items: TvReadItemDTO[];
  channels: TvReadChannelSummaryDTO[];
  filters: {
    group?: string;
    category?: string;
    sport?: string;
    channelId?: string;
    q?: string;
  };
  meta: {
    total: number;
    limit: number;
    nextCursor?: string;
    cached?: boolean;
    generatedAt: string;
  };
}

export interface TvReadChannelsResponseDTO {
  date: string;
  group?: string;
  channels: TvReadChannelSummaryDTO[];
  meta: {
    total: number;
    cached?: boolean;
    generatedAt: string;
  };
}

export interface TvReadItemResponseDTO {
  item: TvReadItemDTO;
  relatedChannelItems: TvReadItemDTO[];
  meta: {
    cached?: boolean;
    generatedAt: string;
  };
}

export type TvReadAssetRefDTO = CatalogAssetRefDTO;
export type TvReadAssetSetDTO = CatalogAssetSetDTO;
