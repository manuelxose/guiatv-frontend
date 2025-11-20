"use strict";
// src/v2/presentation/routes/program.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgramRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const validator_1 = require("../middlewares/validator");
const cache_1 = require("../middlewares/cache");
const createProgramRoutes = (controller) => {
    const router = (0, express_1.Router)();
    /**
     * GET /v2/programs/date/:date
     * Params: date (YYYYMMDD | today | tomorrow | after_tomorrow)
     * Query: channelId, genre, limit, offset
     */
    router.get('/date/:date', (0, cache_1.cacheMiddleware)(20), validator_1.validateDateParam, validator_1.validatePaginationQuery, (0, asyncHandler_1.asyncHandler)(controller.getByDate.bind(controller)));
    /**
     * GET /v2/programs/channel/:channelId
     * Params: channelId
     * Query: date, fromTime, toTime
     */
    router.get('/channel/:channelId', validator_1.validateChannelIdParam, validator_1.validateTimeQuery, (0, asyncHandler_1.asyncHandler)(controller.getByChannel.bind(controller)));
    return router;
};
exports.createProgramRoutes = createProgramRoutes;
//# sourceMappingURL=program.routes.js.map