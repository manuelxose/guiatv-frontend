import assert from 'node:assert/strict';
import test from 'node:test';
import { CatalogService } from './CatalogService';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';

const catalog = new CatalogService({} as any, {} as any, {} as any, {} as any, {} as any, {} as any);

const tvRead = (title: string, editorialCategory: string) => ({
  id: 'airing-1',
  program: { title, editorialCategory, genre: editorialCategory },
  airing: { start: '2026-10-22T20:00:00.000Z', end: '2026-10-22T22:00:00.000Z', durationMinutes: 120, liveNow: false },
  assets: { fallbackChain: [] },
  sourceProvenance: { schedule: [], metadata: [], assets: [] },
  timingContext: { liveNow: false },
  channel: { id: 'la_1', name: 'La 1', aliases: [], sourceIds: [], group: 'tdt' },
});

const paths = (title: string, category: string) => [
  (catalog as any).mapTvReadItemToCatalogItem(tvRead(title, category)).detailPath,
  (catalog as any).mapTvReadItemToAiring(tvRead(title, category)).detailPath,
];

// Production 2026-10-22: hub cards linked /peliculas/atmica and /series/friends-t3-e1-… (404); these resolve.
test('film and series airings link to the slug their detail page resolves', () => {
  assert.deepEqual(paths('Atómica', 'Cine'), ['/peliculas/atomica', '/peliculas/atomica']);
  assert.deepEqual(paths('Friends T3 E1 El de la fantasía de la princesa Leia', 'Series'), ['/series/friends', '/series/friends']);
  assert.deepEqual(paths('Agatha Christie: Poirot', 'Series'), ['/series/agatha-christie-poirot', '/series/agatha-christie-poirot']);
});

test('programme airings keep the legacy slug of their indexed URLs', () => {
  assert.deepEqual(paths('España directo', 'Magacín'), ['/programas/espaa-directo', '/programas/espaa-directo']);
});

// QA on this change: with no TMDB match the slug falls back to the TV read model, which must accept every slug
// airingDetailSlug links, or a film/series without a TMDB entry would 404 (and be negative-cached).
test('the TV read slug fallback resolves the slugs airing links now use', async () => {
  const titles = ['Él Sueño', 'Serie Local T1 E3', 'España directo'];
  const original = { distinct: TVReadAiringModel.distinct, findOne: TVReadAiringModel.findOne };
  (TVReadAiringModel as any).distinct = () => ({ exec: async () => titles });
  (TVReadAiringModel as any).findOne = (filter: { 'program.title': string }) => ({
    sort: () => ({ lean: () => ({ exec: async () => ({ id: filter['program.title'] }) }) }),
  });
  try {
    const find = (text: string, slug: string) => (catalog as any).findTvReadItemBySlug(text, slug, '20261022');
    assert.equal((await find('el sueno', 'el-sueno'))?.id, 'Él Sueño');
    assert.equal((await find('serie local', 'serie-local'))?.id, 'Serie Local T1 E3');
    assert.equal((await find('espaa directo', 'espaa-directo'))?.id, 'España directo');
    assert.equal(await find('otro titulo', 'otro-titulo'), null);
  } finally {
    Object.assign(TVReadAiringModel, original);
  }
});
