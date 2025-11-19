"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoose = void 0;
exports.connectMongoDB = connectMongoDB;
exports.disconnectMongoDB = disconnectMongoDB;
exports.isMongoDBConnected = isMongoDBConnected;
// Require mongoose at runtime to avoid build-time dependency errors when
// types are not available in some environments.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoose = require('mongoose');
exports.mongoose = mongoose;
const logger_1 = require("../v2/shared/utils/logger");
let isConnected = false;
/**
 * Connect to MongoDB database
 */
async function connectMongoDB() {
    if (isConnected) {
        logger_1.logger.info('MongoDB already connected');
        return;
    }
    const config = {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/guiatv',
        dbName: process.env.MONGODB_DB_NAME,
    };
    try {
        logger_1.logger.info('Connecting to MongoDB...', { uri: config.uri.replace(/\/\/.*@/, '//<credentials>@') });
        await mongoose.connect(config.uri, {
            dbName: config.dbName,
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        logger_1.logger.info('✅ Connected to MongoDB successfully', { database: mongoose.connection.db?.databaseName });
        // Handle connection events
        mongoose.connection.on('error', (error) => {
            logger_1.logger.error('MongoDB connection error', { error });
        });
        mongoose.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
            isConnected = false;
        });
        mongoose.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB reconnected');
            isConnected = true;
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to MongoDB', { error });
        throw error;
    }
}
/**
 * Disconnect from MongoDB
 */
async function disconnectMongoDB() {
    if (!isConnected) {
        return;
    }
    try {
        await mongoose.disconnect();
        isConnected = false;
        logger_1.logger.info('Disconnected from MongoDB');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from MongoDB', { error });
        throw error;
    }
}
/**
 * Get MongoDB connection status
 */
function isMongoDBConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}
//# sourceMappingURL=mongodb.js.map