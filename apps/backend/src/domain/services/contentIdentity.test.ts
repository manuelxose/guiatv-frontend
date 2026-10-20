import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransition,
  decideTitleMatch,
  ENTITY_ID_PATTERN,
  isGenericContentTitle,
  mayBeIndexable,
  newEntityId,
  normalizeContentPath,
  TitleKeyRow,
  titleIdentityKey,
  titleKeyId,
} from './contentIdentity';

const E1 = 'ce_01JBQ7Z4M8V2K5T3N9P6R1W0XA';
const E2 = 'ce_01JBQ7Z4M8V2K5T3N9P6R1W0XB';
const E3 = 'ce_01JBQ7Z4M8V2K5T3N9P6R1W0XC';

const row = (over: Partial<TitleKeyRow> & Pick<TitleKeyRow, 'key' | 'kind' | 'discriminator'>): TitleKeyRow => ({
  id: titleKeyId(over.key, over.kind, over.discriminator),
  state: 'verified',
  method: 'tmdb_id',
  confidence: 1,
  ...over,
});

test('newEntityId: ce_ + 26 Crockford chars, unique, time-ordered', () => {
  const ids = new Set(Array.from({ length: 1000 }, () => newEntityId()));
  assert.equal(ids.size, 1000);
  for (const id of ids) assert.match(id, ENTITY_ID_PATTERN);
  assert.ok(newEntityId(1_000) < newEntityId(2_000));
  assert.equal(newEntityId(0, new Uint8Array(10)), 'ce_' + '0'.repeat(26));
});

test('lifecycle: merged is terminal, removed is restorable, nothing is hard-deleted', () => {
  assert.ok(canTransition('candidate', 'active'));
  assert.ok(canTransition('active', 'merged'));
  assert.ok(canTransition('active', 'removed'));
  assert.ok(canTransition('removed', 'active'));
  assert.ok(!canTransition('merged', 'active'));
  assert.ok(!canTransition('active', 'candidate'));
  assert.ok(!canTransition('removed', 'merged'));
});

test('normalizeContentPath: deterministic spelling, unsafe and reserved inputs rejected', () => {
  assert.deepEqual(normalizeContentPath(' /Series/Friends/ '), { ok: true, path: '/series/friends' });
  assert.deepEqual(normalizeContentPath('/series/24'), { ok: true, path: '/series/24' });
  const reasons: Record<string, string> = {
    '/series/friends?x=1': 'unsafe_characters',
    '/series/fri%65nds': 'unsafe_characters',
    '/series/../admin': 'unsafe_characters',
    '/series//friends': 'unsafe_characters',
    '/series/espejo público': 'unsafe_characters',
    '/series\\friends': 'unsafe_characters',
    '/v2/catalog/x': 'bad_shape',
    '/canales/la-1': 'unknown_prefix',
    '/programas/-friends': 'bad_slug',
    '/programas/friends_t3': 'bad_slug',
    [`/programas/${'a'.repeat(81)}`]: 'bad_slug',
    '/programas/cine': 'reserved_slug',
    '/peliculas/fin-de-emision': 'reserved_slug',
  };
  for (const [input, reason] of Object.entries(reasons)) {
    assert.deepEqual(normalizeContentPath(input), { ok: false, reason }, input);
  }
  assert.deepEqual(normalizeContentPath(42), { ok: false, reason: 'not_a_string' });
});

test('titleIdentityKey: accents, season/episode markers, non-Latin titles', () => {
  assert.equal(titleIdentityKey('Espejo Público'), 'espejo_publico');
  assert.equal(titleIdentityKey('Espejo Publico'), 'espejo_publico');
  assert.equal(titleIdentityKey('La Promesa T1 E929'), 'la_promesa');
  assert.equal(titleIdentityKey('Aquí no hay quien viva - Capítulo 14'), 'aqui_no_hay_quien_viva');
  assert.equal(titleIdentityKey('Aquí no hay quien viva'), 'aqui_no_hay_quien_viva');
  // A named episode is not collapsed into the series: it stays its own key, never auto-merged.
  assert.equal(titleIdentityKey('Friends: El de la boda'), 'friends_el_de_la_boda');
  assert.equal(titleIdentityKey('24'), '24');
  assert.equal(titleIdentityKey('捕风追影2'), null);
  assert.equal(titleIdentityKey(''), null);
});

test('generic programme names are rejected, real titles are not', () => {
  for (const title of ['Cine', 'CINE', 'Noticias', 'Informativos', 'Deportes', 'Teletienda', 'Fin de emisión', 'Película']) {
    assert.ok(isGenericContentTitle(title), title);
    assert.deepEqual(
      decideTitleMatch({ title, kind: 'show', method: 'title', confidence: 1 }, []),
      { decision: 'rejected', reason: 'generic_title' },
      title
    );
  }
  // Containers carrying a film: the film is the identity, matched by its own title.
  for (const title of ['Cine: Matrix', 'El peliculón: Titanic']) assert.ok(isGenericContentTitle(title), title);
  // Named programmes built on slot words are real entities.
  for (const title of ['Espejo Público', 'Friends', 'Informativos Telecinco 15:00', 'Cine de barrio', 'Historia de nuestro cine', 'Cine western']) {
    assert.ok(!isGenericContentTitle(title), title);
  }
  assert.deepEqual(decideTitleMatch({ title: '捕风追影2', kind: 'movie', method: 'title', confidence: 1 }, []), {
    decision: 'rejected',
    reason: 'unkeyable_title',
  });
});

test('same title, different years: separate works; no year is ambiguous', () => {
  const rows = [
    row({ key: 'cenicienta', kind: 'movie', discriminator: 'tmdb:movie:11224', year: 1950, entityId: E1 }),
    row({ key: 'cenicienta', kind: 'movie', discriminator: 'tmdb:movie:150689', year: 2015, entityId: E2 }),
  ];
  const y2015 = decideTitleMatch({ title: 'Cenicienta', kind: 'movie', year: 2015, method: 'title', confidence: 1 }, rows);
  assert.equal(y2015.decision, 'bind');
  assert.equal(y2015.decision === 'bind' && y2015.row.entityId, E2);
  assert.equal(y2015.decision === 'bind' && y2015.row.state, 'candidate');

  // ±1 year is supporting evidence only: it nominates for review, never binds.
  const y2016 = decideTitleMatch({ title: 'Cenicienta', kind: 'movie', year: 2016, method: 'title', confidence: 1 }, rows);
  assert.equal(y2016.decision, 'review');
  assert.equal(y2016.decision === 'review' && y2016.row.reason, 'year_adjacent');
  assert.deepEqual(y2016.decision === 'review' && y2016.row.candidates, [E2]);
  assert.equal(y2016.decision === 'review' && y2016.row.entityId, undefined);

  const y2021 = decideTitleMatch({ title: 'Cenicienta', kind: 'movie', year: 2021, method: 'title', confidence: 1 }, rows);
  assert.equal(y2021.decision, 'create');

  const noYear = decideTitleMatch({ title: 'Cenicienta', kind: 'movie', method: 'title', confidence: 1 }, rows);
  assert.equal(noYear.decision, 'review');
  assert.equal(noYear.decision === 'review' && noYear.row.state, 'ambiguous');
  assert.deepEqual(noYear.decision === 'review' && noYear.row.candidates, [E1, E2]);
  assert.equal(noYear.decision === 'review' && noYear.row.entityId, undefined);
});

test('same title, film versus series: kind keeps them apart', () => {
  const rows = [row({ key: 'fargo', kind: 'movie', discriminator: 'tmdb:movie:275', year: 1996, entityId: E1 })];
  const series = decideTitleMatch({ title: 'Fargo', kind: 'series', method: 'title', confidence: 1 }, rows);
  assert.equal(series.decision, 'create');
  assert.equal(series.decision === 'create' && series.row.id, 'fargo|series|*');

  const seriesTmdb = decideTitleMatch(
    { title: 'Fargo', kind: 'series', tmdb: { type: 'tv', id: 60622 }, method: 'tmdb_exact', confidence: 0.95 },
    rows,
    null
  );
  assert.equal(seriesTmdb.decision, 'create');
  assert.equal(seriesTmdb.decision === 'create' && seriesTmdb.row.state, 'verified');

  // A TMDB ref typed for another kind is not reliable: review, never create or bind.
  for (const owner of [null, { entityId: E1, kind: 'movie' as const }]) {
    const mistyped = decideTitleMatch(
      { title: 'Fargo', kind: 'series', tmdb: { type: 'movie', id: 275 }, method: 'tmdb_id', confidence: 1 },
      rows,
      owner
    );
    assert.equal(mistyped.decision === 'review' && mistyped.row.reason, 'tmdb_type_mismatch');
    assert.equal(mistyped.decision === 'review' && mistyped.row.state, 'manual_review');
  }

  // TMDB id already owned by an entity of another kind: never auto-bound.
  const conflict = decideTitleMatch(
    { title: 'Fargo', kind: 'show', tmdb: { type: 'tv', id: 60622 }, method: 'tmdb_id', confidence: 1 },
    rows,
    { entityId: E2, kind: 'series' }
  );
  assert.equal(conflict.decision, 'review');
  assert.equal(conflict.decision === 'review' && conflict.row.reason, 'kind_conflict');
});

test('conflicting TMDB ids for one title: review unless years more than one apart separate them', () => {
  const rows = [row({ key: 'dog_house', kind: 'series', discriminator: 'tmdb:tv:1', entityId: E1 })];
  const rival = decideTitleMatch(
    { title: 'Dog House', kind: 'series', tmdb: { type: 'tv', id: 2 }, method: 'tmdb_id', confidence: 1 },
    rows,
    null
  );
  assert.equal(rival.decision, 'review');
  assert.equal(rival.decision === 'review' && rival.row.reason, 'tmdb_conflict');
  assert.deepEqual(rival.decision === 'review' && rival.row.candidates, [E1]);
  assert.equal(rival.decision === 'review' && rival.row.entityId, undefined);

  const dated = [row({ key: 'cenicienta', kind: 'movie', discriminator: 'tmdb:movie:11224', year: 1950, entityId: E1 })];
  const adjacentYear = { title: 'Cenicienta', kind: 'movie' as const, method: 'tmdb_id' as const, confidence: 1 };
  assert.equal(decideTitleMatch({ ...adjacentYear, tmdb: { type: 'movie', id: 7 }, year: 1951 }, dated, null).decision, 'review');
  const remake = decideTitleMatch({ ...adjacentYear, tmdb: { type: 'movie', id: 150689 }, year: 2015 }, dated, null);
  assert.equal(remake.decision, 'create');
  assert.equal(remake.decision === 'create' && remake.row.state, 'verified');
  const both = [...rows, row({ key: 'dog_house', kind: 'series', discriminator: 'tmdb:tv:2', entityId: E2 })];
  assert.equal(decideTitleMatch({ title: 'Dog House T2 E3', kind: 'series', method: 'title', confidence: 1 }, both).decision, 'review');
});

test('episode title versus series title: episode airings land on the series row', () => {
  const rows = [row({ key: 'aqui_no_hay_quien_viva', kind: 'series', discriminator: '*', entityId: E1, state: 'candidate', confidence: 0.8, method: 'title_kind' })];
  const episode = decideTitleMatch(
    { title: 'Aquí no hay quien viva - Capítulo 14', kind: 'series', method: 'title', confidence: 1 },
    rows
  );
  assert.equal(episode.decision, 'matched');
  assert.equal(episode.decision === 'matched' && episode.row.entityId, E1);
});

test('accented and non-accented spellings resolve to the same row', () => {
  const rows = [row({ key: 'espejo_publico', kind: 'show', discriminator: '*', entityId: E1, state: 'candidate', confidence: 0.8, method: 'title_kind' })];
  for (const title of ['Espejo Público', 'Espejo Publico', 'ESPEJO PÚBLICO']) {
    const d = decideTitleMatch({ title, kind: 'show', method: 'title', confidence: 1 }, rows);
    assert.equal(d.decision === 'matched' && d.row.entityId, E1, title);
  }
});

test('TMDB identity conflicts: existing owner is reused, low confidence never verifies or overwrites', () => {
  // Alias of a known TMDB work ("C.S.I. Miami" vs "CSI Miami") binds to the owner.
  const alias = decideTitleMatch(
    { title: 'C.S.I. Miami', kind: 'series', tmdb: { type: 'tv', id: 1620 }, method: 'tmdb_id', confidence: 1 },
    [],
    { entityId: E1, kind: 'series' }
  );
  assert.equal(alias.decision === 'bind' && alias.row.entityId, E1);
  assert.equal(alias.decision === 'bind' && alias.row.state, 'verified');

  // A fuzzy TMDB guess (substring / edit distance) is a candidate, not a verified identity.
  const fuzzy = decideTitleMatch(
    { title: 'Focus', kind: 'movie', tmdb: { type: 'movie', id: 256591 }, method: 'tmdb_exact', confidence: 0.6 },
    [],
    null
  );
  assert.equal(fuzzy.decision === 'create' && fuzzy.row.state, 'candidate');

  // A verified mapping wins over any later input for the same row.
  const verified = [row({ key: 'focus', kind: 'movie', discriminator: '*', entityId: E1, method: 'manual' })];
  const later = decideTitleMatch({ title: 'Focus', kind: 'movie', method: 'title', confidence: 0.1 }, verified);
  assert.equal(later.decision, 'matched');
  assert.equal(later.decision === 'matched' && later.row.entityId, E1);
  assert.equal(later.decision === 'matched' && later.row.state, 'verified');
});

test('ambiguous rows stay held; title-only bindings are capped below verified', () => {
  const held = [row({ key: 'rebeca', kind: 'movie', discriminator: '*', entityId: undefined, state: 'ambiguous', candidates: [E1, E2] })];
  assert.equal(decideTitleMatch({ title: 'Rebeca', kind: 'movie', method: 'title', confidence: 1 }, held).decision, 'held');

  const one = [row({ key: 'rubi', kind: 'series', discriminator: 'tmdb:tv:9', entityId: E3 })];
  const d = decideTitleMatch({ title: 'Rubí', kind: 'series', method: 'title', confidence: 1 }, one);
  assert.equal(d.decision, 'bind');
  assert.equal(d.decision === 'bind' && d.row.state, 'candidate');
  assert.equal(d.decision === 'bind' && d.row.confidence, 0.8);

  const unknownKind = [
    row({ key: 'rubi', kind: 'series', discriminator: 'tmdb:tv:9', entityId: E3 }),
    row({ key: 'rubi', kind: 'movie', discriminator: 'tmdb:movie:5', entityId: E1 }),
  ];
  assert.equal(decideTitleMatch({ title: 'Rubí', kind: 'unknown', method: 'title', confidence: 1 }, unknownKind).decision, 'review');
});

test('indexability: only active entities with a manual or reliable TMDB identity', () => {
  const at = (status: 'candidate' | 'active', method: 'manual' | 'tmdb_id' | 'tmdb_exact' | 'title' | 'title_year', confidence: number) =>
    mayBeIndexable({ status, matching: { method, confidence } });
  assert.ok(at('active', 'manual', 0.5));
  assert.ok(at('active', 'tmdb_id', 1));
  assert.ok(!at('active', 'tmdb_exact', 0.6));
  assert.ok(!at('active', 'title', 1));
  assert.ok(!at('active', 'title_year', 1));
  assert.ok(!at('candidate', 'manual', 1));
});
