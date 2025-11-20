// src/v2/application/use-cases/GetChannelPrograms.ts

import { Program } from '../../domain/entities/Program';
import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { ChannelId } from '../../domain/value-objects/ChannelId';
import { DateRange } from '../../domain/value-objects/DateRange';
import { ProgramService } from '../../domain/services/ProgramService';

export interface GetChannelProgramsRequest {
  channelId: string;
  date: string; // YYYYMMDD
  fromTime?: string; // HH:mm
  toTime?: string; // HH:mm
}

export class GetChannelPrograms {
  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly cacheRepository: ICacheRepository,
    private readonly programService: ProgramService
  ) {}

  async execute(request: GetChannelProgramsRequest): Promise<Program[]> {
    const dateRange = DateRange.fromString(request.date);
    const cacheKey = `programs:${request.channelId}:${request.date}`;

    const cached = await this.cacheRepository.get<any[]>(cacheKey);
    if (cached) {
      const programs = cached.map((p) =>
        Program.create({
          ...p,
          startTime: new Date(p.startTime),
          endTime: new Date(p.endTime),
        })
      );
      return this.applyTimeFilter(programs, request);
    }

    const programs = await this.programRepository.findByChannel(
      ChannelId.create(request.channelId),
      dateRange
    );

    if (programs.length > 0) {
      await this.cacheRepository.set(
        cacheKey,
        programs.map((p) => p.toJSON()),
        300
      );
    }

    return this.applyTimeFilter(programs, request);
  }

  private applyTimeFilter(
    programs: Program[],
    request: GetChannelProgramsRequest
  ): Program[] {
    if (!request.fromTime && !request.toTime) {
      return programs;
    }

    const dateStr = request.date;
    const fromTime = request.fromTime
      ? this.parseTime(dateStr, request.fromTime)
      : new Date(
          parseInt(dateStr.slice(0, 4)),
          parseInt(dateStr.slice(4, 6)) - 1,
          parseInt(dateStr.slice(6, 8)),
          0,
          0
        );

    const toTime = request.toTime
      ? this.parseTime(dateStr, request.toTime)
      : new Date(
          parseInt(dateStr.slice(0, 4)),
          parseInt(dateStr.slice(4, 6)) - 1,
          parseInt(dateStr.slice(6, 8)),
          23,
          59
        );

    return this.programService.filterByTimeRange(programs, fromTime, toTime);
  }

  private parseTime(dateStr: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(4, 6)) - 1,
      parseInt(dateStr.slice(6, 8)),
      hours,
      minutes
    );
  }
}
