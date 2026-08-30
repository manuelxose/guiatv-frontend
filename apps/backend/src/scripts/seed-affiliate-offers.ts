import '../config/bootstrap';

import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { ensureMongoCollectionsAndIndexes } from '../infrastructure/database/initializeMongoCollections';
import { migrateStaticMonetizationOffers } from '../application/services/AffiliateMigrationService';
import { logger } from '../shared/utils/logger';

/**
 * One-time (idempotent, safely re-runnable) migration from the static
 * `monetizationOffers.ts` array to the persistent Affiliate Engine
 * collections. See docs/affiliate-engine-architecture.md §19.
 *
 * Run: npm run seed:affiliate
 * Force-refresh already-migrated documents: AFFILIATE_SEED_OVERWRITE=true npm run seed:affiliate
 */
async function run(): Promise<void> {
  await connectMongoDB();
  try {
    await ensureMongoCollectionsAndIndexes();

    const overwriteExisting =
      process.env.AFFILIATE_SEED_OVERWRITE === '1' || process.env.AFFILIATE_SEED_OVERWRITE === 'true';
    const result = await migrateStaticMonetizationOffers({ overwriteExisting });
    logger.info('Affiliate engine migration completed', result);
  } finally {
    await disconnectMongoDB();
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Affiliate engine migration failed', { error });
    process.exit(1);
  });
