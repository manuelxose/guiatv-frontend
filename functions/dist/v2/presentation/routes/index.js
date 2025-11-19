"use strict";
// src/v2/presentation/routes/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createV2Routes = void 0;
const express_1 = require("express");
const channel_routes_1 = require("./channel.routes");
const program_routes_1 = require("./program.routes");
const schedule_routes_1 = require("./schedule.routes");
const health_routes_1 = require("./health.routes");
const rateLimit_1 = require("../middlewares/rateLimit");
const admin_routes_1 = require("./admin.routes");
const swagger_routes_1 = require("./swagger.routes");
const createV2Routes = (dependencies) => {
    const router = (0, express_1.Router)();
    // Documentación Swagger
    router.use('/docs', (0, swagger_routes_1.createSwaggerRoutes)());
    // Health check (sin rate limit)
    router.use('/health', (0, health_routes_1.createHealthRoutes)());
    // Aplicar rate limiting general
    router.use(rateLimit_1.generalRateLimit);
    // Rutas de recursos
    router.use('/channels', (0, channel_routes_1.createChannelRoutes)(dependencies.channelController));
    router.use('/programs', (0, program_routes_1.createProgramRoutes)(dependencies.programController));
    router.use('/schedules', (0, schedule_routes_1.createScheduleRoutes)(dependencies.scheduleController));
    router.use('/admin', (0, admin_routes_1.createAdminRoutes)(dependencies.adminController));
    return router;
};
exports.createV2Routes = createV2Routes;
//# sourceMappingURL=index.js.map