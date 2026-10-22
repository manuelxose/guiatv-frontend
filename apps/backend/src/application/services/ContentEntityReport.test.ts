import test from 'node:test';
import assert from 'node:assert/strict';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import { decideConsolidation, entityFacts, filmReport, legacyIndexable, summarizeFilmReports, type LegacySnapshot } from './ContentEntityReport';
import type { BroadcastSelection } from './EntityBroadcastService';

const NOW = new Date('2026-10-22T10:00:00Z');
const prov = <T>(value: T) => ({ value, source: 'tmdb' as const, updatedAt: NOW });
const entity = (over: Partial<ContentEntityRecord> = {}): ContentEntityRecord => ({
  entityId: 'ce_0000000000000000000000000A', kind: 'movie', status: 'active', title: 'La cura del bienestar', normalizedTitle: 'la_cura_del_bienestar', originalTitle: 'A Cure for Wellness', year: 2017,
  externalIds: { tmdb: { type: 'movie', id: 340837 } }, canonicalPath: '/peliculas/la-cura-del-bienestar',
  metadata: {
    synopsis: prov('x'.repeat(420)), genres: prov(['Terror']), runtimeMinutes: prov(147), images: prov({ posterPath: '/p.jpg', backdropPath: '/b.jpg' }),
    credits: prov({ directors: ['Gore Verbinski'], cast: Array.from({ length: 10 }, (_, i) => ({ name: `Actor ${i}` })) }),
    enrichment: { version: 1, mediaId: 'm', tmdb: { type: 'movie', id: 340837 }, hash: 'a'.repeat(64), checkedAt: NOW },
  },
  matching: { method: 'ai_attested', confidence: 1, decidedAt: NOW, decidedBy: 'attestation:x', assurance: 'independently_supported' },
  certification: { attestationId: 'at_1', seq: 0, hash: 'b'.repeat(64), certifiedAt: NOW }, indexability: { state: 'noindex', reasons: [] }, version: 4, createdAt: NOW, updatedAt: NOW, ...over,
}) as ContentEntityRecord;

const legacy = (over: Partial<LegacySnapshot> = {}, facts: Partial<LegacySnapshot['facts']> = {}): LegacySnapshot => ({
  path: '/peliculas/la-cura-del-bienestar', tmdbId: 340837, title: 'La cura del bienestar', measuredAt: '2026-10-22T00:00:00Z', status: 200, robots: 'noindex, follow', robotsBasis: 'measured',
  facts: { synopsisChars: 400, castCount: 10, hasDirector: true, hasPoster: true, hasBackdrop: true, upcomingAirings: 0, releaseYear: 2017, ...facts }, ...over,
});
const selection = (n: number): BroadcastSelection => ({
  items: Array.from({ length: n }, (_, i) => ({ airingId: `a${i}`, channel: { id: 'amc', name: 'AMC', path: '/canales/amc' }, programmeTitle: 'La cura del bienestar', start: '2026-10-26T20:00:00.000Z', end: '2026-10-26T22:00:00.000Z', startLocal: '2026-10-26T21:00:00+01:00', localDate: '2026-10-26', localTime: '21:00', durationMinutes: 120 })),
  evidence: {}, rejected: {}, legacyWindowRows: 0,
});

test('legacy robots: indexable only when the page says index and is 200', () => {
  assert.equal(legacyIndexable({ status: 200, robots: 'index, follow, max-image-preview:large' }), true);
  assert.equal(legacyIndexable({ status: 200, robots: 'noindex, follow' }), false);
  assert.equal(legacyIndexable({ status: 404, robots: 'index, follow' }), false);
  assert.equal(legacyIndexable({ status: 200, robots: null }), false);
});

test('an indexable legacy page is never replaced, whatever the entity shows', () => {
  const rich = entityFacts(entity(), 3);
  const d = decideConsolidation(legacy({ robots: 'index, follow' }), '/peliculas/la-cura-del-bienestar', rich);
  assert.equal(d.decision, 'keep_legacy');
  assert.deepEqual(d.reasons, ['legacy_indexable_now']);
});

test('a noindex legacy page is replaced only when nothing it shows today is lost', () => {
  const rich = entityFacts(entity(), 3);
  const ok = decideConsolidation(legacy(), '/peliculas/la-cura-del-bienestar', rich);
  assert.equal(ok.decision, 'serve_entity');
  assert.ok(ok.gains.includes('runtime') && ok.gains.includes('evidence_joined_broadcasts'));

  const bare = entityFacts(entity({ metadata: {} }), 0);
  const lost = decideConsolidation(legacy({}, { upcomingAirings: 2 }), '/peliculas/la-cura-del-bienestar', bare);
  assert.equal(lost.decision, 'keep_legacy');
  assert.deepEqual(lost.regressions, ['synopsis 0 < 400 chars', 'cast 0 < 10', 'director', 'poster', 'backdrop', 'broadcasts 0 < 2']);

  const shorter = decideConsolidation(legacy({}, { synopsisChars: 600 }), '/peliculas/la-cura-del-bienestar', rich);
  assert.deepEqual([shorter.decision, shorter.regressions], ['keep_legacy', ['synopsis 420 < 600 chars']]);
});

test('canonical ownership: a different path, an unmeasured legacy page and a missing one', () => {
  const rich = entityFacts(entity(), 1);
  assert.deepEqual(decideConsolidation(legacy(), '/peliculas/otra', rich).reasons, ['canonical_path_differs']);
  assert.deepEqual(decideConsolidation(undefined, '/peliculas/x', rich), { decision: 'keep_legacy', reasons: ['legacy_unmeasured'], regressions: [], gains: [] });
  assert.equal(decideConsolidation(legacy({ status: 404, robots: null }), '/peliculas/x', rich).decision, 'serve_entity');
});

test('film report: verdicts follow consolidation and quality, never indexing', () => {
  const base = { candidateId: 'c1', title: 'La cura del bienestar', canonicalPath: '/peliculas/la-cura-del-bienestar', entity: entity(), legacy: legacy(), selection: selection(2) };
  const shown = filmReport(base);
  assert.equal(shown.verdict, 'show_noindex');
  assert.equal(shown.quality.indexable, false, 'an AI-attested identity is never an index candidate');
  assert.equal(shown.quality.criteria.original_value, 'pass');
  assert.equal(shown.quality.criteria.source_attributed, 'pass');
  assert.equal(shown.quality.criteria.internal_links_ready, 'unknown');
  assert.ok(shown.indexingBlockers.includes('identity_verified') && shown.indexingBlockers.includes('legacy_consolidated'));

  const held = filmReport({ ...base, legacy: legacy({ robots: 'index, follow' }) });
  assert.deepEqual([held.verdict, held.verdictBlockers], ['hold_legacy', ['consolidation:legacy_indexable_now']]);

  const thin = filmReport({ ...base, entity: entity({ metadata: { synopsis: prov('Corta.') } }), selection: selection(0) });
  assert.equal(thin.verdict, 'hold_legacy', 'a copy shorter than the legacy page is a regression first');
  assert.ok(thin.verdictBlockers.includes('description_reliable') && thin.verdictBlockers.includes('adsense_risk_high'));

  // A long TMDB synopsis and complete facts are not enough: with no scheduled broadcast there is no original value.
  const tmdbOnly = filmReport({ ...base, selection: selection(0) });
  assert.equal(tmdbOnly.verdict, 'hold_quality');
  assert.deepEqual(tmdbOnly.verdictBlockers, ['original_value', 'user_useful']);

  assert.ok(filmReport({ ...base, entity: null }).verdictBlockers.includes('entity_missing'));
  const summary = summarizeFilmReports([shown, held, thin]);
  assert.deepEqual([summary.films, summary.verdict, summary.indexable], [3, { show_noindex: 1, hold_legacy: 2 }, 0]);
});
