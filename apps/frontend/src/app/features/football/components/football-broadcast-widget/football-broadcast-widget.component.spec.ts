import { FootballMatchDTO } from '../../football.models';
import { summarizeFootballBroadcasts } from './football-broadcast-widget.component';

function match(id: string, channels: Array<{ name: string; confidence?: 'high' | 'medium' | 'low' }>): FootballMatchDTO {
  return {
    id, slug: id, providerIds: {}, competition: { id: 'c', slug: 'liga', name: 'Liga' },
    kickoffAt: '2026-09-02T19:00:00.000Z', status: 'scheduled',
    homeTeam: { id: `h-${id}`, slug: `h-${id}`, name: 'Home', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    awayTeam: { id: `a-${id}`, slug: `a-${id}`, name: 'Away', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    score: { home: null, away: null },
    broadcasts: channels.map((channel, index) => ({ channelId: `${id}-${index}`, channelName: channel.name,
      availability: 'tv', provenance: 'reconciliation', confidence: channel.confidence ?? 'high' })),
    sourceProvenance: { source: 'test', confidence: 'high' }, lastUpdatedAt: '',
  };
}

describe('summarizeFootballBroadcasts', () => {
  it('counts each provider once per match and orders by match count', () => {
    const result = summarizeFootballBroadcasts([
      match('1', [{ name: 'DAZN' }, { name: 'DAZN' }, { name: 'M+ LaLiga' }]),
      match('2', [{ name: 'DAZN' }]),
    ]);
    expect(result).toEqual([{ name: 'DAZN', matchCount: 2 }, { name: 'M+ LaLiga', matchCount: 1 }]);
  });

  it('excludes low-confidence broadcast guesses', () => {
    expect(summarizeFootballBroadcasts([match('1', [{ name: 'Canal dudoso', confidence: 'low' }])])).toEqual([]);
  });
});
