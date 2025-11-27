"use strict";
/**
 * Script to create efficient MongoDB indexes for program queries
 * Run with: npm run create-indexes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIndexes = createIndexes;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../shared/utils/logger");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guiatv';
async function createIndexes() {
    try {
        logger_1.logger.info('Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        logger_1.logger.info('Connected to MongoDB');
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }
        const programsCollection = db.collection('programs');
        logger_1.logger.info('Creating indexes for programs collection...');
        // 1. Compound index for date-based queries (most common)
        await programsCollection.createIndex({ startTime: 1, channelId: 1 }, { name: 'idx_startTime_channelId', background: true });
        logger_1.logger.info('✅ Created index: idx_startTime_channelId');
        // 2. Index for channel + time range queries
        await programsCollection.createIndex({ channelId: 1, startTime: 1, endTime: 1 }, { name: 'idx_channel_timeRange', background: true });
        logger_1.logger.info('✅ Created index: idx_channel_timeRange');
        // 3. Index for category filtering
        await programsCollection.createIndex({ category: 1, startTime: 1 }, { name: 'idx_category_startTime', background: true });
        logger_1.logger.info('✅ Created index: idx_category_startTime');
        // 4. Index for "now playing" queries
        await programsCollection.createIndex({ channelId: 1, startTime: -1 }, { name: 'idx_channel_startTime_desc', background: true });
        logger_1.logger.info('✅ Created index: idx_channel_startTime_desc');
        // List all indexes
        const indexes = await programsCollection.indexes();
        logger_1.logger.info('Current indexes on programs collection:');
        indexes.forEach((index) => {
            logger_1.logger.info(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        logger_1.logger.info('✅ All indexes created successfully!');
    }
    catch (error) {
        logger_1.logger.error('Error creating indexes:', error);
        throw error;
    }
    finally {
        await mongoose_1.default.disconnect();
        logger_1.logger.info('Disconnected from MongoDB');
    }
}
// Run if executed directly
if (require.main === module) {
    createIndexes()
        .then(() => {
        logger_1.logger.info('Index creation completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Index creation failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=create-indexes.js.map