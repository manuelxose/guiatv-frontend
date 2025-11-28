"use strict";
// src/v2/shared/errors/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = exports.ServiceUnavailableError = exports.TooManyRequestsError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
const AppError_1 = require("./AppError");
var AppError_2 = require("./AppError");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return AppError_2.AppError; } });
var NotFoundError_1 = require("./NotFoundError");
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return NotFoundError_1.NotFoundError; } });
var ValidationError_1 = require("./ValidationError");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return ValidationError_1.ValidationError; } });
// Errores adicionales comunes
class UnauthorizedError extends AppError_1.AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, true, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError_1.AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, true, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError_1.AppError {
    constructor(message) {
        super(message, 409, true, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError_1.AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, true, 'TOO_MANY_REQUESTS');
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class ServiceUnavailableError extends AppError_1.AppError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, 503, false, 'SERVICE_UNAVAILABLE');
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class BadRequestError extends AppError_1.AppError {
    constructor(message = 'Bad request') {
        super(message, 400, true, 'BAD_REQUEST');
    }
}
exports.BadRequestError = BadRequestError;
//# sourceMappingURL=index.js.map