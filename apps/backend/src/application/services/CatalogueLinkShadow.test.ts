import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueLinkSnapshot, guardExistingMediaIds, resetCatalogueLinkStats, resolveCatalogueLinkMode, runCatalogueLinkShadow } from './CatalogueLinkShadow';
import { LinkProgram, LinkRow } from '@/domain/services/catalogueLinker';

const heat: LinkRow = { id: 'r1', tmdbId: 949, tmdbType: 'movie', title: 'Heat', originalTitle: 'Heat', normalizedTitle: 'heat' };

test('mode: default off, shadow, unknown fails safe to off', () => {
  assert.equal(resolveCatalogueLinkMode({} as NodeJS.ProcessEnv), 'off');
  assert.equal(resolveCatalogueLinkMode({ EPG_CATALOGUE_LINK_MODE: 'shadow' } as NodeJS.ProcessEnv), 'shadow');
  assert.equal(resolveCatalogueLinkMode({ EPG_CATALOGUE_LINK_MODE: ' SHADOW ' } as NodeJS.ProcessEnv), 'shadow');
  for (const v of ['persist', 'true', '1', '']) assert.equal(resolveCatalogueLinkMode({ EPG_CATALOGUE_LINK_MODE: v } as NodeJS.ProcessEnv), 'off');
});

test('off mode does no reads and records nothing', async () => {
  resetCatalogueLinkStats();
  let reads = 0;
  await runCatalogueLinkShadow([{ title: 'Heat', tmdbId: 949 }], { mode: 'off', reader: async () => { reads += 1; return []; } });
  assert.equal(reads, 0);
  assert.equal(catalogueLinkSnapshot().runs, 0);
});

test('shadow counts by reason, batches reads, never mutates programmes', async () => {
  resetCatalogueLinkStats();
  const programs: LinkProgram[] = [
    { title: 'Heat', tmdbId: 949, editorialCategory: 'Cine' },
    { title: 'Heat', tmdbId: 949, editorialCategory: 'Cine', mediaId: 'r1' },
    { title: 'Nada', tmdbId: 1, editorialCategory: 'Cine' },
    { title: 'Sin id' },
    ...Array.from({ length: 1200 }, (_, i) => ({ title: `Película del oeste ${i}`, tmdbId: 10_000 + i, editorialCategory: 'Cine' })),
  ];
  const before = JSON.stringify(programs);
  const batches: number[] = [];
  const reader = async (ids: number[]) => { batches.push(ids.length); return ids.includes(949) ? [heat] : []; };
  await runCatalogueLinkShadow(programs, { mode: 'shadow', reader });
  await runCatalogueLinkShadow(programs, { mode: 'shadow', reader });
  assert.equal(JSON.stringify(programs), before);
  assert.deepEqual(batches, [500, 500, 202, 500, 500, 202]);
  const s = catalogueLinkSnapshot();
  assert.equal(s.runs, 2);
  assert.deepEqual([s.lastRun!.evaluated, s.lastRun!.linkable, s.lastRun!.alreadyLinked, s.lastRun!.rejected.missing_tmdb_id], [1204, 1, 1, 1]);
  assert.equal(s.lastRun!.rejected.missing_catalogue_row, 1201);
  assert.equal(s.totals.evaluated, 2408);
  assert.ok(Object.keys(s.totals.rejected).length <= 12);
});

test('a reader failure is contained and counted', async () => {
  resetCatalogueLinkStats();
  await runCatalogueLinkShadow([{ title: 'Heat', tmdbId: 949 }], { mode: 'shadow', reader: async () => { throw new Error('boom'); } });
  assert.equal(catalogueLinkSnapshot().errors, 1);
});

test('M03-L2 guard: keeps verified ids, strips cross-type / foreign / dangling ones in place, idempotent, bounded counters', async () => {
  resetCatalogueLinkStats();
  const show: LinkRow = { ...heat, id: 'r2', tmdbType: 'tv', title: 'Heat (serie)', normalizedTitle: 'heat serie' };
  const programs: LinkProgram[] = [
    { title: 'Heat', tmdbId: 949, editorialCategory: 'Cine', mediaId: 'r1' }, // movie → movie
    { title: 'Heat (serie)', tmdbId: 949, editorialCategory: 'Series', mediaId: 'r2' }, // series → tv, same number
    { title: 'Heat', tmdbId: 949, editorialCategory: 'Series', mediaId: 'r1' }, // the 196 class: Series on a movie row
    { title: 'Heat', tmdbId: 949, editorialCategory: 'Cine', mediaId: 'r2' }, // movie on a tv row
    { title: 'Otra', tmdbId: 5, editorialCategory: 'Cine', mediaId: 'r1' }, // row of another TMDB id
    { title: 'Nada', tmdbId: 6, editorialCategory: 'Cine', mediaId: 'gone' }, // dangling
    { title: 'Sin id', mediaId: 'r1' }, // no TMDB id
    { title: 'Heat', tmdbId: 949, editorialCategory: 'Cine' }, // no mediaId: untouched, never linked here
  ];
  const reads: number[][] = [];
  const reader = async (ids: number[]) => { reads.push(ids); return ids.includes(949) ? [heat, show] : []; };
  await guardExistingMediaIds(programs, { reader });
  assert.deepEqual(programs.map((p) => p.mediaId), ['r1', 'r2', undefined, undefined, undefined, undefined, undefined, undefined]);
  assert.deepEqual(reads, [[949, 5, 6]]);
  const g = catalogueLinkSnapshot().mediaIdGuard;
  assert.deepEqual([g.checked, g.kept, g.dropped], [7, 2, { cross_type_media_id: 2, conflicting_media_id: 2, missing_tmdb_id: 1 }]);
  const after = JSON.stringify(programs);
  await guardExistingMediaIds(programs, { reader });
  assert.equal(JSON.stringify(programs), after);
  assert.equal(catalogueLinkSnapshot().mediaIdGuard.kept, 4);
});

test('M03-L2 guard: a catalogue read failure leaves airings unchanged and is counted; no ids means no read', async () => {
  resetCatalogueLinkStats();
  const programs: LinkProgram[] = [{ title: 'Heat', tmdbId: 949, editorialCategory: 'Series', mediaId: 'r1' }];
  await guardExistingMediaIds(programs, { reader: async () => { throw new Error('boom'); } });
  assert.equal(programs[0].mediaId, 'r1');
  assert.equal(catalogueLinkSnapshot().mediaIdGuard.errors, 1);
  let reads = 0;
  await guardExistingMediaIds([{ title: 'Heat', tmdbId: 949 }], { reader: async () => { reads += 1; return []; } });
  assert.equal(reads, 0);
});
