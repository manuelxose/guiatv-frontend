// src/v2/presentation/controllers/AdminController.ts

import { Request, Response } from 'express';
import { SyncEPGData } from '../../application/use-cases/SyncEPGData';
import { PrecomputeSchedule } from '../../application/use-cases/PrecomputeSchedule';
import { CleanOldPrograms } from '../../application/use-cases/CleanOldPrograms';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { DateUtils } from '../../shared/utils/dateUtils';
import { logger } from '../../shared/utils/logger';
import { ValidationError } from '../../shared/errors';

export class AdminController {
  private readonly adminLogger = logger.child('AdminController');

  constructor(
    private readonly syncEPGData: SyncEPGData,
    private readonly precomputeSchedule: PrecomputeSchedule,
    private readonly cleanOldPrograms: CleanOldPrograms,
    private readonly cacheRepository: ICacheRepository
  ) {}

  async triggerSync(req: Request, res: Response): Promise<void> {
    const { date, forceRefresh } = req.body;

    this.adminLogger.info('Manual sync triggered', { date, forceRefresh });

    const dateToSync = date || DateUtils.getTodayYYYYMMDD();

    if (date && !DateUtils.isValidYYYYMMDD(date)) {
      throw new ValidationError('Invalid date format', [
        {
          field: 'date',
          message: 'Expected YYYYMMDD format',
          value: date,
        },
      ]);
    }

    const result = await this.syncEPGData.execute({
      sourceUrl:
        'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz',
      date: dateToSync,
      forceRefresh: forceRefresh === true,
    });

    res.status(200).json({
      message: result.success
        ? 'Sync completed successfully'
        : 'Sync completed with errors',
      result,
    });
  }

  async triggerPrecompute(req: Request, res: Response): Promise<void> {
    const { date } = req.body;

    this.adminLogger.info('Manual precompute triggered', { date });

    const dateToPrecompute = date || DateUtils.getTodayYYYYMMDD();

    if (date && !DateUtils.isValidYYYYMMDD(date)) {
      throw new ValidationError('Invalid date format');
    }

    const result = await this.precomputeSchedule.execute({
      date: dateToPrecompute,
    });

    res.status(200).json({
      message: 'Precompute completed successfully',
      result,
    });
  }

  async triggerCleanup(req: Request, res: Response): Promise<void> {
    const { daysToKeep } = req.body;

    this.adminLogger.info('Manual cleanup triggered', { daysToKeep });

    if (daysToKeep && (typeof daysToKeep !== 'number' || daysToKeep < 1)) {
      throw new ValidationError('Invalid daysToKeep parameter', [
        {
          field: 'daysToKeep',
          message: 'Must be a positive number',
          value: daysToKeep,
        },
      ]);
    }

    const result = await this.cleanOldPrograms.execute({
      daysToKeep: daysToKeep || 7,
    });

    res.status(200).json({
      message: result.success
        ? 'Cleanup completed successfully'
        : 'Cleanup completed with errors',
      result,
    });
  }

  async clearCache(req: Request, res: Response): Promise<void> {
    const { pattern } = req.body;

    this.adminLogger.info('Cache clear triggered', { pattern });

    await this.cacheRepository.clear(pattern);

    res.status(200).json({
      message: 'Cache cleared successfully',
      pattern: pattern || 'all',
    });
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Verificar conectividad de servicios
    const services = {
      cache: await this.checkCacheHealth(),
    };

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      version: process.env.API_VERSION || '2.0.0',
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      },
      services,
    });
  }

  private async checkCacheHealth(): Promise<{ status: string; details?: any }> {
    try {
      await this.cacheRepository.set('health_check', { test: true }, 10);
      const value = await this.cacheRepository.get<{ test: boolean }>(
        'health_check'
      );
      await this.cacheRepository.delete('health_check');

      return {
        status: value && value.test ? 'healthy' : 'degraded',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: (error as Error).message,
      };
    }
  }
}
