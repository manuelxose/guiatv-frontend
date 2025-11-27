"use strict";
// src/v2/infrastructure/parsers/ProgramDataParser.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramDataParser = void 0;
const Program_1 = require("../../domain/entities/Program");
const logger_1 = require("../../shared/utils/logger");
class ProgramDataParser {
    constructor() {
        this.parserLogger = logger_1.logger.child('ProgramDataParser');
    }
    parseXMLDateToDate(dateStr) {
        // Format: "20251021080000 +0200"
        const year = parseInt(dateStr.slice(0, 4), 10);
        const month = parseInt(dateStr.slice(4, 6), 10) - 1;
        const day = parseInt(dateStr.slice(6, 8), 10);
        const hour = parseInt(dateStr.slice(8, 10), 10);
        const minute = parseInt(dateStr.slice(10, 12), 10);
        const second = parseInt(dateStr.slice(12, 14), 10);
        return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    convertToDomainEntity(parsed, channelMap) {
        try {
            const channelId = channelMap.get(parsed.channelId) ||
                channelMap.get(parsed.channelId.trim());
            if (!channelId) {
                this.parserLogger.warn('Channel not found for program', {
                    channelId: parsed.channelId,
                    title: parsed.title,
                });
                return null;
            }
            const startTime = this.parseXMLDateToDate(parsed.start);
            let endTime = this.parseXMLDateToDate(parsed.stop);
            // Some feeds wrap past midnight without bumping the date; fix common cases
            if (endTime <= startTime) {
                // If the difference is small (<= 12h), assume it crosses midnight
                const bumped = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
                if (bumped.getTime() - startTime.getTime() > 0 && bumped.getTime() - startTime.getTime() <= 12 * 60 * 60 * 1000) {
                    endTime = bumped;
                }
                else {
                    this.parserLogger.warn('Skipping program with invalid time range', {
                        title: parsed.title,
                        channelId,
                        start: parsed.start,
                        stop: parsed.stop,
                    });
                    return null;
                }
            }
            let image;
            if (Array.isArray(parsed.icon)) {
                image = parsed.icon[0];
            }
            else {
                image = parsed.icon;
            }
            return Program_1.Program.create({
                id: this.generateProgramId(parsed),
                channelId,
                title: parsed.title,
                startTime,
                endTime,
                description: parsed.description,
                image,
                genre: parsed.category,
                year: parsed.year,
                rating: parsed.rating,
            });
        }
        catch (error) {
            this.parserLogger.error('Failed to convert program to domain entity', error, {
                program: parsed.title,
            });
            return null;
        }
    }
    generateProgramId(parsed) {
        // Generar ID único basado en canal, fecha y hora
        const normalized = `${parsed.channelId}_${parsed.start}_${parsed.title}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_');
        return normalized.substring(0, 100); // Limitar longitud
    }
    batchConvert(programmes, channelMap) {
        const programs = [];
        let skipped = 0;
        for (const prog of programmes) {
            const program = this.convertToDomainEntity(prog, channelMap);
            if (program) {
                programs.push(program);
            }
            else {
                skipped++;
            }
        }
        this.parserLogger.info('Batch conversion complete', {
            total: programmes.length,
            converted: programs.length,
            skipped,
        });
        return programs;
    }
}
exports.ProgramDataParser = ProgramDataParser;
//# sourceMappingURL=ProgramDataParser.js.map