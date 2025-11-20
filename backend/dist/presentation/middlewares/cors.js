"use strict";
// src/v2/presentation/middlewares/cors.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const parseAllowedOrigins = () => {
    const raw = process.env.ALLOWED_ORIGINS;
    if (!raw)
        return null;
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
};
const allowedOrigins = parseAllowedOrigins();
exports.corsMiddleware = (0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow non-browser requests (Postman, curl) and same-origin
        if (!origin)
            return callback(null, true);
        if (!allowedOrigins) {
            // If no explicit origins configured, allow common localhost dev origins
            const devAllow = [
                'http://localhost:4200',
                'http://127.0.0.1:4200',
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ];
            if (devAllow.includes(origin))
                return callback(null, true);
            // Fallback: lenient in local development
            return callback(null, true);
        }
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: !!process.env.ALLOW_CREDENTIALS || false,
    maxAge: 86400, // 24 horas
});
//# sourceMappingURL=cors.js.map