import { splitAiringsByTime } from './catalog';

describe('splitAiringsByTime', () => {
  // Phase 1 TS-15: at 12:40 Madrid a programme page listed last night's 23:00-02:15 airing under "A continuación".
  const airing = (title: string, start: string, end: string) => ({ title, start, end });
  const now = Date.parse('2026-10-20T10:40:00Z'); // 12:40 in Madrid (CEST)
  const airings = [
    airing('tonight, past midnight', '2026-10-20T21:30:00Z', '2026-10-21T00:30:00Z'),
    airing('last night, past midnight', '2026-10-19T21:00:00+00:00', '2026-10-20T02:15:00+02:00'),
    airing('on air', '2026-10-20T12:30:00+02:00', '2026-10-20T13:30:00+02:00'),
    airing('this afternoon', '2026-10-20T13:00:00Z', '2026-10-20T14:00:00Z'),
    airing('ended exactly now', '2026-10-20T09:40:00Z', '2026-10-20T10:40:00Z'),
  ];

  it('keeps the airing on now as current and only future starts as upcoming, in start order', () => {
    const { current, upcoming } = splitAiringsByTime(airings, now);
    expect(current?.title).toBe('on air');
    expect(upcoming.map((a) => a.title)).toEqual(['this afternoon', 'tonight, past midnight']);
  });

  it('treats an airing that started exactly now as current, not upcoming', () => {
    const { current, upcoming } = splitAiringsByTime([airing('starts now', '2026-10-20T10:40:00Z', '2026-10-20T11:00:00Z')], now);
    expect(current?.title).toBe('starts now');
    expect(upcoming).toEqual([]);
  });

  it('handles a missing list', () => {
    expect(splitAiringsByTime(undefined, now)).toEqual({ current: null, upcoming: [] });
  });
});
