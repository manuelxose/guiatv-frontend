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
    /**
     * @openapi
     * /v2/admin/sync:
     *   post:
     *     tags:
     *       - Admin
     *     summary: Sincronizar EPG manualmente
     *     description: Descarga y procesa el archivo XMLTV
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               date:
     *                 type: string
     *                 description: Fecha a sincronizar (YYYYMMDD)
     *               forceRefresh:
     *                 type: boolean
     *                 description: Forzar descarga aunque exista cache
     *     responses:
     *       200:
     *         description: Sincronización completada
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
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
    /**
     * @openapi
     * /v2/admin/precompute:
     *   post:
     *     tags:
     *       - Admin
     *     summary: Precomputar horarios
     *     description: Genera y guarda los JSONs estáticos para la fecha indicada
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               date:
     *                 type: string
     *                 description: Fecha a procesar (YYYYMMDD)
     *     responses:
     *       200:
     *         description: Precomputación completada
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
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
    /**
     * @openapi
     * /v2/admin/cleanup:
     *   post:
     *     tags:
     *       - Admin
     *     summary: Limpiar programas antiguos
     *     description: Elimina programas anteriores a la fecha configurada
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               daysToKeep:
     *                 type: integer
     *                 description: Días de historial a mantener
     *                 default: 7
     *     responses:
     *       200:
     *         description: Limpieza completada
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
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
    /**
     * @openapi
     * /v2/admin/cache/clear:
     *   post:
     *     tags:
     *       - Admin
     *     summary: Limpiar caché
     *     description: Invalida entradas de caché que coincidan con el patrón
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               pattern:
     *                 type: string
     *                 description: Patrón de claves a eliminar (ej. "program:*")
     *     responses:
     *       200:
     *         description: Caché limpiada
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    async clearCache(req, res) {
        const { pattern } = req.body;
        this.adminLogger.info('Cache clear triggered', { pattern });
        await this.cacheRepository.clear(pattern);
        res.status(200).json({
            message: 'Cache cleared successfully',
            pattern: pattern || 'all',
        });
    }
    /**
     * @openapi
     * /v2/admin/health:
     *   get:
     *     tags:
     *       - Admin
     *     summary: Health check administrativo
     *     description: Verifica estado de servicios internos (DB, Cache, etc)
     *     responses:
     *       200:
     *         description: Sistema saludable
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: healthy
     *                 services:
     *                   type: object
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
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