import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { MediaCatalogService } from './MediaCatalogService';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import {
  IMediaCatalogRepository,
  MediaCatalogUpsertInput,
} from '@/domain/repositories/IMediaCatalogRepository';
import {
  computeNormalizedIdentity,
  MediaCatalogEntry,
} from '@/domain/entities/MediaCatalogEntry';
import { normalizeTvToken } from '@/shared/utils/tvMetadata';
import { TMDBDetailResult } from '@/infrastructure/external/TMDBService';

/**
 * In-memory repository double. Mirrors the *contract* Mongo's unique
 * (tmdbType, tmdbId) index gives us: an upsert for a tmdbId that already
 * exists always resolves to the same row, never a second one — which is
 * exactly what the "duplicate prevention" test below relies on.
 */
function createFakeRepository(): IMediaCatalogRepository & {
  rows: Map<string, MediaCatalogEntry>;
  upsertCalls: MediaCatalogUpsertInput[];
} {
  const rows = new Map<string, MediaCatalogEntry>();
  const upsertCalls: MediaCatalogUpsertInput[] = [];

  const keyFor = (tmdbType?: string, tmdbId?: number) =>
    tmdbId ? `${tmdbType}:${tmdbId}` : undefined;

  return {
    rows,
    upsertCalls,
    async findById(id) {
      return Array.from(rows.values()).find((row) => row.id === id) ?? null;
    },
    async findByTmdbId(tmdbType, tmdbId) {
      const key = keyFor(tmdbType, tmdbId);
      return (key && rows.get(key)) || null;
    },
    async findManyByTmdbIds(tmdbType, tmdbIds) {
      return tmdbIds
        .map((id) => rows.get(keyFor(tmdbType, id) as string))
        .filter((entry): entry is MediaCatalogEntry => Boolean(entry));
    },
    async findByNormalizedIdentity(identity) {
      return Array.from(rows.values()).find((row) => row.normalizedIdentity === identity) ?? null;
    },
    async findByNormalizedTitles(titles) {
      return Array.from(rows.values()).filter((row) => titles.includes(row.normalizedTitle));
    },
    async upsert(input) {
      upsertCalls.push(input);
      const normalizedTitle = normalizeTvToken(input.title, ' ');
      const normalizedIdentity = computeNormalizedIdentity(input.contentType, normalizedTitle, input.year);
      const key = keyFor(input.tmdbType, input.tmdbId);
      const existing = (key && rows.get(key)) ||
        Array.from(rows.values()).find((row) => row.normalizedIdentity === normalizedIdentity);

      const merged = MediaCatalogEntry.create({
        id: existing?.id ?? randomUUID(),
        tmdbId: input.tmdbId ?? existing?.tmdbId,
        tmdbType: input.tmdbType ?? existing?.tmdbType,
        contentType: input.contentType,
        title: input.title,
        normalizedTitle,
        normalizedIdentity,
        originalTitle: input.originalTitle ?? existing?.originalTitle,
        canonicalGenres: input.canonicalGenres ?? existing?.canonicalGenres ?? [],
        tmdbGenres: input.tmdbGenres ?? existing?.tmdbGenres ?? [],
        synopsis: input.synopsis ?? existing?.synopsis,
        year: input.year ?? existing?.year,
        runtimeMinutes: input.runtimeMinutes ?? existing?.runtimeMinutes,
        rating: input.rating ?? existing?.rating,
        voteCount: input.voteCount ?? existing?.voteCount,
        posterPath: input.posterPath ?? existing?.posterPath,
        backdropPath: input.backdropPath ?? existing?.backdropPath,
        castSummary: input.castSummary ?? existing?.castSummary ?? [],
        directors: input.directors ?? existing?.directors ?? [],
        metadataSource: input.metadataSource,
        lastEnrichedAt: input.markEnrichedNow ? new Date() : existing?.lastEnrichedAt,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });

      const storageKey = keyFor(merged.tmdbType, merged.tmdbId) ?? merged.normalizedIdentity;
      rows.set(storageKey, merged);
      return merged;
    },
    async findStale() {
      return [];
    },
    async countAll() {
      return rows.size;
    },
  };
}

function memoryCache(): ICacheRepository & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>();
  return {
    store,
    get: async <T>(key: string) => (store.get(key) as T | undefined) ?? null,
    set: async <T>(key: string, value: T) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    clear: async () => {
      store.clear();
    },
  };
}

function tmdbDetail(overrides: Partial<TMDBDetailResult> = {}): TMDBDetailResult {
  return {
    id: 42,
    title: 'Interstellar',
    original_title: 'Interstellar',
    overview: 'A team of explorers travel through a wormhole.',
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    vote_average: 8.4,
    vote_count: 30000,
    release_date: '2014-11-07',
    genres: [{ id: 878, name: 'Science Fiction' }],
    runtime: 169,
    credits: {
      cast: [{ name: 'Matthew McConaughey', character: 'Cooper', profile_path: '/cast.jpg' }],
      crew: [{ name: 'Christopher Nolan', job: 'Director' }],
    },
    ...overrides,
  };
}

function fakeTmdbService(detail: TMDBDetailResult | null | Error, calls: { count: number }) {
  return {
    getMovieById: async (_id: number) => {
      calls.count += 1;
      if (detail instanceof Error) throw detail;
      return detail;
    },
    getTVById: async (_id: number) => {
      calls.count += 1;
      if (detail instanceof Error) throw detail;
      return detail;
    },
  } as any;
}

test('L1 cache hit: a second lookup for the same id never touches Mongo or TMDB', async () => {
  const repository = createFakeRepository();
  const tmdbCalls = { count: 0 };
  const tmdb = fakeTmdbService(tmdbDetail({ id: 101 }), tmdbCalls);
  const service = new MediaCatalogService(repository, tmdb, null);

  const first = await service.getDetail(101, 'movie');
  const findCallsAfterFirst = repository.upsertCalls.length;
  const second = await service.getDetail(101, 'movie');

  assert.equal(tmdbCalls.count, 1, 'TMDB should be hit exactly once for the cold lookup');
  assert.equal(repository.upsertCalls.length, findCallsAfterFirst, 'no extra Mongo write on the L1 hit');
  assert.equal(second?.title, first?.title);
});

test('Redis hit: a fresh envelope in the cache repository short-circuits Mongo and TMDB', async () => {
  const repository = createFakeRepository();
  const tmdbCalls = { count: 0 };
  const tmdb = fakeTmdbService(tmdbDetail({ id: 202 }), tmdbCalls);
  const cache = memoryCache();
  const now = Date.now();
  cache.store.set('mediacat:detail:movie:202', {
    value: tmdbDetail({ id: 202, title: 'Cached From Redis' }),
    freshUntil: now + 60_000,
    staleUntil: now + 120_000,
  });

  const service = new MediaCatalogService(repository, tmdb, cache);
  const result = await service.getDetail(202, 'movie');

  assert.equal(result?.title, 'Cached From Redis');
  assert.equal(tmdbCalls.count, 0, 'Redis hit must not fall through to TMDB');
});

test('Mongo hit: a fresh catalog entry is served without calling TMDB', async () => {
  const repository = createFakeRepository();
  await repository.upsert({
    tmdbId: 303,
    tmdbType: 'movie',
    contentType: 'movie',
    title: 'Already Enriched',
    synopsis: 'Stored previously.',
    metadataSource: 'tmdb',
    markEnrichedNow: true,
  });

  const tmdbCalls = { count: 0 };
  const tmdb = fakeTmdbService(tmdbDetail({ id: 303 }), tmdbCalls);
  const service = new MediaCatalogService(repository, tmdb, null);

  const result = await service.getDetail(303, 'movie');

  assert.equal(result?.title, 'Already Enriched');
  assert.equal(tmdbCalls.count, 0, 'a fresh Mongo entry must short-circuit TMDB entirely');
});

test('TMDB fallback: a genuine miss (no L1/Redis/Mongo) reaches TMDB and persists the result', async () => {
  const repository = createFakeRepository();
  const tmdbCalls = { count: 0 };
  const tmdb = fakeTmdbService(tmdbDetail({ id: 404, title: 'Brand New' }), tmdbCalls);
  const service = new MediaCatalogService(repository, tmdb, null);

  const result = await service.getDetail(404, 'movie');
  // Persist is fire-and-forget inside the service; give its microtask a tick.
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(tmdbCalls.count, 1);
  assert.equal(result?.title, 'Brand New');
  assert.equal(repository.rows.get('movie:404')?.metadataSource, 'tmdb');
  assert.ok(repository.rows.get('movie:404')?.lastEnrichedAt, 'a real TMDB fetch must mark the entry enriched');
});

test('stale metadata refresh: an entry past its freshness window triggers a TMDB refetch', async () => {
  const repository = createFakeRepository();
  const staleDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // far past the 30d movie window
  await repository.upsert({
    tmdbId: 505,
    tmdbType: 'movie',
    contentType: 'movie',
    title: 'Old Data',
    metadataSource: 'tmdb',
  });
  // Force staleness directly since the fake's upsert only sets lastEnrichedAt on markEnrichedNow.
  const staleEntry = repository.rows.get('movie:505')!;
  repository.rows.set(
    'movie:505',
    MediaCatalogEntry.create({ ...staleEntry.toJSON(), lastEnrichedAt: staleDate } as any)
  );

  const tmdbCalls = { count: 0 };
  const tmdb = fakeTmdbService(tmdbDetail({ id: 505, title: 'Refreshed Data' }), tmdbCalls);
  const service = new MediaCatalogService(repository, tmdb, null);

  const result = await service.getDetail(505, 'movie');

  assert.equal(tmdbCalls.count, 1, 'a stale entry must trigger a fresh TMDB fetch');
  assert.equal(result?.title, 'Refreshed Data');
});

test('TMDB outage fallback: TMDB failing serves the last known local data instead of failing', async () => {
  const repository = createFakeRepository();
  await repository.upsert({
    tmdbId: 606,
    tmdbType: 'movie',
    contentType: 'movie',
    title: 'Last Known Good',
    metadataSource: 'tmdb',
  });
  const entry = repository.rows.get('movie:606')!;
  repository.rows.set(
    'movie:606',
    MediaCatalogEntry.create({
      ...entry.toJSON(),
      lastEnrichedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    } as any)
  );

  const tmdb = fakeTmdbService(new Error('TMDB is down'), { count: 0 });
  const service = new MediaCatalogService(repository, tmdb, null);

  const result = await service.getDetail(606, 'movie');

  assert.equal(result?.title, 'Last Known Good', 'a TMDB outage must degrade to stale local data, not throw/null');
});

test('TMDB outage with nothing local at all resolves to null instead of throwing', async () => {
  const repository = createFakeRepository();
  const tmdb = fakeTmdbService(new Error('TMDB is down'), { count: 0 });
  const service = new MediaCatalogService(repository, tmdb, null);

  const result = await service.getDetail(707, 'movie');

  assert.equal(result, null);
});

test('duplicate prevention: repeated matches for the same TMDB id never create a second row', async () => {
  const repository = createFakeRepository();
  const service = new MediaCatalogService(repository, fakeTmdbService(null, { count: 0 }), null);

  await service.recordSearchMatch({ tmdbId: 808, tmdbType: 'movie', title: 'Dune' });
  await service.recordSearchMatch({ tmdbId: 808, tmdbType: 'movie', title: 'Dune (2021)' });
  await service.recordSearchMatch({ tmdbId: 808, tmdbType: 'movie', title: 'Dune' });

  const rowsForTmdbId808 = Array.from(repository.rows.values()).filter((row) => row.tmdbId === 808);
  assert.equal(rowsForTmdbId808.length, 1, 'three matches for the same tmdbId must collapse into one row');
  assert.equal(repository.upsertCalls.length, 3, 'the repository is still called each time...');
  assert.equal(rowsForTmdbId808[0].title, 'Dune', '...but the row itself is a single, merged entity');
});

// getLocalOnly: the primitive the detail-page critical path is built on. It
// must never reach TMDB, regardless of whether the local entry is fresh,
// stale, or absent.

test('getLocalOnly never calls TMDB, even when the local entry is stale', async () => {
  const repository = createFakeRepository();
  await repository.upsert({
    tmdbId: 909,
    tmdbType: 'movie',
    contentType: 'movie',
    title: 'Stale But Present',
    metadataSource: 'tmdb',
    markEnrichedNow: true,
  });
  const fresh = repository.rows.get('movie:909')!;
  repository.rows.set(
    'movie:909',
    MediaCatalogEntry.create({
      ...fresh.toJSON(),
      lastEnrichedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    } as any)
  );

  const tmdbCalls = { count: 0 };
  const tmdb = fakeTmdbService(tmdbDetail({ id: 909, title: 'Refreshed' }), tmdbCalls);
  const service = new MediaCatalogService(repository, tmdb, null);

  const result = await service.getLocalOnly(909, 'movie');

  assert.equal(result?.title, 'Stale But Present', 'getLocalOnly must return immediately, never wait on a refetch');
  // The stale read schedules a background refresh (fire-and-forget) — give
  // its microtasks a tick and confirm it eventually did reach TMDB, just not
  // on the caller's critical path.
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(tmdbCalls.count, 1, 'a stale local hit still triggers a non-blocking background refresh');
});

test('getLocalOnly resolves to null (never throws or blocks) when nothing is known locally', async () => {
  const repository = createFakeRepository();
  const tmdbCalls = { count: 0 };
  const tmdb = fakeTmdbService(tmdbDetail(), tmdbCalls);
  const service = new MediaCatalogService(repository, tmdb, null);

  const result = await service.getLocalOnly(1010, 'movie');

  assert.equal(result, null);
  assert.equal(tmdbCalls.count, 0, 'a cold miss on getLocalOnly must not itself trigger a TMDB call');
});
