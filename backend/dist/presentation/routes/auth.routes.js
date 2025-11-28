"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const createAuthRoutes = (controller) => {
    const router = (0, express_1.Router)();
    router.post('/google', (0, asyncHandler_1.asyncHandler)(controller.loginWithGoogle.bind(controller)));
    router.get('/me', (0, asyncHandler_1.asyncHandler)(controller.me.bind(controller)));
    router.post('/logout', (0, asyncHandler_1.asyncHandler)(controller.logout.bind(controller)));
    return router;
};
exports.createAuthRoutes = createAuthRoutes;
//# sourceMappingURL=auth.routes.js.map