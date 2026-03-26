// src/v2/infrastructure/scheduled/syncScheduledFunction.ts

import { SyncEPGData } from '../../application/use-cases/SyncEPGData';
import { PrecomputeSchedule } from '../../application/use-cases/PrecomputeSchedule';
import { CleanOldPrograms } from '../../application/use-cases/CleanOldPrograms';
import { DateUtils } from '../../shared/utils/dateUtils';
import { logger } from '../../shared/utils/logger';
import { EPGDataSource } from '../external/EPGDataSource';
import { XMLParser } from '../parsers/XMLParser';
import { submitSitemapToSearchConsole } from '../../application/services/submitSitemapToSearchConsole';
import { EPGSourceSnapshotModel } from '../database/models/EPGSourceSnapshot.model';
import { createHash } from 'node:crypto';
import {
  getConfiguredEpgSourceUrls,
} from '../../shared/config/epgSources';
import {
  buildChannelIdentityMetadata,
  inferChannelGroup,
  isGenericMovieTitle,
  normalizeTvToken,
  resolveProgramDisplayTitle,
} from '../../shared/utils/tvMetadata';

// ─── Multi-source EPG helpers ─────────────────────────────────────────────────

interface EPGSourceResult {
  sourceUrl: string;
  xml: string;
  parsed: { channels: any[]; programmes: any[] };
}

function normalizeChannelName(name: string): string {
  return normalizeTvToken(name, ' ');
}

function parseXmlDate(dateStr: string): Date {
  const normalized = String(dateStr || '').trim();
  const match = normalized.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?$/
  );

  if (!match) {
    throw new Error(`Invalid XML datetime format: "${dateStr}"`);
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);
  const baseUtcMillis = Date.UTC(year, month, day, hour, minute, second);

  if (!match[7]) {
    return new Date(baseUtcMillis);
  }

  const sign = match[7] === '+' ? 1 : -1;
  const offsetHours = parseInt(match[8], 10);
  const offsetMinutes = parseInt(match[9], 10);
  const totalOffsetMinutes = sign * (offsetHours * 60 + offsetMinutes);
  return new Date(baseUtcMillis - totalOffsetMinutes * 60_000);
}

function annotateSourceParsedData(
  sourceUrl: string,
  parsed: { channels: any[]; programmes: any[] }
): { channels: any[]; programmes: any[] } {
  return {
    channels: parsed.channels.map((channel: any) => ({
      ...channel,
      sourceFeed: sourceUrl,
    })),
    programmes: parsed.programmes.map((programme: any) => ({
      ...programme,
      sourceFeed: sourceUrl,
      sourceProgrammeId:
        programme.sourceProgrammeId ||
        `${programme.channelId}|${programme.start}|${programme.title}`,
      sourceAssetCandidates: programme.icon
        ? [
            {
              kind: 'poster',
              role: 'primary',
              source: 'epg_program_image',
              url: programme.icon,
              sourceFeed: sourceUrl,
            },
          ]
        : [],
      sourceProvenance: {
        schedule: [sourceUrl],
        metadata: [sourceUrl],
        assets: programme.icon ? ['epg_program_image'] : [],
      },
    })),
  };
}

function filterSourceProgrammesByDate(
  programmes: any[],
  date: string
): any[] {
  const { start: dayStart, end: dayEnd } = DateUtils.getDayRangeYYYYMMDD(date);
  return programmes
    .filter((programme) => {
      try {
        const startDate = parseXmlDate(String(programme.start || ''));
        let endDate = parseXmlDate(String(programme.stop || ''));
        if (endDate <= startDate) {
          endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
        }
        return startDate < dayEnd && endDate > dayStart;
      } catch {
        return false;
      }
    })
    .map((programme) => ({
      channelId: programme.channelId,
      start: programme.start,
      stop: programme.stop,
      title: programme.title,
      subTitle: programme.subTitle,
      icon: programme.icon,
      category: programme.category,
      year: programme.year,
      rating: programme.rating,
      sourceFeed: programme.sourceFeed,
      sourceProgrammeId: programme.sourceProgrammeId,
      sourceAssetCandidates: programme.sourceAssetCandidates,
      sourceProvenance: programme.sourceProvenance,
    }));
}

function buildSnapshotStats(source: EPGSourceResult, date: string) {
  const programmesForDate = filterSourceProgrammesByDate(source.parsed.programmes, date);
  const tdtChannelAliases = new Set<string>();

  source.parsed.channels.forEach((channel: any) => {
    const identity = buildChannelIdentityMetadata({
      name: channel.displayName,
      sourceId: channel.id,
      country: channel.country,
      countryCode: channel.countryCode,
    });
    if (
      inferChannelGroup({
        name: channel.displayName,
        sourceId: channel.id,
        type: identity.inferredType,
        country: channel.country,
        countryCode: channel.countryCode,
      }) !== 'tdt'
    ) {
      return;
    }

    [
      channel.id,
      channel.displayName,
      ...identity.aliases,
      ...identity.sourceIds,
    ]
      .map((value) => normalizeTvToken(value))
      .filter(Boolean)
      .forEach((alias) => {
        tdtChannelAliases.add(alias);
      });
  });

  let programmeIconsCount = 0;
  let genericMovieTitleCount = 0;
  let tdtSpecificTitleCount = 0;

  programmesForDate.forEach((programme: any) => {
    if (programme.icon) {
      programmeIconsCount += 1;
    }

    const resolvedTitle = resolveProgramDisplayTitle(
      programme.title,
      programme.subTitle
    );
    const isGenericMovie = isGenericMovieTitle(resolvedTitle);
    if (isGenericMovie) {
      genericMovieTitleCount += 1;
    }

    const channelAliases = [
      programme.channelId,
      normalizeTvToken(programme.channelId),
    ]
      .map((value) => normalizeTvToken(value))
      .filter(Boolean);

    const isTdt = channelAliases.some((alias) => tdtChannelAliases.has(alias));
    if (isTdt && !isGenericMovie) {
      tdtSpecificTitleCount += 1;
    }
  });

  return {
    channelsCount: source.parsed.channels.length,
    programmesCount: programmesForDate.length,
    programmeIconsCount,
    genericMovieTitleCount,
    tdtSpecificTitleCount,
  };
}

// ──────────────────────────────────────────────────────────────────────────────

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

    // Support multiple EPG sources via EPG_SOURCE_URLS (comma-separated).
    // First URL is primary (drives channel/schedule). Additional URLs supply
    // programme images that the primary source may be missing.
    // The davidmuma/EPG_dobleM source provides poster artwork for Spanish programs.
    const sourceUrls = getConfiguredEpgSourceUrls();
    syncLogger.info('Fetching EPG source(s)', { count: sourceUrls.length, sourceUrls });

    const sourceResults = await Promise.all(
      sourceUrls.map(async (url: string): Promise<EPGSourceResult | null> => {
        try {
          const ds = new EPGDataSource({ url, timeout: 60000, compressed: url.endsWith('.gz') });
          const xml = await ds.fetchWithRetry(3);
          const parsed = annotateSourceParsedData(url, await new XMLParser().parse(xml));
          return { sourceUrl: url, xml, parsed };
        } catch (err) {
          syncLogger.error('Failed to fetch/parse EPG source', err as Error, { url });
          return null;
        }
      })
    );

    const validSources = sourceResults.filter(Boolean) as EPGSourceResult[];
    if (!validSources.length) throw new Error('All EPG sources failed to load');

    for (const date of datesToSync) {
      const snapshotOps = validSources.map((source) => {
        const programmesForDate = filterSourceProgrammesByDate(
          source.parsed.programmes,
          date
        );
        const stats = buildSnapshotStats(source, date);
        return (
        EPGSourceSnapshotModel.findOneAndUpdate(
          {
            sourceKey: normalizeChannelName(source.sourceUrl),
            date,
          },
          {
            $set: {
              sourceUrl: source.sourceUrl,
              sourceKey: normalizeChannelName(source.sourceUrl),
              date,
              payloadHash: createHash('sha1').update(source.xml).digest('hex'),
              channels: source.parsed.channels.map((channel: any) => ({
                id: channel.id,
                displayName: channel.displayName,
                icon: channel.icon,
                country: channel.country,
                countryCode: channel.countryCode,
              })),
              programmes: programmesForDate,
              stats,
            },
          },
          { upsert: true }
        ).exec()
        );
      });
      await Promise.all(snapshotOps);
    }

    const results = [];
    let hasSavedXml = false;

    for (const source of validSources) {
      for (const date of datesToSync) {
        syncLogger.info('Syncing source/date slice', {
          sourceUrl: source.sourceUrl,
          date,
        });

        const result = await syncUseCase.execute({
          sourceUrl: source.sourceUrl,
          date,
          forceRefresh: !results.length,
          xmlContent: source.xml,
          parsedData: source.parsed,
          skipSaveXml: hasSavedXml,
        });
        hasSavedXml = true;

        results.push({ date, sourceUrl: source.sourceUrl, ...result });

        if (result.success) {
          syncLogger.info('Sync completed for source/date slice', {
            sourceUrl: source.sourceUrl,
            date,
            channelsProcessed: result.channelsProcessed,
            programsProcessed: result.programsProcessed,
            duration: result.duration,
          });
        } else {
          syncLogger.error(
            'Sync failed for source/date slice',
            new Error(result.errors.join(', ')),
            { sourceUrl: source.sourceUrl, date }
          );
        }
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
