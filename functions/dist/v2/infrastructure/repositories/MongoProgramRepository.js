"use strict";
// src/v2/infrastructure/repositories/MongoProgramRepository.ts
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
            const doc = await Program_model_1.ProgramModel.findOne({ id }).exec();
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
            const docs = await queryBuilder.exec();
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
     * Map MongoDB document to domain entity
     */
    mapToDomain(doc) {
        const props = {
            id: doc.id,
            channelId: doc.channelId,
            title: doc.title,
            startTime: doc.startTime,
            endTime: doc.endTime,
            description: doc.description,
            image: doc.image,
            genre: doc.category,
            rating: doc.rating,
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