/**
 * Phase 3F: a programme enriched from the stored-programme cache (no TMDB call) keeps the catalogue row id that the
 * stored programme recorded with the same TMDB id. Before this, `tmdbId` was copied and `mediaId` was dropped, so the
 * airing could not be tied to its catalogue row and the legacy enrichment join (which needs that row) rejected it.
 * M03-L2: the copy is type-safe — the row must exist, carry that TMDB id and be of the programme's kind; the cache is no
 * longer kind-blind (a Series airing never reuses a same-titled film's enrichment). Throwaway database, dropped after.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ProgramModel } from '@/infrastructure/database/models/Program.model';
import { MediaCatalogModel } from '@/infrastructure/database/models/MediaCatalogEntry.model';
import { MongoProgramRepository } from '@/infrastructure/repositories/MongoProgramRepository';
import { SyncEPGData } from './SyncEPGData';
import { Program } from '@/domain/entities/Program';
import { PRIMARY_EPG_SOURCE_URL } from '@/shared/config/epgSources';

const base = (id: string, title: string, day: string, genre = 'Cine') => ({
  id, channelId: 'la_1', canonicalChannelId: 'la_1', title, genre, genreTags: [], titleAliases: [], sourceFeed: PRIMARY_EPG_SOURCE_URL,
  startTime: new Date(`${day}T20:00:00.000Z`), endTime: new Date(`${day}T22:00:00.000Z`), sourceProvenance: { legacyProgramIds: [id] },
});
const stored = (id: string, title: string, genre: string, tmdbId: number, kind: 'movie' | 'series' | undefined, mediaId?: string) =>
  Program.create({ ...base(id, title, '2026-10-21', genre), tmdbId, mediaId, image: `/${id}.jpg`, genreTags: ['drama'], year: '1995', ...(kind ? { trustFlags: { tmdbKind: kind } } : {}) } as never);
const row = async (tmdbId: number, tmdbType: 'movie' | 'tv', title: string) =>
  String((await MediaCatalogModel.create({ tmdbId, tmdbType, contentType: tmdbType === 'tv' ? 'series' : 'movie', title, normalizedTitle: title.toLowerCase(), normalizedIdentity: `${tmdbType}:${title.toLowerCase()}`, metadataSource: 'epg' }))._id);

function makeSync(repo: MongoProgramRepository, api: { series?: Record<string, number>; movie?: Record<string, number> } = {}) {
  const calls: string[] = [];
  const result = (id: number, title: string, tv: boolean) => ({ id, ...(tv ? { name: title } : { title }), overview: '', poster_path: '/p.jpg', vote_average: 7, genre_ids: [] });
  const tmdb = {
    searchSeries: async (t: string) => { calls.push(`tv:${t}`); const id = api.series?.[t]; return id ? result(id, t, true) : null; },
    searchMovie: async (t: string) => { calls.push(`movie:${t}`); const id = api.movie?.[t]; return id ? result(id, t, false) : null; },
    getImageUrl: (p: string) => p,
  };
  const sync = new SyncEPGData(repo as never, repo as never, {} as never, {} as never, {} as never, {} as never, tmdb as never) as any;
  sync.shouldSkipTMDBForProgram = () => false;
  return { calls, enrich: (ps: Program[]) => sync.enrichProgramsWithTMDB(ps) as Promise<Program[]>, refusals: () => sync.cacheRefusals as Record<string, number> };
}

async function withDb(name: string, fn: (repo: MongoProgramRepository) => Promise<void>) {
  const dbName = `guiatv_test_${name}_${process.pid}`;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName });
  try {
    assert.ok(dbName.startsWith('guiatv_test_'));
    await mongoose.connection.dropDatabase();
    await fn(new MongoProgramRepository());
  } finally {
    await ProgramModel.deleteMany({}).catch(() => undefined);
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  }
}

const byId = (out: Program[]) => Object.fromEntries(out.map((p) => [p.id, [p.tmdbId, p.mediaId ?? null]]));

test('3F: a cache-hit programme keeps the stored catalogue row id, and never invents one', { skip: !process.env.TEST_MONGO_URI }, () =>
  withDb('3fmedia', async (repo) => {
    const heat = await row(949, 'movie', 'Heat');
    // Yesterday's enrichment: Heat with its catalogue row; Alien enriched before the row id was kept.
    await repo.saveBatch([stored('old_heat', 'Heat', 'Cine', 949, 'movie', heat), stored('old_alien', 'Alien', 'Cine', 348, 'movie')]);
    assert.deepEqual((await repo.findEnrichedByTitles(['Heat', 'Alien'])).map((e) => [e.title, e.tmdbId, e.mediaId, e.tmdbKind]).sort(), [['Alien', 348, undefined, 'movie'], ['Heat', 949, heat, 'movie']]);
    const { enrich, calls } = makeSync(repo);
    const out = byId(await enrich([Program.create(base('new_heat', 'Heat', '2026-10-24') as never), Program.create(base('new_alien', 'Alien', '2026-10-24') as never)]));
    assert.deepEqual(out, { new_heat: [949, heat], new_alien: [348, null] }, 'no stored row id: none is invented');
    assert.deepEqual(calls, []);
  }));

test('M03-L2: the 196 class — a Series airing never takes a same-titled film\'s TMDB id or movie row; it is enriched as a show', { skip: !process.env.TEST_MONGO_URI }, () =>
  withDb('m03l2sync', async (repo) => {
    const film = await row(777, 'movie', 'Amar');
    // A film titled "Amar" (movie row) and yesterday's series airings already polluted by the kind-blind cache: flagged series, movie row.
    await repo.saveBatch([stored('film', 'Amar', 'Cine', 777, 'movie', film), stored('bad_series', 'Amar', 'Serie', 777, 'series', film)]);
    const catalogueBefore = JSON.stringify(await MediaCatalogModel.find().sort({ _id: 1 }).lean());
    const programmesBefore = JSON.stringify(await ProgramModel.find().sort({ id: 1 }).lean());
    const { enrich, calls, refusals } = makeSync(repo, { series: { amar: 5555 } });
    const input = () => [Program.create(base('new_series', 'Amar', '2026-10-24', 'Serie') as never), Program.create(base('new_film', 'Amar', '2026-10-24') as never)];
    const out = byId(await enrich(input()));
    assert.deepEqual(out.new_film, [777, film], 'movie → movie still reuses the verified row');
    assert.deepEqual(out.new_series, [5555, null], 'series → fresh TV search (no catalogue service here, so no row), never the movie row');
    assert.deepEqual(calls, ['tv:amar'], 'one TV search, no movie search');
    assert.deepEqual(refusals(), { cross_type_media_id: 1, other_kind_only: 1 });
    // Idempotent and read-only: same answer again, programmes and catalogue untouched (enrichment does not persist).
    assert.deepEqual(byId(await enrich(input())), out);
    assert.equal(JSON.stringify(await MediaCatalogModel.find().sort({ _id: 1 }).lean()), catalogueBefore);
    assert.equal(JSON.stringify(await ProgramModel.find().sort({ id: 1 }).lean()), programmesBefore);
  }));

test('M03-L2: same TMDB number in both namespaces — each kind gets its own row; missing kind, dangling and ambiguous rows copy no id', { skip: !process.env.TEST_MONGO_URI }, () =>
  withDb('m03l2kinds', async (repo) => {
    const movie = await row(949, 'movie', 'Heat');
    const show = await row(949, 'tv', 'Heat');
    const other = await row(31, 'tv', 'Dark');
    await repo.saveBatch([
      stored('m', 'Heat', 'Cine', 949, 'movie', movie),
      stored('s', 'Heat', 'Serie', 949, 'series', show),
      stored('untyped', 'Dark', 'Serie', 31, undefined, other), // no tmdbKind: kind comes from the verified row
      stored('dangling', 'Lost', 'Serie', 4607, 'series', 'ffffffffffffffffffffffff'),
      stored('amb1', 'Twins', 'Serie', 10, 'series'),
      stored('amb2', 'Twins', 'Serie', 11, 'series', await row(11, 'tv', 'Twins')),
    ]);
    const { enrich, calls } = makeSync(repo);
    const out = byId(await enrich([
      Program.create(base('n_movie', 'Heat', '2026-10-24') as never),
      Program.create(base('n_show', 'Heat', '2026-10-24', 'Serie') as never),
      Program.create(base('n_dark', 'Dark', '2026-10-24', 'Serie') as never),
      Program.create(base('n_lost', 'Lost', '2026-10-24', 'Serie') as never),
      Program.create(base('n_twins', 'Twins', '2026-10-24', 'Serie') as never),
    ]));
    assert.deepEqual(out, {
      n_movie: [949, movie],
      n_show: [949, show],
      n_dark: [31, other],
      n_lost: [4607, null], // row missing: metadata reused, no id copied
      n_twins: [11, null], // two stored TMDB ids for one title: no id copied
    });
    assert.deepEqual(calls, []);
  }));

test('M03-L2: an unreadable catalogue copies no mediaId but keeps the cached metadata', { skip: !process.env.TEST_MONGO_URI }, () =>
  withDb('m03l2fail', async (repo) => {
    const heat = await row(949, 'movie', 'Heat');
    await repo.saveBatch([stored('m', 'Heat', 'Cine', 949, 'movie', heat)]);
    const raw = new SyncEPGData(repo as never, repo as never, {} as never, {} as never, {} as never, {} as never, {} as never) as any;
    raw.shouldSkipTMDBForProgram = () => false;
    raw.catalogueRowReader = async () => { throw new Error('boom'); };
    const out = byId(await raw.enrichProgramsWithTMDB([Program.create(base('n', 'Heat', '2026-10-24') as never)]));
    assert.deepEqual(out, { n: [949, null] });
    assert.deepEqual(raw.cacheRefusals, { catalogue_unavailable: 1 });
  }));
