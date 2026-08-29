import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findGenresInText,
  genreLabelsMatch,
  mapTmdbGenreIdsToTags,
  MOVIE_GENRE_NAME_TO_TMDB_ID,
  normalizeGenreLabel,
  normalizeGenreList,
  TV_GENRE_NAME_TO_TMDB_ID,
} from './genreTaxonomy';

// ─── Backward compatibility: forward TMDB id → tag table ──────────────────

test('mapTmdbGenreIdsToTags reproduces the original TMDB id -> tag table', () => {
  assert.deepEqual(mapTmdbGenreIdsToTags([28]), ['Acción']);
  assert.deepEqual(mapTmdbGenreIdsToTags([10759]), ['Acción']);
  assert.deepEqual(mapTmdbGenreIdsToTags([878]), ['Ciencia ficción']);
  assert.deepEqual(mapTmdbGenreIdsToTags([10765]), ['Ciencia ficción']);
  assert.deepEqual(mapTmdbGenreIdsToTags([53]), ['Suspense']);
  assert.deepEqual(mapTmdbGenreIdsToTags([9648]), ['Misterio']);
  assert.deepEqual(mapTmdbGenreIdsToTags([10768]), ['Política']);
  assert.deepEqual(mapTmdbGenreIdsToTags([10762]), ['Infantil']);
  assert.deepEqual(mapTmdbGenreIdsToTags([10751]), ['Familia']);
  assert.deepEqual(
    mapTmdbGenreIdsToTags([28, 10759, 999999]),
    ['Acción'],
    'unknown ids are dropped, duplicate labels are de-duped'
  );
});

// ─── Backward compatibility: reverse alias → TMDB discover id tables ──────

test('discover id tables reproduce the original CatalogService lookup tables', () => {
  const movieCases: Array<[string, number]> = [
    ['accion', 28], ['aventura', 12], ['animacion', 16], ['comedia', 35],
    ['crimen', 80], ['documental', 99], ['drama', 18], ['familia', 10751],
    ['fantasia', 14], ['historia', 36], ['terror', 27], ['musica', 10402],
    ['misterio', 9648], ['romance', 10749], ['ciencia ficcion', 878],
    ['scifi', 878], ['suspenso', 53], ['suspense', 53], ['tvmovie', 10770],
    ['thriller', 53], ['guerra', 10752], ['western', 37],
  ];
  for (const [alias, id] of movieCases) {
    assert.equal(MOVIE_GENRE_NAME_TO_TMDB_ID[alias], id, `movie alias "${alias}"`);
  }

  const tvCases: Array<[string, number]> = [
    ['accion', 10759], ['aventura', 10759], ['animacion', 16], ['comedia', 35],
    ['crimen', 80], ['documental', 99], ['drama', 18], ['familia', 10751],
    ['infantil', 10762], ['kids', 10762], ['misterio', 9648], ['noticias', 10763],
    ['reality', 10764], ['ciencia ficcion', 10765], ['scifi', 10765],
    ['soap', 10766], ['talk', 10767], ['guerra', 10768], ['politica', 10768],
    ['suspense', 9648], ['thriller', 9648],
  ];
  for (const [alias, id] of tvCases) {
    assert.equal(TV_GENRE_NAME_TO_TMDB_ID[alias], id, `tv alias "${alias}"`);
  }
});

// ─── New behavior: alias/composite normalization ──────────────────────────

test('normalizeGenreLabel resolves Spanish, English, and composite source values', () => {
  assert.equal(normalizeGenreLabel('Action & Adventure'), 'Acción');
  assert.equal(normalizeGenreLabel('Acción/Aventura'), 'Acción');
  assert.equal(normalizeGenreLabel('Cine de acción'), 'Acción');
  assert.equal(normalizeGenreLabel('Sci-Fi'), 'Ciencia ficción');
  assert.equal(normalizeGenreLabel('Ciencia ficción'), 'Ciencia ficción');
  assert.equal(normalizeGenreLabel('Thriller'), 'Suspense');
  assert.equal(normalizeGenreLabel('Suspense'), 'Suspense');
  assert.equal(normalizeGenreLabel('Horror'), 'Terror');
  assert.equal(normalizeGenreLabel('Comedy'), 'Comedia');
  assert.equal(normalizeGenreLabel(''), undefined);
  assert.equal(normalizeGenreLabel('Not A Genre'), undefined);
});

test('normalizeGenreList splits composites and keeps unknown values instead of dropping them', () => {
  assert.deepEqual(normalizeGenreList('Acción/Aventura'), ['Acción', 'Aventura']);
  assert.deepEqual(normalizeGenreList(['Sci-Fi', 'Terror']), ['Ciencia ficción', 'Terror']);
  assert.deepEqual(normalizeGenreList('Rareza Editorial X'), ['Rareza Editorial X']);
  assert.deepEqual(normalizeGenreList(undefined), []);
});

test('genreLabelsMatch treats aliases as equal to their canonical label', () => {
  assert.equal(genreLabelsMatch('Acción', 'action'), true);
  assert.equal(genreLabelsMatch('Ciencia ficción', 'sci-fi'), true);
  assert.equal(genreLabelsMatch('Suspense', 'thriller'), true);
  assert.equal(genreLabelsMatch('Acción', 'Drama'), false);
});

// ─── New behavior: chatbot free-text genre detection ──────────────────────

test('findGenresInText detects the documented chatbot queries', () => {
  assert.deepEqual(findGenresInText('qué películas de acción están echando ahora'), ['Acción']);
  assert.deepEqual(findGenresInText('qué thrillers hay esta noche'), ['Suspense']);
  assert.deepEqual(findGenresInText('hay alguna película de ciencia ficción ahora'), ['Ciencia ficción']);
  assert.deepEqual(findGenresInText('qué comedias ponen hoy'), ['Comedia']);
});

test('findGenresInText supports English wording and composite phrases', () => {
  assert.deepEqual(findGenresInText('any good sci-fi movies on now?'), ['Ciencia ficción']);
  assert.deepEqual(findGenresInText('show me action & adventure films'), ['Acción', 'Aventura']);
  assert.deepEqual(findGenresInText('algo de terror para esta noche'), ['Terror']);
  assert.deepEqual(findGenresInText(''), []);
});
