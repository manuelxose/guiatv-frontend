"use strict";
// src/v2/infrastructure/scheduled/syncScheduledFunction.ts
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
exports.cleanOldProgramsHandler = exports.precomputeSchedulesHandler = exports.syncEPGDataHandler = void 0;
const dateUtils_1 = require("../../shared/utils/dateUtils");
const logger_1 = require("../../shared/utils/logger");
const EPGDataSource_1 = require("../external/EPGDataSource");
const XMLParser_1 = require("../parsers/XMLParser");
/**
 * Sincronización diaria de datos EPG
 * Se ejecuta cada 6 horas
 */
const syncEPGDataHandler = async (context) => {
    const syncLogger = logger_1.logger.child('SyncScheduled');
    try {
        syncLogger.info('Starting scheduled EPG sync');
        // Inicializar container de forma dinámica para evitar ejecutar
        // inicialización pesada durante la fase de discovery/deploy.
        let syncUseCase;
        if (process.env.SKIP_CONTAINER_INIT === '1' || process.env.SKIP_CONTAINER_INIT === 'true') {
            syncLogger.warn('SKIP_CONTAINER_INIT set - skipping container initialization for scheduled sync');
            throw new Error('Container initialization skipped by SKIP_CONTAINER_INIT');
        }
        else {
            const { Container } = await Promise.resolve().then(() => __importStar(require('../../config/container')));
            const container = Container.getInstance();
            await container.initialize();
            syncUseCase = container.get('syncEPGData');
        }
        // Sincronizar hoy, mañana y pasado mañana
        const datesToSync = [
            dateUtils_1.DateUtils.getTodayYYYYMMDD(),
            dateUtils_1.DateUtils.getTomorrowYYYYMMDD(),
            dateUtils_1.DateUtils.getAfterTomorrowYYYYMMDD(),
        ];
        // Descargar y parsear el XML una sola vez para reutilizar en todas las fechas
        const sourceUrl = 'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz';
        const dataSource = new EPGDataSource_1.EPGDataSource({
            url: sourceUrl,
            timeout: 60000,
            compressed: sourceUrl.endsWith('.gz'),
        });
        syncLogger.info('Fetching EPG once for all dates', { sourceUrl });
        const xmlContent = await dataSource.fetchWithRetry(3);
        const xmlParser = new XMLParser_1.XMLParser();
        const parsedData = await xmlParser.parse(xmlContent);
        const results = [];
        let isFirstDate = true;
        for (const date of datesToSync) {
            syncLogger.info('Syncing date', { date });
            const result = await syncUseCase.execute({
                sourceUrl,
                date,
                forceRefresh: true,
                xmlContent,
                parsedData,
                skipSaveXml: !isFirstDate,
            });
            isFirstDate = false;
            results.push({ date, ...result });
            if (result.success) {
                syncLogger.info('Sync completed for date', {
                    date,
                    channelsProcessed: result.channelsProcessed,
                    programsProcessed: result.programsProcessed,
                    duration: result.duration,
                });
            }
            else {
                syncLogger.error('Sync failed for date', new Error(result.errors.join(', ')), { date });
            }
        }
        syncLogger.info('All syncs completed', {
            total: results.length,
            successful: results.filter((r) => r.success).length,
        });
        return { success: true, results };
    }
    catch (error) {
        syncLogger.error('Scheduled sync failed', error);
        throw error;
    }
};
exports.syncEPGDataHandler = syncEPGDataHandler;
/**
 * Precomputar schedules para acceso rápido
 * Se ejecuta 15 minutos después del sync
 */
const precomputeSchedulesHandler = async (context) => {
    const precomputeLogger = logger_1.logger.child('PrecomputeScheduled');
    try {
        precomputeLogger.info('Starting scheduled precompute');
        let precomputeUseCase;
        if (process.env.SKIP_CONTAINER_INIT === '1' || process.env.SKIP_CONTAINER_INIT === 'true') {
            precomputeLogger.warn('SKIP_CONTAINER_INIT set - skipping container initialization for scheduled precompute');
            throw new Error('Container initialization skipped by SKIP_CONTAINER_INIT');
        }
        else {
            const { Container } = await Promise.resolve().then(() => __importStar(require('../../config/container')));
            const container = Container.getInstance();
            await container.initialize();
            precomputeUseCase = container.get('precomputeSchedule');
        }
        const datesToPrecompute = [
            dateUtils_1.DateUtils.getTodayYYYYMMDD(),
            dateUtils_1.DateUtils.getTomorrowYYYYMMDD(),
            dateUtils_1.DateUtils.getAfterTomorrowYYYYMMDD(),
        ];
        const results = [];
        for (const date of datesToPrecompute) {
            precomputeLogger.info('Precomputing schedule for date', { date });
            const result = await precomputeUseCase.execute({ date });
            results.push({ date, ...result });
            if (result.success) {
                precomputeLogger.info('Precompute completed', {
                    date,
                    filePath: result.filePath,
                    fileSize: result.fileSize,
                });
            }
        }
        precomputeLogger.info('All precomputes completed', {
            total: results.length,
            successful: results.filter((r) => r.success).length,
        });
        return { success: true, results };
    }
    catch (error) {
        precomputeLogger.error('Scheduled precompute failed', error);
        throw error;
    }
};
exports.precomputeSchedulesHandler = precomputeSchedulesHandler;
/**
 * Limpieza de programas antiguos
 * Se ejecuta diariamente a las 3 AM
 */
const cleanOldProgramsHandler = async (context) => {
    const cleanLogger = logger_1.logger.child('CleanScheduled');
    try {
        cleanLogger.info('Starting scheduled cleanup');
        let cleanUseCase;
        if (process.env.SKIP_CONTAINER_INIT === '1' || process.env.SKIP_CONTAINER_INIT === 'true') {
            cleanLogger.warn('SKIP_CONTAINER_INIT set - skipping container initialization for scheduled cleanup');
            throw new Error('Container initialization skipped by SKIP_CONTAINER_INIT');
        }
        else {
            const { Container } = await Promise.resolve().then(() => __importStar(require('../../config/container')));
            const container = Container.getInstance();
            await container.initialize();
            cleanUseCase = container.get('cleanOldPrograms');
        }
        const result = await cleanUseCase.execute({
            daysToKeep: 7, // Mantener últimos 7 días
        });
        if (result.success) {
            cleanLogger.info('Cleanup completed successfully', {
                datesRemoved: result.datesRemoved.length,
            });
        }
        else {
            cleanLogger.warn('Cleanup completed with errors', {
                datesRemoved: result.datesRemoved.length,
                errors: result.errors,
            });
        }
        return result;
    }
    catch (error) {
        cleanLogger.error('Scheduled cleanup failed', error);
        throw error;
    }
};
exports.cleanOldProgramsHandler = cleanOldProgramsHandler;
//# sourceMappingURL=syncScheduledFunction.js.map