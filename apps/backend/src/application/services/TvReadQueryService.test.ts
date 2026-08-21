import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TvReadQueryService,
  applyTvReadTemporalBounds,
  hydrateTvReadItemRuntime,
  isConsumerVisibleTvReadItem,
  isFeaturedTvReadItem,
  normalizeTvReadView,
  resolveTvReadLimit,
  scopeChannelSummariesToPage,
  selectPrimeTimeTvItems,
} from './TvReadQueryService';
import { TvReadItemDTO } from '../dto/TvReadDTO';

test('normalizeTvReadView falls back to day for invalid input', () => {
  assert.equal(normalizeTvReadView('invalid'), 'day');
  assert.equal(normalizeTvReadView(undefined), 'day');
});

test('resolveTvReadLimit bounds day reads for progressive fetching', () => {
  assert.equal(resolveTvReadLimit('day', undefined), 240);
  assert.equal(resolveTvReadLimit('day', 5000), 1000);
  assert.equal(resolveTvReadLimit('day', 99999), 1000);
});

test('resolveTvReadLimit keeps hot paths bounded', () => {
  assert.equal(resolveTvReadLimit('now', 99999), 500);
  assert.equal(resolveTvReadLimit('search', undefined), 60);
  assert.equal(resolveTvReadLimit('night', 1200), 1200);
});

test('applyTvReadTemporalBounds restricts now reads to active airings in Mongo', () => {
  const reference = new Date('2026-03-26T11:00:00.000Z');
  assert.deepEqual(applyTvReadTemporalBounds({ date: '20260326' }, 'now', reference), {
    date: '20260326',
    'airing.start': { $lte: '2026-03-26T11:00:00.000Z' },
    'airing.end': { $gt: '2026-03-26T11:00:00.000Z' },
  });
  assert.deepEqual(applyTvReadTemporalBounds({ date: '20260326' }, 'day', reference), {
    date: '20260326',
  });
});

test('scopeChannelSummariesToPage keeps hot-view payloads aligned with paged items', () => {
  const item = { channel: { id: 'la_1' } } as TvReadItemDTO;
  const summaries = [
    { channel: { id: 'la_1' } },
    { channel: { id: 'la_2' } },
  ] as any;
  assert.deepEqual(scopeChannelSummariesToPage('now', summaries, [item]), [summaries[0]]);
  assert.equal(scopeChannelSummariesToPage('day', summaries, [item]).length, 2);
});

test('hydrateTvReadItemRuntime derives liveNow from request time instead of persisted value', () => {
  const item: TvReadItemDTO = {
    id: '20260326_la_1_20260326113000',
    channel: {
      id: 'la_1',
      name: 'LA 1',
      normalizedName: 'la_1',
      aliases: ['la_1'],
      sourceIds: ['LA1.es'],
      type: 'TDT',
      group: 'tdt',
      subgroups: ['tdt'],
      sortOrder: 0,
    },
    program: {
      brandKey: 'telediario_matinal',
      title: 'Telediario Matinal',
      normalizedTitle: 'telediario matinal',
      titleAliases: ['telediario matinal'],
      editorialCategory: 'Noticias',
    },
    airing: {
      id: '20260326_la_1_20260326113000',
      date: '20260326',
      start: '2026-03-26T10:00:00.000Z',
      end: '2026-03-26T11:00:00.000Z',
      durationMinutes: 60,
      liveNow: false,
      partOfDay: 'manana',
      timeSlotKey: '11:00',
    },
    assets: { fallbackChain: [] },
    availability: {
      live: true,
      catchup: false,
      streaming: false,
    },
    sourceProvenance: {
      schedule: ['primary'],
      metadata: [],
      assets: [],
    },
    timingContext: {
      liveNow: false,
      window: 'today',
      start: '2026-03-26T10:00:00.000Z',
      end: '2026-03-26T11:00:00.000Z',
    },
    relevance: {
      score: 10,
      reason: 'channel_priority',
    },
  };

  const hydrated = hydrateTvReadItemRuntime(item, new Date('2026-03-26T10:30:00.000Z'));
  assert.equal(hydrated.airing.liveNow, true);
  assert.equal(hydrated.timingContext.liveNow, true);
});

test('isFeaturedTvReadItem excludes low-trust suppressed entries from guide surfaces', () => {
  const item = {
    trustDecision: {
      confidence: 'low',
      sourceAgreement: 'primary_only',
      featuredSuppressed: true,
      reasons: ['generic_title'],
    },
  } as TvReadItemDTO;

  assert.equal(isFeaturedTvReadItem(item), false);
});

test('isConsumerVisibleTvReadItem hides generic unresolved movie slots from consumer surfaces', () => {
  const suppressed = {
    program: {
      titleResolutionState: 'generic_unresolved',
    },
    trustDecision: {
      consumerSuppressed: true,
    },
  } as TvReadItemDTO;

  const visible = {
    program: {
      titleResolutionState: 'specific_source_title',
    },
    trustDecision: {
      consumerSuppressed: false,
    },
  } as TvReadItemDTO;

  assert.equal(isConsumerVisibleTvReadItem(suppressed), false);
  assert.equal(isConsumerVisibleTvReadItem(visible), true);
});

test('query now collapses overlapping live rows into one featured item per channel', async () => {
  const tvReadQueryService = new TvReadQueryService({
    get: async () => null,
    set: async () => undefined,
    clear: async () => undefined,
  } as any);

  const baseItem = (title: string, start: string, score: number, withPoster = false): TvReadItemDTO => ({
    id: `id-${title}`,
    channel: {
      id: 'mega',
      name: 'Mega',
      normalizedName: 'mega',
      aliases: ['mega'],
      sourceIds: ['mega'],
      type: 'TDT',
      group: 'tdt',
      subgroups: ['tdt'],
      sortOrder: 8,
    },
    program: {
      brandKey: title.toLowerCase(),
      title,
      normalizedTitle: title.toLowerCase(),
      titleAliases: [title.toLowerCase()],
      editorialCategory: 'Otros',
    },
    airing: {
      id: `id-${title}`,
      date: '20260326',
      start,
      end: '2026-03-26T12:30:00.000Z',
      durationMinutes: 90,
      liveNow: true,
      partOfDay: 'manana',
      timeSlotKey: '11:00',
    },
    assets: withPoster
      ? {
          poster: {
            kind: 'poster',
            role: 'primary',
            source: 'epg_program_image',
            url: 'https://img/poster.jpg',
          },
          fallbackChain: [],
        }
      : { fallbackChain: [] },
    availability: { live: true, catchup: false, streaming: false },
    sourceProvenance: { schedule: ['primary'], metadata: [], assets: [] },
    timingContext: {
      liveNow: true,
      window: 'now',
      start,
      end: '2026-03-26T12:30:00.000Z',
    },
    relevance: { score, reason: 'test' },
  });

  const transformed = tvReadQueryService['applyViewTransform'](
    'now',
    [
      baseItem('Vida bajo cero', '2026-03-26T10:00:00.000Z', 12),
      baseItem('Mountain Men', '2026-03-26T09:30:00.000Z', 18, true),
    ],
    new Date('2026-03-26T11:00:00.000Z'),
    '20260326'
  );

  assert.equal(transformed.length, 1);
  assert.equal(transformed[0]?.program.title, 'Mountain Men');
});

test('selectPrimeTimeTvItems keeps one prime-time featured item per channel', () => {
  const buildItem = (id: string, channelId: string, title: string, start: string, end: string, options: {
    poster?: boolean;
    tmdbId?: number;
    score?: number;
  } = {}): TvReadItemDTO => ({
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
      sortOrder: channelId === 'la_1' ? 0 : 1,
    },
    program: {
      brandKey: title.toLowerCase(),
      title,
      normalizedTitle: title.toLowerCase(),
      titleAliases: [title.toLowerCase()],
      editorialCategory: 'Otros',
      tmdbId: options.tmdbId,
    },
    airing: {
      id,
      date: '20260326',
      start,
      end,
      durationMinutes: 60,
      liveNow: false,
      partOfDay: 'noche',
      timeSlotKey: '22:00',
    },
    assets: options.poster
      ? {
          primary: {
            kind: 'poster',
            role: 'primary',
            source: 'epg_program_image',
            url: 'https://img/poster.jpg',
          },
          poster: {
            kind: 'poster',
            role: 'primary',
            source: 'epg_program_image',
            url: 'https://img/poster.jpg',
          },
          fallbackChain: [],
        }
      : { fallbackChain: [] },
    availability: { live: true, catchup: false, streaming: false },
    sourceProvenance: { schedule: ['primary'], metadata: [], assets: [] },
    timingContext: { liveNow: false, window: 'tonight', start, end },
    relevance: { score: options.score ?? 0, reason: 'test' },
    trustDecision: {
      confidence: 'high',
      sourceAgreement: 'single_source',
      featuredSuppressed: false,
      reasons: [],
    },
  });

  const items = [
    buildItem('a', 'la_1', 'Telediario 2', '2026-03-26T20:55:00.000+01:00', '2026-03-26T21:40:00.000+01:00'),
    buildItem('b', 'la_1', 'La revuelta', '2026-03-26T21:45:00.000+01:00', '2026-03-26T23:00:00.000+01:00', { poster: true, tmdbId: 1, score: 10 }),
    buildItem('c', 'la_2', 'Cifras y letras', '2026-03-26T21:45:00.000+01:00', '2026-03-26T22:20:00.000+01:00', { score: 5 }),
    buildItem('d', 'la_2', 'Todo a la vez en todas partes', '2026-03-26T22:15:00.000+01:00', '2026-03-27T00:35:00.000+01:00', { poster: true, tmdbId: 2, score: 20 }),
  ];

  const selected = selectPrimeTimeTvItems(items, '20260326');

  assert.equal(selected.length, 2);
  assert.deepEqual(
    selected.map((item) => item.program.title),
    ['La revuelta', 'Todo a la vez en todas partes']
  );
});

test('selectPrimeTimeTvItems can require shows to start inside the prime-time window', () => {
  const buildItem = (id: string, title: string, start: string, end: string): TvReadItemDTO => ({
    id,
    channel: {
      id: 'la_sexta',
      name: 'La Sexta',
      normalizedName: 'la_sexta',
      aliases: ['la_sexta'],
      sourceIds: ['la_sexta'],
      type: 'TDT',
      group: 'tdt',
      subgroups: ['tdt'],
      sortOrder: 5,
    },
    program: {
      brandKey: title.toLowerCase().replace(/\s+/g, '_'),
      title,
      normalizedTitle: title.toLowerCase(),
      titleAliases: [title.toLowerCase()],
      editorialCategory: 'Otros',
    },
    airing: {
      id,
      date: '20260326',
      start,
      end,
      durationMinutes: 60,
      liveNow: false,
      partOfDay: 'noche',
      timeSlotKey: '22:00',
    },
    assets: { fallbackChain: [] },
    availability: { live: true, catchup: false, streaming: false },
    sourceProvenance: { schedule: ['primary'], metadata: [], assets: [] },
    timingContext: { liveNow: false, window: 'tonight', start, end },
    relevance: { score: 0, reason: 'test' },
    trustDecision: {
      confidence: 'high',
      sourceAgreement: 'single_source',
      featuredSuppressed: false,
      reasons: [],
    },
  });

  const selected = selectPrimeTimeTvItems(
    [
      buildItem(
        'a',
        'El intermedio',
        '2026-03-26T21:30:00.000+01:00',
        '2026-03-26T23:00:00.000+01:00'
      ),
      buildItem(
        'b',
        'El Objetivo',
        '2026-03-26T23:00:00.000+01:00',
        '2026-03-27T01:00:00.000+01:00'
      ),
    ],
    '20260326',
    { requireStartInsideWindow: true }
  );

  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.program.title, 'El Objetivo');
});
