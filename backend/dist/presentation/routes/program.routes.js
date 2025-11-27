"use strict";
// src/v2/presentation/routes/program.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgramRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const cache_1 = require("../middlewares/cache");
const createProgramRoutes = (controller) => {
    const router = (0, express_1.Router)();
    /**
     * GET /v2/programs
     * Query: date (YYYYMMDD | today | tomorrow | after_tomorrow), channels, timeSlot, fields, page, limit
     */
    router.get('/', (0, cache_1.cacheMiddleware)(300), (0, asyncHandler_1.asyncHandler)(controller.getProgramsHandler.bind(controller)));
    /**
     * GET /v2/programs/:id
     */
    router.get('/:id', (0, asyncHandler_1.asyncHandler)(controller.getById.bind(controller)));
    return router;
};
exports.createProgramRoutes = createProgramRoutes;
//# sourceMappingURL=program.routes.js.map