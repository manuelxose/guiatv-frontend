import { Schedule } from '../entities/Schedule';

/**
 * Future extension point to orchestrate schedule updates.
 */
export class ScheduleService {
  /**
   * Updates or persists schedule data.
   *
   * @param schedule - Domain schedule aggregate to persist.
   */
  async updateSchedule(schedule: Schedule): Promise<void> {
    void schedule;
    // placeholder for schedule update logic
    return Promise.resolve();
  }
}
