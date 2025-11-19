// Require mongoose at runtime to avoid build-time dependency errors when
// types are not available in some environments.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoose = require('mongoose');
import { logger } from '../v2/shared/utils/logger';

interface MongoDBConfig {
  uri: string;
  dbName?: string;
}

let isConnected = false;

/**
 * Connect to MongoDB database
 */
export async function connectMongoDB(): Promise<void> {
  if (isConnected) {
    logger.info('MongoDB already connected');
    return;
  }

  const config: MongoDBConfig = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/guiatv',
    dbName: process.env.MONGODB_DB_NAME,
  };

  try {
    logger.info('Connecting to MongoDB...', { uri: config.uri.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(config.uri, {
      dbName: config.dbName,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info('✅ Connected to MongoDB successfully', { database: mongoose.connection.db?.databaseName });

    // Handle connection events
    mongoose.connection.on('error', (error: unknown) => {
      logger.error('MongoDB connection error', { error });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error });
    throw error;
  }
}

/**
 * Get MongoDB connection status
 */
export function isMongoDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Export mongoose instance for use in repositories
 */
export { mongoose };
