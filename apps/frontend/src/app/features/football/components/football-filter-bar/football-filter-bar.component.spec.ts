import { applyFootballMatchFilter } from './football-filter-bar.component';

const matches = [
  { status: 'live' },
  { status: 'halftime' },
  { status: 'scheduled' },
  { status: 'finished' },
];

describe('applyFootballMatchFilter', () => {
  it('"all" returns every match unchanged', () => {
    expect(applyFootballMatchFilter(matches, 'all')).toEqual(matches);
  });

  it('"live" includes both live and halftime', () => {
    const result = applyFootballMatchFilter(matches, 'live');
    expect(result.map((m) => m.status)).toEqual(['live', 'halftime']);
  });

  it('"upcoming" only includes scheduled', () => {
    const result = applyFootballMatchFilter(matches, 'upcoming');
    expect(result.map((m) => m.status)).toEqual(['scheduled']);
  });

  it('"finished" only includes finished', () => {
    const result = applyFootballMatchFilter(matches, 'finished');
    expect(result.map((m) => m.status)).toEqual(['finished']);
  });
});
