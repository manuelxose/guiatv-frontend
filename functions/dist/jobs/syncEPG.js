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
exports.syncEPGJob = syncEPGJob;
/**
 * Job de sincronización de EPG
 * Ejecuta el handler de sincronización de datos EPG
 */
async function syncEPGJob() {
    console.log('[Job] 🔄 Iniciando sincronización de EPG...');
    try {
        // Importar handler original desde v2/scheduledFunctions
        const { syncEPGDataHandler } = await Promise.resolve().then(() => __importStar(require('../v2/scheduledFunctions')));
        // Los handlers de v2 esperan un CloudEvent, crear uno mock
        const mockEvent = {
            type: 'google.cloud.scheduler.job.v1.executed',
            data: {},
        };
        await syncEPGDataHandler(mockEvent);
        console.log('[Job] ✅ Sincronización de EPG completada');
    }
    catch (error) {
        console.error('[Job] ❌ Error en syncEPG:', error);
        throw error;
    }
}
//# sourceMappingURL=syncEPG.js.map