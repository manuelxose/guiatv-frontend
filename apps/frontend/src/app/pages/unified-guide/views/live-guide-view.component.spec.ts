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
