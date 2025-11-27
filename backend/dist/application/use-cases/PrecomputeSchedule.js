"use strict";
// src/v2/application/use-cases/PrecomputeSchedule.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrecomputeSchedule = void 0;
const ChannelMapper_1 = require("../mappers/ChannelMapper");
const logger_1 = require("../../shared/utils/logger");
class PrecomputeSchedule {
    constructor(getPrograms, getAllChannels, storageRepository, cacheRepository) {
        this.getPrograms = getPrograms;
        this.getAllChannels = getAllChannels;
        this.storageRepository = storageRepository;
        this.cacheRepository = cacheRepository;
        this.precomputeLogger = logger_1.logger.child('PrecomputeSchedule');
        this.layoutVersion = process.env.LAYOUT_VERSION || 'v1';
    }
    /**
     * Precompute for the canonical 4-day window: yesterday, today, tomorrow, after_tomorrow.
     */
    async precomputeCanonicalWindow(fields = 'full') {
        const dates = ['yesterday', 'today', 'tomorrow', 'after_tomorrow'];
        for (const date of dates) {
            try {
                await this.execute({ date, fields });
            }
            catch (error) {
                this.precomputeLogger.error('Failed precompute for window', {
                    date,
                    error,
                });
            }
        }
    }
    async execute(request) {
        const fields = request.fields || 'full';
        try {
            this.precomputeLogger.info('Precomputing schedule', {
                date: request.date,
                fields,
            });
            // 1. Fetch all programs (layout already computed)
            const { programs, channels: channelMeta, timeSlots } = await this.getPrograms.execute({
                date: request.date,
                limit: 10000,
                fields,
            });
            // 2. Group by channel
            const programsByChannel = new Map();
            programs.forEach((p) => {
                const list = programsByChannel.get(p.channelId) || [];
                list.push(p);
                programsByChannel.set(p.channelId, list);
            });
            // 3. Fetch channel details
            const allChannels = await this.getAllChannels.execute({ isActive: true });
            // 4. Build schedule structure
            const schedule = Array.from(programsByChannel.entries())
                .map(([channelId, channelPrograms]) => {
                const channel = allChannels.find((c) => c.id === channelId);
                return {
                    channel: channel ? ChannelMapper_1.ChannelMapper.toDTO(channel) : null,
                    programs: channelPrograms,
                };
            })
                .filter((s) => s.channel !== null);
            // 5. Serialize to JSON
            const generatedAt = new Date().toISOString();
            const jsonContent = JSON.stringify({
                date: request.date,
                layoutVersion: this.layoutVersion,
                channels: schedule,
                timeSlots,
                channelMeta,
                meta: {
                    totalChannels: schedule.length,
                    totalPrograms: programs.length,
                    generatedAt,
                    fields,
                },
            });
            // 6. Save to storage
            const filePath = `schedules/${request.date}.json`;
            await this.storageRepository.upload(filePath, jsonContent, {
                contentType: 'application/json',
                metadata: {
                    date: request.date,
                    generatedAt,
                },
            });
            // 7. Signed URL
            const signedUrl = await this.storageRepository.getSignedUrl(filePath, 360); // 6h
            const fileSize = Buffer.byteLength(jsonContent);
            // 8. Warm precomputed cache for the canonical path
            const preKey = `precomputed:programs:${request.date}:${fields}`;
            await this.cacheRepository.set(preKey, {
                date: request.date,
                timeSlots,
                channels: channelMeta,
                programs,
                meta: {
                    date: request.date,
                    totalChannels: channelMeta.length,
                    totalPrograms: programs.length,
                    cached: true,
                    precomputed: true,
                    generatedAt,
                    layoutVersion: this.layoutVersion,
                },
            });
            // 9. Persist materialized schedule in Mongo and cache snapshot for filtered reads
            try {
                const { ScheduleModel } = await Promise.resolve().then(() => __importStar(require('../../infrastructure/database/models/Schedule.model')));
                await ScheduleModel.findOneAndUpdate({ date: request.date }, {
                    date: request.date,
                    layoutVersion: this.layoutVersion,
                    generatedAt: new Date(generatedAt),
                    timeSlots,
                    channelMeta,
                    channels: schedule.map((item) => ({
                        channelId: item.channel?.id,
                        programs: item.programs,
                    })),
                    meta: { totalChannels: schedule.length, totalPrograms: programs.length, fields, generatedAt },
                }, { upsert: true, new: true }).exec();
                await this.cacheRepository.set(`schedule:json:${request.date}:${fields}`, {
                    date: request.date,
                    timeSlots,
                    channels: channelMeta,
                    programs,
                    layoutVersion: this.layoutVersion,
                }, Number(process.env.SCHEDULE_CACHE_TTL_SEC || 21600) // 6h default
                );
            }
            catch (err) {
                this.precomputeLogger.warn('Failed to persist/cache schedule snapshot', { error: err.message });
            }
            this.precomputeLogger.info('Schedule precomputed successfully', {
                date: request.date,
                filePath,
                fileSize,
                cacheKey: preKey,
            });
            return {
                success: true,
                filePath,
                signedUrl,
                fileSize,
                cachedKey: preKey,
            };
        }
        catch (error) {
            this.precomputeLogger.error('Failed to precompute schedule', error);
            throw error;
        }
    }
}
exports.PrecomputeSchedule = PrecomputeSchedule;
//# sourceMappingURL=PrecomputeSchedule.js.map