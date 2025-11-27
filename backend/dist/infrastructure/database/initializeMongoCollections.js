"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMongoCollectionsAndIndexes = ensureMongoCollectionsAndIndexes;
const logger_1 = require("../../shared/utils/logger");
const Program_model_1 = require("./models/Program.model");
const Channel_model_1 = require("./models/Channel.model");
const Schedule_model_1 = require("./models/Schedule.model");
/**
 * Ensure required Mongo collections exist and indexes are in place.
 * This runs at boot to avoid lazy collection/index creation in runtime traffic.
 */
async function ensureMongoCollectionsAndIndexes() {
    const start = Date.now();
    const resources = [
        { name: 'channels', model: Channel_model_1.ChannelModel },
        { name: 'programs', model: Program_model_1.ProgramModel },
        { name: 'schedules', model: Schedule_model_1.ScheduleModel },
    ];
    for (const { name, model } of resources) {
        try {
            // Create collection if it does not exist (no-op if it already exists)
            await model.createCollection();
            logger_1.logger.info(`Mongo collection ready`, { collection: name });
        }
        catch (error) {
            // Ignore "NamespaceExists" errors; log others
            if (error?.codeName !== 'NamespaceExists') {
                logger_1.logger.warn(`Failed to create collection`, { collection: name, error });
            }
        }
        try {
            // Align indexes defined in the schema
            await model.syncIndexes();
            logger_1.logger.info(`Mongo indexes synced`, { collection: name });
        }
        catch (error) {
            logger_1.logger.error(`Failed to sync indexes`, { collection: name, error });
            throw error;
        }
    }
    logger_1.logger.info('Mongo collections/indexes ensured', { elapsedMs: Date.now() - start });
}
//# sourceMappingURL=initializeMongoCollections.js.map