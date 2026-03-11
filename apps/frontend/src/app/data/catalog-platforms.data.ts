import type { CatalogPlatform } from '../services/catalog.service';

export const FALLBACK_CATALOG_PLATFORMS: CatalogPlatform[] = [
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

export function getCatalogPlatformByKey(key: string): CatalogPlatform | undefined {
  return FALLBACK_CATALOG_PLATFORMS.find((platform) => platform.key === key);
}
