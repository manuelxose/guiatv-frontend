import { filterChannelDirectory } from './channel-catalog.component';
import { TvReadChannelSummaryDTO } from '../../api/models';

describe('channel catalogue filtering', () => {
  const channels: TvReadChannelSummaryDTO[] = [
    {
      channel: {
        id: 'axn',
        name: 'AXN España',
        aliases: ['AXN HD'],
        access: 'pay',
        operator: 'Sony Pictures Television',
      },
      counts: { total: 28, live: 1, tonight: 5 },
    },
    {
      channel: { id: 'la_1', name: 'La 1', access: 'free', type: 'TDT' },
      counts: { total: 24, live: 1, tonight: 4 },
    },
  ];

  it('matches accents, aliases and operators without changing directory order', () => {
    expect(filterChannelDirectory(channels, 'espana', 'pay')).toEqual([channels[0]]);
    expect(filterChannelDirectory(channels, 'sony', 'all')).toEqual([channels[0]]);
    expect(filterChannelDirectory(channels, 'AXN HD', 'all')).toEqual([channels[0]]);
  });

  it('supports explicit free/pay access filters', () => {
    expect(filterChannelDirectory(channels, '', 'free')).toEqual([channels[1]]);
    expect(filterChannelDirectory(channels, '', 'pay')).toEqual([channels[0]]);
  });
});
