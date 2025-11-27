"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeJobs = initializeJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const syncEPG_1 = require("./syncEPG");
const precomputeSchedules_1 = require("./precomputeSchedules");
const cleanOldPrograms_1 = require("./cleanOldPrograms");
/**
 * Inicializar todos los jobs programados usando node-cron
 */
function initializeJobs() {
    console.log('[Jobs] Configurando jobs programados...');
    // Sincronizar EPG cada 6 horas (00:00, 06:00, 12:00, 18:00)
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        try {
            await (0, syncEPG_1.syncEPGJob)();
        }
        catch (error) {
            console.error('Error ejecutando syncEPGJob:', error);
        }
    }, {
        timezone: 'Europe/Madrid',
    });
    console.log('  - syncEPG: cada 6 horas (0 */6 * * *)');
    // Precomputar horarios cada 6 horas (00:00, 06:00, 12:00, 18:00)
    node_cron_1.default.schedule('15 */6 * * *', async () => {
        try {
            await (0, precomputeSchedules_1.precomputeSchedulesJob)();
        }
        catch (error) {
            console.error('Error ejecutando precomputeSchedulesJob:', error);
        }
    }, {
        timezone: 'Europe/Madrid',
    });
    console.log('  - precomputeSchedules: cada 6 horas (15 */6 * * *)');
    // Limpiar programas antiguos cada 24 horas a las 3:00 AM
    node_cron_1.default.schedule('0 3 * * *', async () => {
        try {
            await (0, cleanOldPrograms_1.cleanOldProgramsJob)();
        }
        catch (error) {
            console.error('Error ejecutando cleanOldProgramsJob:', error);
        }
    }, {
        timezone: 'Europe/Madrid',
    });
    console.log('  - cleanOldPrograms: cada dia a las 3:00 AM (0 3 * * *)');
    console.log('[Jobs] Jobs programados configurados correctamente');
}
//# sourceMappingURL=index.js.map