import path from 'node:path';
import dotenv from 'dotenv';
import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { UserProfileModel } from '../infrastructure/database/models/UserProfile.model';
import { logger } from '../shared/utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dryRun =
  process.argv.includes('--dry-run') ||
  (!process.argv.includes('--apply') &&
    process.env.USER_PRIVACY_MIGRATION_APPLY !== '1' &&
    process.env.USER_PRIVACY_MIGRATION_APPLY !== 'true');

async function main(): Promise<void> {
  logger.info('Starting user privacy defaults migration', { dryRun });
  await connectMongoDB();

  const filter = {
    $or: [
      { 'privacy.allowMessages': { $exists: false } },
      { 'privacy.allowMessages': 'followers' },
    ],
  };

  const matched = await UserProfileModel.countDocuments(filter).exec();

  if (dryRun) {
    logger.info('Dry-run finished for user privacy defaults migration', {
      matched,
      targetValue: 'all',
    });
    await disconnectMongoDB();
    return;
  }

  const result = await UserProfileModel.updateMany(filter, {
    $set: { 'privacy.allowMessages': 'all' },
  }).exec();

  logger.info('User privacy defaults migration completed', {
    matched,
    modified: result.modifiedCount,
  });

  await disconnectMongoDB();
}

main().catch(async (error) => {
  logger.error('User privacy defaults migration failed', { error });
  await disconnectMongoDB();
  process.exit(1);
});
