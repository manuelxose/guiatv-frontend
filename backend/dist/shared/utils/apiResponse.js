"use strict";
// src/shared/utils/apiResponse.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.createSuccessResponse = void 0;
const createSuccessResponse = (data, meta) => {
    return {
        success: true,
        data,
        meta,
    };
};
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (code, message, details) => {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
    };
};
exports.createErrorResponse = createErrorResponse;
//# sourceMappingURL=apiResponse.js.map