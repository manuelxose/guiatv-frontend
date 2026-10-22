import test from 'node:test';
import assert from 'node:assert/strict';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import { broadcastLocalIso, EntityBroadcastService, madridDay, madridParts, selectBroadcasts, type AiringRow } from './EntityBroadcastService';

const NOW = new Date('2026-10-22T10:00:00Z');
const entity = (over: Partial<ContentEntityRecord> = {}) => ({
  entityId: 'ce_0000000000000000000000000A', kind: 'movie', title: 'La cura del bienestar', originalTitle: 'A Cure for Wellness',
  externalIds: { tmdb: { type: 'movie', id: 340837 } }, metadata: { enrichment: { mediaId: 'media_1' } }, ...over,
}) as unknown as ContentEntityRecord;

const row = (over: Record<string, unknown> = {}, program: Record<string, unknown> = {}, airing: Record<string, unknown> = {}): AiringRow => ({
  id: `a_${Math.random().toString(36).slice(2)}`, date: '20261023', channel: { id: 'amc', name: 'AMC', normalizedName: 'amc', icon: '/storage/channel_icons/amc.webp' },
  program: { title: 'La cura del bienestar', tmdbId: 340837, mediaId: 'media_1', ...program },
  airing: { start: '2026-10-23T15:29:00.000Z', end: '2026-10-23T17:53:00.000Z', ...airing }, ...over,
}) as AiringRow;

test('a broadcast needs the same TMDB id, the same title key and (when known) the same catalogue row', () => {
  const kept = row();
  const sel = selectBroadcasts(entity(), [
    kept,
    row({}, { tmdbId: 999 }),                         // another work entirely
    row({}, { title: 'Dobles vidas' }),               // same id, different title: a wrong EPG match
    row({}, { mediaId: 'media_tv' }),                 // same number, but a TV catalogue row
    row({}, { entityId: 'ce_0000000000000000000000000B' }), // already bound to another entity
  ], NOW);
  assert.deepEqual(sel.items.map((i) => i.airingId), [kept.id]);
  assert.equal(sel.evidence[kept.id], 'catalogue_media');
  assert.deepEqual(sel.rejected, { tmdb_id_differs: 1, title_key_differs: 1, other_catalogue_row: 1, other_entity_ref: 1 });
});

test('similar titles alone never create a broadcast: no TMDB id, no match', () => {
  const sel = selectBroadcasts(entity(), [row({}, { tmdbId: undefined }), row({}, { tmdbId: undefined, title: 'La cura del bienestar (2017)' })], NOW);
  assert.equal(sel.items.length, 0);
  assert.equal(sel.rejected.tmdb_id_differs, 2);
});

test('evidence levels: explicit entity reference, catalogue row, TMDB id + title for an entity not enriched yet', () => {
  const ref = row({}, { entityId: 'ce_0000000000000000000000000A', title: 'Otro nombre en la parrilla' });
  const media = row({ channel: { id: 'la_1', name: 'La 1', normalizedName: 'la-1' } }, {}, { start: '2026-10-23T18:00:00.000Z', end: '2026-10-23T20:00:00.000Z' });
  const plain = row({ channel: { id: 'tcm', name: 'TCM' } }, { mediaId: undefined }, { start: '2026-10-24T18:00:00.000Z', end: '2026-10-24T20:00:00.000Z' });
  const sel = selectBroadcasts(entity(), [ref, media, plain], NOW);
  assert.deepEqual(sel.items.map((i) => sel.evidence[i.airingId]), ['entity_ref', 'catalogue_media', 'tmdb_title']);
  const unenriched = selectBroadcasts(entity({ metadata: {} }), [row()], NOW);
  assert.equal(unenriched.evidence[unenriched.items[0].airingId], 'tmdb_title');
});

test('an entity that is not a movie (or a TV id that reuses the number) has no broadcasts', () => {
  assert.equal(selectBroadcasts(entity({ externalIds: { tmdb: { type: 'tv', id: 340837 } } }), [row()], NOW).items.length, 0);
});

test('ended and malformed broadcasts are suppressed at read time; duplicates collapse; order is chronological', () => {
  const later = row({ id: 'later' }, {}, { start: '2026-10-24T20:00:00.000Z', end: '2026-10-24T22:00:00.000Z' });
  const sooner = row({ id: 'sooner' }, {}, { start: '2026-10-22T12:00:00.000Z', end: '2026-10-22T14:00:00.000Z' });
  const over = row({ id: 'over' }, {}, { start: '2026-10-22T07:00:00.000Z', end: '2026-10-22T09:00:00.000Z' });
  const live = row({ id: 'live' }, {}, { start: '2026-10-22T09:00:00.000Z', end: '2026-10-22T11:00:00.000Z' });
  const bad = row({ id: 'bad' }, {}, { start: 'nope', end: '2026-10-22T11:00:00.000Z' });
  const backwards = row({ id: 'backwards' }, {}, { start: '2026-10-22T13:00:00.000Z', end: '2026-10-22T12:00:00.000Z' });
  const dup = row({ id: 'dup' }, {}, { start: '2026-10-22T12:00:00.000Z', end: '2026-10-22T14:00:00.000Z' });
  const sel = selectBroadcasts(entity(), [later, sooner, over, live, bad, backwards, dup], NOW);
  assert.deepEqual(sel.items.map((i) => i.airingId), ['live', 'sooner', 'later']);
  assert.deepEqual(sel.rejected, { already_ended: 1, invalid_times: 2, duplicate_slot: 1 });
  assert.equal(sel.items[1].durationMinutes, 120);
  assert.equal(selectBroadcasts(entity(), [live], new Date('2026-10-22T11:00:00Z')).items.length, 0, 'ends exactly now: over');
});

test('Madrid time, with the daylight-saving change on 2026-10-25 (CEST -> CET) and 2026-03-29 (CET -> CEST)', () => {
  // The 25th has 25 hours: 02:30 happens twice, once at +02:00 and once at +01:00.
  assert.equal(broadcastLocalIso(new Date('2026-10-24T22:30:00Z')), '2026-10-25T00:30:00+02:00');
  assert.equal(broadcastLocalIso(new Date('2026-10-25T00:30:00Z')), '2026-10-25T02:30:00+02:00');
  assert.equal(broadcastLocalIso(new Date('2026-10-25T01:30:00Z')), '2026-10-25T02:30:00+01:00');
  assert.equal(broadcastLocalIso(new Date('2026-10-25T02:30:00Z')), '2026-10-25T03:30:00+01:00');
  assert.equal(broadcastLocalIso(new Date('2026-03-29T00:59:00Z')), '2026-03-29T01:59:00+01:00');
  assert.equal(broadcastLocalIso(new Date('2026-03-29T01:00:00Z')), '2026-03-29T03:00:00+02:00', 'there is no 02:xx on 29 March');
  // 23:30 UTC on the 21st is already the 22nd in Madrid: the broadcast day follows the guide, not UTC.
  assert.deepEqual([madridParts(new Date('2026-10-21T23:30:00Z')).date, madridParts(new Date('2026-10-21T23:30:00Z')).time], ['2026-10-22', '01:30']);
  assert.equal(madridDay(new Date('2026-10-21T23:30:00Z')), '20261022');
  assert.equal(madridDay(new Date('2026-10-24T12:00:00Z'), 1), '20261025');
  assert.equal(madridDay(new Date('2026-12-31T23:30:00Z')), '20270101');
  assert.equal(madridDay(new Date('2026-10-22T10:00:00Z'), -1), '20261021');
  const sel = selectBroadcasts(entity(), [row({}, {}, { start: '2026-10-25T01:30:00.000Z', end: '2026-10-25T03:30:00.000Z' })], new Date('2026-10-24T10:00:00Z'));
  assert.deepEqual([sel.items[0].localDate, sel.items[0].localTime, sel.items[0].startLocal], ['2026-10-25', '02:30', '2026-10-25T02:30:00+01:00']);
  assert.equal(sel.items[0].durationMinutes, 120, 'duration is elapsed time, DST included');
});

test('channel links follow the public channel URL rule', () => {
  const sel = selectBroadcasts(entity(), [row({ channel: { id: 'la_1', name: 'La 1', normalizedName: 'la-1' } }), row({ channel: { id: 'cuatro_hd', name: 'Cuatro HD' } }, {}, { start: '2026-10-24T18:00:00.000Z', end: '2026-10-24T20:00:00.000Z' })], NOW);
  assert.deepEqual(sel.items.map((i) => i.channel.path), ['/canales/la-1', '/canales/cuatro-hd']);
});

test('the legacy window: rows for today or tomorrow, counted on the TMDB id alone (the legacy lookup keys on it)', () => {
  const wrongTitle = row({ date: '20261022' }, { title: 'Otra cosa' });
  const later = row({ date: '20261026' });
  assert.equal(selectBroadcasts(entity(), [wrongTitle], NOW).legacyWindowRows, 1);
  assert.equal(selectBroadcasts(entity(), [later], NOW).legacyWindowRows, 0);
  assert.equal(selectBroadcasts(entity(), [row({ date: '20261023' })], NOW).legacyWindowRows, 1, 'tomorrow');
  assert.equal(selectBroadcasts(entity(), [row({ date: '20261022' }, {}, { start: '2026-10-22T05:00:00.000Z', end: '2026-10-22T07:00:00.000Z' })], NOW).legacyWindowRows, 1, 'an airing that already ended still keeps the legacy page listing it');
});

test('the service reads once, in one window, and degrades without claiming anything', async () => {
  const calls: Array<[number, string[], number]> = [];
  const service = new EntityBroadcastService({ findByTmdbId: async (id, dates, limit) => { calls.push([id, dates, limit]); return [row({ date: '20261023' })]; } }, () => NOW);
  const found = await service.forEntity(entity());
  assert.equal(calls.length, 1, 'one query per entity, however many broadcasts');
  assert.deepEqual(calls[0][1][0], '20261021');
  assert.equal(calls[0][1].length, 9);
  assert.equal(found.broadcasts.status, 'ok');
  assert.equal(found.legacyIndexableNow, true);
  assert.equal(found.broadcasts.timeZone, 'Europe/Madrid');

  const none = await new EntityBroadcastService({ findByTmdbId: async () => [] }, () => NOW).forEntity(entity());
  assert.deepEqual([none.broadcasts.status, none.broadcasts.items, none.legacyIndexableNow], ['none', [], false]);

  const down = await new EntityBroadcastService({ findByTmdbId: async () => { throw new Error('mongo down'); } }, () => NOW).forEntity(entity());
  assert.deepEqual([down.broadcasts.status, down.legacyIndexableNow], ['unavailable', 'unknown']);

  const series = await new EntityBroadcastService({ findByTmdbId: async () => { throw new Error('must not read'); } }, () => NOW).forEntity(entity({ externalIds: { tmdb: { type: 'tv', id: 1 } } }));
  assert.equal(series.broadcasts.status, 'none');
});
