"use strict";
// src/v2/presentation/middlewares/rateLimit.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimit = exports.generalRateLimit = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errors_1 = require("../../shared/errors");
const createRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options?.windowMs || 60 * 1000, // 1 minuto
        max: options?.max || 100, // 100 requests por ventana
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            throw new errors_1.TooManyRequestsError(options?.message || 'Too many requests, please try again later');
        },
    });
};
exports.createRateLimiter = createRateLimiter;
// Rate limiters específicos
exports.generalRateLimit = (0, exports.createRateLimiter)({
    windowMs: 60 * 1000, // 1 minuto
    max: 100,
});
exports.strictRateLimit = (0, exports.createRateLimiter)({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many requests to this endpoint',
});
//# sourceMappingURL=rateLimit.js.map