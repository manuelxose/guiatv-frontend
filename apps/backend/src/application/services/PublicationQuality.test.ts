import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPublicationQuality, overlapWithEpg, type PublicationSignals } from './PublicationQuality';

const long = 'Un ladrón de guante blanco prepara el golpe definitivo mientras una inspectora recompone, pieza a pieza, la red de contactos que lo protege. '.repeat(3);
const good: PublicationSignals = {
  verified: true, kind: 'movie', title: 'Heat', year: 1995, yearProvenance: 'independent', synopsis: long, synopsisSource: 'tmdb',
  epgDescription: 'Película de acción.', genres: ['Crimen'], runtimeMinutes: 170, upcomingAirings: 2, inboundLinks: 5,
  legacyPage: 'redirects_to_entity', registryClean: true, ssr: { ok: 40, total: 40 },
};
const ids = (r: ReturnType<typeof assessPublicationQuality>, status: string) => r.criteria.filter((c) => c.status === status).map((c) => c.id);

test('a fully evidenced page is an index candidate, and only then', () => {
  const r = assessPublicationQuality(good);
  assert.equal(r.tier, 'index_candidate');
  assert.equal(r.indexable, true);
  assert.equal(r.adsenseRisk, 'low');
  assert.deepEqual(r.blockers, []);
});

test('missing evidence never passes: every unset signal is unknown or fail, never a silent pass', () => {
  const bare = assessPublicationQuality({ verified: true, kind: 'movie', title: 'Heat' });
  assert.equal(bare.indexable, false);
  assert.notEqual(bare.tier, 'index_candidate');
  for (const id of ['year_reliable', 'description_reliable', 'internal_links_ready', 'canonical_consistent', 'ssr_reliable', 'legacy_consolidated', 'user_useful']) {
    assert.notEqual(bare.criteria.find((c) => c.id === id)!.status, 'pass', id);
  }
});

test('quality is separate from identity: a verified identity with thin content is at most a canary page', () => {
  const thin = assessPublicationQuality({ ...good, synopsis: 'Corta.', yearProvenance: 'tmdb_overwrite', inboundLinks: 0, legacyPage: 'live_duplicate' });
  assert.equal(thin.tier, 'canary');
  assert.equal(thin.adsenseRisk, 'high');
  assert.deepEqual(ids(thin, 'fail').sort(), ['adsense_risk', 'description_reliable', 'internal_links_ready', 'legacy_consolidated', 'user_useful'].sort());
  assert.deepEqual(ids(thin, 'unknown'), ['year_reliable']);
  // An unverified identity can never be shown, however good the text is.
  const unverified = assessPublicationQuality({ ...good, verified: false });
  assert.equal(unverified.tier, 'blocked');
  assert.equal(unverified.indexable, false);
});

test('the stored year is not independent evidence when it is TMDB\'s own', () => {
  for (const yearProvenance of ['tmdb_overwrite', 'unknown', undefined] as const) {
    const r = assessPublicationQuality({ ...good, yearProvenance });
    assert.equal(r.criteria.find((c) => c.id === 'year_reliable')!.status, 'unknown');
    assert.equal(r.indexable, false);
  }
  assert.equal(assessPublicationQuality({ ...good, year: undefined }).criteria.find((c) => c.id === 'year_reliable')!.status, 'fail', 'a film needs a year');
  const series = assessPublicationQuality({ ...good, kind: 'series', year: undefined, runtimeMinutes: undefined });
  assert.equal(series.criteria.find((c) => c.id === 'metadata_complete')!.status, 'pass', 'series do not need runtime or year');
});

test('duplicate content: a synopsis that repeats the EPG listing, another entity, a live legacy page', () => {
  const epg = good.synopsis!;
  assert.ok(overlapWithEpg(good.synopsis!, epg) === 1);
  assert.equal(overlapWithEpg('', epg), 0);
  const copy = assessPublicationQuality({ ...good, epgDescription: epg });
  assert.equal(copy.criteria.find((c) => c.id === 'no_duplicate_of_epg')!.status, 'fail');
  assert.equal(copy.adsenseRisk, 'high');
  assert.equal(assessPublicationQuality({ ...good, duplicateOf: 'ce_x' }).tier, 'blocked');
  assert.equal(assessPublicationQuality({ ...good, legacyPage: 'live_duplicate' }).indexable, false);
});

test('titles that read as an episode or a slot are blocked', () => {
  for (const title of ['Cine', 'Noticias', 'Informativos', 'Los Simpson T3 E4', 'Mentes criminales · El final', '']) {
    assert.equal(assessPublicationQuality({ ...good, title }).tier, 'blocked', title);
  }
});

test('AdSense risk: third-party text alone is medium, with a schedule or editorial text it is low; SSR failures block the canary', () => {
  assert.equal(assessPublicationQuality({ ...good, upcomingAirings: 0 }).adsenseRisk, 'medium');
  assert.equal(assessPublicationQuality({ ...good, upcomingAirings: 0, synopsisSource: 'manual' }).adsenseRisk, 'low');
  assert.equal(assessPublicationQuality({ ...good, synopsis: long.slice(0, 200) }).adsenseRisk, 'medium');
  const flaky = assessPublicationQuality({ ...good, ssr: { ok: 30, total: 40 } });
  assert.equal(flaky.criteria.find((c) => c.id === 'ssr_reliable')!.status, 'fail');
  assert.equal(flaky.tier, 'blocked');
  assert.equal(assessPublicationQuality({ ...good, ssr: { ok: 5, total: 5 } }).tier, 'blocked', 'too few SSR checks to trust');
});
