// src/v2/application/use-cases/PrecomputeSchedule.ts

import { GetPrograms } from './GetPrograms';
import { GetAllChannels } from './GetAllChannels';
import { ChannelMapper } from '../mappers/ChannelMapper';
import { logger } from '../../shared/utils/logger';
import { DateUtils } from '../../shared/utils/dateUtils';
import { IStorageRepository } from '@/domain/repositories/IStorageRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { invalidateSitemapCache } from '../../presentation/controllers/SitemapController';

export interface PrecomputeScheduleRequest {
  date: string; // YYYYMMDD or alias
  fields?: 'minimal' | 'full';
}

export interface PrecomputeScheduleResult {
  success: boolean;
  filePath: string;
  signedUrl?: string;
  fileSize: number;
  cachedKey?: string;
}

/**
 * Precomputes schedule snapshots and stores them in persistent storage and cache.
 */
export class PrecomputeSchedule {
  private readonly precomputeLogger = logger.child('PrecomputeSchedule');
  private readonly layoutVersion =
    process.env.LAYOUT_VERSION || 'v1';
  private readonly fullSnapshotLimit =
    Number(process.env.PROGRAMS_FULL_SNAPSHOT_LIMIT || 100000) || 100000;

  constructor(
    private readonly getPrograms: GetPrograms,
    private readonly getAllChannels: GetAllChannels,
    private readonly storageRepository: IStorageRepository,
    private readonly cacheRepository: ICacheRepository
  ) {}

  /**
   * Precompute for the canonical 4-day window: yesterday, today, tomorrow, after_tomorrow.
   */
  async precomputeCanonicalWindow(fields: 'minimal' | 'full' = 'full'): Promise<void> {
    const aliases = ['yesterday', 'today', 'tomorrow', 'after_tomorrow'];
    for (const alias of aliases) {
      try {
        const date = DateUtils.parseDateAlias(alias);
        await this.execute({ date, fields });
      } catch (error) {
        this.precomputeLogger.error('Failed precompute for window', {
          alias,
          error,
        });
      }
    }

    invalidateSitemapCache();
  }

  /**
   * Generates and stores a precomputed schedule snapshot for a given date.
   */
  async execute(
    request: PrecomputeScheduleRequest
  ): Promise<PrecomputeScheduleResult> {
    const fields = request.fields || 'full';
    try {
      this.precomputeLogger.info('Precomputing schedule', {
        date: request.date,
        fields,
      });

      // 1. Fetch all programs (layout already computed)
      const { programs, channels: channelMeta, timeSlots } =
        await this.getPrograms.execute({
          date: request.date,
          limit: this.fullSnapshotLimit,
          fields,
          skipScheduleSnapshot: true,
        });

      // 2. Group by channel
      const programsByChannel = new Map<string, typeof programs>();
      programs.forEach((p) => {
        const list = programsByChannel.get(p.channelId) || [];
        list.push(p);
        programsByChannel.set(p.channelId, list);
      });

      // 3. Fetch channel details
      const allChannels = await this.getAllChannels.execute({ isActive: true });

      // 4. Build schedule structure
      const schedule = Array.from(programsByChannel.entries())
        .map(([channelId, channelPrograms]) => {
          const channel = allChannels.find((c) => c.id === channelId);
          return {
            channel: channel ? ChannelMapper.toDTO(channel) : null,
            programs: channelPrograms,
          };
        })
        .filter((s) => s.channel !== null);

      // 5. Serialize to JSON
      const generatedAt = new Date().toISOString();
      const jsonContent = JSON.stringify({
        date: request.date,
        layoutVersion: this.layoutVersion,
        channels: schedule,
        timeSlots,
        channelMeta,
        meta: {
          totalChannels: schedule.length,
          totalPrograms: programs.length,
          generatedAt,
          fields,
        },
      });

      // 6. Save to storage
      const filePath = `schedules/${request.date}.json`;
      await this.storageRepository.upload(filePath, jsonContent, {
        contentType: 'application/json',
        metadata: {
          date: request.date,
          generatedAt,
        },
      });

      // 7. Signed URL
      const signedUrl = await this.storageRepository.getSignedUrl(
        filePath,
        360
      ); // 6h

      const fileSize = Buffer.byteLength(jsonContent);

      // 8. Warm precomputed cache for the canonical path
      const preKey = `precomputed:programs:${request.date}:${fields}`;
      await this.cacheRepository.set(preKey, {
        date: request.date,
        timeSlots,
        channels: channelMeta,
        programs,
        meta: {
          date: request.date,
          totalChannels: channelMeta.length,
          totalPrograms: programs.length,
          cached: true,
          precomputed: true,
          generatedAt,
          layoutVersion: this.layoutVersion,
        },
      });

      // 9. Persist materialized schedule in Mongo and cache snapshot for filtered reads
      try {
        const { ScheduleModel } = await import('../../infrastructure/database/models/Schedule.model');
        await ScheduleModel.findOneAndUpdate(
          { date: request.date },
          {
            date: request.date,
            layoutVersion: this.layoutVersion,
            generatedAt: new Date(generatedAt),
            timeSlots,
            channelMeta,
            channels: schedule.map((item) => ({
              channelId: item.channel?.id,
              channel: item.channel,
              programs: item.programs,
            })),
            meta: { totalChannels: schedule.length, totalPrograms: programs.length, fields, generatedAt },
          },
          { upsert: true, new: true }
        ).exec();

        await this.cacheRepository.set(
          `schedule:json:${request.date}:${fields}`,
          {
            date: request.date,
            timeSlots,
            channels: channelMeta,
            programs,
            layoutVersion: this.layoutVersion,
          },
          Number(process.env.SCHEDULE_CACHE_TTL_SEC || 21600) // 6h default
        );

        // Warm layouts snapshot cache key (versioned) with materialized channels.
        await this.cacheRepository.set(
          `precomputed:programs:${request.date}:${fields}:${this.layoutVersion}`,
          {
            date: request.date,
            timeSlots,
            channelMeta,
            channels: schedule.map((item) => ({
              channelId: item.channel?.id,
              channel: item.channel,
              programs: item.programs,
            })),
            meta: {
              layoutVersion: this.layoutVersion,
              generatedAt,
            },
          },
          Number(process.env.SCHEDULE_CACHE_TTL_SEC || 21600)
        );
      } catch (err) {
        this.precomputeLogger.warn('Failed to persist/cache schedule snapshot', { error: (err as Error).message });
      }

      this.precomputeLogger.info('Schedule precomputed successfully', {
        date: request.date,
        filePath,
        fileSize,
        cacheKey: preKey,
      });

      invalidateSitemapCache();

      return {
        success: true,
        filePath,
        signedUrl,
        fileSize,
        cachedKey: preKey,
      };
    } catch (error) {
      this.precomputeLogger.error(
        'Failed to precompute schedule',
        error as Error
      );
      throw error;
    }
  }
}
