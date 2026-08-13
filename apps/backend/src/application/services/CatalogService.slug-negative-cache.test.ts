import test from 'node:test';
import assert from 'node:assert/strict';
import { CatalogService } from './CatalogService';
import { InMemoryCache } from '@/infrastructure/cache/InMemoryCache';
import { NotFoundError } from '@/shared/errors';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';

/**
 * Regression test for the OOM crash-loop caused by /v2/catalog/slug/:contentType/:slug
 * falling through to a live, uncached TMDB search on every single request for a slug
 * that doesn't exist (mostly bot traffic, userAgent "node", ~90% resulting in 404s).
 *
 * Proves:
 *  1. First lookup of a genuinely non-existent slug hits TMDB (slow path).
 *  2. A second identical lookup within the negative-cache TTL short-circuits and does
 *     NOT hit TMDB again.
 *  3. Concurrent identical lookups for the same not-yet-cached slug are de-duped into
 *     a single TMDB call instead of each independently paying the TMDB round trip.
 */

function buildService(tmdbCallCounter: { count: number }, cache: InMemoryCache) {
  const fakeTmdbService = {
    searchMovies: async (_query: string, _options?: { page?: number; limit?: number }) => {
      tmdbCallCounter.count += 1;
      // Simulate the slow TMDB round trip observed in production (bounded here so the
      // test stays fast, but long enough to prove concurrent calls actually overlap).
      await new Promise((resolve) => setTimeout(resolve, 25));
      return []; // genuinely no match -> "not found"
    },
    searchTV: async () => {
      tmdbCallCounter.count += 1;
      return [];
    },
  };

  return new CatalogService(
    {} as any, // channelRepository - unused on the not-found path
    cache,
    fakeTmdbService as any,
    {} as any, // streamingProvidersService - unused on the not-found path
    {} as any, // interactionRepository - unused on the not-found path
    {} as any // tvReadQueryService - unused for contentType 'movie'
  );
}

test('getBySlug: first lookup of a missing slug hits TMDB, second identical lookup is served from the negative cache', async () => {
  const tmdbCallCounter = { count: 0 };
  const cache = new InMemoryCache();
  const service = buildService(tmdbCallCounter, cache);

  try {
    await assert.rejects(
      () => service.getBySlug('movie', 'this-movie-does-not-exist', undefined),
      NotFoundError
    );
    assert.equal(tmdbCallCounter.count, 1, 'first lookup should hit TMDB exactly once');

    const start = Date.now();
    await assert.rejects(
      () => service.getBySlug('movie', 'this-movie-does-not-exist', undefined),
      NotFoundError
    );
    const elapsedMs = Date.now() - start;

    assert.equal(
      tmdbCallCounter.count,
      1,
      'second identical lookup must be served from the negative cache, not TMDB'
    );
    assert.ok(
      elapsedMs < 25,
      `cached negative lookup should be near-instant, took ${elapsedMs}ms`
    );
  } finally {
    cache.destroy();
  }
});

test('getBySlug: concurrent identical lookups for a not-yet-cached slug are de-duped into a single TMDB call', async () => {
  const tmdbCallCounter = { count: 0 };
  const cache = new InMemoryCache();
  const service = buildService(tmdbCallCounter, cache);

  try {
    const results = await Promise.allSettled([
      service.getBySlug('movie', 'concurrent-missing-slug', undefined),
      service.getBySlug('movie', 'concurrent-missing-slug', undefined),
      service.getBySlug('movie', 'concurrent-missing-slug', undefined),
      service.getBySlug('movie', 'concurrent-missing-slug', undefined),
      service.getBySlug('movie', 'concurrent-missing-slug', undefined),
    ]);

    assert.ok(
      results.every((result) => result.status === 'rejected'),
      'all concurrent lookups for a missing slug should reject with NotFoundError'
    );
    assert.equal(
      tmdbCallCounter.count,
      1,
      '5 concurrent requests for the same missing slug should trigger exactly 1 TMDB call'
    );

    // The negative cache should now be populated for subsequent requests too.
    await assert.rejects(
      () => service.getBySlug('movie', 'concurrent-missing-slug', undefined),
      NotFoundError
    );
    assert.equal(tmdbCallCounter.count, 1, 'follow-up lookup should still be cached');
  } finally {
    cache.destroy();
  }
});

test('getBySlug: distinct missing slugs are cached independently', async () => {
  const tmdbCallCounter = { count: 0 };
  const cache = new InMemoryCache();
  const service = buildService(tmdbCallCounter, cache);

  try {
    await assert.rejects(() => service.getBySlug('movie', 'slug-one', undefined), NotFoundError);
    await assert.rejects(() => service.getBySlug('movie', 'slug-two', undefined), NotFoundError);

    assert.equal(
      tmdbCallCounter.count,
      2,
      'two distinct missing slugs should each hit TMDB once'
    );
  } finally {
    cache.destroy();
  }
});

test('getBySlug: missing program slugs use a bounded indexed candidate query instead of hydrating the day view', async () => {
  const cache = new InMemoryCache();
  const tmdbCallCounter = { count: 0 };
  const service = buildService(tmdbCallCounter, cache);
  const originalFind = TVReadAiringModel.find;
  const observed: { queries: Record<string, unknown>[]; limits: number[] } = {
    queries: [],
    limits: [],
  };

  (TVReadAiringModel as any).find = (query: Record<string, unknown>) => {
    observed.queries.push(query);
    return {
      sort: () => ({
        limit: (limit: number) => {
          observed.limits.push(limit);
          return { lean: () => ({ exec: async () => [] }) };
        },
      }),
    };
  };

  try {
    await assert.rejects(
      () => service.getBySlug('program', 'programa-inexistente-distinto', undefined),
      NotFoundError
    );

    assert.equal(observed.queries.length, 2, 'today and tomorrow should each use one bounded query');
    assert.deepEqual(observed.limits, [500, 500]);
    observed.queries.forEach((query) => {
      assert.deepEqual(query.searchTokens, { $in: ['inexistente', 'programa', 'distinto'] });
      assert.match(String(query.date), /^\d{8}$/);
    });
    assert.equal(tmdbCallCounter.count, 0, 'program lookup must not call TMDB');
  } finally {
    (TVReadAiringModel as any).find = originalFind;
    cache.destroy();
  }
});
