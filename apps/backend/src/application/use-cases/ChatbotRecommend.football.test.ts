import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFootballTodayPayload } from './ChatbotRecommend';
import { FootballMatch } from '@/domain/sports/football/types';

function match(overrides: Partial<FootballMatch> = {}): FootballMatch {
  return {
    id: 'match-1', slug: 'local-visitante-2026-08-25', providerIds: {},
    competition: { id: 'liga', slug: 'liga', name: 'LaLiga' },
    kickoffAt: '2026-08-25T19:00:00.000Z', status: 'scheduled',
    homeTeam: { id: 'home', slug: 'local', name: 'Local', aliases: [], providerIds: {}, lastUpdatedAt: '2026-08-25T00:00:00.000Z' },
    awayTeam: { id: 'away', slug: 'visitante', name: 'Visitante', aliases: [], providerIds: {}, lastUpdatedAt: '2026-08-25T00:00:00.000Z' },
    score: { home: null, away: null },
    broadcasts: [{ channelId: 'canal-1', channelName: 'Canal 1', availability: 'tv', provenance: 'airing', confidence: 'high', channelPath: '/canales/canal-1' }],
    sourceProvenance: { source: 'test', confidence: 'high' },
    lastUpdatedAt: '2026-08-25T00:00:00.000Z',
    ...overrides,
  };
}

test('presents provider matches with canonical internal links and provenance', () => {
  const response = buildFootballTodayPayload([match()]);
  assert.equal(response.intent, 'football_today');
  assert.equal(response.confidence, 1);
  assert.equal(response.matches?.[0].detailPath, '/futbol/partido/local-visitante-2026-08-25');
  assert.deepEqual(response.matches?.[0].broadcasters, [{ name: 'Canal 1', path: '/canales/canal-1' }]);
  assert.equal(response.sources?.[0].kind, 'football_provider');
});

test('does not manufacture matches when the provider returns none', () => {
  const response = buildFootballTodayPayload([]);
  assert.deepEqual(response.matches, []);
  assert.match(response.text, /No encuentro partidos confirmados/);
});
