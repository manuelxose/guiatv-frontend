import { CatalogItem } from '../services/catalog.service';
import { TvReadItemDTO } from '../api/models';
import { computeProgress, isTvReadItem, normalizeCategory, normalizeToCard } from './tv-normalizers';

describe('tv-normalizers', () => {
  it('detects TvRead items with the type guard', () => {
    expect(isTvReadItem(makeTvItem())).toBeTrue();
    expect(
      isTvReadItem({
        catalogId: 'tmdb:movie:1',
        source: 'tmdb',
        contentType: 'movie',
        title: 'Movie',
        genres: [],
        primaryPlatforms: [],
      } as CatalogItem)
    ).toBeFalse();
  });

  it('normalizes TV items into unified card data with live badges and progress', () => {
    const start = '2026-03-26T20:00:00.000Z';
    const end = '2026-03-26T22:00:00.000Z';
    const tvItem = makeTvItem({ start, end, liveNow: true, editorialCategory: 'Deportes', sportFacet: 'Fútbol' });

    const normalized = normalizeToCard(tvItem);

    expect(normalized.title).toBe('Partido estelar');
    expect(normalized.contentType).toBe('program');
    expect(normalized.channelName).toBe('La 1');
    expect(normalized.channelId).toBe('la-1');
    expect(normalized.channelPath).toBe('/canales/la-1');
    expect(normalized.badges).toContain('LIVE');
    expect(normalized.badges).toContain('Fútbol');
    expect(normalized.badges).toContain('Deportes');
    expect(normalized.detailPath).toContain('/programas/');
    expect(
      computeProgress(start, end, new Date('2026-03-26T21:00:00.000Z'))
    ).toBe(50);
  });

  it('normalizes catalog items with graceful fallbacks', () => {
    const catalogItem: CatalogItem = {
      catalogId: 'tmdb:movie:55',
      source: 'tmdb',
      contentType: 'movie',
      title: 'La película',
      genres: ['Drama'],
      primaryPlatforms: ['Netflix'],
      liveNow: false,
      image: '',
      backdrop: 'https://img.example.com/backdrop.jpg',
    };

    const normalized = normalizeToCard(catalogItem);

    expect(normalized.contentType).toBe('movie');
    expect(normalized.image).toBe('https://img.example.com/backdrop.jpg');
    expect(normalized.badges).toContain('Netflix');
    expect(normalized.badges).toContain('Película');
    expect(normalized.detailPath).toContain('/peliculas/');
  });

  it('normalizes editorial labels consistently', () => {
    expect(normalizeCategory('película romántica')).toBe('Cine');
    expect(normalizeCategory('serie de suspense')).toBe('Series');
    expect(normalizeCategory('fútbol internacional')).toBe('Deportes');
    expect(normalizeCategory('')).toBe('Contenido');
  });
});

function makeTvItem(overrides: {
  start?: string;
  end?: string;
  liveNow?: boolean;
  editorialCategory?: string;
  sportFacet?: TvReadItemDTO['program']['sportFacet'];
} = {}): TvReadItemDTO {
  return {
    id: 'airing-1',
    channel: {
      id: 'la-1',
      name: 'La 1',
      icon: 'https://img.example.com/channel.png',
      sortOrder: 1,
      type: 'TDT',
      group: 'tdt',
    },
    program: {
      brandKey: 'brand-1',
      title: 'Partido estelar',
      normalizedTitle: 'partido estelar',
      titleAliases: [],
      editorialCategory: overrides.editorialCategory || 'Deportes',
      sportFacet: overrides.sportFacet,
      genre: 'Deportes',
      description: 'Evento en directo',
      isResolvedTitle: true,
    },
    airing: {
      id: 'airing-1',
      date: '20260326',
      start: overrides.start || '2026-03-26T20:00:00.000Z',
      end: overrides.end || '2026-03-26T22:00:00.000Z',
      durationMinutes: 120,
      liveNow: overrides.liveNow ?? false,
      partOfDay: 'noche',
      timeSlotKey: 'prime',
    },
    assets: {
      fallbackChain: [],
      poster: {
        kind: 'poster',
        role: 'primary',
        source: 'tmdb',
        url: 'https://img.example.com/poster.jpg',
      },
      channelLogo: {
        kind: 'channelLogo',
        role: 'primary',
        source: 'channel',
        url: 'https://img.example.com/channel.png',
      },
    },
    availability: {
      live: true,
      catchup: false,
      streaming: false,
    },
    sourceProvenance: {
      schedule: [],
      metadata: [],
      assets: [],
    },
    timingContext: {
      liveNow: overrides.liveNow ?? false,
    },
    relevance: {
      score: 1,
      reason: 'test',
    },
  };
}
