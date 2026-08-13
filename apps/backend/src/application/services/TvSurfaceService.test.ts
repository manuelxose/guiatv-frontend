import test from 'node:test';
import assert from 'node:assert/strict';
import { TvSurfaceService } from './TvSurfaceService';
import { TvReadItemDTO } from '../dto/TvReadDTO';

function buildItem(
  id: string,
  channelId: string,
  sortOrder: number,
  title: string,
  options: {
    liveNow?: boolean;
    poster?: string;
    tmdbId?: number;
    score?: number;
    start?: string;
    end?: string;
  } = {}
): TvReadItemDTO {
  return {
    id,
    channel: {
      id: channelId,
      name: channelId.toUpperCase(),
      normalizedName: channelId,
      aliases: [channelId],
      sourceIds: [channelId],
      type: 'TDT',
      group: 'tdt',
      subgroups: ['tdt'],
      sortOrder,
      icon: `/logos/${channelId}.webp`,
    },
    program: {
      brandKey: title.toLowerCase().replace(/\s+/g, '_'),
      title,
      normalizedTitle: title.toLowerCase(),
      titleAliases: [title.toLowerCase()],
      editorialCategory: 'Otros',
      genre: undefined,
      subgenre: undefined,
      tmdbId: options.tmdbId,
      description: undefined,
    },
    airing: {
      id,
      date: '20260326',
      start: options.start || '2026-03-26T10:00:00.000Z',
      end: options.end || '2026-03-26T11:00:00.000Z',
      durationMinutes: 60,
      liveNow: options.liveNow ?? true,
      partOfDay: 'manana',
      timeSlotKey: '10:00',
    },
    assets: {
      primary: options.poster
        ? { kind: 'poster', role: 'primary', source: 'tmdb_poster', url: options.poster }
        : undefined,
      poster: options.poster
        ? { kind: 'poster', role: 'primary', source: 'tmdb_poster', url: options.poster }
        : undefined,
      backdrop: undefined,
      channelLogo: {
        kind: 'channelLogo',
        role: 'fallback',
        source: 'channel_icon',
        url: `/logos/${channelId}.webp`,
      },
      platformLogo: undefined,
      fallbackChain: [],
    },
    availability: {
      live: true,
      catchup: false,
      streaming: false,
    },
    sourceProvenance: {
      schedule: ['epg'],
      metadata: options.tmdbId ? ['tmdb'] : [],
      assets: options.poster ? ['tmdb_poster'] : ['channel_icon'],
    },
    timingContext: {
      start: options.start || '2026-03-26T10:00:00.000Z',
      end: options.end || '2026-03-26T11:00:00.000Z',
      liveNow: options.liveNow ?? true,
      window: 'today',
    },
    relevance: {
      score: options.score ?? 0,
      reason: 'test',
    },
    trustDecision: {
      confidence: 'high',
      sourceAgreement: 'single_source',
      featuredSuppressed: false,
      reasons: [],
    },
  };
}

test('TvSurfaceService guide surface deduplicates current items per channel', async () => {
  const duplicateWithoutPoster = buildItem('dmax-a', 'dmax', 10, 'Alienígenas', {
    liveNow: true,
    score: 5,
  });
  const duplicateWithPoster = buildItem('dmax-b', 'dmax', 10, 'La fiebre del oro', {
    liveNow: true,
    poster: 'https://img/poster.jpg',
    tmdbId: 1,
    score: 10,
  });
  const otherChannel = buildItem('la2-a', 'la_2', 1, 'Le llamaban Calamidad', {
    liveNow: true,
    poster: 'https://img/movie.jpg',
    tmdbId: 2,
    score: 20,
  });

  let queryCalls = 0;
  const tvReadQueryService = {
    query: async () => {
      queryCalls += 1;
      return ({
      date: '20260326',
      view: 'day',
      items: [otherChannel, duplicateWithoutPoster, duplicateWithPoster],
      channels: [
        { channel: otherChannel.channel, current: otherChannel, next: undefined, tonight: [], counts: { total: 1, live: 1, tonight: 0 } },
        { channel: duplicateWithPoster.channel, current: duplicateWithPoster, next: undefined, tonight: [], counts: { total: 2, live: 1, tonight: 0 } },
      ],
      filters: { group: 'tdt' },
      meta: { total: 3, limit: 5000, generatedAt: new Date().toISOString() },
      });
    },
    getGroupChannelCounts: async () => ({ tdt: 2, cable: 4 }),
    getChannels: async () => ({ channels: [] }),
    getChannelDetail: async () => ({
      date: '20260326',
      view: 'day',
      items: [duplicateWithoutPoster, duplicateWithPoster],
      channels: [],
      filters: {},
      meta: { total: 2, limit: 1000, generatedAt: new Date().toISOString() },
    }),
  } as any;

  const cacheRepository = {
    get: async () => null,
    set: async () => undefined,
  } as any;

  const service = new TvSurfaceService(tvReadQueryService, cacheRepository);
  const surface = await service.getGuideSurface({ date: 'today', group: 'tdt' });

  assert.equal(surface.nowItems.length, 2);
  assert.equal(surface.nowItems.find((item) => item.channel.id === 'dmax')?.program.title, 'La fiebre del oro');
  assert.equal(queryCalls, 1);
  assert.deepEqual(surface.meta.groupCounts, { tdt: 2, cable: 4 });
});
