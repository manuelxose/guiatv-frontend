import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMatchSlug,
  inferStatus,
  isFootballAiring,
  normalizeEpgAiringToMatch,
  resolveCompetition,
  splitMatchup,
  slugify,
} from './FootballNormalizer';
import { normalizeMatchStatus } from '../../../domain/sports/football/types';

const airing = (overrides: Partial<Parameters<typeof normalizeEpgAiringToMatch>[0]> = {}) => ({
  id: 'airing-1',
  date: '20260814',
  start: '2026-08-14T19:00:00+02:00',
  end: '2026-08-14T21:00:00+02:00',
  title: 'Fútbol LaLiga · Real Madrid - Barcelona',
  sportFacet: 'Fútbol',
  editorialCategory: 'Deportes',
  channelId: 'movistar_laliga',
  channelName: 'Movistar LaLiga',
  ...overrides,
});

test('slugify normalizes accents and separators', () => {
  assert.equal(slugify('Atlético de Madrid'), 'atletico-de-madrid');
  assert.equal(slugify('Real Madrid CF'), 'real-madrid-cf');
});

test('isFootballAiring rejects motor racing titles', () => {
  assert.equal(isFootballAiring(airing({ title: 'Mundial F1 - GP de Hungría', sportFacet: 'F1' })), false);
  assert.equal(isFootballAiring(airing({ title: 'MotoGP - Gran Premio' })), false);
});

test('isFootballAiring accepts football matchups inside the sports vertical', () => {
  assert.equal(isFootballAiring(airing()), true);
});

test('splitMatchup splits " - " and " vs " separators', () => {
  assert.deepEqual(splitMatchup('Real Madrid - Barcelona'), { homeTeam: 'Real Madrid', awayTeam: 'Barcelona' });
  assert.deepEqual(splitMatchup('Atlético de Madrid vs Sevilla'), { homeTeam: 'Atlético de Madrid', awayTeam: 'Sevilla' });
});

test('resolveCompetition resolves against the catalog, not raw title lead', () => {
  const comp = resolveCompetition(airing({ title: 'Champions League · Real Madrid - PSG' }));
  assert.equal(comp.slug, 'champions-league');
  assert.equal(comp.name, 'UEFA Champions League');
});

test('inferStatus maps time windows to domain status', () => {
  const ref = new Date('2026-08-14T20:00:00+02:00');
  assert.equal(inferStatus('2026-08-14T19:00:00+02:00', '2026-08-14T21:00:00+02:00', ref), 'live');
  assert.equal(inferStatus('2026-08-14T21:30:00+02:00', '2026-08-14T23:00:00+02:00', ref), 'scheduled');
  assert.equal(inferStatus('2026-08-14T18:00:00+02:00', '2026-08-14T19:00:00+02:00', ref), 'finished');
});

test('normalizeMatchStatus maps provider enums into the domain', () => {
  assert.equal(normalizeMatchStatus('IN_PLAY'), 'live');
  assert.equal(normalizeMatchStatus('PAUSED'), 'suspended');
  assert.equal(normalizeMatchStatus('FINISHED'), 'finished');
  assert.equal(normalizeMatchStatus('POSTPONED'), 'postponed');
  assert.equal(normalizeMatchStatus('SCHEDULED'), 'scheduled');
  assert.equal(normalizeMatchStatus('UNKNOWN'), 'scheduled');
});

test('normalizeEpgAiringToMatch never fabricates scores or minutes', () => {
  const match = normalizeEpgAiringToMatch(airing(), new Date('2026-08-14T20:00:00+02:00'));
  assert.ok(match);
  assert.equal(match.homeTeam.name, 'Real Madrid');
  assert.equal(match.awayTeam.name, 'Barcelona');
  assert.equal(match.score.home, null);
  assert.equal(match.score.away, null);
  assert.equal(match.minute, null);
  assert.equal(match.broadcasts[0].channelName, 'Movistar LaLiga');
});

test('normalizeEpgAiringToMatch rejects non-matchup sports programs', () => {
  const match = normalizeEpgAiringToMatch(airing({ title: 'ElDesmarque' }));
  assert.equal(match, null);
});

test('buildMatchSlug is collision-safe with date suffix', () => {
  assert.equal(
    buildMatchSlug('Real Madrid', 'Barcelona', '2026-10-25T19:00:00Z'),
    'real-madrid-barcelona-2026-10-25'
  );
});
