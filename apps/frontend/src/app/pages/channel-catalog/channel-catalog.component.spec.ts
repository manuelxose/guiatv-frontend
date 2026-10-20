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

  it('hides channels whose name is a raw feed id', () => {
    const raw = [{ channel: { id: 'xarxa_tv', name: 'Xarxa_TVMataro.TV' } }, { channel: { id: 'etb1_tv', name: 'ETB1.TV' } }] as TvReadChannelSummaryDTO[];
    expect(filterChannelDirectory([...channels, ...raw], '', 'all')).toEqual(channels);
  });

  it('supports explicit free/pay access filters', () => {
    expect(filterChannelDirectory(channels, '', 'free')).toEqual([channels[1]]);
    expect(filterChannelDirectory(channels, '', 'pay')).toEqual([channels[0]]);
  });
});
