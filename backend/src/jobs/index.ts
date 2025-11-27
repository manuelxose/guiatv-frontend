import cron from 'node-cron';
import { syncEPGJob } from './syncEPG';
import { precomputeSchedulesJob } from './precomputeSchedules';
import { cleanOldProgramsJob } from './cleanOldPrograms';

/**
 * Inicializar todos los jobs programados usando node-cron
 */
export function initializeJobs(): void {
  console.log('[Jobs] Configurando jobs programados...');

  // Sincronizar EPG cada 6 horas (00:00, 06:00, 12:00, 18:00)
  cron.schedule(
    '0 */6 * * *',
    async () => {
      try {
        await syncEPGJob();
      } catch (error) {
        console.error('Error ejecutando syncEPGJob:', error);
      }
    },
    {
      timezone: 'Europe/Madrid',
    }
  );
  console.log('  - syncEPG: cada 6 horas (0 */6 * * *)');

  // Precomputar horarios cada 6 horas (00:00, 06:00, 12:00, 18:00)
  cron.schedule(
    '15 */6 * * *',
    async () => {
      try {
        await precomputeSchedulesJob();
      } catch (error) {
        console.error('Error ejecutando precomputeSchedulesJob:', error);
      }
    },
    {
      timezone: 'Europe/Madrid',
    }
  );
  console.log('  - precomputeSchedules: cada 6 horas (15 */6 * * *)');

  // Limpiar programas antiguos cada 24 horas a las 3:00 AM
  cron.schedule(
    '0 3 * * *',
    async () => {
      try {
        await cleanOldProgramsJob();
      } catch (error) {
        console.error('Error ejecutando cleanOldProgramsJob:', error);
      }
    },
    {
      timezone: 'Europe/Madrid',
    }
  );
  console.log('  - cleanOldPrograms: cada dia a las 3:00 AM (0 3 * * *)');

  console.log('[Jobs] Jobs programados configurados correctamente');
}
