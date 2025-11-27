/**
 * Script to create efficient MongoDB indexes for program queries
 * Run with: npm run create-indexes
 */

import mongoose from 'mongoose';
import { logger } from '../shared/utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guiatv';

async function createIndexes() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const programsCollection = db.collection('programs');

    logger.info('Creating indexes for programs collection...');

    // 1. Compound index for date-based queries (most common)
    await programsCollection.createIndex(
      { startTime: 1, channelId: 1 },
      { name: 'idx_startTime_channelId', background: true }
    );
    logger.info('✅ Created index: idx_startTime_channelId');

    // 2. Index for channel + time range queries
    await programsCollection.createIndex(
      { channelId: 1, startTime: 1, endTime: 1 },
      { name: 'idx_channel_timeRange', background: true }
    );
    logger.info('✅ Created index: idx_channel_timeRange');

    // 3. Index for category filtering
    await programsCollection.createIndex(
      { category: 1, startTime: 1 },
      { name: 'idx_category_startTime', background: true }
    );
    logger.info('✅ Created index: idx_category_startTime');

    // 4. Index for "now playing" queries
    await programsCollection.createIndex(
      { channelId: 1, startTime: -1 },
      { name: 'idx_channel_startTime_desc', background: true }
    );
    logger.info('✅ Created index: idx_channel_startTime_desc');

    // List all indexes
    const indexes = await programsCollection.indexes();
    logger.info('Current indexes on programs collection:');
    indexes.forEach((index) => {
      logger.info(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    logger.info('✅ All indexes created successfully!');
  } catch (error:any) {
    logger.error('Error creating indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run if executed directly
if (require.main === module) {
  createIndexes()
    .then(() => {
      logger.info('Index creation completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Index creation failed:', error);
      process.exit(1);
    });
}

export { createIndexes };
