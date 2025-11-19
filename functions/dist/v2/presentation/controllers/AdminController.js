"use strict";
// src/v2/presentation/controllers/AdminController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const dateUtils_1 = require("../../shared/utils/dateUtils");
const logger_1 = require("../../shared/utils/logger");
const errors_1 = require("../../shared/errors");
class AdminController {
    constructor(syncEPGData, precomputeSchedule, cleanOldPrograms, cacheRepository) {
        this.syncEPGData = syncEPGData;
        this.precomputeSchedule = precomputeSchedule;
        this.cleanOldPrograms = cleanOldPrograms;
        this.cacheRepository = cacheRepository;
        this.adminLogger = logger_1.logger.child('AdminController');
    }
    async triggerSync(req, res) {
        const { date, forceRefresh } = req.body;
        this.adminLogger.info('Manual sync triggered', { date, forceRefresh });
        const dateToSync = date || dateUtils_1.DateUtils.getTodayYYYYMMDD();
        if (date && !dateUtils_1.DateUtils.isValidYYYYMMDD(date)) {
            throw new errors_1.ValidationError('Invalid date format', [
                {
                    field: 'date',
                    message: 'Expected YYYYMMDD format',
                    value: date,
                },
            ]);
        }
        const result = await this.syncEPGData.execute({
            sourceUrl: 'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz',
            date: dateToSync,
            forceRefresh: forceRefresh === true,
        });
        res.status(200).json({
            message: result.success
                ? 'Sync completed successfully'
                : 'Sync completed with errors',
            result,
        });
    }
    async triggerPrecompute(req, res) {
        const { date } = req.body;
        this.adminLogger.info('Manual precompute triggered', { date });
        const dateToPrecompute = date || dateUtils_1.DateUtils.getTodayYYYYMMDD();
        if (date && !dateUtils_1.DateUtils.isValidYYYYMMDD(date)) {
            throw new errors_1.ValidationError('Invalid date format');
        }
        const result = await this.precomputeSchedule.execute({
            date: dateToPrecompute,
        });
        res.status(200).json({
            message: 'Precompute completed successfully',
            result,
        });
    }
    async triggerCleanup(req, res) {
        const { daysToKeep } = req.body;
        this.adminLogger.info('Manual cleanup triggered', { daysToKeep });
        if (daysToKeep && (typeof daysToKeep !== 'number' || daysToKeep < 1)) {
            throw new errors_1.ValidationError('Invalid daysToKeep parameter', [
                {
                    field: 'daysToKeep',
                    message: 'Must be a positive number',
                    value: daysToKeep,
                },
            ]);
        }
        const result = await this.cleanOldPrograms.execute({
            daysToKeep: daysToKeep || 7,
        });
        res.status(200).json({
            message: result.success
                ? 'Cleanup completed successfully'
                : 'Cleanup completed with errors',
            result,
        });
    }
    async clearCache(req, res) {
        const { pattern } = req.body;
        this.adminLogger.info('Cache clear triggered', { pattern });
        await this.cacheRepository.clear(pattern);
        res.status(200).json({
            message: 'Cache cleared successfully',
            pattern: pattern || 'all',
        });
    }
    async healthCheck(req, res) {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        // Verificar conectividad de servicios
        const services = {
            cache: await this.checkCacheHealth(),
        };
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime)}s`,
            version: process.env.API_VERSION || '2.0.0',
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            },
            services,
        });
    }
    async checkCacheHealth() {
        try {
            await this.cacheRepository.set('health_check', { test: true }, 10);
            const value = await this.cacheRepository.get('health_check');
            await this.cacheRepository.delete('health_check');
            return {
                status: value && value.test ? 'healthy' : 'degraded',
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: error.message,
            };
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=AdminController.js.map