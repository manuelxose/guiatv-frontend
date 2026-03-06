export type CatalogSource = 'program' | 'tmdb';
export type CatalogContentType = 'movie' | 'series' | 'program';
export type CatalogAvailability =
  | 'live'
  | 'streaming'
  | 'free'
  | 'flatrate'
  | 'rent'
  | 'buy';

export interface CatalogPlatformDTO {
  key: string;
  name: string;
  tmdbProviderId: number;
  color: string;
  logoUrl?: string;
  supportedAvailability: CatalogAvailability[];
}

export interface CatalogProviderDTO {
  id: number;
  name: string;
  logoUrl: string;
  type: 'flatrate' | 'rent' | 'buy' | 'free';
  price?: string;
  deepLink?: string;
}

export interface CatalogChannelDTO {
  id: string;
  name: string;
  icon?: string;
}

export interface CatalogAiringDTO {
  channelId: string;
  channelName: string;
  channelIcon?: string;
  start: string;
  end: string;
}

export interface CatalogUserInteractionDTO {
  status?: string;
  rating?: number;
  liked?: boolean;
  inWatchlist: boolean;
  lists: string[];
  watchedAt?: string;
}

export interface CatalogWhereToWatchDTO {
  flatrate: CatalogProviderDTO[];
  rent: CatalogProviderDTO[];
  buy: CatalogProviderDTO[];
  free: CatalogProviderDTO[];
  tmdbLink: string;
}

export interface CatalogItemDTO {
  catalogId: string;
  source: CatalogSource;
  contentType: CatalogContentType;
  title: string;
  subtitle?: string;
  synopsis?: string;
  image?: string;
  backdrop?: string;
  genres: string[];
  tmdbId?: number;
  rating?: number;
  releaseYear?: number;
  durationMinutes?: number;
  start?: string;
  end?: string;
  liveNow?: boolean;
  primaryPlatforms: string[];
  whereToWatch?: CatalogWhereToWatchDTO;
  channel?: CatalogChannelDTO;
  airings?: CatalogAiringDTO[];
  userInteraction?: CatalogUserInteractionDTO;
}

export interface CatalogDetailDTO extends CatalogItemDTO {
  cast?: Array<{ name: string; character?: string; profile?: string }>;
  director?: string;
  related?: CatalogItemDTO[];
  socialSummary?: {
    friendsWhoWatched: number;
    avgFriendRating?: number;
  };
}

export interface CatalogQueryResultDTO {
  items: CatalogItemDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  availableGenres: string[];
  availablePlatforms: CatalogPlatformDTO[];
}

export interface CatalogSuggestionDTO {
  catalogId: string;
  source: CatalogSource;
  contentType: CatalogContentType;
  title: string;
  subtitle?: string;
  image?: string;
  primaryPlatforms: string[];
}

export const CATALOG_PLATFORM_REGISTRY: CatalogPlatformDTO[] = [
  {
    key: 'netflix',
    name: 'Netflix',
    tmdbProviderId: 8,
    color: '#E50914',
    supportedAvailability: ['streaming', 'flatrate'],
  },
  {
    key: 'prime-video',
    name: 'Prime Video',
    tmdbProviderId: 119,
    color: '#00A8E1',
    supportedAvailability: ['streaming', 'flatrate', 'rent', 'buy'],
  },
  {
    key: 'disney-plus',
    name: 'Disney+',
    tmdbProviderId: 337,
    color: '#113CCF',
    supportedAvailability: ['streaming', 'flatrate'],
  },
  {
    key: 'max',
    name: 'Max',
    tmdbProviderId: 1899,
    color: '#2962FF',
    supportedAvailability: ['streaming', 'flatrate'],
  },
  {
    key: 'movistar-plus',
    name: 'Movistar+',
    tmdbProviderId: 149,
    color: '#00C6FF',
    supportedAvailability: ['streaming', 'flatrate'],
  },
  {
    key: 'skyshowtime',
    name: 'SkyShowtime',
    tmdbProviderId: 1773,
    color: '#1D9BF0',
    supportedAvailability: ['streaming', 'flatrate'],
  },
  {
    key: 'apple-tv-plus',
    name: 'Apple TV+',
    tmdbProviderId: 350,
    color: '#A3A3A3',
    supportedAvailability: ['streaming', 'flatrate', 'rent', 'buy'],
  },
  {
    key: 'filmin',
    name: 'Filmin',
    tmdbProviderId: 63,
    color: '#00D1B2',
    supportedAvailability: ['streaming', 'flatrate'],
  },
  {
    key: 'rtve-play',
    name: 'RTVE Play',
    tmdbProviderId: 541,
    color: '#F59E0B',
    supportedAvailability: ['streaming', 'free'],
  },
  {
    key: 'atresplayer',
    name: 'ATRESplayer',
    tmdbProviderId: 581,
    color: '#F97316',
    supportedAvailability: ['streaming', 'flatrate'],
  },
  {
    key: 'mitele',
    name: 'Mitele',
    tmdbProviderId: 613,
    color: '#EC4899',
    supportedAvailability: ['streaming', 'flatrate'],
  },
  {
    key: 'pluto-tv',
    name: 'Pluto TV',
    tmdbProviderId: 300,
    color: '#9333EA',
    supportedAvailability: ['streaming', 'free'],
  },
  {
    key: 'rakuten-tv',
    name: 'Rakuten TV',
    tmdbProviderId: 35,
    color: '#EF4444',
    supportedAvailability: ['streaming', 'rent', 'buy'],
  },
];

export const CATALOG_PLATFORM_NAME_MAP = new Map(
  CATALOG_PLATFORM_REGISTRY.map((platform) => [platform.name.toLowerCase(), platform])
);
