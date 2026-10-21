import test from 'node:test';
import assert from 'node:assert/strict';
import type { IdentityTrace } from './ContentIdentityIngestion';
import { adjudicateEvidence, evaluateEvidence, exactTmdbWorks, type EvidenceVerdict, type TmdbSearchCheck } from './ContentIdentityEvidence';

const slug = (title: string) => title.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-');
const trace = (title: string, over: Partial<IdentityTrace> = {}): IdentityTrace => ({
  candidateId: `${title}|${over.kind ?? 'show'}`,
  key: title.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
  kind: 'show',
  title,
  spellings: [title],
  channels: ['la_1'],
  airings: 2,
  epgYears: [],
  tmdb: { ids: [], evidence: 'none' },
  decision: 'create',
  identity: `new:${title}`,
  path: `/programas/${slug(title)}`,
  ...over,
});
const tmdbWork = (title: string, type: 'movie' | 'tv', id: number, year: number, over: Partial<IdentityTrace> = {}) =>
  trace(title, {
    kind: type === 'movie' ? 'movie' : 'series', year, epgYears: [year], path: `/${type === 'movie' ? 'peliculas' : 'series'}/${slug(title)}`,
    tmdb: { ids: [id], evidence: 'confirmed', ref: { type, id } as any }, ...over,
  });
/** A TMDB search whose results are the given works (title, id). */
const search = (type: 'movie' | 'tv', id: number, query: string, ...works: Array<[string, number]>): TmdbSearchCheck => ({
  type, id, query, results: works.map(([title, wid]) => ({ id: wid, title })),
});
const checks = (...list: TmdbSearchCheck[]) => new Map(list.map((c) => [`${c.type}:${c.id}`, c]));
const show = (title: string, over: Partial<IdentityTrace> = {}) => trace(title, { historicOwner: true, ...over });
const one = (t: IdentityTrace, others: IdentityTrace[][] = [], tmdb = new Map<string, TmdbSearchCheck>()) => adjudicateEvidence([t], others, tmdb)[0];
const twoDays = (t: IdentityTrace) => [[{ ...t }], [{ ...t }]];
const matrix = tmdbWork('Matrix', 'movie', 603, 1999);
const matrixUnique = checks(search('movie', 603, 'Matrix', ['Matrix', 603], ['Matrix Reloaded', 604]));

test('exactTmdbWorks: title or original title with the same key, each work once', () => {
  const check: TmdbSearchCheck = { type: 'tv', id: 1, query: 'Bordertown', results: [
    { id: 554, title: 'Bordertown' }, { id: 66573, title: 'Sorjonen', originalTitle: 'Bordertown' }, { id: 554, title: 'Bordertown' }, { id: 9, title: 'Border Town Blues' },
  ] };
  assert.deepEqual(exactTmdbWorks(check, 'bordertown'), [554, 66573]);
  assert.deepEqual(exactTmdbWorks({ ...check, results: undefined, error: 'HTTP 503' }, 'bordertown'), []);
});

test('a TMDB work is accepted only when a TMDB search finds it as the only work with that title', () => {
  const ok = one(matrix, [], matrixUnique);
  assert.equal(ok.decision, 'AUTO_ACCEPT');
  assert.equal(ok.kindBasis, 'tmdb_type');
  assert.deepEqual(ok.support.filter((s) => s.independent).map((s) => s.source), ['tmdb_search']);
  assert.equal(ok.support.find((s) => s.source === 'tmdb_catalogue')?.independent, false, "the catalogue row is the match's own result");
  assert.deepEqual(one(matrix).missing, ['tmdb_search_unchecked']);
  assert.deepEqual(one(matrix, [], checks({ type: 'movie', id: 603, query: 'Matrix', error: 'HTTP 503' })).missing, ['tmdb_search_failed']);
  // Production case: "Bordertown T3 E4" bound to the 1989 series; the 2016 one has the same original title.
  const bordertown = tmdbWork('Bordertown', 'tv', 554, 1989);
  const homonyms = one(bordertown, [], checks({ type: 'tv', id: 554, query: 'Bordertown', results: [{ id: 554, title: 'Bordertown' }, { id: 66573, title: 'Sorjonen', originalTitle: 'Bordertown' }] }));
  assert.equal(homonyms.decision, 'QUARANTINE');
  assert.deepEqual(homonyms.missing, ['tmdb_homonyms:554,66573']);
  const elsewhere = one(matrix, [], checks(search('movie', 603, 'Matrix', ['The Matrix Resurrections', 624860])));
  assert.deepEqual(elsewhere.contradictions, ['tmdb_not_exact:none']);
});

test('the EPG year is not evidence (the sync writes the TMDB year into it), but a mismatch still contradicts', () => {
  assert.equal(one({ ...matrix, epgYears: [] }, [], matrixUnique).decision, 'AUTO_ACCEPT', 'no year needed');
  assert.match(one({ ...matrix, epgYears: [2021] }, [], matrixUnique).contradictions.join(), /movie_year/);
  const titleOnly = one(trace('Matrix', { kind: 'movie', epgYears: [1999] }));
  assert.equal(titleOnly.decision, 'QUARANTINE', 'a title-only film may be a remake');
  assert.ok(titleOnly.missing.includes('movie_without_tmdb'));
});

test('a title-only TV work needs a legacy URL, one channel, and the same kind on two other days', () => {
  const t = show('Saber y ganar');
  const ok = one(t, twoDays(t));
  assert.equal(ok.decision, 'AUTO_ACCEPT');
  assert.equal(ok.kindBasis, 'category', 'series vs show stays the broadcaster category');
  assert.deepEqual(one(t, [[{ ...t }]]).missing, ['seen_on_1_other_days']);
  const noLegacy = trace('Saber y ganar');
  assert.deepEqual(one(noLegacy, twoDays(noLegacy)).missing, ['title_only_without_legacy_url']);
  const regional = show('Informativo Territorial', { channels: ['aragon_tv', 'la_1'] });
  assert.deepEqual(one(regional, twoDays(regional)).missing, ['title_only_several_channels']);
});

test('no circular proof: repetition, episode markers and the catalogue match never stand in for independent evidence', () => {
  const t = trace('Serie nueva', { kind: 'series', titleEvidence: { 'episode:title_marker': 9 } });
  const v = one(t, [[t], [t], [t], [t]]);
  assert.equal(v.decision, 'QUARANTINE');
  assert.ok(v.support.length && v.support.every((s) => !s.independent));
});

test('one decision per identity: a contradicting airing group quarantines the entity it binds to', () => {
  // Production case: "9-1-1" from TMDB 75219, plus episode spellings carrying another, unconfirmed id.
  const owner = tmdbWork('9-1-1', 'tv', 75219, 2018, { identity: 'new:9_1_1|series|tmdb:tv:75219', path: null, pathless: 'unsupported_slug' });
  const bound = trace('9-1-1', {
    candidateId: '9_1_1|series||', kind: 'series', decision: 'bind', state: 'candidate', identity: owner.identity, path: null,
    tmdb: { ids: [65733], evidence: 'mixed' }, epgYears: [2005], titleEvidence: { 'episode:title_marker': 2 },
  });
  const tmdb = checks(search('tv', 75219, '9-1-1', ['9-1-1', 75219]));
  assert.equal(adjudicateEvidence([owner], [], tmdb)[0].decision, 'AUTO_ACCEPT');
  const both = adjudicateEvidence([owner, bound], [], tmdb);
  assert.deepEqual(both.map((v) => v.decision), ['QUARANTINE', 'QUARANTINE']);
  assert.deepEqual(both[0].contradictions, ['tmdb_mixed:65733']);
  assert.ok(!both[1].missing.includes('stored_candidate'), 'an in-run bind is not a stored row');
});

test('contradictions quarantine even with independent support', () => {
  const t = show('Cara a cara');
  const cases: Array<[IdentityTrace, IdentityTrace[][], RegExp]> = [
    [{ ...t, tmdb: { ids: [5], evidence: 'mixed' } }, twoDays(t), /tmdb_mixed/],
    [{ ...t, crossKind: ['series', 'show'] }, twoDays(t), /cross_kind/],
    [t, [[{ ...t, kind: 'series' }], [t], [t]], /kind_unstable:series/],
    [{ ...t, pathless: 'historic_unverified', path: null }, twoDays(t), /pathless_historic_unverified/],
    [{ ...t, pathRefused: ['historic_conflict'] }, twoDays(t), /legacy_owner_conflict/],
    [show('Antena 3 Noticias 2'), twoDays(show('Antena 3 Noticias 2')), /residue_trailing_number/],
    [show('Royals - La Casa Danesa'), twoDays(show('Royals - La Casa Danesa')), /residue_spaced_separator/],
    [show('El inmortal (extras)'), twoDays(show('El inmortal (extras)')), /residue_parenthetical/],
    [show('9-1-1 T4 E3'), twoDays(show('9-1-1 T4 E3')), /title_episode/],
    [{ ...matrix, titleEvidence: { 'episode:title_marker': 1 } }, [], /movie_with_episodes/],
    [tmdbWork('Bordertown', 'movie', 554, 2016, { kind: 'series' }), [], /tmdb_type_movie_vs_series/],
  ];
  for (const [c, others, reason] of cases) {
    const v = one(c, others, matrixUnique);
    assert.equal(v.decision, 'QUARANTINE', c.title);
    assert.match(v.contradictions.join(' '), reason, c.title);
  }
  // A TMDB title match settles residue: "Scream 2" is the film.
  assert.equal(one(tmdbWork('Scream 2', 'movie', 4233, 1997), [], checks(search('movie', 4233, 'Scream 2', ['Scream 2', 4233]))).decision, 'AUTO_ACCEPT');
});

test('duplicates and shared paths quarantine every side; slots are rejected; undecided runs stay quarantined', () => {
  const a = show('Grimm');
  const b = show('Grimm', { candidateId: 'Grimm|series', kind: 'series', identity: 'new:other', path: '/series/grimm' });
  assert.deepEqual(adjudicateEvidence([a, b], [[a], [a]]).map((v) => v.decision), ['QUARANTINE', 'QUARANTINE']);
  const c = show('Uno', { path: '/programas/x' });
  const d = show('Dos', { path: '/programas/x' });
  assert.ok(adjudicateEvidence([c, d], [[c, d], [c, d]]).every((v) => v.contradictions.includes('path_collision')));
  const slot = trace('Cine', { decision: 'rejected', reason: 'generic_title', kind: 'unknown', identity: undefined, path: undefined });
  assert.equal(one(slot).decision, 'AUTO_REJECT');
  for (const decision of ['held', 'review', 'unresolved', 'deferred', 'failed'] as const) {
    const v = one(show('X', { decision, reason: 'cross_kind_conflict', identity: undefined }), twoDays(show('X')));
    assert.deepEqual([v.decision, v.contradictions], ['QUARANTINE', ['cross_kind_conflict']]);
  }
});

test('gates: pass with a reproducible digest, fail on any planted violation', () => {
  const t = show('Saber y ganar');
  const day = [matrix, t, trace('Cine', { decision: 'rejected', reason: 'generic_title', identity: undefined })];
  const run = () => evaluateEvidence(adjudicateEvidence(day, twoDays(t), matrixUnique));
  const r = run();
  assert.equal(r.status, 'pass');
  assert.deepEqual(r.identities, { AUTO_ACCEPT: 2 });
  assert.deepEqual(r.candidates, { AUTO_ACCEPT: 2, AUTO_REJECT: 1 });
  assert.deepEqual(r.accepted.byIndependentSource, { tmdb_search: 1, historic_url: 1 });
  assert.equal(r.digest, run().digest);
  assert.match(r.meaning, /not human-validated/i);
  const accepted = (over: Partial<EvidenceVerdict>): EvidenceVerdict => ({
    candidateId: 'v', key: 'k', kind: 'show', title: 'K', identity: `new:${over.candidateId}`, path: '/programas/k', decision: 'AUTO_ACCEPT', kindBasis: 'category',
    support: [{ source: 'historic_url', claim: '', independent: true }], contradictions: [], missing: [], ...over,
  });
  const bad = evaluateEvidence([
    accepted({ candidateId: 'a' }),
    accepted({ candidateId: 'b', kind: 'series' }),
    accepted({ candidateId: 'c', key: 'e', title: 'La Promesa T1 E929', path: '/programas/e' }),
    accepted({ candidateId: 'd', key: 'n', path: null, support: [{ source: 'cross_day', claim: '', independent: false }] }),
    accepted({ candidateId: 'f', key: 'f', path: '/programas/f', missing: ['seen_on_0_other_days'] }),
  ]);
  assert.equal(bad.status, 'fail');
  assert.deepEqual(bad.violations.canonicalOwnership, ['a', 'b']);
  assert.deepEqual(bad.violations.crossKindMerges, ['a', 'b']);
  assert.deepEqual(bad.violations.episodeAsWork, ['c']);
  assert.deepEqual(bad.violations.withoutIndependentEvidence, ['d']);
  assert.deepEqual(bad.violations.acceptedWithConflicts, ['f']);
});

test('slot wording, container prefixes and part markers quarantine title-only works; named programmes pass', () => {
  const verdict = (title: string) => one(show(title), twoDays(show(title)));
  // Production titles that leaked through every other rule in the first 2D-2F replay.
  for (const [title, reason] of [
    ['Informativo mediodía', 'residue_slot_wording'],
    ['Boletín informativo', 'residue_slot_wording'],
    ['Espacios comerciales', 'residue_slot_wording'],
    ['Videoclips', 'residue_slot_wording'],
    ['Les Notícies Edició vespre', 'residue_slot_wording'],
    ['Informativos II Edición', 'residue_slot_wording'],
    ['Newsroom', 'residue_slot_wording'],
    ['Serie: Autopista hacia el cielo', 'residue_container_prefix'],
    ['SERIE «EL VIRGINIANO»', 'residue_container_prefix'],
    ['Monteando entre robles y chaparros 1º parte', 'residue_part_marker'],
    ['JT 19h30', 'residue_time_of_day'],
    ['Le 6h info', 'residue_time_of_day'],
  ]) {
    const v = verdict(title);
    assert.equal(v.decision, 'QUARANTINE', title);
    assert.ok(v.contradictions.includes(reason), `${title}: ${v.contradictions}`);
  }
  for (const title of ['Noticias Cuatro', 'Informativos Telecinco', 'CNN Newsroom', 'Por fin', 'Vamos a ver', 'Cine de barrio', 'Las mañanas contigo', 'Al lío']) {
    assert.equal(verdict(title).decision, 'AUTO_ACCEPT', title);
  }
});

test('a news edition of a proposed programme is quarantined; a spin-off with its own name is not', () => {
  const day = ['Noticias Cuatro', 'Noticias Cuatro mediodía', 'Informativos Telecinco Noche', 'Ley y orden', 'Ley y orden: unidad de víctimas especiales', 'Levante al día', 'Al día']
    .map((title) => show(title, { key: title.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_') }));
  const verdicts = adjudicateEvidence(day, [day, day]);
  const decided = Object.fromEntries(verdicts.map((v) => [v.title, v.contradictions.find((c) => c.startsWith('edition_of')) ?? v.decision]));
  assert.deepEqual(decided, {
    'Noticias Cuatro': 'AUTO_ACCEPT',
    'Noticias Cuatro mediodía': 'edition_of:noticias_cuatro',
    'Informativos Telecinco Noche': 'AUTO_ACCEPT',
    'Ley y orden': 'AUTO_ACCEPT',
    'Ley y orden: unidad de víctimas especiales': 'AUTO_ACCEPT',
    'Levante al día': 'AUTO_ACCEPT',
    'Al día': 'AUTO_ACCEPT',
  });
});
