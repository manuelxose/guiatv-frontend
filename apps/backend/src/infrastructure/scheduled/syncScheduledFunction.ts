// src/v2/infrastructure/scheduled/syncScheduledFunction.ts

import { SyncEPGData } from '../../application/use-cases/SyncEPGData';
import { PrecomputeSchedule } from '../../application/use-cases/PrecomputeSchedule';
import { CleanOldPrograms } from '../../application/use-cases/CleanOldPrograms';
import { DateUtils } from '../../shared/utils/dateUtils';
import { logger } from '../../shared/utils/logger';
import { EPGDataSource } from '../external/EPGDataSource';
import { XMLParser } from '../parsers/XMLParser';
import { submitSitemapToSearchConsole } from '../../application/services/submitSitemapToSearchConsole';

/**
 * Sincronización diaria de datos EPG
 * Se ejecuta cada 6 horas
 */
export const syncEPGDataHandler = async (context: any) => {
  void context;
  const syncLogger = logger.child('SyncScheduled');

  try {
    syncLogger.info('Starting scheduled EPG sync');

    // Inicializar container de forma dinámica para evitar ejecutar
    // inicialización pesada durante la fase de discovery/deploy.
    let syncUseCase: SyncEPGData;
    if (process.env.SKIP_CONTAINER_INIT === '1' || process.env.SKIP_CONTAINER_INIT === 'true') {
      syncLogger.warn('SKIP_CONTAINER_INIT set - skipping container initialization for scheduled sync');
      throw new Error('Container initialization skipped by SKIP_CONTAINER_INIT');
    } else {
      const { Container } = await import('../../config/container');
      const container = Container.getInstance();
      await container.initialize();

      syncUseCase = container.get<SyncEPGData>('syncEPGData');
    }

    // Sincronizar ventana canónica: ayer, hoy, mañana y pasado mañana
    const datesToSync = [
      DateUtils.getYesterdayYYYYMMDD(),
      DateUtils.getTodayYYYYMMDD(),
      DateUtils.getTomorrowYYYYMMDD(),
      DateUtils.getAfterTomorrowYYYYMMDD(),
    ];

    // Descargar y parsear el XML una sola vez para reutilizar en todas las fechas
    const sourceUrl =
      'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz';
    const dataSource = new EPGDataSource({
      url: sourceUrl,
      timeout: 60000,
      compressed: sourceUrl.endsWith('.gz'),
    });
    syncLogger.info('Fetching EPG once for all dates', { sourceUrl });
    const xmlContent = await dataSource.fetchWithRetry(3);
    const xmlParser = new XMLParser();
    const parsedData = await xmlParser.parse(xmlContent);

    const results = [];
    let isFirstDate = true;

    for (const date of datesToSync) {
      syncLogger.info('Syncing date', { date });

      const result = await syncUseCase.execute({
        sourceUrl,
        date,
        forceRefresh: true,
        xmlContent,
        parsedData,
        skipSaveXml: !isFirstDate,
      });
      isFirstDate = false;

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
};

/**
 * Precomputar schedules para acceso rápido
 * Se ejecuta 15 minutos después del sync
 */
export const precomputeSchedulesHandler = async (context: any) => {
  void context;
  const precomputeLogger = logger.child('PrecomputeScheduled');

  try {
    precomputeLogger.info('Starting scheduled precompute');

    let precomputeUseCase: PrecomputeSchedule;
    if (process.env.SKIP_CONTAINER_INIT === '1' || process.env.SKIP_CONTAINER_INIT === 'true') {
      precomputeLogger.warn('SKIP_CONTAINER_INIT set - skipping container initialization for scheduled precompute');
      throw new Error('Container initialization skipped by SKIP_CONTAINER_INIT');
    } else {
      const { Container } = await import('../../config/container');
      const container = Container.getInstance();
      await container.initialize();

      precomputeUseCase = container.get<PrecomputeSchedule>('precomputeSchedule');
    }

    const datesToPrecompute = [
      DateUtils.getYesterdayYYYYMMDD(),
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

    const submitResult = await submitSitemapToSearchConsole({
      throwOnError: false,
      logger: precomputeLogger,
    });
    if (submitResult.skipped) {
      precomputeLogger.info('Search Console sitemap submit skipped', {
        result: submitResult,
      });
    } else if (!submitResult.submitted) {
      precomputeLogger.warn('Search Console sitemap submit not completed', {
        result: submitResult,
      });
    }

    return { success: true, results };
  } catch (error) {
    precomputeLogger.error('Scheduled precompute failed', error as Error);
    throw error;
  }
};

/**
 * Limpieza de programas antiguos
 * Se ejecuta diariamente a las 3 AM
 */
export const cleanOldProgramsHandler = async (context: any) => {
  void context;
  const cleanLogger = logger.child('CleanScheduled');

  try {
    cleanLogger.info('Starting scheduled cleanup');

    let cleanUseCase: CleanOldPrograms;
    if (process.env.SKIP_CONTAINER_INIT === '1' || process.env.SKIP_CONTAINER_INIT === 'true') {
      cleanLogger.warn('SKIP_CONTAINER_INIT set - skipping container initialization for scheduled cleanup');
      throw new Error('Container initialization skipped by SKIP_CONTAINER_INIT');
    } else {
      const { Container } = await import('../../config/container');
      const container = Container.getInstance();
      await container.initialize();

      cleanUseCase = container.get<CleanOldPrograms>('cleanOldPrograms');
    }

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
};
