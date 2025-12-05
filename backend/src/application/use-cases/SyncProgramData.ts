// src/v2/application/use-cases/SyncProgramData.ts

import { Program } from '../../domain/entities/Program';
import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';

export interface SyncProgramDataRequest {
  programs: Array<{
    id: string;
    channelId: string;
    title: string;
    startTime: Date;
    endTime: Date;
    description?: string;
    image?: string;
    genre?: string;
  }>;
  clearCache?: boolean;
}

/**
 * Persists batches of program data and optionally clears related caches.
 */
export class SyncProgramData {
  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly cacheRepository: ICacheRepository
  ) {}

  /**
   * Saves the provided programs and triggers cache invalidation when requested.
   */
  async execute(request: SyncProgramDataRequest): Promise<void> {
    const programs = request.programs.map((p) => Program.create(p));

    await this.programRepository.saveBatch(programs);

    if (request.clearCache) {
      await this.cacheRepository.clear('programs:*');
    }
  }
}
