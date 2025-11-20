"use strict";
// src/v2/shared/errors/ValidationError.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
const AppError_1 = require("./AppError");
class ValidationError extends AppError_1.AppError {
    constructor(message, details) {
        super(message, 400, true, 'VALIDATION_ERROR');
        this.details = details;
    }
    toJSON() {
        return {
            error: {
                name: this.name,
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                details: this.details,
            },
        };
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=ValidationError.js.map