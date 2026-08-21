import test from 'node:test';
import assert from 'node:assert/strict';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { CacheEnvelope, StaleWhileRevalidateCache } from './StaleWhileRevalidateCache';

function memoryRepository(): ICacheRepository & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>();
  return {
    store,
    get: async <T>(key: string) => (store.get(key) as T | undefined) ?? null,
    set: async <T>(key: string, value: T) => { store.set(key, value); },
    delete: async (key: string) => { store.delete(key); },
    clear: async () => { store.clear(); },
  };
}

test('coalesces concurrent cold misses into one loader call', async () => {
  const repository = memoryRepository();
  const cache = new StaleWhileRevalidateCache(repository);
  let calls = 0;
  const loader = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { value: 'fresh' };
  };

  const results = await Promise.all(Array.from({ length: 20 }, () =>
    cache.getOrLoad('v2:test:cold', { freshSeconds: 30, staleSeconds: 60 }, loader)
  ));

  assert.equal(calls, 1);
  assert.ok(results.every((result) => result.value === 'fresh'));
});

test('returns stale immediately and refreshes once in the background', async () => {
  const repository = memoryRepository();
  const now = Date.now();
  repository.store.set('v2:test:stale', {
    value: 'stale',
    freshUntil: now - 1,
    staleUntil: now + 60_000,
  } satisfies CacheEnvelope<string>);
  const cache = new StaleWhileRevalidateCache(repository);
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return 'refreshed';
  };

  const [first, second] = await Promise.all([
    cache.getOrLoad('v2:test:stale', { freshSeconds: 30, staleSeconds: 60 }, loader),
    cache.getOrLoad('v2:test:stale', { freshSeconds: 30, staleSeconds: 60 }, loader),
  ]);
  assert.equal(first, 'stale');
  assert.equal(second, 'stale');

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(calls, 1);
  const envelope = await repository.get<CacheEnvelope<string>>('v2:test:stale');
  assert.equal(envelope?.value, 'refreshed');
});

test('does not cache rejected or semantically empty values', async () => {
  const repository = memoryRepository();
  const cache = new StaleWhileRevalidateCache(repository);
  await cache.getOrLoad('v2:test:empty', { freshSeconds: 30, staleSeconds: 60 }, async () => [], (value) => value.length > 0);
  assert.equal(await repository.get('v2:test:empty'), null);
});
