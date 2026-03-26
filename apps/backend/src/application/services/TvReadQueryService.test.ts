import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TvReadQueryService,
  hydrateTvReadItemRuntime,
  isConsumerVisibleTvReadItem,
  isFeaturedTvReadItem,
  normalizeTvReadView,
  resolveTvReadLimit,
} from './TvReadQueryService';
import { TvReadItemDTO } from '../dto/TvReadDTO';

test('normalizeTvReadView falls back to day for invalid input', () => {
  assert.equal(normalizeTvReadView('invalid'), 'day');
  assert.equal(normalizeTvReadView(undefined), 'day');
});

test('resolveTvReadLimit preserves large day reads required by guide surfaces', () => {
  assert.equal(resolveTvReadLimit('day', 5000), 5000);
  assert.equal(resolveTvReadLimit('day', 99999), 5000);
});

test('resolveTvReadLimit keeps hot paths bounded', () => {
  assert.equal(resolveTvReadLimit('now', 99999), 500);
  assert.equal(resolveTvReadLimit('search', undefined), 60);
  assert.equal(resolveTvReadLimit('night', 1200), 1200);
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
    new Date('2026-03-26T11:00:00.000Z')
  );

  assert.equal(transformed.length, 1);
  assert.equal(transformed[0]?.program.title, 'Mountain Men');
});
