"use strict";
// src/v2/presentation/routes/admin.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const rateLimit_1 = require("../middlewares/rateLimit");
const createAdminRoutes = (controller) => {
    const router = (0, express_1.Router)();
    // TODO: Agregar middleware de autenticación para producción
    // router.use(authMiddleware);
    /**
     * POST /v2/admin/sync
     * Body: { date?: string, forceRefresh?: boolean }
     */
    router.post('/sync', rateLimit_1.strictRateLimit, (0, asyncHandler_1.asyncHandler)(controller.triggerSync.bind(controller)));
    /**
     * POST /v2/admin/precompute
     * Body: { date?: string }
     */
    router.post('/precompute', rateLimit_1.strictRateLimit, (0, asyncHandler_1.asyncHandler)(controller.triggerPrecompute.bind(controller)));
    /**
     * POST /v2/admin/precompute-window
     * Body: { fields?: 'minimal' | 'full' }
     */
    router.post('/precompute-window', rateLimit_1.strictRateLimit, (0, asyncHandler_1.asyncHandler)(controller.triggerPrecomputeWindow.bind(controller)));
    /**
     * POST /v2/admin/cleanup
     * Body: { daysToKeep?: number }
     */
    router.post('/cleanup', rateLimit_1.strictRateLimit, (0, asyncHandler_1.asyncHandler)(controller.triggerCleanup.bind(controller)));
    /**
     * POST /v2/admin/cache/clear
     * Body: { pattern?: string }
     */
    router.post('/cache/clear', rateLimit_1.strictRateLimit, (0, asyncHandler_1.asyncHandler)(controller.clearCache.bind(controller)));
    /**
     * POST /v2/admin/reset
     * Body: { sourceUrl?: string, fields?: 'minimal' | 'full' }
     */
    router.post('/reset', rateLimit_1.strictRateLimit, (0, asyncHandler_1.asyncHandler)(controller.triggerReset.bind(controller)));
    /**
     * GET /v2/admin/health
     */
    router.get('/health', (0, asyncHandler_1.asyncHandler)(controller.healthCheck.bind(controller)));
    return router;
};
exports.createAdminRoutes = createAdminRoutes;
//# sourceMappingURL=admin.routes.js.map