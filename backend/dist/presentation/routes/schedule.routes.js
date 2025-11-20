"use strict";
// src/v2/presentation/routes/schedule.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScheduleRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const validator_1 = require("../middlewares/validator");
const createScheduleRoutes = (controller) => {
    const router = (0, express_1.Router)();
    /**
     * GET /v2/schedules/:date
     * Params: date (YYYYMMDD | today | tomorrow | after_tomorrow)
     */
    router.get('/:date', validator_1.validateDateParam, (0, asyncHandler_1.asyncHandler)(controller.getByDate.bind(controller)));
    /**
     * GET /v2/schedules/:date/channels
     * Params: date
     * Returns: Summary of channels with program counts
     */
    router.get('/:date/channels', validator_1.validateDateParam, (0, asyncHandler_1.asyncHandler)(controller.getChannelsSummary.bind(controller)));
    return router;
};
exports.createScheduleRoutes = createScheduleRoutes;
//# sourceMappingURL=schedule.routes.js.map