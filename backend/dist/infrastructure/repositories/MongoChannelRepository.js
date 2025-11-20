"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoChannelRepository = void 0;
const Channel_1 = require("../../domain/entities/Channel");
const Channel_model_1 = require("../database/models/Channel.model");
const logger_1 = require("../../shared/utils/logger");
class MongoChannelRepository {
    /**
     * Find channel by ID
     */
    async findById(id) {
        try {
            const doc = await Channel_model_1.ChannelModel.findOne({ id: id.value }).exec();
            return doc ? this.mapToDomain(doc) : null;
        }
        catch (error) {
            logger_1.logger.error('Error finding channel by ID', { id: id.value, error });
            throw error;
        }
    }
    /**
     * Find all channels with optional filters
     */
    async findAll(filters) {
        try {
            const query = {};
            if (filters?.type) {
                query.type = filters.type;
            }
            if (filters?.region) {
                query.region = filters.region;
            }
            if (filters?.isActive !== undefined) {
                query.active = filters.isActive;
            }
            const docs = await Channel_model_1.ChannelModel.find(query)
                .sort({ order: 1, name: 1 })
                .exec();
            return docs.map((doc) => this.mapToDomain(doc));
        }
        catch (error) {
            logger_1.logger.error('Error finding channels', { filters, error });
            throw error;
        }
    }
    /**
     * Find channel by normalized name
     */
    async findByNormalizedName(normalizedName) {
        try {
            // Since normalizedName is computed, we need to fetch all and filter
            // For better performance, consider storing normalizedName in the database
            const docs = await Channel_model_1.ChannelModel.find().exec();
            for (const doc of docs) {
                const channel = this.mapToDomain(doc);
                if (channel.normalizedName === normalizedName) {
                    return channel;
                }
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error finding channel by normalized name', { normalizedName, error });
            throw error;
        }
    }
    /**
     * Save (create or update) a channel
     */
    async save(channel) {
        try {
            const data = this.mapToDocument(channel);
            await Channel_model_1.ChannelModel.findOneAndUpdate({ id: channel.id }, data, { upsert: true, new: true }).exec();
            logger_1.logger.debug('Channel saved', { channelId: channel.id });
        }
        catch (error) {
            logger_1.logger.error('Error saving channel', { channelId: channel.id, error });
            throw error;
        }
    }
    /**
     * Delete a channel
     */
    async delete(id) {
        try {
            await Channel_model_1.ChannelModel.deleteOne({ id: id.value }).exec();
            logger_1.logger.debug('Channel deleted', { channelId: id.value });
        }
        catch (error) {
            logger_1.logger.error('Error deleting channel', { channelId: id.value, error });
            throw error;
        }
    }
    /**
     * Map MongoDB document to domain entity
     */
    mapToDomain(doc) {
        const props = {
            id: doc.id,
            name: doc.name,
            icon: doc.logo || null,
            type: doc.category || 'TDT', // Map category to type
            region: doc.country,
            isActive: doc.active,
        };
        return Channel_1.Channel.create(props);
    }
    /**
     * Map domain entity to MongoDB document data
     */
    mapToDocument(channel) {
        return {
            id: channel.id,
            name: channel.name,
            logo: channel.icon || undefined,
            category: channel.type,
            country: channel.region,
            active: channel.isActive,
            order: 0, // Default order, can be customized
        };
    }
}
exports.MongoChannelRepository = MongoChannelRepository;
//# sourceMappingURL=MongoChannelRepository.js.map