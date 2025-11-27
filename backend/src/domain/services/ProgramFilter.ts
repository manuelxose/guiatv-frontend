import { Program } from '../entities/Program';
import { TimeSlot } from '../value-objects/TimeSlot';

const DEFAULT_TIME_SLOTS: Array<TimeSlot> = [
  new TimeSlot('06:00', '12:00'),
  new TimeSlot('12:00', '18:00'),
  new TimeSlot('18:00', '00:00'),
  new TimeSlot('00:00', '06:00'),
];

export class ProgramFilter {
  /**
   * Filter programs by a time slot index string ("0", "1", etc.)
   */
  static byTimeSlot(
    programs: Program[],
    slotIndex: string,
    timeSlots: TimeSlot[] = DEFAULT_TIME_SLOTS
  ): Program[] {
    const index = parseInt(slotIndex, 10);
    if (isNaN(index) || index < 0 || index >= timeSlots.length) {
      return programs;
    }

    const slot = timeSlots[index];
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);

    return programs.filter((program) => {
      const start = program.startTime;
      const programMinutes = start.getHours() * 60 + start.getMinutes();
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Handle slots that wrap past midnight
      if (endMinutes < startMinutes) {
        return programMinutes >= startMinutes || programMinutes < endMinutes;
      }

      return programMinutes >= startMinutes && programMinutes < endMinutes;
    });
  }
}

export { DEFAULT_TIME_SLOTS };
