"use strict";
// src/v2/application/use-cases/GetChannelPrograms.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetChannelPrograms = void 0;
const Program_1 = require("../../domain/entities/Program");
const ChannelId_1 = require("../../domain/value-objects/ChannelId");
const DateRange_1 = require("../../domain/value-objects/DateRange");
class GetChannelPrograms {
    constructor(programRepository, cacheRepository, programService) {
        this.programRepository = programRepository;
        this.cacheRepository = cacheRepository;
        this.programService = programService;
    }
    async execute(request) {
        const dateRange = DateRange_1.DateRange.fromString(request.date);
        const cacheKey = `programs:${request.channelId}:${request.date}`;
        const cached = await this.cacheRepository.get(cacheKey);
        if (cached) {
            const programs = cached.map((p) => Program_1.Program.create({
                ...p,
                startTime: new Date(p.startTime),
                endTime: new Date(p.endTime),
            }));
            return this.applyTimeFilter(programs, request);
        }
        const programs = await this.programRepository.findByChannel(ChannelId_1.ChannelId.create(request.channelId), dateRange);
        if (programs.length > 0) {
            await this.cacheRepository.set(cacheKey, programs.map((p) => p.toJSON()), 300);
        }
        return this.applyTimeFilter(programs, request);
    }
    applyTimeFilter(programs, request) {
        if (!request.fromTime && !request.toTime) {
            return programs;
        }
        const dateStr = request.date;
        const fromTime = request.fromTime
            ? this.parseTime(dateStr, request.fromTime)
            : new Date(parseInt(dateStr.slice(0, 4)), parseInt(dateStr.slice(4, 6)) - 1, parseInt(dateStr.slice(6, 8)), 0, 0);
        const toTime = request.toTime
            ? this.parseTime(dateStr, request.toTime)
            : new Date(parseInt(dateStr.slice(0, 4)), parseInt(dateStr.slice(4, 6)) - 1, parseInt(dateStr.slice(6, 8)), 23, 59);
        return this.programService.filterByTimeRange(programs, fromTime, toTime);
    }
    parseTime(dateStr, time) {
        const [hours, minutes] = time.split(':').map(Number);
        return new Date(parseInt(dateStr.slice(0, 4)), parseInt(dateStr.slice(4, 6)) - 1, parseInt(dateStr.slice(6, 8)), hours, minutes);
    }
}
exports.GetChannelPrograms = GetChannelPrograms;
//# sourceMappingURL=GetChannelPrograms.js.map