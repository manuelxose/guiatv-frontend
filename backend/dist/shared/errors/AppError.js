"use strict";
// src/v2/shared/errors/AppError.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            error: {
                name: this.name,
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
            },
        };
    }
}
exports.AppError = AppError;
//# sourceMappingURL=AppError.js.map