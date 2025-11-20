"use strict";
// src/v2/application/use-cases/CleanOldPrograms.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanOldPrograms = void 0;
const DateRange_1 = require("../../domain/value-objects/DateRange");
const dateUtils_1 = require("../../shared/utils/dateUtils");
const logger_1 = require("../../shared/utils/logger");
class CleanOldPrograms {
    constructor(programRepository) {
        this.programRepository = programRepository;
        this.cleanLogger = logger_1.logger.child('CleanOldPrograms');
    }
    async execute(request = {}) {
        const daysToKeep = request.daysToKeep || 7;
        const errors = [];
        const datesRemoved = [];
        try {
            this.cleanLogger.info('Starting cleanup of old programs', { daysToKeep });
            const today = new Date();
            const cutoffDate = dateUtils_1.DateUtils.addDays(today, -daysToKeep);
            const cutoffDateStr = dateUtils_1.DateUtils.formatYYYYMMDD(cutoffDate);
            this.cleanLogger.info('Removing programs before date', {
                cutoffDate: cutoffDateStr,
            });
            // Eliminar programas día por día
            for (let i = 30; i > daysToKeep; i--) {
                const dateToRemove = dateUtils_1.DateUtils.addDays(today, -i);
                const dateStr = dateUtils_1.DateUtils.formatYYYYMMDD(dateToRemove);
                try {
                    const dateRange = DateRange_1.DateRange.fromString(dateStr);
                    await this.programRepository.deleteByDateRange(dateRange);
                    datesRemoved.push(dateStr);
                    this.cleanLogger.info('Programs removed for date', { date: dateStr });
                }
                catch (error) {
                    this.cleanLogger.error('Failed to remove programs for date', error, {
                        date: dateStr,
                    });
                    errors.push(`Failed to remove ${dateStr}: ${error.message}`);
                }
            }
            this.cleanLogger.info('Cleanup completed', {
                datesRemoved: datesRemoved.length,
                errors: errors.length,
            });
            return {
                success: errors.length === 0,
                datesRemoved,
                errors,
            };
        }
        catch (error) {
            this.cleanLogger.error('Cleanup failed', error);
            return {
                success: false,
                datesRemoved,
                errors: [error.message],
            };
        }
    }
}
exports.CleanOldPrograms = CleanOldPrograms;
//# sourceMappingURL=CleanOldPrograms.js.map