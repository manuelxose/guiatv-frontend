"use strict";
// src/v2/shared/errors/NotFoundError.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const AppError_1 = require("./AppError");
class NotFoundError extends AppError_1.AppError {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404, true, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=NotFoundError.js.map