"use strict";
// src/v2/domain/services/ProgramService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramService = void 0;
class ProgramService {
    getCurrentProgram(programs) {
        const now = new Date();
        return programs.find((p) => p.startTime <= now && p.endTime > now) || null;
    }
    getNextPrograms(programs, count = 3) {
        const now = new Date();
        return programs
            .filter((p) => p.startTime > now)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            .slice(0, count);
    }
    filterByTimeRange(programs, startTime, endTime) {
        return programs.filter((p) => (p.startTime >= startTime && p.startTime < endTime) ||
            (p.endTime > startTime && p.endTime <= endTime) ||
            (p.startTime <= startTime && p.endTime >= endTime));
    }
    groupByChannel(programs) {
        const grouped = new Map();
        programs.forEach((program) => {
            const existing = grouped.get(program.channelId) || [];
            existing.push(program);
            grouped.set(program.channelId, existing);
        });
        return grouped;
    }
}
exports.ProgramService = ProgramService;
//# sourceMappingURL=ProgramService.js.map