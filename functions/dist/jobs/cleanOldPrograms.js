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
exports.cleanOldProgramsJob = cleanOldProgramsJob;
/**
 * Job de limpieza de programas antiguos
 * Ejecuta el handler de limpieza de programas viejos
 */
async function cleanOldProgramsJob() {
    console.log('[Job] 🔄 Iniciando limpieza de programas antiguos...');
    try {
        // Importar handler original desde v2/scheduledFunctions
        const { cleanOldProgramsHandler } = await Promise.resolve().then(() => __importStar(require('../v2/scheduledFunctions')));
        // Los handlers de v2 esperan un CloudEvent, crear uno mock
        const mockEvent = {
            type: 'google.cloud.scheduler.job.v1.executed',
            data: {},
        };
        await cleanOldProgramsHandler(mockEvent);
        console.log('[Job] ✅ Limpieza de programas antiguos completada');
    }
    catch (error) {
        console.error('[Job] ❌ Error en cleanOldPrograms:', error);
        throw error;
    }
}
//# sourceMappingURL=cleanOldPrograms.js.map