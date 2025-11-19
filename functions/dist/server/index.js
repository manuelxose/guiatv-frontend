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
const app_1 = require("./app");
const config_1 = require("./config");
/**
 * Entry point del servidor Express
 */
async function startServer() {
    try {
        console.log('🚀 Iniciando servidor Express...');
        console.log(`📌 Entorno: ${config_1.config.nodeEnv}`);
        console.log(`📌 Puerto: ${config_1.config.port}`);
        // Validar configuración
        (0, config_1.validateConfig)();
        // Inicializar DI container (configura DB, cache y repositorios)
        console.log('🔥 Inicializando contenedor de dependencias...');
        const { createContainer } = await Promise.resolve().then(() => __importStar(require('../v2/config/container')));
        const container = createContainer();
        await container.initialize();
        console.log('✅ Contenedor inicializado');
        // Crear aplicación Express
        const app = (0, app_1.createApp)();
        // Inicializar jobs programados (se apoyan en contenedor inicializado)
        console.log('📅 Inicializando jobs programados...');
        const { initializeJobs } = await Promise.resolve().then(() => __importStar(require('../jobs')));
        initializeJobs();
        console.log('✅ Jobs programados inicializados');
        // Arrancar servidor HTTP
        const server = app.listen(config_1.config.port, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log(`✅ Servidor escuchando en http://localhost:${config_1.config.port}`);
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
            console.log('Endpoints disponibles:');
            console.log(`  - Health Check: http://localhost:${config_1.config.port}/health`);
            console.log(`  - API v1:       http://localhost:${config_1.config.port}/v1/`);
            console.log(`  - API v2:       http://localhost:${config_1.config.port}/v2/`);
            console.log(`  - SSR:          http://localhost:${config_1.config.port}/`);
            console.log('');
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            console.log(`\n${signal} recibido, cerrando servidor...`);
            server.close(() => {
                console.log('✅ Servidor HTTP cerrado');
                process.exit(0);
            });
            // Forzar cierre después de 10 segundos
            setTimeout(() => {
                console.error('❌ Forzando cierre del servidor (timeout)');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        console.error('❌ Error fatal al arrancar el servidor:', error);
        process.exit(1);
    }
}
// Arrancar servidor
startServer();
//# sourceMappingURL=index.js.map