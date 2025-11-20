"use strict";
// src/v2/presentation/middlewares/errorHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../../shared/errors");
const logger_1 = require("../../shared/utils/logger");
const errorHandler = (err, req, res, next) => {
    const errorLogger = logger_1.logger.child('ErrorHandler');
    // Error operacional conocido (AppError)
    if (err instanceof errors_1.AppError) {
        errorLogger.warn('Operational error', {
            name: err.name,
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            path: req.path,
            method: req.method,
        });
        res.status(err.statusCode).json(err.toJSON());
        return;
    }
    // Error desconocido/inesperado
    errorLogger.error('Unexpected error', err, {
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
    });
    // No exponer detalles internos en producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
        error: {
            name: 'InternalServerError',
            message: isDevelopment ? err.message : 'An unexpected error occurred',
            ...(isDevelopment && { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map