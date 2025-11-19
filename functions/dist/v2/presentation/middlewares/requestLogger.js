"use strict";
// src/v2/presentation/middlewares/requestLogger.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../../shared/utils/logger");
const requestLogger = (req, res, next) => {
    const requestLogger = logger_1.logger.child('Request');
    const start = Date.now();
    // Log cuando termina la respuesta
    res.on('finish', () => {
        const duration = Date.now() - start;
        requestLogger.info('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map