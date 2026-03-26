import { logger } from '../../shared/utils/logger';
import { DateUtils } from '../../shared/utils/dateUtils';
import { invalidateSitemapCache } from '../../presentation/controllers/SitemapController';
import { TvReadModelBuilder } from '../services/TvReadModelBuilder';

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
 * Rebuilds the canonical TV read model for one or more dates.
 * The legacy schedule snapshot is intentionally replaced by tv_read_airings.
 */
export class PrecomputeSchedule {
  private readonly precomputeLogger = logger.child('PrecomputeSchedule');

  constructor(private readonly tvReadModelBuilder: TvReadModelBuilder) {}

  async precomputeCanonicalWindow(_fields: 'minimal' | 'full' = 'full'): Promise<void> {
    const aliases = ['yesterday', 'today', 'tomorrow', 'after_tomorrow'];
    for (const alias of aliases) {
      try {
        const date = DateUtils.parseDateAlias(alias);
        await this.execute({ date });
      } catch (error) {
        this.precomputeLogger.error('Failed TV read model rebuild for window', {
          alias,
          error,
        });
      }
    }

    invalidateSitemapCache();
  }

  async execute(
    request: PrecomputeScheduleRequest
  ): Promise<PrecomputeScheduleResult> {
    const date = DateUtils.parseDateAlias(request.date);

    this.precomputeLogger.info('Rebuilding canonical TV read model', { date });
    const result = await this.tvReadModelBuilder.rebuildDate(date);
    invalidateSitemapCache();

    return {
      success: true,
      filePath: `tv_read_airings/${date}.json`,
      fileSize: result.airingsUpserted,
      cachedKey: `tv:read:${date}:*`,
    };
  }
}
