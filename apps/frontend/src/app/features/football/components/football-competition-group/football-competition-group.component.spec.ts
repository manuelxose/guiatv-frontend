import { groupMatchesByCompetition } from './football-competition-group.component';
import { FootballMatchDTO } from '@app/features/football/football.models';

function match(id: string, competitionSlug: string, competitionName: string): FootballMatchDTO {
  return {
    id,
    slug: id,
    providerIds: {},
    competition: { id: competitionSlug, slug: competitionSlug, name: competitionName },
    kickoffAt: '2026-08-21T19:00:00.000Z',
    status: 'scheduled',
    homeTeam: { id: 'h', slug: 'h', name: 'Home', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    awayTeam: { id: 'a', slug: 'a', name: 'Away', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    score: { home: null, away: null },
    broadcasts: [],
    sourceProvenance: { source: 'test', confidence: 'high' },
    lastUpdatedAt: '',
  };
}

describe('groupMatchesByCompetition', () => {
  it('groups matches by competition slug, not by display name', () => {
    const groups = groupMatchesByCompetition([
      match('1', 'laliga', 'LaLiga'),
      match('2', 'laliga', 'LaLiga'),
      match('3', 'champions', 'Champions League'),
    ]);
    expect(groups.length).toBe(2);
    expect(groups.find((g) => g.competitionSlug === 'laliga')?.matches.length).toBe(2);
    expect(groups.find((g) => g.competitionSlug === 'champions')?.matches.length).toBe(1);
  });

  it('preserves first-seen competition order', () => {
    const groups = groupMatchesByCompetition([
      match('1', 'champions', 'Champions League'),
      match('2', 'laliga', 'LaLiga'),
    ]);
    expect(groups.map((g) => g.competitionSlug)).toEqual(['champions', 'laliga']);
  });

  it('returns an empty array for an empty match list', () => {
    expect(groupMatchesByCompetition([])).toEqual([]);
  });
});
