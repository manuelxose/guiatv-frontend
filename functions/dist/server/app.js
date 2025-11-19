"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
/**
 * Crear y configurar la aplicación Express
 */
function createApp() {
    const app = (0, express_1.default)();
    // ===== MIDDLEWARES GLOBALES =====
    // CORS
    app.use((0, cors_1.default)({
        origin: config_1.config.corsOrigin,
        credentials: true,
    }));
    // Compresión de respuestas
    app.use((0, compression_1.default)());
    // Parseo de JSON y URL-encoded
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Logging básico de requests
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path}`);
        next();
    });
    // ===== HEALTH CHECK =====
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config_1.config.nodeEnv,
        });
    });
    // ===== MONTAJE DE ROUTERS =====
    // Lazy-load de routers para optimizar tiempo de arranque
    app.use('/v1', async (req, res, next) => {
        try {
            const { default: v1Router } = await Promise.resolve().then(() => __importStar(require('../api/v1/router')));
            return v1Router(req, res, next);
        }
        catch (error) {
            next(error);
        }
    });
    app.use('/v2', async (req, res, next) => {
        try {
            const { default: v2Router } = await Promise.resolve().then(() => __importStar(require('../api/v2/router')));
            return v2Router(req, res, next);
        }
        catch (error) {
            next(error);
        }
    });
    // SSR / Servidor de estáticos (debe ir al final)
    app.use('*', async (req, res, next) => {
        try {
            const { ssrHandler } = await Promise.resolve().then(() => __importStar(require('../ssr/handler')));
            return ssrHandler(req, res, next);
        }
        catch (error) {
            next(error);
        }
    });
    // ===== MIDDLEWARE DE ERRORES =====
    app.use((err, req, res, next) => {
        console.error('❌ Error en la aplicación:', err);
        // No enviar stack trace en producción
        const errorResponse = {
            error: 'Internal Server Error',
            message: config_1.config.isDevelopment ? err.message : 'Ha ocurrido un error',
        };
        if (config_1.config.isDevelopment && err.stack) {
            errorResponse.stack = err.stack;
        }
        res.status(500).json(errorResponse);
    });
    return app;
}
//# sourceMappingURL=app.js.map