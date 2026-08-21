import {
  formatMatchAccessibleLabel,
  formatMatchStatusLabel,
  formatKickoffTime,
  hasFinalScore,
  isLiveStatus,
  primaryBroadcast,
} from './football-status.util';
import { FootballMatchDTO } from './football.models';

function match(overrides: Partial<FootballMatchDTO> = {}): FootballMatchDTO {
  return {
    id: 'm1',
    slug: 'real-madrid-barcelona',
    providerIds: {},
    competition: { id: 'c1', slug: 'laliga', name: 'LaLiga' },
    kickoffAt: '2026-08-21T19:00:00.000Z',
    status: 'scheduled',
    homeTeam: { id: 't1', slug: 'real-madrid', name: 'Real Madrid', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    awayTeam: { id: 't2', slug: 'barcelona', name: 'Barcelona', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    score: { home: null, away: null },
    broadcasts: [],
    sourceProvenance: { source: 'test', confidence: 'high' },
    lastUpdatedAt: '',
    ...overrides,
  };
}

describe('isLiveStatus', () => {
  it('treats live and halftime as live', () => {
    expect(isLiveStatus('live')).toBeTrue();
    expect(isLiveStatus('halftime')).toBeTrue();
  });

  it('does not treat scheduled/finished/postponed as live', () => {
    expect(isLiveStatus('scheduled')).toBeFalse();
    expect(isLiveStatus('finished')).toBeFalse();
    expect(isLiveStatus('postponed')).toBeFalse();
  });
});

describe('hasFinalScore', () => {
  it('requires both home and away to be non-null', () => {
    expect(hasFinalScore({ home: 1, away: 0 })).toBeTrue();
    expect(hasFinalScore({ home: null, away: null })).toBeFalse();
    expect(hasFinalScore({ home: 1, away: null })).toBeFalse();
    expect(hasFinalScore(undefined)).toBeFalse();
  });
});

describe('formatMatchStatusLabel', () => {
  it('shows the minute for a live match, short form', () => {
    expect(formatMatchStatusLabel(match({ status: 'live', minute: 67 }), 'short')).toBe("67'");
  });

  it('shows a Spanish sentence for a live match, long form', () => {
    expect(formatMatchStatusLabel(match({ status: 'live', minute: 67 }), 'long')).toBe('Minuto 67');
  });

  it('falls back to "En directo" when live but minute is unknown', () => {
    expect(formatMatchStatusLabel(match({ status: 'live', minute: null }), 'short')).toBe('En directo');
  });

  it('never fabricates a minute or score for scheduled matches — shows kickoff time', () => {
    const label = formatMatchStatusLabel(match({ status: 'scheduled', kickoffAt: '2026-08-21T19:00:00.000Z' }), 'short');
    expect(label).not.toBe('');
    expect(label).not.toContain("'");
  });

  it('maps every documented status to a distinct short label', () => {
    const statuses: FootballMatchDTO['status'][] = [
      'scheduled',
      'live',
      'halftime',
      'finished',
      'postponed',
      'suspended',
      'cancelled',
    ];
    const labels = statuses.map((status) => formatMatchStatusLabel(match({ status, minute: 10 }), 'short'));
    expect(new Set(labels).size).toBe(statuses.length);
  });
});

describe('formatMatchAccessibleLabel', () => {
  it('reads as a coherent sentence for a live match with a score', () => {
    const label = formatMatchAccessibleLabel(
      match({ status: 'live', minute: 67, score: { home: 2, away: 1 } })
    );
    expect(label).toBe('Real Madrid contra Barcelona, 2 a 1, minuto 67');
  });

  it('includes the broadcaster when provided', () => {
    const label = formatMatchAccessibleLabel(match({ status: 'finished', score: { home: 3, away: 0 } }), 'DAZN');
    expect(label).toContain('DAZN');
    expect(label).toContain('finalizado');
  });

  it('never depends on color — the sentence alone conveys status', () => {
    const label = formatMatchAccessibleLabel(match({ status: 'scheduled' }));
    expect(label).toContain('Real Madrid contra Barcelona');
  });
});

describe('primaryBroadcast', () => {
  it('skips low-confidence broadcasts', () => {
    const result = primaryBroadcast(
      match({
        broadcasts: [
          { channelId: 'a', channelName: 'Guess FM', availability: 'tv', provenance: 'reconciliation', confidence: 'low' },
          { channelId: 'b', channelName: 'DAZN', availability: 'streaming', provenance: 'airing', confidence: 'high' },
        ],
      })
    );
    expect(result?.channelName).toBe('DAZN');
  });

  it('returns null when no confident broadcast exists', () => {
    const result = primaryBroadcast(
      match({
        broadcasts: [
          { channelId: 'a', channelName: 'Guess FM', availability: 'tv', provenance: 'reconciliation', confidence: 'low' },
        ],
      })
    );
    expect(result).toBeNull();
  });
});

describe('formatKickoffTime', () => {
  it('returns an empty string for an invalid date rather than "Invalid Date"', () => {
    expect(formatKickoffTime('not-a-date')).toBe('');
  });
});
