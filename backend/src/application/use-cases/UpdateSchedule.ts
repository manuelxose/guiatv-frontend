import { Schedule } from '../../domain/entities/Schedule';

/**
 * Placeholder use case to update schedules (extension point for future logic).
 */
export class UpdateSchedule {
  /**
   * Executes the update; currently a no-op awaiting business rules.
   */
  async execute(schedule: Schedule): Promise<void> {
    void schedule;
    // placeholder
    return Promise.resolve();
  }
}
