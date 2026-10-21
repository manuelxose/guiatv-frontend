import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransition,
  classifyContentKind,
  decideIngestionMatch,
  decideTitleMatch,
  entityCandidatePaths,
  legacyCatalogSlugs,
  slugifyEntityTitle,
  ENTITY_ID_PATTERN,
  isGenericContentTitle,
  mayBeIndexable,
  newEntityId,
  normalizeContentPath,
  parseEpgTitle,
  HistoricWork,
  planCanonicalPaths,
  TitleKeyRow,
  titleIdentityKey,
  titleKeyId,
} from './contentIdentity';
import { CatalogService } from '@/application/services/CatalogService';
import { readContentIdentityFlags } from '@/shared/config/contentEntities';

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

test('2D-2 slugs: transliterated, markers dropped, null when there is no usable slug', () => {
  const cases: Array<[string, string | null]> = [
    ['Espejo Público', 'espejo-publico'],
    ["Grey's Anatomy", 'greys-anatomy'],
    ['C.S.I. Miami', 'csi-miami'],
    ['La Promesa T1 E929', 'la-promesa'],
    ['Sueños de libertad T1 E672', 'suenos-de-libertad'],
    ['Mañaneros 360', 'mananeros-360'],
    ['Fast & Furious 7', 'fast-furious-7'],
    ['Øyvind og Æsir', 'oyvind-og-aesir'],
    ['Cine de barrio', 'cine-de-barrio'],
    ['1899', null],
    ['捕风追影2', null],
    ['Noticias', null],
    ['', null],
  ];
  for (const [title, slug] of cases) assert.equal(slugifyEntityTitle(title), slug, title);
  const glued = 'El escaparate ' + 'la lectura en verano y otras historias '.repeat(10);
  assert.equal(titleIdentityKey(glued), null, 'a synopsis glued onto the title is not a title');
  assert.equal(slugifyEntityTitle(glued), null);
  const long = slugifyEntityTitle('palabra '.repeat(14)) as string;
  assert.ok(long.length <= 80 && !long.endsWith('-') && long.endsWith('palabra'));
});

test('2D-2 candidate paths: kind prefix, year only as an explicit disambiguator, nothing for unknown', () => {
  assert.deepEqual(entityCandidatePaths('movie', 'Cenicienta', 2015), ['/peliculas/cenicienta', '/peliculas/cenicienta-2015']);
  assert.deepEqual(entityCandidatePaths('series', 'Friends'), ['/series/friends']);
  assert.deepEqual(entityCandidatePaths('show', 'Espejo Público'), ['/programas/espejo-publico']);
  assert.deepEqual(entityCandidatePaths('unknown', 'Friends'), []);
  assert.deepEqual(entityCandidatePaths('show', 'Noticias'), []);
});

test('2D-2 legacy slugs match CatalogService (recognition only)', () => {
  const proto = CatalogService.prototype as any;
  for (const title of ['Espejo Público', 'Romería del Rocío', 'Noé', "Grey's Anatomy", 'C.S.I. Miami', '  ', 'Asesinato en Mónaco']) {
    const legacy = proto.slugify.call(proto, title);
    const transliterated = proto.slugifyTitle.call(proto, title);
    assert.deepEqual(legacyCatalogSlugs(title), [...new Set([legacy, transliterated])], title);
  }
  assert.deepEqual(legacyCatalogSlugs('Noé'), ['no', 'noe']);
});

test('2D-2 kind: TMDB decides film vs TV, named slots are shows, mixed categories stay unknown', () => {
  const k = (title: string, editorialCategory?: string, tmdbType?: 'movie' | 'tv', sportFacet?: string) =>
    classifyContentKind({ title, editorialCategory, tmdbType, sportFacet });
  assert.equal(k('Cine de barrio', 'Cine'), 'show');
  assert.equal(k('Historia de nuestro cine', 'Cine'), 'show');
  assert.equal(k('Cinema Paradiso', 'Cine'), 'movie');
  assert.equal(k('Fargo', 'Cine'), 'movie');
  assert.equal(k('Fargo', 'Series', 'tv'), 'series');
  assert.equal(k('Fargo', 'Cine', 'tv'), 'show', 'TMDB TV beats a film category; not scripted evidence, so show');
  assert.equal(k('El hormiguero', 'Entretenimiento', 'tv'), 'show');
  assert.equal(k('Fargo', 'Series', 'movie'), 'movie');
  assert.equal(k('La Promesa', 'Series'), 'series');
  assert.equal(k('Telediario', 'Noticias'), 'show');
  assert.equal(k('Real Madrid - Barcelona', 'Deportes', undefined, 'futbol'), 'sport');
  assert.equal(k('Bluey', 'Infantil'), 'unknown');
  assert.equal(k('Planeta azul', 'Documental'), 'unknown');
  assert.equal(k('Algo', 'Otros'), 'unknown');
  assert.equal(k('La 2 en concierto', 'Música'), 'show');
  assert.equal(k('El día del Señor', 'Religión'), 'show');
});

test('2D-2 unknown kind never creates or binds; it waits for review with evidence', () => {
  const input = { title: 'Fargo', kind: 'unknown' as const, method: 'title' as const, confidence: 0.8 };
  const fresh = decideIngestionMatch(input, []);
  assert.equal(fresh.decision, 'review');
  assert.equal(fresh.decision === 'review' && fresh.row.reason, 'unknown_kind');
  assert.equal(fresh.decision === 'review' && fresh.row.entityId, undefined);
  const withSeries = decideIngestionMatch(input, [row({ key: 'fargo', kind: 'series', discriminator: '*', entityId: E1 })]);
  assert.deepEqual(withSeries.decision === 'review' && withSeries.row.candidates, [E1]);
  // A reviewed (bound) unknown row is respected; a rejected row stays held.
  assert.equal(decideIngestionMatch(input, [row({ key: 'fargo', kind: 'unknown', discriminator: '*', entityId: E2 })]).decision, 'matched');
  const rejected = row({ key: 'fargo', kind: 'series', discriminator: '*', state: 'rejected' });
  assert.equal(decideIngestionMatch({ ...input, kind: 'series' }, [rejected]).decision, 'held');
});

test('2D-2 rejected title: a later sighting with a year or TMDB id goes to review, not to a new entity', () => {
  const rejected = row({ key: 'mi_casa', kind: 'movie', discriminator: '*', state: 'rejected', entityId: undefined, method: 'manual' });
  const withYear = decideIngestionMatch({ title: 'Mi casa', kind: 'movie', year: 2001, method: 'title', confidence: 0.8 }, [rejected]);
  assert.equal(withYear.decision, 'review');
  assert.equal(withYear.decision === 'review' && withYear.row.reason, 'rejected_title');
  const withTmdb = decideIngestionMatch({ title: 'Mi casa', kind: 'movie', tmdb: { type: 'movie', id: 7 }, method: 'tmdb_exact', confidence: 0.9 }, [rejected]);
  assert.equal(withTmdb.decision === 'review' && withTmdb.row.reason, 'rejected_title');
  // The same title as another kind is another identity, and the exact rejected row stays held.
  assert.equal(decideIngestionMatch({ title: 'Mi casa', kind: 'show', method: 'title', confidence: 0.8 }, [rejected]).decision, 'create');
  assert.equal(decideIngestionMatch({ title: 'Mi casa', kind: 'movie', method: 'title', confidence: 0.8 }, [rejected]).decision, 'held');
  // A rating line in the title field is not a work.
  assert.equal(isGenericContentTitle('★6.8/10'), true);
  assert.equal(isGenericContentTitle('9-1-1'), false);
});

test('2D-2 path ownership: evidence decides, never arrival order', () => {
  const works: Record<string, HistoricWork[]> = {
    cenicienta: [
      { keys: new Set(['la_cenicienta', 'cenicienta']), tmdb: { type: 'movie', id: 11224 }, year: 1950 },
      { keys: new Set(['cenicienta']), tmdb: { type: 'movie', id: 150689 }, year: 2015 },
      { keys: new Set(['cenicienta']) },
    ],
    fargo: [
      { keys: new Set(['fargo']), tmdb: { type: 'movie', id: 275 }, year: 1996 },
      { keys: new Set(['fargo']), tmdb: { type: 'tv', id: 60622 }, year: 2014 },
    ],
    no: [{ keys: new Set(['noe']) }, { keys: new Set(['no']) }],
    'espejo-publico': [{ keys: new Set(['espejo_publico']) }],
  };
  const ownersOf = (slug: string) => works[slug] ?? [];
  const film = (title: string, year?: number, id?: number) =>
    planCanonicalPaths({ kind: 'movie', title, year, externalIds: id ? { tmdb: { type: 'movie', id } } : {} }, ownersOf);

  // Remakes: two TMDB works answer the bare slug, so neither takes it; each gets its year path.
  const c1950 = film('Cenicienta', 1950, 11224);
  const c2015 = film('Cenicienta', 2015, 150689);
  assert.deepEqual([c1950.paths, c1950.blocked], [['/peliculas/cenicienta-1950'], ['historic_ambiguous']]);
  assert.deepEqual([c2015.paths, c2015.blocked], [['/peliculas/cenicienta-2015'], ['historic_ambiguous']]);
  // A title-only remake proves nothing: no bare slug, and no year path a TMDB work of that year answers.
  assert.deepEqual(film('Cenicienta', 2021).paths, ['/peliculas/cenicienta-2021']);
  assert.deepEqual(film('Cenicienta', 1950).blocked, ['historic_ambiguous', 'historic_unverified']);
  assert.deepEqual(film('Cenicienta').paths, []);
  assert.deepEqual(film('Película nueva sin ficha').blocked, ['historic_unverified'], 'title-only film: bare slug never automatic');
  assert.deepEqual(film('Película nueva sin ficha', 2020).paths, ['/peliculas/pelicula-nueva-sin-ficha-2020']);
  // A TMDB work the evidence doesn't name can't take a slug another TMDB work answers.
  assert.deepEqual(film('Cenicienta', 2015, 999).paths, []);

  // Prefix-aware: the film owns /peliculas/fargo, the series /series/fargo, whatever arrives first.
  assert.deepEqual(film('Fargo', 1996, 275).paths, ['/peliculas/fargo', '/peliculas/fargo-1996']);
  const series = planCanonicalPaths({ kind: 'series', title: 'Fargo', year: 2014, externalIds: { tmdb: { type: 'tv', id: 60622 } } }, ownersOf);
  assert.deepEqual(series.paths, ['/series/fargo', '/series/fargo-2014']);
  assert.deepEqual(series.historic, ['/series/fargo'], 'a legacy title of the same work answered it: verified owner');
  const titleOnlySeries = planCanonicalPaths({ kind: 'series', title: 'Fargo', externalIds: {} }, ownersOf);
  assert.deepEqual(titleOnlySeries.blocked, ['historic_unverified'], 'a TMDB series answers it; the title-only one may be a duplicate');

  const show = (title: string) => planCanonicalPaths({ kind: 'show', title, externalIds: {} }, ownersOf);
  assert.deepEqual(show('No').blocked, ['historic_conflict']);
  assert.deepEqual([show('Espejo Público').paths, show('Espejo Público').historic], [['/programas/espejo-publico'], ['/programas/espejo-publico']]);
  assert.deepEqual(show('Programa sin historia').historic, []);
  // 2C inventory: a legacy URL planned as a 301 or left to prefix review is never allocated.
  assert.deepEqual(show('Espacio Innovación').paths, ['/programas/espacio-innovacion']);
  assert.deepEqual(show('Rizzoli & Isles').paths, ['/programas/rizzoli-isles'], 'its historic URL, not accent damage');
  assert.deepEqual(show('Modern Family').blocked, ['inventory_review']);
  assert.deepEqual(planCanonicalPaths({ kind: 'series', title: 'La Promesa T1 E929', externalIds: {} }, ownersOf).blocked, ['inventory_review']);
  assert.deepEqual(planCanonicalPaths({ kind: 'movie', title: '300', year: 2007, externalIds: {} }, ownersOf).blocked, ['unsupported_slug']);
  assert.deepEqual(show('Noticias').blocked, ['reserved_slug']);

  // Order independence: the plan is a pure function of the entity and the evidence.
  const all = [c1950, c2015, film('Fargo', 1996, 275), series].map((p) => JSON.stringify(p));
  const reversed = [series, film('Fargo', 1996, 275), c2015, c1950].map((p) => JSON.stringify(p)).reverse();
  assert.deepEqual(all, reversed);
});

test('2D-2 flags: separate, default off, writes need the database name', () => {
  const f = (env: Record<string, string>, db = 'guiatv') => readContentIdentityFlags(env, db);
  const off = { shadow: false, writes: false, airingRefs: false };
  assert.deepEqual(f({}), off);
  assert.deepEqual(f({ CONTENT_ENTITIES_ENABLED: 'true' }), off, '2D-1 flag alone changes nothing in 2D-2');
  assert.deepEqual(f({ CONTENT_IDENTITY_SHADOW: 'true' }), { ...off, shadow: true });
  assert.deepEqual(f({ CONTENT_ENTITIES_ENABLED: 'true', CONTENT_IDENTITY_WRITES: 'true' }), off, '"true" is not a database name');
  assert.deepEqual(f({ CONTENT_IDENTITY_WRITES: 'guiatv' }), off, 'writes need the 2D-1 flag');
  assert.deepEqual(f({ CONTENT_ENTITIES_ENABLED: 'true', CONTENT_IDENTITY_WRITES: 'guiatv' }, 'guiatv_test'), off, 'other database');
  assert.deepEqual(f({ CONTENT_ENTITIES_ENABLED: 'true', CONTENT_IDENTITY_WRITES: 'guiatv' }), { ...off, writes: true });
  assert.deepEqual(f({ CONTENT_IDENTITY_AIRING_REFS: 'true' }), off, 'refs need writes');
  assert.deepEqual(
    f({ CONTENT_ENTITIES_ENABLED: 'true', CONTENT_IDENTITY_WRITES: 'guiatv', CONTENT_IDENTITY_AIRING_REFS: 'true' }),
    { shadow: false, writes: true, airingRefs: true }
  );
  assert.deepEqual(f({ CONTENT_ENTITIES_ENABLED: 'true', CONTENT_IDENTITY_WRITES: '' }, ''), off);
});

// ---------------------------------------------------------------------------------------------
// 2D-2E: EPG title parsing. Real production spellings (2D-2D sample, 20261020) unless noted.

test('parseEpgTitle: season/episode markers in every feed format give the work and the numbers', () => {
  const cases: Array<[string, string, number | undefined, number | undefined, string | undefined]> = [
    ['9-1-1 T4 E3 · El futuro', '9-1-1', 4, 3, 'El futuro'],
    ['Alerta Cobra T22 Ep09', 'Alerta Cobra', 22, 9, undefined],
    ['Agrosfera T26 E812', 'Agrosfera', 26, 812, undefined],
    ['Bluey T4E3', 'Bluey', 4, 3, undefined],
    ['Friends S04E03', 'Friends', 4, 3, undefined],
    ['Friends 4x03', 'Friends', 4, 3, undefined],
    ['Friends Temporada 4 Episodio 3', 'Friends', 4, 3, undefined],
    ['Lazos mortales Temporada 2', 'Lazos mortales', 2, undefined, undefined],
    ['Aquí no hay quien viva - Capítulo 12', 'Aquí no hay quien viva', undefined, 12, undefined],
    ['Velvet Ep. 12', 'Velvet', undefined, 12, undefined],
    ['Un si grand soleil: Episode 1923', 'Un si grand soleil', undefined, 1923, undefined],
    ['Com si fos ahir T10 E30 · Episodi 30', 'Com si fos ahir', 10, 30, 'Episodi 30'],
    ['Aire Lliure T1 · Ebre, amb Peyu', 'Aire Lliure', 1, undefined, 'Ebre, amb Peyu'],
    ['Amanda y Alan: reformas a la italiana T1 · 4', 'Amanda y Alan: reformas a la italiana', 1, undefined, '4'],
    ['Rosario (76) 12', 'Rosario', undefined, 76, undefined],
    ['Autopista hacia el cielo (171) 7', 'Autopista hacia el cielo', undefined, 171, undefined],
    ['Chicago P.D. T10 E14 · Atrapada', 'Chicago P.D.', 10, 14, 'Atrapada'],
    ['Camera Café T1 E109 · Guerra De Pintura - Amiga Frita', 'Camera Café', 1, 109, 'Guerra De Pintura - Amiga Frita'],
    ['Los pequeños asesinatos de Agatha Christie: años 50 T1 E18 · El espejo se rompió', 'Los pequeños asesinatos de Agatha Christie: años 50', 1, 18, 'El espejo se rompió'],
    // The feed repeats the episode name in the title: only that repetition drops a colon segment.
    ['UFO Witness: Órbitas e insectoides T2 E2 · Órbitas e insectoides', 'UFO Witness', 2, 2, 'Órbitas e insectoides'],
  ];
  for (const [title, work, season, episode, episodeTitle] of cases) {
    const p = parseEpgTitle(title);
    assert.equal(p.resolutionState, 'episode', title);
    assert.equal(p.originalTitle, title, 'the original title is kept as it is');
    assert.deepEqual([p.proposedWorkTitle, p.seasonNumber, p.episodeNumber, p.episodeTitle], [work, season, episode, episodeTitle], title);
  }
  assert.equal(parseEpgTitle('Alerta Cobra T22 Ep09').evidenceSource, 'title_marker');
  assert.equal(parseEpgTitle('Alerta Cobra T22 Ep09').confidence, 'high');
  assert.deepEqual([parseEpgTitle('Criaturas indefensas · (The dog lover)').evidenceSource, parseEpgTitle('Criaturas indefensas · (The dog lover)').episodeTitle], ['title_separator', undefined], 'a parenthesised original title is not an episode name');
});

test('parseEpgTitle: XMLTV sub-title is episode evidence; a repeated sub-title is cut from the title', () => {
  const p = parseEpgTitle('Alerta Cobra · Doble juego', 'Doble juego');
  assert.deepEqual([p.resolutionState, p.proposedWorkTitle, p.episodeTitle, p.evidenceSource, p.confidence], ['episode', 'Alerta Cobra', 'Doble juego', 'xmltv_subtitle', 'high']);
  const dash = parseEpgTitle('A pedir de boca - Setas de otoño', 'Setas de otoño');
  assert.deepEqual([dash.resolutionState, dash.proposedWorkTitle], ['episode', 'A pedir de boca'], 'the dedicated field settles an otherwise uncertain " - "');
  const apart = parseEpgTitle('Alerta Cobra', 'Doble juego');
  assert.deepEqual([apart.resolutionState, apart.proposedWorkTitle, apart.episodeTitle], ['work', 'Alerta Cobra', 'Doble juego']);
  // The grid already swapped a generic title for its sub-title ("Cine" + "Matrix" -> "Matrix", "Matrix").
  assert.equal(parseEpgTitle('Matrix', 'Matrix').resolutionState, 'work');
});

test('parseEpgTitle: " - " and " : " are uncertain, a colon without a space is part of the title', () => {
  for (const [title, work] of [
    ['A pedir de boca - Setas de otoño', 'A pedir de boca'],
    ['9-1-1 : ¿De qué te quejas', '9-1-1'],
    ['FBI : Promesas Rotas', 'FBI'],
    ['Los conciertos de Radio 3 - Tako', 'Los conciertos de Radio 3'],
    ['Misión imposible - Fallout', 'Misión imposible'],
  ]) {
    const p = parseEpgTitle(title);
    assert.deepEqual([p.resolutionState, p.confidence, p.proposedWorkTitle, p.uncertainSplit?.workTitle], ['uncertain', 'low', title, work], title);
  }
  assert.deepEqual(parseEpgTitle('Rosario (76) - La boda').uncertainSplit, { workTitle: 'Rosario', workKey: 'rosario', episodeTitle: 'La boda' });
  assert.equal(titleIdentityKey(parseEpgTitle('Rosario (76) - La boda').uncertainSplit!.workTitle), 'rosario', 'the split key is the key matching computes');
  assert.deepEqual([parseEpgTitle('Noticias - Edición tarde').resolutionState, parseEpgTitle('Noticias - Edición tarde').uncertainSplit], ['work', undefined], 'a slot word is never the work');
  assert.equal(parseEpgTitle('Cine - Matrix').resolutionState, 'generic', 'a film container: the film is matched by its own title');
  for (const title of [
    'Agatha Christie: Poirot', 'Peter Rabbit 2: A la fuga', 'Expediente 64: Los casos del departamento Q', 'S.W.A.T.: Los hombres de Harrelson',
    'Catfish: mentiras en la red', 'Blue Bloods (Familia de policías)', 'Brooklyn Nine-Nine', 'Acacias, 38', 'Un día en la Historia de España: 20 de octubre de 1982',
    'Los conciertos de Radio 3 - Fito y los Fitipaldis (1999)'.replace(' - ', ' '),
  ]) {
    const p = parseEpgTitle(title);
    assert.deepEqual([p.resolutionState, p.proposedWorkTitle], ['work', title], title);
  }
});

test('parseEpgTitle: slots, episode-only and non-Latin titles hold no work', () => {
  for (const title of ['Repetición de programas', 'Programación local', 'Fin de emisión', 'Información de programación', 'Cine', 'Película', 'Próximamente', 'Espacio promocional', 'Programación especial', 'Avance Informativo', 'Cine: Matrix', '★6.8/10']) {
    assert.equal(parseEpgTitle(title).resolutionState, 'generic', title);
    assert.ok(isGenericContentTitle(title), title);
  }
  // Legitimate works whose titles contain slot words.
  for (const title of ['Cine de barrio', 'Historia de nuestro cine', 'Programación local de Navidad en Lugo', 'Próximamente en cines', 'Noticias de un secuestro', 'Repetición', 'Cine western']) {
    assert.notEqual(parseEpgTitle(title).resolutionState, 'generic', title);
  }
  for (const title of ['Episodio 770', 'T11 - Episodio 6', 'Capítulo 12', 'S01E02']) {
    const p = parseEpgTitle(title);
    assert.deepEqual([p.resolutionState, p.normalizedWorkKey], ['no_work', null], title);
  }
  for (const title of ['捕风追影2 T1 E3', 'Ελληνικά T1', 'Москва слезам не верит', '', '   ', '·', ' - ']) {
    assert.equal(parseEpgTitle(title).normalizedWorkKey, null, JSON.stringify(title));
  }
});

test('2D-2E regressions: digits, punctuation, accents and episode-like words do not split or merge works', () => {
  const key = (t: string) => titleIdentityKey(t);
  // A one-off documentary or film with an episode-like word keeps its title.
  for (const [title, k] of [
    ['Apolo 13', 'apolo_13'], ['Capítulo final', 'capitulo_final'], ['El capítulo perdido', 'el_capitulo_perdido'],
    ['La guerra civil española, parte 2', 'la_guerra_civil_espanola_parte_2'], ['Dune: Parte dos', 'dune_parte_dos'],
    ['Malcolm X', 'malcolm_x'], ['Supervivientes 4x4', 'supervivientes_4x4'], ['Mossèn Capellà', 'mossen_capella'], ['Capitán Conan', 'capitan_conan'],
    ['T2 Trainspotting', 't2_trainspotting'], ['Ocean\'s 11', 'ocean_s_11'], ['Fast & Furious 7', 'fast_furious_7'], ['Mañaneros 360', 'mananeros_360'],
    ['24', '24'], ['9-1-1', '9_1_1'],
  ]) {
    assert.equal(key(title), k, title);
    assert.notEqual(parseEpgTitle(title).resolutionState, 'episode', title);
  }
  assert.notEqual(key('T2 Trainspotting'), key('Trainspotting'), 'a sequel is not the first film');
  assert.notEqual(key('Dune: Parte dos'), key('Dune'), '"parte" is a film part, not an episode');
  // Two shows with similar names stay apart; a series with many episode titles is one work.
  assert.notEqual(key('MasterChef Junior T10 E3'), key('MasterChef T12 E3'));
  assert.notEqual(key('Supervivientes: Tierra de nadie'), key('Supervivientes'));
  const episodes = ['FBI T2 E17 · Promesas rotas', 'FBI T2 E18 · Amenaza', 'FBI T3 E1', 'FBI'];
  assert.deepEqual(new Set(episodes.map(key)), new Set(['fbi']));
  // An anthology with titled installments is one work, its installments are episodes.
  assert.equal(key('Historias para no dormir T1 E3 · El doble'), key('Historias para no dormir T1 E4 · La casa'));
  // Accents fold, non-Latin titles have no key.
  assert.equal(key('Sueños de libertad T1 E672'), 'suenos_de_libertad');
  assert.equal(key('Pasión Prohibida T1 E30'), key('Pasion prohibida'));
  assert.equal(slugifyEntityTitle('Chicago P.D. T10 E14 · Atrapada'), 'chicago-pd');
  assert.equal(slugifyEntityTitle('9-1-1 T4 E3 · El futuro'), null, 'digits only: no slug, as before');
  assert.equal(slugifyEntityTitle('Alerta Cobra T22 Ep09'), 'alerta-cobra');
});

test('2D-2E cross-kind: a title alone never merges kinds nor creates a twin; distinct TMDB works may share a title', () => {
  const film = row({ key: 'la_gran_belleza', kind: 'movie', discriminator: 'tmdb:movie:179144', entityId: E1 });
  const series = (over: Partial<Parameters<typeof decideIngestionMatch>[0]> = {}) =>
    decideIngestionMatch({ title: 'La gran belleza', kind: 'series', method: 'title', confidence: 0.8, ...over }, [film]);
  const held = series();
  assert.equal(held.decision, 'review');
  assert.deepEqual([held.row.state, held.row.reason, held.row.candidates, held.row.entityId], ['manual_review', 'cross_kind_conflict', [E1], undefined]);
  // Two different TMDB works (the film, and a series with its own TMDB id) are two works.
  assert.equal(series({ tmdb: { type: 'tv', id: 9 }, method: 'tmdb_exact', confidence: 0.9 }).decision, 'create');
  // A stored title-only work of another kind holds a TMDB sighting too: it may be the same work.
  const showOnly = row({ key: 'diagnostico', kind: 'show', discriminator: '*', state: 'candidate', method: 'title', confidence: 0.8, entityId: E2 });
  const tv = decideIngestionMatch({ title: 'Diagnóstico', kind: 'series', tmdb: { type: 'tv', id: 5 }, method: 'tmdb_exact', confidence: 0.9 }, [showOnly]);
  assert.deepEqual([tv.decision, tv.decision === 'review' && tv.row.reason], ['review', 'cross_kind_conflict']);
  // The same-kind identity still matches and binds (existing identity first), the run flag only stops creations.
  assert.equal(decideIngestionMatch({ title: 'Diagnóstico', kind: 'show', method: 'title', confidence: 0.8 }, [showOnly], null, { crossKind: true }).decision, 'matched');
  assert.equal(decideIngestionMatch({ title: 'Nueva', kind: 'show', method: 'title', confidence: 0.8 }, [], null, { crossKind: true }).decision, 'review');
  // Unrelated kinds of rows (unknown, rejected, review-only) are no rivals.
  const loose = [row({ key: 'x', kind: 'unknown', discriminator: '*', entityId: E3 }), row({ key: 'x', kind: 'show', discriminator: '*', state: 'ambiguous' })];
  assert.equal(decideIngestionMatch({ title: 'X', kind: 'series', method: 'title', confidence: 0.8 }, loose).decision, 'create');
});

// Seeded property checks (no dependency): xorshift32, so a failure reproduces from the seed.
function rng(seed: number) {
  let x = seed >>> 0 || 1;
  return () => ((x ^= x << 13), (x ^= x >>> 17), (x ^= x << 5), (x >>> 0) / 2 ** 32);
}
const WORK_WORDS = ['Casa', 'papel', 'Ñandú', 'Él', 'niños', 'Fast', '&', 'Furious', '7', '24', 'Año', 'Über', "l'Été", 'C.S.I.', 'Miami', 'Mañana', 'Grey\'s', 'Anatomía', 'García', 'Lugo', 'Barça', '1899', 'Ocho', 'apellidos', 'vascos'];
const EPISODE_WORDS = ['El futuro', 'Promesas rotas', 'Persecución', 'Nº6', 'La boda', '21', 'Atrapada', 'Fin de año'];
const markerFor = (s: number, e: number, pick: number) =>
  [`T${s} E${e}`, `T${s}E${e}`, `S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')}`, `${s}x${String(e).padStart(2, '0')}`, `Temporada ${s} Episodio ${e}`, `T${s} Ep${String(e).padStart(2, '0')}`][pick];

test('property: work + any marker (+ episode name) parses back to the work, with the numbers (2,000 seeded cases)', () => {
  const r = rng(20261021);
  const int = (n: number) => Math.floor(r() * n);
  for (let i = 0; i < 2000; i++) {
    const work = Array.from({ length: 1 + int(4) }, () => WORK_WORDS[int(WORK_WORDS.length)]).join(' ');
    const base = parseEpgTitle(work);
    if (!base.normalizedWorkKey || base.resolutionState !== 'work') continue;
    const [s, e] = [1 + int(30), 1 + int(99)];
    const episodeTitle = int(2) ? EPISODE_WORDS[int(EPISODE_WORDS.length)] : undefined;
    const title = `${work} ${markerFor(s, e, int(6))}${episodeTitle ? ` · ${episodeTitle}` : ''}`;
    const p = parseEpgTitle(title);
    const ctx = JSON.stringify({ i, title });
    assert.equal(p.resolutionState, 'episode', ctx);
    assert.equal(p.normalizedWorkKey, base.normalizedWorkKey, ctx);
    assert.equal(p.proposedWorkTitle, work, ctx);
    assert.deepEqual([p.seasonNumber, p.episodeNumber, p.episodeTitle], [s, e, episodeTitle], ctx);
  }
});

test('property: parsing never throws, keeps the original, is idempotent on the work title, and is a pure function of its input', () => {
  const r = rng(7);
  const alphabet = ['a', 'Z', 'ñ', 'é', '9', '0', ' ', ' ', '·', '-', ':', '(', ')', '.', ',', 'T', 'E', 'x', 'p', '捕', 'Ж', '★', '/', '\t', 'Ep', 'Capítulo'];
  for (let i = 0; i < 5000; i++) {
    const title = Array.from({ length: Math.floor(r() * 40) }, () => alphabet[Math.floor(r() * alphabet.length)]).join('');
    const p = parseEpgTitle(title);
    assert.equal(p.originalTitle, title.trim());
    assert.deepEqual(parseEpgTitle(title), p);
    if (p.normalizedWorkKey) assert.ok(p.normalizedWorkKey.length <= 120 && /^[a-z0-9_]+$/.test(p.normalizedWorkKey), title);
    if (p.resolutionState === 'episode' && p.proposedWorkTitle) {
      // The work title of an episode is itself a work (or one whose own " - " is still uncertain), with the same key.
      const again = parseEpgTitle(p.proposedWorkTitle);
      assert.equal(again.normalizedWorkKey, p.normalizedWorkKey, JSON.stringify(title));
    }
    // Without a marker, a sub-title or " · ", a separator alone never makes an episode.
    if (!/[·•(]/.test(title) && !/(^|[\s·:,.\-(])([ST]\d|\d{1,2}x\d{2}|temporada|episodio|episodi|[eé]pisode|cap[ií]tulo|cap\.?\s*\d|ep\.?\s*\d|chapter)/iu.test(title)) {
      assert.notEqual(p.resolutionState, 'episode', JSON.stringify(title));
    }
  }
});
