import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCache } from '@/infrastructure/cache/InMemoryCache';
import { GetDiscoveryHome } from './GetDiscoveryHome';

test('GetDiscoveryHome falls back when catalog segments exceed timeout budget', async () => {
  const previousTimeout = process.env.DISCOVERY_HOME_SEGMENT_TIMEOUT_MS;
  const cache = new InMemoryCache();
  const tvReadQueryService = {
    query: async () => ({
      items: [],
      meta: { total: 0, limit: 12, hasMore: false },
      filters: {},
      generatedAt: new Date().toISOString(),
    }),
  };
  const catalogService = {
    query: () =>
      new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              items: [{ title: 'too late' }],
              meta: { page: 1, limit: 12, total: 1, hasMore: false },
              availableGenres: [],
              availablePlatforms: [],
            }),
          50
        );
      }),
    getPlatforms: () => [],
    mapTvReadItemToCatalogItem: (item: unknown) => item,
  };
  const getPersonalizedRecommendations = {
    execute: async () => [],
  };

  process.env.DISCOVERY_HOME_SEGMENT_TIMEOUT_MS = '10';

  const useCase = new GetDiscoveryHome(
    cache,
    tvReadQueryService as any,
    catalogService as any,
    getPersonalizedRecommendations as any
  );
  try {
    const result = await useCase.execute({ date: 'today' });

    assert.deepEqual(result.view.trendingItems, []);
    assert.deepEqual(result.view.freeItems, []);
  } finally {
    cache.destroy();
    if (previousTimeout === undefined) {
      delete process.env.DISCOVERY_HOME_SEGMENT_TIMEOUT_MS;
    } else {
      process.env.DISCOVERY_HOME_SEGMENT_TIMEOUT_MS = previousTimeout;
    }
  }
});
