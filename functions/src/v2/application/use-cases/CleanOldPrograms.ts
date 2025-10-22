// src/v2/application/use-cases/CleanOldPrograms.ts

import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { DateRange } from '../../domain/value-objects/DateRange';
import { DateUtils } from '../../shared/utils/dateUtils';
import { logger } from '../../shared/utils/logger';

export interface CleanOldProgramsRequest {
  daysToKeep?: number; // Por defecto 7 días
}

export interface CleanOldProgramsResult {
  success: boolean;
  datesRemoved: string[];
  errors: string[];
}

export class CleanOldPrograms {
  private readonly cleanLogger = logger.child('CleanOldPrograms');

  constructor(private readonly programRepository: IProgramRepository) {}

  async execute(
    request: CleanOldProgramsRequest = {}
  ): Promise<CleanOldProgramsResult> {
    const daysToKeep = request.daysToKeep || 7;
    const errors: string[] = [];
    const datesRemoved: string[] = [];

    try {
      this.cleanLogger.info('Starting cleanup of old programs', { daysToKeep });

      const today = new Date();
      const cutoffDate = DateUtils.addDays(today, -daysToKeep);
      const cutoffDateStr = DateUtils.formatYYYYMMDD(cutoffDate);

      this.cleanLogger.info('Removing programs before date', {
        cutoffDate: cutoffDateStr,
      });

      // Eliminar programas día por día
      for (let i = 30; i > daysToKeep; i--) {
        const dateToRemove = DateUtils.addDays(today, -i);
        const dateStr = DateUtils.formatYYYYMMDD(dateToRemove);

        try {
          const dateRange = DateRange.fromString(dateStr);
          await this.programRepository.deleteByDateRange(dateRange);
          datesRemoved.push(dateStr);

          this.cleanLogger.info('Programs removed for date', { date: dateStr });
        } catch (error) {
          this.cleanLogger.error(
            'Failed to remove programs for date',
            error as Error,
            {
              date: dateStr,
            }
          );
          errors.push(
            `Failed to remove ${dateStr}: ${(error as Error).message}`
          );
        }
      }

      this.cleanLogger.info('Cleanup completed', {
        datesRemoved: datesRemoved.length,
        errors: errors.length,
      });

      return {
        success: errors.length === 0,
        datesRemoved,
        errors,
      };
    } catch (error) {
      this.cleanLogger.error('Cleanup failed', error as Error);
      return {
        success: false,
        datesRemoved,
        errors: [(error as Error).message],
      };
    }
  }
}
