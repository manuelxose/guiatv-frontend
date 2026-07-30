import '../config/bootstrap';

import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { seedEditorialContent } from '../application/services/EditorialSeedService';
import { logger } from '../shared/utils/logger';

async function run(): Promise<void> {
  await connectMongoDB();
  try {
    const overwriteExisting =
      process.env.EDITORIAL_SEED_OVERWRITE === '1' ||
      process.env.EDITORIAL_SEED_OVERWRITE === 'true';
    const result = await seedEditorialContent({ overwriteExisting });
    logger.info('Editorial seed completed', result);
  } finally {
    await disconnectMongoDB();
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Editorial seed failed', { error });
    process.exit(1);
  });
