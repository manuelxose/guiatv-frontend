"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSSRRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const createSSRRoutes = (controller) => {
    const router = (0, express_1.Router)();
    router.get('/now-playing', (0, asyncHandler_1.asyncHandler)(controller.nowPlaying.bind(controller)));
    return router;
};
exports.createSSRRoutes = createSSRRoutes;
//# sourceMappingURL=ssr.routes.js.map