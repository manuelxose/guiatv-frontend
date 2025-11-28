import { logger } from '../../shared/utils/logger';
import { ProgramModel } from './models/Program.model';
import { ChannelModel } from './models/Channel.model';
import { ScheduleModel } from './models/Schedule.model';
import { UserModel } from './models/User.model';

/**
 * Ensure required Mongo collections exist and indexes are in place.
 * This runs at boot to avoid lazy collection/index creation in runtime traffic.
 */
export async function ensureMongoCollectionsAndIndexes(): Promise<void> {
  const start = Date.now();

  const resources = [
    { name: 'channels', model: ChannelModel },
    { name: 'programs', model: ProgramModel },
    { name: 'schedules', model: ScheduleModel },
    { name: 'users', model: UserModel },
  ] as const;

  for (const { name, model } of resources) {
    try {
      // Create collection if it does not exist (no-op if it already exists)
      await model.createCollection();
      logger.info(`Mongo collection ready`, { collection: name });
    } catch (error: any) {
      // Ignore "NamespaceExists" errors; log others
      if (error?.codeName !== 'NamespaceExists') {
        logger.warn(`Failed to create collection`, { collection: name, error });
      }
    }

    try {
      // Align indexes defined in the schema
      await model.syncIndexes();
      logger.info(`Mongo indexes synced`, { collection: name });
    } catch (error) {
      logger.error(`Failed to sync indexes`, { collection: name, error });
      throw error;
    }
  }

  logger.info('Mongo collections/indexes ensured', { elapsedMs: Date.now() - start });
}
