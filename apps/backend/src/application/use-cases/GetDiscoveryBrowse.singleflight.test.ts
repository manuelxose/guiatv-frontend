import test from 'node:test';
import assert from 'node:assert/strict';
import { GetDiscoveryBrowse } from './GetDiscoveryBrowse';

test('concurrent identical browse misses share one catalog load', async () => {
  let queries = 0;
  const catalog = {
    query: async () => {
      queries += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { items: [], availableGenres: [], availablePlatforms: [], meta: {} };
    },
    getPlatforms: () => [],
    mapTvReadItemToCatalogItem: (item: unknown) => item,
  };
  const tv = { query: async () => ({ items: [] }) };
  const cache = { get: async () => null, set: async () => undefined };
  const useCase = new GetDiscoveryBrowse(cache as any, tv as any, catalog as any);

  await Promise.all(Array.from({ length: 8 }, () => useCase.execute({ contentType: 'series', limit: 8 })));
  assert.equal(queries, 1);
  await useCase.execute({ contentType: 'series', limit: 8 });
  assert.equal(queries, 2, 'the in-flight entry is released afterwards');
});
