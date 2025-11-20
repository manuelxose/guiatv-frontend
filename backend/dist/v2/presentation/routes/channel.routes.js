"use strict";
// src/v2/presentation/routes/channel.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChannelRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const validator_1 = require("../middlewares/validator");
const cache_1 = require("../middlewares/cache");
const createChannelRoutes = (controller) => {
    const router = (0, express_1.Router)();
    /**
     * GET /v2/channels
     * Query params: type, region, isActive
     */
    router.get('/', (0, cache_1.cacheMiddleware)(30), (0, asyncHandler_1.asyncHandler)(controller.getAll.bind(controller)));
    /**
     * GET /v2/channels/:id
     */
    router.get('/:id', validator_1.validateChannelIdParam, (0, asyncHandler_1.asyncHandler)(controller.getById.bind(controller)));
    return router;
};
exports.createChannelRoutes = createChannelRoutes;
//# sourceMappingURL=channel.routes.js.map