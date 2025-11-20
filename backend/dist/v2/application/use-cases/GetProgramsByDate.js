"use strict";
// src/v2/application/use-cases/GetProgramsByDate.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProgramsByDate = void 0;
const Program_1 = require("../../domain/entities/Program");
const DateRange_1 = require("../../domain/value-objects/DateRange");
class GetProgramsByDate {
    constructor(programRepository, cacheRepository) {
        this.programRepository = programRepository;
        this.cacheRepository = cacheRepository;
    }
    async execute(request) {
        const dateRange = DateRange_1.DateRange.fromString(request.date);
        const cacheKey = this.buildCacheKey(request);
        // Intentar desde caché
        const cached = await this.cacheRepository.get(cacheKey);
        if (cached) {
            return cached.map((p) => Program_1.Program.create({
                ...p,
                startTime: new Date(p.startTime),
                endTime: new Date(p.endTime),
            }));
        }
        // Buscar en repositorio
        const programs = await this.programRepository.findByDateRange(dateRange, {
            channelId: request.channelId,
            genre: request.genre,
            limit: request.limit || 100,
            offset: request.offset || 0,
        });
        if (programs.length > 0) {
            await this.cacheRepository.set(cacheKey, programs.map((p) => p.toJSON()), 300 // 5 min
            );
        }
        return programs;
    }
    buildCacheKey(request) {
        const parts = ['programs', request.date];
        if (request.channelId)
            parts.push(request.channelId);
        if (request.genre)
            parts.push(request.genre);
        parts.push(`${request.limit || 100}-${request.offset || 0}`);
        return parts.join(':');
    }
}
exports.GetProgramsByDate = GetProgramsByDate;
//# sourceMappingURL=GetProgramsByDate.js.map