import { TvReadItemDTO } from '../../../api/models';
import { selectMobileChannelSchedule } from './live-guide-view.component';

describe('selectMobileChannelSchedule', () => {
  const now = new Date('2026-08-25T20:00:00+02:00').getTime();

  it('starts a today schedule at the live programme and keeps the next rows', () => {
    const items = [
      makeItem('past', '2026-08-25T18:00:00+02:00', '2026-08-25T19:00:00+02:00'),
      makeItem('live', '2026-08-25T19:30:00+02:00', '2026-08-25T20:30:00+02:00', true),
      makeItem('next', '2026-08-25T20:30:00+02:00', '2026-08-25T21:30:00+02:00'),
    ];

    expect(selectMobileChannelSchedule(items, 'today', now).map((item) => item.id)).toEqual([
      'live',
      'next',
    ]);
  });

  it('shows the chronological start of a future date', () => {
    const items = [
      makeItem('second', '2026-08-26T09:00:00+02:00', '2026-08-26T10:00:00+02:00'),
      makeItem('first', '2026-08-26T08:00:00+02:00', '2026-08-26T09:00:00+02:00'),
    ];

    expect(selectMobileChannelSchedule(items, 'tomorrow', now).map((item) => item.id)).toEqual([
      'first',
      'second',
    ]);
  });

  it('recomputes cached live flags and excludes invalid intervals without mutating responses', () => {
    const past = makeItem('past', '2026-08-25T18:00:00+02:00', '2026-08-25T19:00:00+02:00', true);
    const live = makeItem('live', '2026-08-25T19:30:00+02:00', '2026-08-25T20:30:00+02:00');
    const next = makeItem('next', '2026-08-25T20:30:00+02:00', '2026-08-25T21:30:00+02:00', true);
    next.timingContext = { start: next.airing.start, end: next.airing.end, liveNow: true, window: 'today' };
    const invalid = makeItem('invalid', 'invalid', 'invalid');
    const reversed = makeItem('reversed', '2026-08-25T22:00:00+02:00', '2026-08-25T21:00:00+02:00');
    const result = selectMobileChannelSchedule([past, next, invalid, reversed, live], 'today', now);
    expect(result.map((item) => [item.id, item.airing.liveNow])).toEqual([['live', true], ['next', false]]);
    expect(result[1].timingContext?.liveNow).toBeFalse();
    expect(past.airing.liveNow).toBeTrue();
    expect(live.airing.liveNow).toBeFalse();
  });

  it('treats the end boundary as finished', () => {
    const finished = makeItem('finished', '2026-08-25T19:00:00+02:00', '2026-08-25T20:00:00+02:00', true);
    expect(selectMobileChannelSchedule([finished], 'today', now)[0].airing.liveNow).toBeFalse();
  });
});

function makeItem(id: string, start: string, end: string, liveNow = false): TvReadItemDTO {
  return {
    id,
    channel: { id: 'channel-1', name: 'Canal 1' },
    program: { title: id },
    airing: { start, end, liveNow, durationMinutes: 60 },
    assets: { primary: { kind: 'none' } },
    availability: { live: liveNow, catchup: false, streaming: false, providers: [] },
    taxonomy: { groups: [], flags: [], searchTokens: [] },
  } as unknown as TvReadItemDTO;
}
