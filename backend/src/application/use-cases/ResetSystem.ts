import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import { SyncEPGData } from './SyncEPGData';
import { PrecomputeSchedule } from './PrecomputeSchedule';
import { DateUtils } from '../../shared/utils/dateUtils';
import { logger } from '../../shared/utils/logger';
import { ChannelModel } from '../../infrastructure/database/models/Channel.model';
import { ProgramModel } from '../../infrastructure/database/models/Program.model';
import { ScheduleModel } from '../../infrastructure/database/models/Schedule.model';

export interface ResetSystemRequest {
  sourceUrl?: string;
  fields?: 'minimal' | 'full';
}

export interface ResetSystemResult {
  cacheCleared: boolean;
  dbCleared: { channels: number; programs: number; schedules: number };
  storageCleared: { epgXML: number; schedules: number; channelIcons: number };
  syncedDates: string[];
  precomputed: boolean;
}

export class ResetSystem {
  private readonly resetLogger = logger.child('ResetSystem');
  private readonly defaultSource =
    'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz';

  constructor(
    private readonly cacheRepository: ICacheRepository,
    private readonly storageRepository: IStorageRepository,
    private readonly syncEPGData: SyncEPGData,
    private readonly precomputeSchedule: PrecomputeSchedule
  ) {}

  async execute(request: ResetSystemRequest = {}): Promise<ResetSystemResult> {
    const syncedDates: string[] = [];

    // 1) Cache
    await this.cacheRepository.clear();
    this.resetLogger.info('Cache cleared');

    // 2) Mongo collections
    const channelDel = await ChannelModel.deleteMany({});
    const programDel = await ProgramModel.deleteMany({});
    const scheduleDel = await ScheduleModel.deleteMany({});
    this.resetLogger.info('Mongo collections truncated');

    // 3) Storage cleanup
    const storageStats = { epgXML: 0, schedules: 0, channelIcons: 0 };
    const prefixes = [
      { prefix: 'epg_xml/', key: 'epgXML' as const },
      { prefix: 'schedules/', key: 'schedules' as const },
      { prefix: 'channel_icons/', key: 'channelIcons' as const },
    ];

    for (const item of prefixes) {
      const files = await this.storageRepository.list(item.prefix);
      for (const file of files) {
        await this.storageRepository.delete(file);
        storageStats[item.key] += 1;
      }
    }
    this.resetLogger.info('Storage cleaned', storageStats);

    // 4) Re-synchronize EPG for canonical window
    const windowDates = ['yesterday', 'today', 'tomorrow', 'after_tomorrow'];
    for (const alias of windowDates) {
      const date = DateUtils.parseDateAlias(alias);
      await this.syncEPGData.execute({
        sourceUrl: request.sourceUrl || this.defaultSource,
        date,
        forceRefresh: true,
      });
      syncedDates.push(date);
    }

    // 5) Precompute
    await this.precomputeSchedule.precomputeCanonicalWindow(
      request.fields || 'full'
    );

    return {
      cacheCleared: true,
      dbCleared: {
        channels: channelDel.deletedCount || 0,
        programs: programDel.deletedCount || 0,
        schedules: scheduleDel.deletedCount || 0,
      },
      storageCleared: storageStats,
      syncedDates,
      precomputed: true,
    };
  }
}
