"use strict";
// src/v2/presentation/middlewares/compression.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionMiddleware = void 0;
const compression_1 = __importDefault(require("compression"));
exports.compressionMiddleware = (0, compression_1.default)({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
    level: 6, // Balance entre compresión y CPU
    threshold: 1024, // Solo comprimir respuestas > 1KB
});
//# sourceMappingURL=compression.js.map