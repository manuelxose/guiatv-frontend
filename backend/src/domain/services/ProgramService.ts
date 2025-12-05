// src/v2/domain/services/ProgramService.ts

import { Program } from '../entities/Program';

/**
 * Lightweight utility service to query program lists.
 */
export class ProgramService {
  /**
   * Returns the program airing at the current time.
   */
  getCurrentProgram(programs: Program[]): Program | null {
    const now = new Date();

    return programs.find((p) => p.startTime <= now && p.endTime > now) || null;
  }

  /**
   * Retrieves the next N upcoming programs sorted by start time.
   *
   * @param programs - Full program list.
   * @param count - Amount of items to return (default 3).
   */
  getNextPrograms(programs: Program[], count: number = 3): Program[] {
    const now = new Date();

    return programs
      .filter((p) => p.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, count);
  }

  /**
   * Filters the given programs that overlap the provided range.
   */
  filterByTimeRange(
    programs: Program[],
    startTime: Date,
    endTime: Date
  ): Program[] {
    return programs.filter(
      (p) =>
        (p.startTime >= startTime && p.startTime < endTime) ||
        (p.endTime > startTime && p.endTime <= endTime) ||
        (p.startTime <= startTime && p.endTime >= endTime)
    );
  }

  /**
   * Groups programs by channel identifier.
   */
  groupByChannel(programs: Program[]): Map<string, Program[]> {
    const grouped = new Map<string, Program[]>();

    programs.forEach((program) => {
      const existing = grouped.get(program.channelId) || [];
      existing.push(program);
      grouped.set(program.channelId, existing);
    });

    return grouped;
  }
}
