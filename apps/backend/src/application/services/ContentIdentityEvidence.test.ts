import test from 'node:test';
import assert from 'node:assert/strict';
import type { IdentityTrace } from './ContentIdentityIngestion';
import {
  adjudicateEvidence,
  broadcasterKinds,
  evaluateEvidence,
  exactTmdbWorks,
  tmdbTvKind,
  type EvidenceVerdict,
  type TmdbSearchCheck,
} from './ContentIdentityEvidence';

const slug = (title: string) => title.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-');
const keyOf = (title: string) => title.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
const trace = (title: string, over: Partial<IdentityTrace> = {}): IdentityTrace => ({
  candidateId: `${title}|${over.kind ?? 'show'}`,
  key: keyOf(title),
  kind: 'show',
  title,
  spellings: [title],
  channels: ['la1'],
  broadcaster: { genres: [], minutes: { min: 60, max: 60 }, maxSeason: null },
  airings: 2,
  epgYears: [],
  tmdb: { ids: [], evidence: 'none' },
  decision: 'create',
  identity: `new:${title}`,
  path: `/programas/${slug(title)}`,
  ...over,
});
const film = (title: string, id: number, over: Partial<IdentityTrace> = {}) =>
  trace(title, {
    kind: 'movie', year: 1999, epgYears: [1999], path: `/peliculas/${slug(title)}`,
    broadcaster: { genres: ['Cine'], minutes: { min: 140, max: 140 }, maxSeason: null },
    tmdb: { ids: [id], evidence: 'confirmed', ref: { type: 'movie', id } as any }, ...over,
  });
const series = (title: string, id: number, over: Partial<IdentityTrace> = {}) =>
  trace(title, {
    kind: 'series', path: `/series/${slug(title)}`,
    broadcaster: { genres: ['Series'], minutes: { min: 45, max: 50 }, maxSeason: 3 },
    tmdb: { ids: [id], evidence: 'confirmed', ref: { type: 'tv', id } as any }, ...over,
  });
const lookup = (type: 'movie' | 'tv', id: number, query: string, over: Partial<TmdbSearchCheck> = {}): TmdbSearchCheck => ({
  v: 2, type, id, query, results: [{ id, title: query }],
  details: type === 'movie' ? { runtime: 136, genreIds: [28] } : { seasons: 5, genreIds: [18, 80] }, alternatives: {}, ...over,
});
const checks = (...list: TmdbSearchCheck[]) => new Map(list.map((c) => [`${c.type}:${c.id}`, c]));
const show = (title: string, over: Partial<IdentityTrace> = {}) => trace(title, { historicOwner: true, ...over });
const one = (t: IdentityTrace, others: IdentityTrace[][] = [], tmdb = new Map<string, TmdbSearchCheck>()) => adjudicateEvidence([t], others, tmdb)[0];
const twoDays = (t: IdentityTrace) => [[{ ...t }], [{ ...t }]];
const matrix = film('Matrix', 603);
const matrixTmdb = checks(lookup('movie', 603, 'Matrix', { results: [{ id: 603, title: 'Matrix' }, { id: 604, title: 'Matrix Reloaded' }] }));
const mentes = series('Mentes criminales', 4057);
const mentesTmdb = checks(lookup('tv', 4057, 'Mentes criminales'));

test('TMDB helpers: exact titles include alternative titles; genres and categories give kinds only when decisive', () => {
  const check: TmdbSearchCheck = {
    type: 'tv', id: 554, query: 'Bordertown',
    results: [{ id: 554, title: 'Bordertown' }, { id: 66573, title: 'Sorjonen', originalTitle: 'Bordertown' }, { id: 9, title: 'Border Town Blues' }, { id: 77, title: 'Grenzland' }],
    alternatives: { 77: ['Bordertown'] },
  };
  assert.deepEqual(exactTmdbWorks(check, 'bordertown'), [77, 554, 66573], 'a Spanish/alternative title is a homonym too');
  assert.deepEqual(exactTmdbWorks({ ...check, results: undefined, error: 'HTTP 503' }, 'bordertown'), []);
  assert.equal(tmdbTvKind([10767]), 'show');
  assert.equal(tmdbTvKind([18, 80]), 'series');
  assert.equal(tmdbTvKind([35, 10767]), null, 'comedy talk show: undecided');
  assert.equal(tmdbTvKind([99]), null, 'documentary: undecided');
  assert.deepEqual(broadcasterKinds(['Series', 'Documental']), ['series']);
  assert.deepEqual(broadcasterKinds(['Noticias', 'Series']), ['series', 'show']);
  assert.deepEqual(broadcasterKinds(['Infantil', 'Documental']), []);
});

test('independently supported film: unique TMDB title plus an independent runtime check', () => {
  const ok = one(matrix, [], matrixTmdb);
  assert.deepEqual([ok.decision, ok.assurance, ok.kindBasis], ['AUTO_ACCEPT', 'independently_supported', 'tmdb_runtime']);
  assert.deepEqual(ok.support.filter((s) => s.independent).map((s) => [s.source, s.provenance, s.root]), [
    ['tmdb_unique_title', 'external_metadata', 'tmdb_index:movie:603'],
    ['consistency_check', 'external_metadata', 'tmdb_index:movie:603+broadcaster_feed'],
  ]);
  assert.deepEqual(ok.support.find((s) => s.source === 'tmdb_catalogue')?.root, 'tmdb_guess', "the catalogue row is the sync's own guess");
  // A unique search result alone is not proof: without a check it is machine-supported only.
  const noSlot = one({ ...matrix, broadcaster: { genres: ['Cine'], minutes: null, maxSeason: null } }, [], matrixTmdb);
  assert.deepEqual([noSlot.assurance, noSlot.unverified], ['machine_supported', ['movie_without_independent_check']]);
  const short = one({ ...matrix, broadcaster: { genres: ['Cine'], minutes: { min: 30, max: 30 }, maxSeason: null } }, [], matrixTmdb);
  assert.deepEqual([short.assurance, short.contradictions], ['contradictory', ['slot_shorter_than_runtime:30m<136m']]);
  assert.deepEqual(one(matrix).unverified, ['tmdb_lookup_missing', 'tmdb_details_missing']);
  // The feed's own year (EPG_YEAR_PROVENANCE) is an independent check: a remake is caught, a match counts.
  const withYear = (rawYears: number[]) => ({ ...matrix, broadcaster: { genres: ['Cine'], minutes: null, maxSeason: null, rawYears } });
  const yearTmdb = checks(lookup('movie', 603, 'Matrix', { details: { runtime: 136, year: 1999 } }));
  assert.deepEqual(one(withYear([1999]), [], yearTmdb).assurance, 'independently_supported');
  assert.deepEqual(one(withYear([2021]), [], yearTmdb).contradictions, ['raw_year_vs_tmdb:2021≠1999']);
});

test('independently supported series: unique title, TMDB genres decide the kind, seasons fit', () => {
  const ok = one(mentes, [], mentesTmdb);
  assert.deepEqual([ok.decision, ok.kindBasis], ['AUTO_ACCEPT', 'tmdb_genres']);
  assert.ok(ok.support.some((s) => s.claim === 'EPG season 3 ≤ TMDB seasons 5'));
  const talk = one(series('La revuelta', 1), [], checks(lookup('tv', 1, 'La revuelta', { details: { seasons: 2, genreIds: [10767, 35] } })));
  assert.deepEqual([talk.assurance, talk.unverified], ['machine_supported', ['tv_kind_unverified']], 'undecided genres: kind not verified');
  const wrongKind = one(series('Late Motiv', 2), [], checks(lookup('tv', 2, 'Late Motiv', { details: { seasons: 9, genreIds: [10767] } })));
  assert.deepEqual(wrongKind.contradictions, ['tmdb_genres_show_vs_series'], 'a talk show the category called a series');
  // Production case: "Bordertown T3" bound to the 1989 series; the 2016 one shares the original title.
  const bordertown = one(series('Bordertown', 554), [], checks(lookup('tv', 554, 'Bordertown', { results: [{ id: 554, title: 'Bordertown' }, { id: 66573, title: 'Sorjonen', originalTitle: 'Bordertown' }] })));
  assert.deepEqual(bordertown.unverified, ['tmdb_homonyms:554,66573']);
  const beyond = one(series('Aída', 3, { broadcaster: { genres: ['Series'], minutes: null, maxSeason: 10 } }), [], checks(lookup('tv', 3, 'Aída', { details: { seasons: 2, genreIds: [35] } })));
  assert.deepEqual(beyond.contradictions, ['season_beyond_tmdb:10>2'], 'EPG season 10 on a 2-season TMDB work: another work');
});

test('no circular independence: legacy URL, catalogue match, repetition and markers never make a title-only work independent', () => {
  const t = show('Saber y ganar', { titleEvidence: { 'episode:title_marker': 3 } });
  const v = one(t, twoDays(t));
  assert.deepEqual([v.decision, v.assurance, v.kindBasis], ['QUARANTINE', 'machine_supported', 'category']);
  assert.ok(v.support.length >= 3 && v.support.every((s) => !s.independent));
  assert.deepEqual(new Set(v.support.map((s) => s.root)), new Set(['epg_title', 'legacy_url']));
  assert.deepEqual(v.unverified, ['title_only']);
  // The 2D-2F machine rules still apply below that: without them the work is insufficient.
  assert.deepEqual([one(t, [[t]]).assurance, one(t, [[t]]).missing], ['insufficient', ['seen_on_1_other_days']]);
});

test('TMDB conflicts: unstable ids across days, mixed ids in one entity, not an exact title', () => {
  const other = { ...matrix, tmdb: { ids: [9999], evidence: 'confirmed' as const, ref: { type: 'movie', id: 9999 } as any } };
  assert.deepEqual(one(matrix, [[other]], matrixTmdb).contradictions, ['tmdb_id_unstable:movie:9999']);
  const owner = series('9-1-1', 75219, { identity: 'new:9_1_1|series|tmdb:tv:75219', path: null, pathless: 'unsupported_slug' });
  const bound = trace('9-1-1', {
    candidateId: '9_1_1|series||', kind: 'series', decision: 'bind', state: 'candidate', identity: owner.identity, path: null,
    tmdb: { ids: [65733], evidence: 'mixed' }, titleEvidence: { 'episode:title_marker': 2 },
  });
  const tmdb = checks(lookup('tv', 75219, '9-1-1'));
  assert.equal(adjudicateEvidence([owner], [], tmdb)[0].decision, 'AUTO_ACCEPT');
  const both = adjudicateEvidence([owner, bound], [], tmdb);
  assert.deepEqual(both.map((v) => [v.decision, v.assurance]), [['QUARANTINE', 'contradictory'], ['QUARANTINE', 'contradictory']]);
  assert.deepEqual(one(matrix, [], checks(lookup('movie', 603, 'Matrix', { results: [{ id: 624860, title: 'Matrix Resurrections' }] }))).contradictions, ['tmdb_not_exact:none']);
});

test('broadcaster category conflicts: XMLTV category against the kind the run gave', () => {
  assert.deepEqual(one({ ...mentes, broadcaster: { genres: ['Noticias'], minutes: null, maxSeason: 3 } }, [], mentesTmdb).contradictions, ['broadcaster_kind_show_vs_series']);
  assert.deepEqual(one({ ...matrix, broadcaster: { genres: ['Series'], minutes: { min: 140, max: 140 }, maxSeason: null } }, [], matrixTmdb).contradictions, ['broadcaster_kind_series_vs_movie']);
  assert.match(one({ ...mentes, broadcaster: { genres: ['Noticias', 'Series'], minutes: null, maxSeason: 3 } }, [], mentesTmdb).contradictions.join(), /broadcaster_kinds:series\+show/);
  assert.equal(one({ ...mentes, broadcaster: { genres: ['Documental'], minutes: null, maxSeason: 3 } }, [], mentesTmdb).decision, 'AUTO_ACCEPT', 'a category that claims no kind is no conflict');
});

test('2D-2F contradictions still quarantine', () => {
  const t = show('Cara a cara');
  const cases: Array<[IdentityTrace, IdentityTrace[][], RegExp]> = [
    [{ ...t, tmdb: { ids: [5], evidence: 'mixed' } }, twoDays(t), /tmdb_mixed/],
    [{ ...t, crossKind: ['series', 'show'] }, twoDays(t), /cross_kind/],
    [t, [[{ ...t, kind: 'series' }], [t], [t]], /kind_unstable:series/],
    [{ ...t, pathless: 'historic_unverified', path: null }, twoDays(t), /pathless_historic_unverified/],
    [{ ...t, pathRefused: ['historic_conflict'] }, twoDays(t), /legacy_owner_conflict/],
    [show('Antena 3 Noticias 2'), twoDays(show('Antena 3 Noticias 2')), /residue_trailing_number/],
    [show('El inmortal (extras)'), twoDays(show('El inmortal (extras)')), /residue_parenthetical/],
    [show('Informativo mediodía'), [], /residue_slot_wording/],
    [show('Serie: Autopista hacia el cielo'), [], /residue_container_prefix/],
    [show('JT 19h30'), [], /residue_time_of_day/],
    [show('9-1-1 T4 E3'), twoDays(show('9-1-1 T4 E3')), /title_episode/],
    [{ ...matrix, titleEvidence: { 'episode:title_marker': 1 } }, [], /movie_with_episodes/],
    [series('Bordertown', 554, { kind: 'movie' }), [], /tmdb_type_tv_vs_movie/],
  ];
  for (const [c, others, reason] of cases) {
    const v = one(c, others, matrixTmdb);
    assert.deepEqual([v.decision, v.assurance], ['QUARANTINE', 'contradictory'], c.title);
    assert.match(v.contradictions.join(' '), reason, c.title);
  }
  const day = ['Noticias Cuatro', 'Noticias Cuatro mediodía'].map((title) => show(title));
  assert.deepEqual(adjudicateEvidence(day, [day, day]).map((v) => v.contradictions), [[], ['edition_of:noticias_cuatro']]);
  // A TMDB title match settles residue: "Scream 2" is the film.
  assert.equal(one(film('Scream 2', 4233), [], checks(lookup('movie', 4233, 'Scream 2', { details: { runtime: 120 } }))).decision, 'AUTO_ACCEPT');
});

test('undecided runs, slots and duplicates', () => {
  const slot = trace('Cine', { decision: 'rejected', reason: 'generic_title', kind: 'unknown', identity: undefined, path: undefined });
  assert.deepEqual([one(slot).decision, one(slot).assurance], ['AUTO_REJECT', 'rejected_slot']);
  const held = (reason: string) => one(show('X', { decision: 'unresolved', reason, identity: undefined }));
  assert.deepEqual([held('unknown_kind').assurance, held('cross_kind_conflict').assurance], ['insufficient', 'contradictory']);
  const a = series('Grimm', 39351);
  const b = show('Grimm', { candidateId: 'Grimm|show', identity: 'new:other', path: '/programas/grimm' });
  assert.ok(adjudicateEvidence([a, b], [], checks(lookup('tv', 39351, 'Grimm'))).every((v) => v.contradictions.includes('duplicate_slug')));
});

test('gates: levels kept apart, reproducible digest, every planted violation caught', () => {
  const t = show('Saber y ganar');
  const unresolved = show('Bluey', { decision: 'unresolved', reason: 'unknown_kind', identity: undefined });
  const day = [matrix, mentes, t, unresolved, trace('Cine', { decision: 'rejected', reason: 'generic_title', identity: undefined })];
  const tmdb = new Map([...matrixTmdb, ...mentesTmdb]);
  const run = () => evaluateEvidence(adjudicateEvidence(day, twoDays(t), tmdb));
  const r = run();
  assert.equal(r.status, 'pass');
  assert.deepEqual(r.levels, { candidates: 4, distinctWorkKeys: 4, proposedEntities: 3, candidatesNeverProposed: 1, rejectedSlotTitles: 1 });
  assert.deepEqual(r.proposedEntities.byAssurance, { independently_supported: 2, machine_supported: 1 });
  assert.equal(r.proposedEntities.acceptedShare, 2 / 3, 'share of proposed entities, not of candidates');
  assert.deepEqual(r.candidatesNeverProposed.byAssurance, { insufficient: 1 });
  assert.equal(r.digest, run().digest);
  assert.match(r.meaning, /not human-validated/i);
  const independent = { source: 'tmdb_unique_title', claim: '', provenance: 'external_metadata' as const, root: 'tmdb_index:movie:1', independent: true };
  const accepted = (over: Partial<EvidenceVerdict>): EvidenceVerdict => ({
    candidateId: 'v', key: 'k', kind: 'movie', title: 'K', identity: `new:${over.candidateId}`, path: '/peliculas/k', decision: 'AUTO_ACCEPT',
    assurance: 'independently_supported', kindBasis: 'tmdb_runtime', support: [independent], contradictions: [], missing: [], unverified: [], ...over,
  });
  const bad = evaluateEvidence([
    accepted({ candidateId: 'a' }),
    accepted({ candidateId: 'b', kind: 'series', kindBasis: 'tmdb_genres' }),
    accepted({ candidateId: 'c', key: 'e', title: 'La Promesa T1 E929', path: '/series/e' }),
    accepted({ candidateId: 'd', key: 'n', path: '/programas/n', kindBasis: 'category', support: [{ source: 'historic_url', claim: '', provenance: 'historic_url', root: 'legacy_url', independent: true }] }),
    accepted({ candidateId: 'f', key: 'f', path: '/peliculas/f', unverified: ['title_only'] }),
  ]);
  assert.equal(bad.status, 'fail');
  assert.deepEqual(bad.violations.canonicalOwnership, ['a', 'b']);
  assert.deepEqual(bad.violations.crossKindMerges, ['a', 'b']);
  assert.deepEqual(bad.violations.episodeAsWork, ['c']);
  assert.deepEqual(bad.violations.circularIndependence, ['d'], 'a legacy URL marked independent is caught by its root');
  assert.deepEqual(bad.violations.unsupportedTmdb, ['d']);
  assert.deepEqual(bad.violations.kindUnverified, ['d']);
  assert.deepEqual(bad.violations.acceptedWithConflicts, ['f']);
});
