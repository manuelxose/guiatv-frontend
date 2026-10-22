import test from 'node:test';
import assert from 'node:assert/strict';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import {
  applyPlanToMetadata, clearEnrichedMetadata, ENRICHMENT_VERSION, enrichmentRefusals, fieldsFromSource, planEnrichment, type EnrichmentSource,
} from './entityEnrichment';

const NOW = new Date('2026-10-22T10:00:00Z');
const day = 86_400_000;

const entity = (over: Partial<ContentEntityRecord> = {}): ContentEntityRecord => ({
  entityId: 'ce_0000000000000000000000000A', kind: 'movie', status: 'candidate', title: 'La cura del bienestar', normalizedTitle: 'la_cura_del_bienestar', year: 2017,
  externalIds: { tmdb: { type: 'movie', id: 340837 } }, canonicalPath: '/peliculas/la-cura-del-bienestar', metadata: {},
  matching: { method: 'tmdb_exact', confidence: 0.9, decidedAt: NOW, decidedBy: 'ingest', assurance: 'independently_supported' },
  indexability: { state: 'noindex', reasons: [] }, version: 3, createdAt: NOW, updatedAt: NOW, ...over,
}) as ContentEntityRecord;

const source = (over: Partial<EnrichmentSource> = {}): EnrichmentSource => ({
  mediaId: 'media_1', tmdb: { type: 'movie', id: 340837 }, metadataSource: 'epg', lastEnrichedAt: new Date(NOW.getTime() - 3 * day),
  title: 'La cura del bienestar', originalTitle: 'A Cure for Wellness', year: 2016,
  synopsis: 'Un joven y ambicioso ejecutivo viaja a un centro de bienestar en los Alpes suizos.', genres: ['Misterio', 'Terror'], runtimeMinutes: 146,
  posterPath: '/k4XZ47wFZF1aUv7bjLM4Pae2TYm.jpg', backdropPath: '/uXx9wjfJEzLlfqB8GW67SYBrhVT.jpg',
  directors: ['Gore Verbinski'], cast: [{ name: 'Dane DeHaan', character: 'Lockhart' }, { name: 'Mia Goth' }],
  ...over,
});

test('a row that is provably the same work is copied; metadataSource (last writer) proves nothing', () => {
  assert.deepEqual(enrichmentRefusals(entity(), source()), []);
  const plan = planEnrichment(entity(), source(), NOW);
  assert.equal(plan.outcome, 'enrich');
  if (plan.outcome !== 'enrich') return;
  assert.deepEqual(plan.fields.genres, ['Misterio', 'Terror']);
  assert.equal(plan.fields.runtimeMinutes, 146);
  assert.equal(plan.fields.originalTitle, 'A Cure for Wellness');
  assert.deepEqual(plan.fields.credits, { directors: ['Gore Verbinski'], cast: [{ name: 'Dane DeHaan', character: 'Lockhart' }, { name: 'Mia Goth' }] });
  assert.equal(plan.stamp.sourceUpdatedAt?.toISOString(), source().lastEnrichedAt!.toISOString(), 'freshness is the source\'s, not the time of copy');
  assert.deepEqual(plan.warnings, []);
});

test('ambiguous or different works are refused, never guessed', () => {
  const cases: Array<[string, Partial<EnrichmentSource>, Partial<ContentEntityRecord>, string]> = [
    ['catalogue row never filled from a full TMDB detail', { lastEnrichedAt: undefined }, {}, 'source_not_enriched'],
    ['same number, but a TV row', { tmdb: { type: 'tv', id: 340837 } }, {}, 'tmdb_type_mismatch'],
    ['another TMDB id', { tmdb: { type: 'movie', id: 1 } }, {}, 'tmdb_id_mismatch'],
    ['another work under that id', { title: 'Otra película', originalTitle: 'Another Movie' }, {}, 'title_mismatch'],
    ['a remake 20 years apart', { year: 1997 }, {}, 'year_mismatch'],
    ['source without a year', { year: undefined }, {}, 'year_unverifiable'],
    ['entity without a year', {}, { year: undefined }, 'year_unverifiable'],
    ['series entity', {}, { kind: 'series' }, 'unsupported_kind'],
    ['entity without a TMDB work', {}, { externalIds: {} }, 'no_tmdb_ref'],
    ['merged entity', {}, { status: 'merged' }, 'entity_not_live'],
  ];
  for (const [name, s, e, reason] of cases) {
    const plan = planEnrichment(entity(e), source(s), NOW);
    assert.equal(plan.outcome, 'refused', name);
    assert.ok(plan.outcome === 'refused' && plan.reasons.includes(reason as never), `${name}: ${JSON.stringify(plan)}`);
  }
  assert.deepEqual(planEnrichment(entity(), null, NOW), { outcome: 'refused', reasons: ['source_missing'] });
  assert.equal(planEnrichment(entity({ year: 2017 }), source({ year: 2018 }), NOW).outcome, 'enrich', 'the feed\'s ±1 year tolerance holds');
});

test('the original title also identifies the work (a localised entity title, an original-language row title)', () => {
  assert.deepEqual(enrichmentRefusals(entity({ title: 'A Cure for Wellness' }), source()), []);
});

test('nothing is invented: absent fields stay absent and are reported', () => {
  const plan = planEnrichment(entity(), source({ synopsis: '  ', genres: [], runtimeMinutes: 0, posterPath: 'https://iptv-epg.org/x.jpg', backdropPath: undefined, directors: [], cast: [] }), NOW);
  assert.equal(plan.outcome, 'enrich');
  if (plan.outcome !== 'enrich') return;
  assert.deepEqual(Object.keys(plan.fields).sort(), ['originalTitle']);
  assert.deepEqual(plan.warnings, ['source_has_no_synopsis', 'source_has_no_genres', 'source_has_no_runtime', 'source_has_no_poster']);
});

test('only TMDB-relative image paths are kept: a feed image URL is not a licensed TMDB image', () => {
  const fields = fieldsFromSource(source({ posterPath: 'https://iptv-epg.org/images/abc.jpg', backdropPath: '/uXx9wjfJEzLlfqB8GW67SYBrhVT.jpg' }));
  assert.deepEqual(fields.images, { backdropPath: '/uXx9wjfJEzLlfqB8GW67SYBrhVT.jpg' });
  assert.equal(fieldsFromSource(source({ posterPath: '/../etc/passwd', backdropPath: '/a b.jpg' })).images, undefined);
});

test('refresh is deterministic: same source = unchanged, changed source or age = refresh, new version = refresh', () => {
  const first = planEnrichment(entity(), source(), NOW);
  assert.equal(first.outcome, 'enrich');
  if (first.outcome !== 'enrich') return;
  const enriched = entity({ metadata: applyPlanToMetadata({}, first) });
  assert.equal(enriched.metadata.synopsis?.source, 'tmdb');
  assert.equal(enriched.metadata.enrichment?.hash, first.hash);

  const again = planEnrichment(enriched, source(), new Date(NOW.getTime() + 5 * day));
  assert.deepEqual(again, { outcome: 'unchanged', hash: first.hash });
  assert.equal(planEnrichment(enriched, source(), new Date(NOW.getTime() + 5 * day), { force: true }).outcome, 'refresh');
  assert.equal(planEnrichment(enriched, source(), new Date(NOW.getTime() + 31 * day)).outcome, 'refresh', 'older than the max age is re-validated');
  const changed = planEnrichment(enriched, source({ runtimeMinutes: 147 }), new Date(NOW.getTime() + day));
  assert.equal(changed.outcome, 'refresh');
  assert.notEqual(changed.outcome === 'refresh' && changed.hash, first.hash);
  const stale = entity({ metadata: { ...enriched.metadata, enrichment: { ...enriched.metadata.enrichment!, version: ENRICHMENT_VERSION - 1 } } });
  assert.equal(planEnrichment(stale, source(), NOW).outcome, 'refresh');
});

test('the digest ignores key order and time of copy', () => {
  const a = planEnrichment(entity(), source(), NOW);
  const b = planEnrichment(entity(), source({ cast: [{ character: 'Lockhart', name: 'Dane DeHaan' }, { name: 'Mia Goth' }] }), new Date(NOW.getTime() + day));
  assert.ok(a.outcome === 'enrich' && b.outcome === 'enrich' && a.hash === b.hash);
});

test('a value a person wrote is never overwritten, and survives invalidation', () => {
  const manual = { value: 'Texto editorial propio.', source: 'manual' as const, updatedAt: NOW };
  const e = entity({ metadata: { synopsis: manual } });
  const plan = planEnrichment(e, source(), NOW);
  assert.equal(plan.outcome, 'enrich');
  if (plan.outcome !== 'enrich') return;
  assert.deepEqual(plan.kept, ['synopsis']);
  const next = applyPlanToMetadata(e.metadata, plan);
  assert.deepEqual(next.synopsis, manual);
  assert.equal(next.genres?.source, 'tmdb');
  const cleared = clearEnrichedMetadata(next);
  assert.deepEqual(cleared, { synopsis: manual });
});

test('invalidation withdraws every copied field and the stamp, nothing else', () => {
  const plan = planEnrichment(entity(), source(), NOW);
  if (plan.outcome !== 'enrich') throw new Error('plan');
  assert.deepEqual(clearEnrichedMetadata(applyPlanToMetadata({}, plan)), {});
});
