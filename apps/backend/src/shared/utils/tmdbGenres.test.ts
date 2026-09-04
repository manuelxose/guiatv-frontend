import assert from 'node:assert/strict';
import test from 'node:test';
import { mapTmdbGenreIdsToTags } from './tmdbGenres';

test('maps TMDB movie and TV action genre IDs to the canonical Acción tag', () => {
  assert.deepEqual(mapTmdbGenreIdsToTags([28, 10759, 999999]), ['Acción']);
});
