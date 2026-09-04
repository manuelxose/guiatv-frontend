import cron from 'node-cron';
import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process';
import { join } from 'node:path';

export type SpawnProcess = (
  command: string,
  args: string[],
  options: SpawnOptions
) => ChildProcess;

/**
 * Runs a heavy maintenance job in a separate Node process so XML parsing,
 * image work and garbage collection cannot block the API event loop.
 */
export function createIsolatedJobRunner(
  scriptPath: string,
  spawnProcess: SpawnProcess = spawn
): () => Promise<boolean> {
  let running = false;

  return async () => {
    if (running) return false;
    running = true;

    return new Promise<boolean>((resolve, reject) => {
      const child = spawnProcess(process.execPath, [scriptPath], {
        env: process.env,
        stdio: 'inherit',
      });
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        running = false;
        if (error) reject(error);
        else resolve(true);
      };

      child.once('error', (error) => finish(error));
      child.once('exit', (code, signal) => {
        if (code === 0) finish();
        else finish(new Error(`Job ${scriptPath} exited with code ${code ?? 'null'}${signal ? ` (${signal})` : ''}`));
      });
    });
  };
}

/**
 * Inicializar todos los jobs programados usando node-cron
 */
export function initializeJobs(options: { refreshFootballHome?: () => Promise<unknown> } = {}): void {
  console.log('[Jobs] Configurando jobs programados...');
  const runSyncEpg = createIsolatedJobRunner(join(__dirname, 'cli/syncEPG.cli.js'));
  const runPrecompute = createIsolatedJobRunner(join(__dirname, 'cli/precomputeSchedules.cli.js'));
  const runCleanup = createIsolatedJobRunner(join(__dirname, 'cli/cleanOldPrograms.cli.js'));

  // Sincronizar EPG cada 6 horas (00:00, 06:00, 12:00, 18:00)
  cron.schedule(
    '0 */6 * * *',
    async () => {
      try {
        await runSyncEpg();
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
        await runPrecompute();
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
        await runCleanup();
      } catch (error) {
        console.error('Error ejecutando cleanOldProgramsJob:', error);
      }
    },
    {
      timezone: 'Europe/Madrid',
    }
  );
  console.log('  - cleanOldPrograms: cada dia a las 3:00 AM (0 3 * * *)');

  if (options.refreshFootballHome) {
    const refresh = async () => {
      try {
        await options.refreshFootballHome?.();
      } catch (error) {
        console.error('Error refrescando football home read model:', error);
      }
    };
    // A one-minute trigger is inexpensive on a fresh cache and guarantees
    // provider/reconciliation work happens outside visitor requests.
    cron.schedule('* * * * *', refresh, { timezone: 'Europe/Madrid' });
    setImmediate(() => void refresh());
    console.log('  - footballHomeReadModel: cada minuto (* * * * *)');
  }

  console.log('[Jobs] Jobs programados configurados correctamente');
}
