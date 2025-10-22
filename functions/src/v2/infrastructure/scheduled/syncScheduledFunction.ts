// src/v2/infrastructure/scheduled/syncScheduledFunction.ts

import * as functions from 'firebase-functions';
import { Container } from '../../config/container';
import { SyncEPGData } from '../../application/use-cases/SyncEPGData';
import { PrecomputeSchedule } from '../../application/use-cases/PrecomputeSchedule';
import { CleanOldPrograms } from '../../application/use-cases/CleanOldPrograms';
import { DateUtils } from '../../shared/utils/dateUtils';
import { logger } from '../../shared/utils/logger';

/**
 * Sincronización diaria de datos EPG
 * Se ejecuta cada 6 horas
 */
export const syncEPGDataScheduled = functions
  .runWith({
    memory: '1GB',
    timeoutSeconds: 540,
  })
  .pubsub.schedule('0 */6 * * *') // Cada 6 horas
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    const syncLogger = logger.child('SyncScheduled');

    try {
      syncLogger.info('Starting scheduled EPG sync');

      // Inicializar container
      const container = Container.getInstance();
      await container.initialize();

      const syncUseCase = container.get<SyncEPGData>('syncEPGData');

      // Sincronizar hoy, mañana y pasado mañana
      const datesToSync = [
        DateUtils.getTodayYYYYMMDD(),
        DateUtils.getTomorrowYYYYMMDD(),
        DateUtils.getAfterTomorrowYYYYMMDD(),
      ];

      const results = [];

      for (const date of datesToSync) {
        syncLogger.info('Syncing date', { date });

        const result = await syncUseCase.execute({
          sourceUrl:
            'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz',
          date,
          forceRefresh: true,
        });

        results.push({ date, ...result });

        if (result.success) {
          syncLogger.info('Sync completed for date', {
            date,
            channelsProcessed: result.channelsProcessed,
            programsProcessed: result.programsProcessed,
            duration: result.duration,
          });
        } else {
          syncLogger.error(
            'Sync failed for date',
            new Error(result.errors.join(', ')),
            { date }
          );
        }
      }

      syncLogger.info('All syncs completed', {
        total: results.length,
        successful: results.filter((r) => r.success).length,
      });

      return { success: true, results };
    } catch (error) {
      syncLogger.error('Scheduled sync failed', error as Error);
      throw error;
    }
  });

/**
 * Precomputar schedules para acceso rápido
 * Se ejecuta 15 minutos después del sync
 */
export const precomputeSchedulesScheduled = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 300,
  })
  .pubsub.schedule('15 */6 * * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    const precomputeLogger = logger.child('PrecomputeScheduled');

    try {
      precomputeLogger.info('Starting scheduled precompute');

      const container = Container.getInstance();
      await container.initialize();

      const precomputeUseCase =
        container.get<PrecomputeSchedule>('precomputeSchedule');

      const datesToPrecompute = [
        DateUtils.getTodayYYYYMMDD(),
        DateUtils.getTomorrowYYYYMMDD(),
        DateUtils.getAfterTomorrowYYYYMMDD(),
      ];

      const results = [];

      for (const date of datesToPrecompute) {
        precomputeLogger.info('Precomputing schedule for date', { date });

        const result = await precomputeUseCase.execute({ date });
        results.push({ date, ...result });

        if (result.success) {
          precomputeLogger.info('Precompute completed', {
            date,
            filePath: result.filePath,
            fileSize: result.fileSize,
          });
        }
      }

      precomputeLogger.info('All precomputes completed', {
        total: results.length,
        successful: results.filter((r) => r.success).length,
      });

      return { success: true, results };
    } catch (error) {
      precomputeLogger.error('Scheduled precompute failed', error as Error);
      throw error;
    }
  });

/**
 * Limpieza de programas antiguos
 * Se ejecuta diariamente a las 3 AM
 */
export const cleanOldProgramsScheduled = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 300,
  })
  .pubsub.schedule('0 3 * * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    const cleanLogger = logger.child('CleanScheduled');

    try {
      cleanLogger.info('Starting scheduled cleanup');

      const container = Container.getInstance();
      await container.initialize();

      const cleanUseCase = container.get<CleanOldPrograms>('cleanOldPrograms');

      const result = await cleanUseCase.execute({
        daysToKeep: 7, // Mantener últimos 7 días
      });

      if (result.success) {
        cleanLogger.info('Cleanup completed successfully', {
          datesRemoved: result.datesRemoved.length,
        });
      } else {
        cleanLogger.warn('Cleanup completed with errors', {
          datesRemoved: result.datesRemoved.length,
          errors: result.errors,
        });
      }

      return result;
    } catch (error) {
      cleanLogger.error('Scheduled cleanup failed', error as Error);
      throw error;
    }
  });
