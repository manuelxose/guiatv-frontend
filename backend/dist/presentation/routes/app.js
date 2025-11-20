"use strict";
// src/v2/presentation/routes/app.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const index_1 = require("./index");
const cors_1 = require("../middlewares/cors");
const compression_1 = require("../middlewares/compression");
const requestLogger_1 = require("../middlewares/requestLogger");
const errorHandler_1 = require("../middlewares/errorHandler");
const notFoundHandler_1 = require("../middlewares/notFoundHandler");
const createApp = (dependencies) => {
    const app = (0, express_1.default)();
    // Middlewares globales
    app.use(cors_1.corsMiddleware);
    app.use(compression_1.compressionMiddleware);
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(requestLogger_1.requestLogger);
    // Rutas v2
    const v2Router = (0, index_1.createV2Routes)(dependencies);
    app.use('/v2', v2Router);
    // Root route for compatibility and health check
    /**
     * @openapi
     * /:
     *   get:
     *     tags:
     *       - General
     *     summary: Bienvenida a la API
     *     description: Retorna información básica y versión de la API
     *     responses:
     *       200:
     *         description: Bienvenida
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     message:
     *                       type: string
     *                       example: Welcome to Guía TV API
     *                     version:
     *                       type: string
     *                       example: 2.0.0
     *                     docs:
     *                       type: string
     *                       example: /v2/docs
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.get('/', (req, res) => {
        res.json({
            success: true,
            data: {
                message: 'Welcome to Guía TV API',
                version: process.env.API_VERSION || '2.0.0',
                docs: '/v2/docs',
            },
        });
    });
    // Alias v2 routes at root for backward compatibility (e.g. /health)
    app.use('/', v2Router);
    // 404 handler
    app.use(notFoundHandler_1.notFoundHandler);
    // Error handler (debe ser el último)
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map