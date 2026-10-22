import assert from 'node:assert/strict';
import test from 'node:test';
import { programDetailPath } from './detailPath';

test('programDetailPath uses the known airing id without guessing public work slugs', () => {
  assert.equal(programDetailPath('friends-slot'), '/contenido/program:friends-slot');
  assert.equal(programDetailPath('jurassic-slot'), '/contenido/program:jurassic-slot');
  assert.equal(programDetailPath('unsafe/id?#'), '/contenido/program:unsafe%2Fid%3F%23');
});
