// src/v2/domain/services/ProgramService.ts

import { Program } from '../entities/Program';

export class ProgramService {
  getCurrentProgram(programs: Program[]): Program | null {
    const now = new Date();

    return programs.find((p) => p.startTime <= now && p.endTime > now) || null;
  }

  getNextPrograms(programs: Program[], count: number = 3): Program[] {
    const now = new Date();

    return programs
      .filter((p) => p.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, count);
  }

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
