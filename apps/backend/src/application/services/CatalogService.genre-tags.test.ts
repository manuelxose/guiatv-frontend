import assert from 'node:assert/strict';
import test from 'node:test';
import { CatalogService } from './CatalogService';

const catalog = new CatalogService(
  {} as any,
  {} as any,
  {} as any,
  {} as any,
  {} as any,
  {} as any,
);

test('TV read genre tags supplement EPG categories in catalog items', () => {
  const item = (catalog as any).mapTvReadItemToCatalogItem({
    id: 'airing-1',
    program: {
      title: 'Misión imposible',
      editorialCategory: 'Cine',
      genre: 'Cine',
      genreTags: ['Acción', 'Aventura'],
    },
    airing: {
      start: '2026-08-28T18:00:00.000Z',
      end: '2026-08-28T20:00:00.000Z',
      durationMinutes: 120,
      liveNow: true,
    },
    assets: { fallbackChain: [] },
    sourceProvenance: { schedule: [], metadata: [], assets: [] },
    timingContext: { liveNow: true },
    channel: { id: 'la_1', name: 'La 1', aliases: [], sourceIds: [], group: 'tdt' },
  });

  assert.deepEqual(item.genres, ['Cine', 'Acción', 'Aventura']);
});
