"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProgramLayouts = void 0;
const Schedule_model_1 = require("../../infrastructure/database/models/Schedule.model");
const dateUtils_1 = require("../../shared/utils/dateUtils");
class GetProgramLayouts {
    constructor(cacheRepository, getPrograms) {
        this.cacheRepository = cacheRepository;
        this.getPrograms = getPrograms;
        this.layoutVersion = process.env.LAYOUT_VERSION || 'v1';
    }
    async execute(request) {
        const normalizedDate = dateUtils_1.DateUtils.parseDateAlias(request.date);
        const fields = request.fields || 'full';
        const channelFilter = request.channels?.filter(Boolean) ?? [];
        const slotFilter = request.timeSlot;
        const preKey = this.buildPreKey(normalizedDate, fields);
        // 1) Redis snapshot
        const cached = await this.cacheRepository.get(preKey);
        if (cached) {
            return this.buildResponseFromSnapshot(cached, channelFilter, slotFilter, true);
        }
        // 2) Schedules collection
        const doc = await Schedule_model_1.ScheduleModel.findOne({ date: normalizedDate })
            .lean()
            .exec();
        if (doc && (!doc.layoutVersion || doc.layoutVersion === this.layoutVersion)) {
            const snapshot = {
                date: doc.date,
                timeSlots: doc.timeSlots,
                channels: doc.channels || [],
                meta: {
                    layoutVersion: doc.layoutVersion,
                    uiConstants: doc.meta?.uiConstants,
                },
            };
            await this.cacheRepository.set(preKey, snapshot);
            return this.buildResponseFromSnapshot(snapshot, channelFilter, slotFilter, true);
        }
        // 3) Fallback: compute via GetPrograms, luego agrupar
        const flat = await this.getPrograms.execute({
            date: normalizedDate,
            fields,
            limit: 10000,
        });
        const grouped = this.groupPrograms(flat.channels, flat.programs, channelFilter, slotFilter);
        const response = {
            date: flat.date,
            timeSlots: flat.timeSlots,
            channels: grouped.channels,
            meta: {
                date: flat.date,
                totalChannels: grouped.channels.length,
                totalPrograms: grouped.totalPrograms,
                cached: false,
                precomputed: false,
                layoutVersion: this.layoutVersion,
            },
        };
        return response;
    }
    buildPreKey(date, fields) {
        return `precomputed:programs:${date}:${fields}:${this.layoutVersion}`;
    }
    buildResponseFromSnapshot(snapshot, channelFilter, slotFilter, cached) {
        const channelsData = snapshot.channels || [];
        const channelSet = channelFilter.length ? new Set(channelFilter) : null;
        const filteredChannels = channelsData
            .filter((entry) => !channelSet || channelSet.has(entry.channelId || entry.channel?.id))
            .map((entry) => {
            const programs = (entry.programs || []).filter((p) => {
                if (!slotFilter)
                    return true;
                const num = Number(slotFilter);
                if (!isNaN(num) && typeof p.timeSlotIndex === 'number') {
                    return p.timeSlotIndex === num;
                }
                return true;
            });
            return {
                channel: entry.channel || { id: entry.channelId },
                programs,
            };
        })
            .filter((c) => Array.isArray(c.programs) && c.programs.length);
        const totalPrograms = filteredChannels.reduce((acc, c) => acc + (c.programs?.length || 0), 0);
        return {
            date: snapshot.date,
            timeSlots: snapshot.timeSlots || [],
            channels: filteredChannels,
            meta: {
                date: snapshot.date,
                totalChannels: filteredChannels.length,
                totalPrograms,
                cached,
                precomputed: true,
                layoutVersion: snapshot.meta?.layoutVersion || this.layoutVersion,
                uiConstants: snapshot.meta?.uiConstants,
            },
        };
    }
    groupPrograms(channelMeta, programs, channelFilter, slotFilter) {
        const channelSet = channelFilter.length ? new Set(channelFilter) : null;
        const filtered = channelSet
            ? programs.filter((p) => channelSet.has(p.channelId))
            : programs;
        const slot = slotFilter ? Number(slotFilter) : null;
        const filteredBySlot = slot !== null && !isNaN(slot)
            ? filtered.filter((p) => p.timeSlotIndex === slot ||
                p.layoutsBySlot?.some((l) => l.timeSlotIndex === slot))
            : filtered;
        const map = new Map();
        filteredBySlot.forEach((p) => {
            const list = map.get(p.channelId) || [];
            list.push(p);
            map.set(p.channelId, list);
        });
        const channels = channelMeta
            .filter((ch) => map.has(ch.id))
            .map((ch) => ({
            channel: ch,
            programs: map.get(ch.id) || [],
        }));
        return {
            channels,
            totalPrograms: filteredBySlot.length,
        };
    }
}
exports.GetProgramLayouts = GetProgramLayouts;
//# sourceMappingURL=GetProgramLayouts.js.map