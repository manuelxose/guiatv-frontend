import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveGroundedRecommendations } from './AssistantGrounding';

test('provider recommendations without a catalog match are discarded', async () => {
  const candidates = [
    {
      catalogId: 'invented:123',
      title: 'Película inventada',
      type: 'movie',
      platform: 'Netflix',
      reason: 'El modelo dice que encaja.',
    },
  ];

  const resolved = await resolveGroundedRecommendations(
    candidates,
    async () => null,
    (candidate) => candidate
  );

  assert.deepEqual(resolved, []);
});

test('provider recommendations are mapped only after catalog resolution', async () => {
  const resolved = await resolveGroundedRecommendations(
    [{ title: 'Arrival', type: 'movie' as const }],
    async () => ({ catalogId: 'tmdb:329865', platform: 'Netflix' }),
    (candidate, match) => ({ ...candidate, ...match })
  );

  assert.deepEqual(resolved, [{
    title: 'Arrival',
    type: 'movie',
    catalogId: 'tmdb:329865',
    platform: 'Netflix',
  }]);
});
