import assert from 'node:assert/strict';
import test from 'node:test';
import { CatalogService } from './CatalogService';
import { NotFoundError } from '@/shared/errors';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';

/**
 * Regression suite for the "View Details" fast path: a detail response must
 * render from local/known data and never wait on TMDB search, streaming
 * providers, related-content discovery or social/user-interaction queries.
 * See CatalogService.getDetail/getBySlug/getTmdbDetail/getDetailEnrichment.
 */

/**
 * `getTmdbDetail`'s airings lookup (findProgramMatches) and the slug
 * not-found fallback both query TVReadAiringModel directly (no repository
 * abstraction). Stub it for the duration of one test, matching the pattern
 * in CatalogService.slug-negative-cache.test.ts, and restore it afterwards
 * so this hermetic stub can't leak into any other test.
 */
async function withStubbedTvReadFind<T>(run: () => Promise<T>): Promise<T> {
  const original = TVReadAiringModel.find;
  (TVReadAiringModel as any).find = () => ({
    sort: () => ({
      limit: () => ({ lean: () => ({ exec: async () => [] }) }),
    }),
  });
  try {
    return await run();
  } finally {
    TVReadAiringModel.find = original;
  }
}

function fakeCacheRepository() {
  const store = new Map<string, unknown>();
  return {
    store,
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async <T>(key: string, value: T) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    clear: async () => store.clear(),
  };
}

function fakeTmdbService(counters: { searchMovies: number; searchTV: number; discoverMovies: number; discoverTV: number }) {
  return {
    searchMovies: async () => {
      counters.searchMovies += 1;
      return [];
    },
    searchTV: async () => {
      counters.searchTV += 1;
      return [];
    },
    discoverMovies: async () => {
      counters.discoverMovies += 1;
      return { page: 1, total_pages: 0, total_results: 0, results: [] };
    },
    discoverTV: async () => {
      counters.discoverTV += 1;
      return { page: 1, total_pages: 0, total_results: 0, results: [] };
    },
    getImageUrl: (path: string | null) => (path ? `https://image.tmdb.org/t/p/w500${path}` : undefined),
    getMovieById: async () => null,
    getTVById: async () => null,
  } as any;
}

function fakeStreamingProviders(counters: { calls: number }, opts: { throwOnCall?: boolean } = {}) {
  return {
    getMovieProviders: async () => {
      counters.calls += 1;
      if (opts.throwOnCall) throw new Error('streaming providers down');
      return null;
    },
    getTVProviders: async () => {
      counters.calls += 1;
      if (opts.throwOnCall) throw new Error('streaming providers down');
      return null;
    },
  } as any;
}

function fakeTvReadQueryService(item: any, relatedChannelItems: any[] = []) {
  return {
    getItem: async (_id: string) => ({
      item,
      relatedChannelItems,
      meta: { generatedAt: new Date().toISOString() },
    }),
    query: async () => ({ items: [], meta: { page: 1, limit: 24, total: 0, hasMore: false } }),
  } as any;
}

function fakeMediaCatalogService(overrides: Partial<{
  getDetail: (...args: any[]) => Promise<any>;
  getLocalOnly: (...args: any[]) => Promise<any>;
  findKnownMatchesForTitles: (...args: any[]) => Promise<any>;
}> = {}) {
  const calls = { getDetail: 0, getLocalOnly: 0, findKnownMatchesForTitles: 0 };
  return {
    calls,
    getDetail: async (...args: any[]) => {
      calls.getDetail += 1;
      return overrides.getDetail ? overrides.getDetail(...args) : null;
    },
    getLocalOnly: async (...args: any[]) => {
      calls.getLocalOnly += 1;
      return overrides.getLocalOnly ? overrides.getLocalOnly(...args) : null;
    },
    findKnownMatchesForTitles: async (...args: any[]) => {
      calls.findKnownMatchesForTitles += 1;
      return overrides.findKnownMatchesForTitles ? overrides.findKnownMatchesForTitles(...args) : [];
    },
    recordSearchMatch: async () => undefined,
  } as any;
}

function tmdbDetailFixture(overrides: Partial<any> = {}) {
  return {
    id: 603,
    title: 'The Matrix',
    original_title: 'The Matrix',
    overview: 'A hacker discovers reality is a simulation.',
    poster_path: '/matrix.jpg',
    backdrop_path: '/matrix-bg.jpg',
    vote_average: 8.2,
    vote_count: 20000,
    release_date: '1999-03-31',
    genres: [{ id: 878, name: 'Ciencia ficción' }],
    runtime: 136,
    credits: {
      cast: [{ name: 'Keanu Reeves', character: 'Neo', profile_path: '/keanu.jpg' }],
      crew: [{ name: 'Lana Wachowski', job: 'Director' }],
    },
    ...overrides,
  };
}

function tvReadItemFixture(overrides: Partial<any> = {}) {
  return {
    id: 'airing-1',
    airing: {
      date: '20260828',
      start: '2026-08-28T20:00:00.000Z',
      end: '2026-08-28T22:00:00.000Z',
      durationMinutes: 120,
      liveNow: true,
    },
    program: {
      title: 'Misión Imposible',
      editorialCategory: 'Cine',
      genre: 'Cine',
      genreTags: ['Acción'],
      tmdbId: undefined,
    },
    assets: { fallbackChain: [] },
    sourceProvenance: { schedule: [], metadata: [], assets: [] },
    timingContext: { liveNow: true },
    channel: { id: 'la_1', name: 'La 1', aliases: [], sourceIds: [], group: 'tdt' },
    ...overrides,
  };
}

function buildService(options: {
  tmdbCounters: { searchMovies: number; searchTV: number; discoverMovies: number; discoverTV: number };
  providersCounters: { calls: number };
  tvReadItem?: any;
  mediaCatalogOverrides?: Parameters<typeof fakeMediaCatalogService>[0];
  providersThrow?: boolean;
}) {
  const cache = fakeCacheRepository();
  const tmdbService = fakeTmdbService(options.tmdbCounters);
  const streamingProvidersService = fakeStreamingProviders(options.providersCounters, {
    throwOnCall: options.providersThrow,
  });
  const tvReadQueryService = fakeTvReadQueryService(options.tvReadItem || tvReadItemFixture());
  const mediaCatalogService = fakeMediaCatalogService(options.mediaCatalogOverrides);

  const service = new CatalogService(
    {} as any, // channelRepository — unused on the detail fast path
    cache as any,
    tmdbService,
    streamingProvidersService,
    {} as any, // interactionRepository — unused; user-interaction path is skipped for anonymous calls
    tvReadQueryService,
    mediaCatalogService
  );

  return { service, cache, tmdbService, streamingProvidersService, tvReadQueryService, mediaCatalogService };
}

// 1. Direct catalogId navigation ---------------------------------------------

test('direct catalogId navigation (tmdb) resolves without any slug search', async () => {
  const counters = { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 };
  const { service, mediaCatalogService } = buildService({
    tmdbCounters: counters,
    providersCounters: { calls: 0 },
    mediaCatalogOverrides: { getDetail: async () => tmdbDetailFixture() },
  });

  const result = await withStubbedTvReadFind(() => service.getDetail('tmdb:movie:603'));

  assert.equal(result.title, 'The Matrix');
  assert.equal(result.enrichmentPending, true);
  assert.equal(counters.searchMovies, 0);
  assert.equal(counters.searchTV, 0);
  assert.equal(mediaCatalogService.calls.getDetail, 1);
  assert.equal(mediaCatalogService.calls.findKnownMatchesForTitles, 0, 'no slug resolution needed for a direct catalogId');
});

test('direct catalogId navigation (program) resolves from the airing itself, no TMDB required', async () => {
  const { service, mediaCatalogService } = buildService({
    tmdbCounters: { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 },
    providersCounters: { calls: 0 },
    mediaCatalogOverrides: { getLocalOnly: async () => null }, // nothing cached yet
  });

  const result = await service.getDetail('program:airing-1');

  assert.equal(result.title, 'Misión Imposible');
  assert.equal(result.enrichmentPending, true);
  assert.equal(mediaCatalogService.calls.findKnownMatchesForTitles, 0);
});

// 2. Slug route ---------------------------------------------------------------

test('slug route resolves via the local media catalog, skipping TMDB search entirely', async () => {
  const counters = { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 };
  const { service, mediaCatalogService } = buildService({
    tmdbCounters: counters,
    providersCounters: { calls: 0 },
    mediaCatalogOverrides: {
      findKnownMatchesForTitles: async () => [
        { tmdbId: 603, tmdbType: 'movie', title: 'The Matrix' },
      ],
      getDetail: async () => tmdbDetailFixture(),
    },
  });

  const result = await withStubbedTvReadFind(() => service.getBySlug('movie', 'the-matrix'));

  assert.equal(result.title, 'The Matrix');
  assert.equal(counters.searchMovies, 0, 'a known local match must never fall through to a TMDB search');
  assert.equal(mediaCatalogService.calls.findKnownMatchesForTitles, 1);
});

test('slug route falls back to a live TMDB search only when nothing local matches', async () => {
  const counters = { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 };
  const { service } = buildService({
    tmdbCounters: counters,
    providersCounters: { calls: 0 },
    mediaCatalogOverrides: { findKnownMatchesForTitles: async () => [] },
  });

  await withStubbedTvReadFind(() =>
    assert.rejects(() => service.getBySlug('movie', 'a-title-nobody-has-ever-seen'), NotFoundError)
  );
  assert.equal(counters.searchMovies, 1, 'a genuinely unknown slug must still be resolvable via TMDB search');
});

// 3 & 4. Cached vs cold detail: the critical path never does secondary work --

test('cached detail never touches providers, related discovery, or social queries', async () => {
  const counters = { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 };
  const providersCounters = { calls: 0 };
  const { service } = buildService({
    tmdbCounters: counters,
    providersCounters,
    mediaCatalogOverrides: { getDetail: async () => tmdbDetailFixture() },
  });

  const result = await withStubbedTvReadFind(() => service.getDetail('tmdb:movie:603'));

  assert.equal(result.cast?.[0]?.name, 'Keanu Reeves');
  assert.equal(result.director, 'Lana Wachowski');
  assert.equal(result.related, undefined, 'related must be deferred, not computed eagerly');
  assert.equal(result.socialSummary, undefined);
  assert.equal(result.whereToWatch, undefined);
  assert.equal(providersCounters.calls, 0, 'the critical path must never call the streaming providers service');
  assert.equal(counters.discoverMovies, 0, 'the critical path must never run related-content discovery');
});

test('cold detail (never seen before) still renders a complete critical page', async () => {
  const { service } = buildService({
    tmdbCounters: { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 },
    providersCounters: { calls: 0 },
    // Simulates MediaCatalogService performing its one-time TMDB fetch and
    // returning a freshly-persisted detail — CatalogService itself never
    // knows or cares whether this came from cache or a live call.
    mediaCatalogOverrides: { getDetail: async () => tmdbDetailFixture({ id: 999, title: 'Brand New Movie' }) },
  });

  const result = await withStubbedTvReadFind(() => service.getDetail('tmdb:movie:999'));

  assert.equal(result.title, 'Brand New Movie');
  assert.equal(result.image, 'https://image.tmdb.org/t/p/w500/matrix.jpg');
  assert.ok(result.cast?.length);
});

// 5. TMDB unavailable ----------------------------------------------------------

test('TMDB unavailable + nothing local for a tmdb-identity catalogId surfaces a 404, not a hang/crash', async () => {
  const { service } = buildService({
    tmdbCounters: { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 },
    providersCounters: { calls: 0 },
    mediaCatalogOverrides: { getDetail: async () => null }, // outage + never cached
  });

  await assert.rejects(() => service.getDetail('tmdb:movie:404404'), NotFoundError);
});

test('TMDB unavailable for a program catalogId still renders from the airing (graceful degradation)', async () => {
  const { service } = buildService({
    tmdbCounters: { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 },
    providersCounters: { calls: 0 },
    mediaCatalogOverrides: { getLocalOnly: async () => null }, // TMDB down, nothing cached
  });

  const result = await service.getDetail('program:airing-1');

  assert.equal(result.title, 'Misión Imposible');
  assert.equal(result.cast?.length, 0);
  assert.equal(result.director, undefined);
});

// 6. Secondary enrichment failure is isolated ----------------------------------

test('secondary enrichment failure on one section never breaks the others (tmdb identity)', async () => {
  const counters = { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 };
  const { service } = buildService({
    tmdbCounters: counters,
    providersCounters: { calls: 0 },
    providersThrow: true, // streaming providers is down
    mediaCatalogOverrides: { getDetail: async () => tmdbDetailFixture() },
  });

  const enrichment = await service.getDetailEnrichment('tmdb:movie:603');

  assert.equal(enrichment.whereToWatch, undefined, 'the failing section degrades to absent');
  assert.deepEqual(enrichment.related, [], 'discover returned no results but the call still resolved');
});

test('secondary enrichment failure on providers does not block related content (program)', async () => {
  const { service, tvReadQueryService } = buildService({
    tmdbCounters: { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 },
    providersCounters: { calls: 0 },
    providersThrow: true,
    tvReadItem: tvReadItemFixture({ program: { title: 'Misión Imposible', editorialCategory: 'Cine', genre: 'Cine', tmdbId: 603 } }),
  });
  tvReadQueryService.query = async () => ({
    items: [tvReadItemFixture({ id: 'airing-2', program: { title: 'Otra Película', editorialCategory: 'Cine' } })],
    meta: { page: 1, limit: 24, total: 1, hasMore: false },
  });

  const enrichment = await service.getDetailEnrichment('program:airing-1');

  assert.equal(enrichment.whereToWatch, undefined);
  assert.equal(enrichment.related.length, 1, 'an unrelated dependency failing must not take down related content');
});

// Backend critical-path fix: airings for a resolved TMDB id must use an
// indexed query, not a full-day collection scan (see findProgramMatches).

test('current/next airing lookup for a resolved TMDB id queries by indexed program.tmdbId, never the whole day', async () => {
  const { service } = buildService({
    tmdbCounters: { searchMovies: 0, searchTV: 0, discoverMovies: 0, discoverTV: 0 },
    providersCounters: { calls: 0 },
    mediaCatalogOverrides: { getDetail: async () => tmdbDetailFixture() },
  });

  const originalFind = TVReadAiringModel.find;
  const observedQueries: Record<string, unknown>[] = [];
  const observedLimits: number[] = [];
  (TVReadAiringModel as any).find = (query: Record<string, unknown>) => {
    observedQueries.push(query);
    return {
      sort: () => ({
        limit: (limit: number) => {
          observedLimits.push(limit);
          return { lean: () => ({ exec: async () => [] }) };
        },
      }),
    };
  };

  try {
    await service.getDetail('tmdb:movie:603');
  } finally {
    TVReadAiringModel.find = originalFind;
  }

  assert.equal(observedQueries.length, 2, 'one bounded query per day (today + tomorrow), not a table scan');
  observedQueries.forEach((query) => {
    assert.equal(query['program.tmdbId'], 603, 'must filter by the indexed tmdbId field at the database level');
    assert.match(String(query.date), /^\d{8}$/);
  });
  assert.deepEqual(observedLimits, [12, 12], 'bounded to a handful of airings, never the full day');
});
