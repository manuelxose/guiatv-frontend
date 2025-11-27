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
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
/**
 * Configuración centralizada del servidor Express
 * Todas las variables de entorno se leen aquí
 */
exports.config = {
    // ===== SERVIDOR =====
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    // ===== CORS =====
    corsOrigin: process.env.CORS_ORIGIN || '*',
    // ===== FIREBASE =====
    // Project / Storage general settings (not Firebase-specific)
    project: {
        projectId: process.env.PROJECT_ID || 'guiatv',
        storageBucket: process.env.STORAGE_BUCKET || process.env.AWS_S3_BUCKET || 'guia-tv-storage',
    },
    // ===== REDIS =====
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },
    // ===== PATHS =====
    paths: {
        // Carpeta raíz del build SSR de Angular (contiene /browser e /server)
        distFolder: process.env.DIST_FOLDER ||
            path.resolve(__dirname, '../../dist/guiatv'),
    },
    // ===== OTRAS CONFIGURACIONES =====
    // Añade aquí otras variables de entorno que necesites
    externalApiKey: process.env.EXTERNAL_API_KEY,
};
/**
 * Validar configuración crítica
 */
function validateConfig() {
    const errors = [];
    // We don't require Firebase specific env vars anymore; only warn if critical project info missing
    if (!exports.config.project.projectId) {
        errors.push('PROJECT_ID no está configurado');
    }
    if (errors.length > 0) {
        console.error('❌ Errores de configuración:');
        errors.forEach(err => console.error(`  - ${err}`));
        throw new Error('Configuración inválida. Revisa las variables de entorno.');
    }
    console.log('✅ Configuración validada correctamente');
}
//# sourceMappingURL=config.js.map