// src/v2/application/use-cases/GetProgramsByDate.ts

import { Program } from '../../domain/entities/Program';
import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { DateRange } from '../../domain/value-objects/DateRange';

export interface GetProgramsByDateRequest {
  date: string; // YYYYMMDD
  channelId?: string;
  genre?: string;
  limit?: number;
  offset?: number;
}

export class GetProgramsByDate {
  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly cacheRepository: ICacheRepository
  ) {}

  async execute(request: GetProgramsByDateRequest): Promise<Program[]> {
    const dateRange = DateRange.fromString(request.date);
    const cacheKey = this.buildCacheKey(request);

    // Intentar desde caché
    const cached = await this.cacheRepository.get<any[]>(cacheKey);
    if (cached) {
      return cached.map((p) =>
        Program.create({
          ...p,
          startTime: new Date(p.startTime),
          endTime: new Date(p.endTime),
        })
      );
    }

    // Buscar en repositorio
    const programs = await this.programRepository.findByDateRange(dateRange, {
      channelId: request.channelId,
      genre: request.genre,
      limit: request.limit || 100,
      offset: request.offset || 0,
    });

    if (programs.length > 0) {
      await this.cacheRepository.set(
        cacheKey,
        programs.map((p) => p.toJSON()),
        300 // 5 min
      );
    }

    return programs;
  }

  private buildCacheKey(request: GetProgramsByDateRequest): string {
    const parts = ['programs', request.date];
    if (request.channelId) parts.push(request.channelId);
    if (request.genre) parts.push(request.genre);
    parts.push(`${request.limit || 100}-${request.offset || 0}`);
    return parts.join(':');
  }
}
