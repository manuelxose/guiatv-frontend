import { ProgramListFacadeService } from './program-list-facade.service';
import { ProgramListService } from '../../state/program-list.service';

describe('ProgramListFacadeService time slots (embed widget)', () => {
  const facade = () => new ProgramListFacadeService({} as ProgramListService);

  afterEach(() => jasmine.clock().uninstall());

  it('picks the current 3-hour slot in Madrid time, CEST and CET alike', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-10-20T12:07:00Z')); // 14:07 CEST
    expect(facade().getCurrentTimeSlot()).toBe(4); // 12:00-15:00
    jasmine.clock().mockDate(new Date('2026-12-01T22:30:00Z')); // 23:30 CET
    expect(facade().getCurrentTimeSlot()).toBe(7); // 21:00-00:00
    jasmine.clock().mockDate(new Date('2026-10-25T00:30:00Z')); // 02:30 CEST, the night the clocks go back
    expect(facade().getCurrentTimeSlot()).toBe(0);
  });

  it('treats a missing ?timeSlot as "current slot", not as slot 0', () => {
    const service = facade();
    service.configureEmbed({ theme: 'light', date: 'today', timeSlot: null, channelLimit: 5, autorefreshSeconds: 300, language: 'es', showCategoryFilter: false });
    expect(service.getConfiguredTimeSlot()).toBeNull();
    service.configureEmbed({ theme: 'light', date: 'today', timeSlot: '0', channelLimit: 5, autorefreshSeconds: 300, language: 'es', showCategoryFilter: false });
    expect(service.getConfiguredTimeSlot()).toBe(0);
  });
});
