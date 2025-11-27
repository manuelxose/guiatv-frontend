"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLayoutRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const createLayoutRoutes = (layoutController) => {
    const router = (0, express_1.Router)();
    /**
     * GET /v2/layouts/:date
     * Query: channels (csv), timeSlot, fields
     */
    router.get('/:date', (0, asyncHandler_1.asyncHandler)(layoutController.getByDate.bind(layoutController)));
    return router;
};
exports.createLayoutRoutes = createLayoutRoutes;
//# sourceMappingURL=layout.routes.js.map