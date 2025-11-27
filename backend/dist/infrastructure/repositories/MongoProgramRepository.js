"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoProgramRepository = void 0;
const Program_1 = require("../../domain/entities/Program");
const Program_model_1 = require("../database/models/Program.model");
const logger_1 = require("../../shared/utils/logger");
class MongoProgramRepository {
    /**
     * Find program by ID
     */
    async findById(id) {
        try {
            const doc = await Program_model_1.ProgramModel.findOne({ id }).lean().exec();
            return doc ? this.mapToDomain(doc) : null;
        }
        catch (error) {
            logger_1.logger.error('Error finding program by ID', { id, error });
            throw error;
        }
    }
    /**
     * Find programs by channel and date range
     */
    async findByChannel(channelId, dateRange) {
        try {
            const docs = await Program_model_1.ProgramModel.find({
                channelId: channelId.value,
                startTime: { $gte: dateRange.start, $lte: dateRange.end },
            })
                .sort({ startTime: 1 })
                .lean()
                .exec();
            return docs.map((doc) => this.mapToDomain(doc));
        }
        catch (error) {
            logger_1.logger.error('Error finding programs by channel', {
                channelId: channelId.value,
                dateRange,
                error,
            });
            throw error;
        }
    }
    /**
     * Find programs by date range with optional filters
     */
    async findByDateRange(dateRange, filters) {
        try {
            const query = {
                startTime: { $gte: dateRange.start },
                endTime: { $lte: dateRange.end },
            };
            if (filters?.channelId) {
                query.channelId = filters.channelId;
            }
            if (filters?.genre) {
                query.category = filters.genre;
            }
            let queryBuilder = Program_model_1.ProgramModel.find(query).sort({ startTime: 1 });
            if (filters?.limit) {
                queryBuilder = queryBuilder.limit(filters.limit);
            }
            if (filters?.offset) {
                queryBuilder = queryBuilder.skip(filters.offset);
            }
            const docs = await queryBuilder.lean().exec();
            return docs.map((doc) => this.mapToDomain(doc));
        }
        catch (error) {
            logger_1.logger.error('Error finding programs by date range', {
                dateRange,
                filters,
                error,
            });
            throw error;
        }
    }
    /**
     * Save (create or update) a program
     */
    async save(program) {
        try {
            const data = this.mapToDocument(program);
            await Program_model_1.ProgramModel.findOneAndUpdate({ id: program.id }, data, { upsert: true, new: true }).exec();
            logger_1.logger.debug('Program saved', { programId: program.id });
        }
        catch (error) {
            logger_1.logger.error('Error saving program', { programId: program.id, error });
            throw error;
        }
    }
    /**
     * Save multiple programs in batch
     */
    async saveBatch(programs) {
        try {
            if (programs.length === 0) {
                return;
            }
            const bulkOps = programs.map((program) => ({
                updateOne: {
                    filter: { id: program.id },
                    update: this.mapToDocument(program),
                    upsert: true,
                },
            }));
            await Program_model_1.ProgramModel.bulkWrite(bulkOps);
            logger_1.logger.debug('Programs saved in batch', { count: programs.length });
        }
        catch (error) {
            logger_1.logger.error('Error saving programs in batch', {
                count: programs.length,
                error,
            });
            throw error;
        }
    }
    /**
     * Delete programs by date range
     */
    async deleteByDateRange(dateRange) {
        try {
            const result = await Program_model_1.ProgramModel.deleteMany({
                startTime: { $gte: dateRange.start },
                endTime: { $lte: dateRange.end },
            }).exec();
            logger_1.logger.debug('Programs deleted by date range', {
                dateRange,
                deletedCount: result.deletedCount,
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting programs by date range', {
                dateRange,
                error,
            });
            throw error;
        }
    }
    /**
     * Find programs by specific date (YYYYMMDD format)
     * INCLUDES programs that started before this day but are still airing (crossing midnight)
     */
    async findByDate(date, fields = 'full') {
        try {
            const dateRange = this.parseDateToRange(date);
            const projection = fields === 'minimal'
                ? { description: 0, image: 0 }
                : undefined;
            // Use overlap detection: program overlaps with day if:
            // - Program starts before day ends AND
            // - Program ends after day starts
            // This includes:
            // 1. Programs starting and ending within the day
            // 2. Programs starting before the day but ending during the day (crossing midnight)
            // 3. Programs starting during the day but ending after (spanning to next day)
            const docs = await Program_model_1.ProgramModel.find({
                startTime: { $lt: dateRange.end }, // Starts before day ends
                endTime: { $gt: dateRange.start }, // Ends after day starts
            })
                .sort({ channelId: 1, startTime: 1 })
                .select(projection)
                .lean()
                .exec();
            return docs.map((doc) => this.mapToDomain(doc));
        }
        catch (error) {
            logger_1.logger.error('Error finding programs by date', { date, error });
            throw error;
        }
    }
    /**
     * Parse YYYYMMDD string to date range (start of day to end of day)
     */
    parseDateToRange(dateStr) {
        // Parse YYYYMMDD format
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1; // 0-indexed
        const day = parseInt(dateStr.substring(6, 8), 10);
        const start = new Date(year, month, day, 0, 0, 0, 0);
        const end = new Date(year, month, day + 1, 0, 0, 0, 0);
        return { start, end };
    }
    /**
     * Backfill computed fields for programs on a specific date
     */
    async backfillComputedFields(date) {
        try {
            const dateRange = this.parseDateToRange(date);
            const docs = await Program_model_1.ProgramModel.find({
                startTime: { $gte: dateRange.start, $lt: dateRange.end },
            })
                .lean()
                .exec();
            if (!docs.length)
                return 0;
            const bulkOps = docs.map((doc) => {
                const startDate = new Date(doc.startTime);
                const endDate = new Date(doc.endTime);
                const dateStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
                const startUtc = startDate.toISOString();
                const endUtc = endDate.toISOString();
                const startMinutes = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
                let endMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
                if (endDate <= startDate) {
                    endMinutes += 1440;
                }
                const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
                return {
                    updateOne: {
                        filter: { _id: doc._id },
                        update: {
                            $set: {
                                date: doc.date || dateStr,
                                startUtc,
                                endUtc,
                                startMinutes,
                                endMinutes,
                                durationMinutes,
                            },
                        },
                    },
                };
            });
            const res = await Program_model_1.ProgramModel.bulkWrite(bulkOps);
            return res.modifiedCount || 0;
        }
        catch (error) {
            logger_1.logger.error('Error backfilling computed fields', { date, error });
            throw error;
        }
    }
    /**
     * Find current program for a set of channels in a single query.
     */
    async findNowPlaying(channelIds, at) {
        if (channelIds.length === 0)
            return [];
        try {
            const docs = await Program_model_1.ProgramModel.find({
                channelId: { $in: channelIds },
                startTime: { $lte: at },
                endTime: { $gt: at },
            })
                .sort({ channelId: 1, startTime: -1 })
                .lean()
                .exec();
            // Pick the most recent program per channel
            const selection = new Map();
            for (const doc of docs) {
                if (!selection.has(doc.channelId)) {
                    selection.set(doc.channelId, doc);
                }
            }
            return Array.from(selection.values()).map((doc) => this.mapToDomain(doc));
        }
        catch (error) {
            logger_1.logger.error('Error finding now playing programs', { channelIds, at, error });
            throw error;
        }
    }
    /**
     * Map MongoDB document to domain entity
     */
    mapToDomain(doc) {
        // Validate required fields are present
        if (!doc || !doc.id || !doc.channelId || !doc.title || !doc.startTime || !doc.endTime) {
            throw new Error(`Invalid program document encountered while mapping to domain: ${JSON.stringify(doc)}`);
        }
        const props = {
            id: String(doc.id),
            channelId: String(doc.channelId),
            title: String(doc.title),
            startTime: new Date(doc.startTime),
            endTime: new Date(doc.endTime),
            description: doc.description,
            image: doc.image,
            genre: doc.category,
            rating: doc.rating !== undefined && doc.rating !== null ? String(doc.rating) : undefined,
        };
        return Program_1.Program.create(props);
    }
    /**
     * Map domain entity to MongoDB document data
     */
    mapToDocument(program) {
        return {
            id: program.id,
            channelId: program.channelId,
            title: program.title,
            startTime: program.startTime,
            endTime: program.endTime,
            description: program.description,
            image: program.image,
            category: program.genre,
            rating: program.rating,
        };
    }
}
exports.MongoProgramRepository = MongoProgramRepository;
//# sourceMappingURL=MongoProgramRepository.js.map