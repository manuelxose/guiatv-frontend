"use strict";
// src/v2/presentation/routes/health.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const ApiResponse_1 = require("../../shared/types/ApiResponse");
const createHealthRoutes = () => {
    const router = (0, express_1.Router)();
    /**
     * @openapi
     * /v2/health:
     *   get:
     *     tags:
     *       - Health
     *     summary: Health check
     *     description: Verifica que el servidor esté respondiendo
     *     responses:
     *       200:
     *         description: Servidor saludable
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: healthy
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                 uptime:
     *                   type: string
     *                 version:
     *                   type: string
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        res.status(200).json((0, ApiResponse_1.successResponse)({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime)}s`,
            version: process.env.API_VERSION || '2.0.0',
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            },
        }, { cached: false }));
    }));
    return router;
};
exports.createHealthRoutes = createHealthRoutes;
//# sourceMappingURL=health.routes.js.map