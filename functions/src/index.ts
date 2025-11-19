import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Lazy initialization flag
let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  initialized = true;

  // Firebase Functions v7: No longer using runtimeConfigShim
  // All configuration is now handled via params module and environment variables

  ensureProjectEnv();
}

export function ensureProjectEnv(): void {
  const skip = process.env.SKIP_PROJECT_ENV === '1' || process.env.SKIP_PROJECT_ENV === 'true';
  if (skip) return;

  let projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID;
  if (!projectId && process.env.FIREBASE_CONFIG) {
    try {
      projectId = JSON.parse(process.env.FIREBASE_CONFIG).projectId;
    } catch (e) {
      console.warn('Unable to parse FIREBASE_CONFIG for projectId', e);
    }
  }

  if (!projectId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { resolve } = require('path');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { readFileSync } = require('fs');
      const rcPath = resolve(__dirname, '..', '..', '.firebaserc');
      const rc = JSON.parse(readFileSync(rcPath, 'utf8'));
      projectId = rc?.projects?.default;
    } catch (e) {
      console.warn('Unable to read .firebaserc for projectId', e);
    }
  }

  if (projectId) {
    process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || projectId;
    process.env.GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || projectId;
  }
}

// Export API v1 (legacy)
export const v1 = onRequest({ memory: '2GiB', timeoutSeconds: 540 }, async (req, res) => {
  ensureInitialized();
  const { api } = await import('./v1/index');
  return api(req, res);
});

// Export API v2
export const v2 = onRequest(
  {
    memory: '512MiB',
    timeoutSeconds: 60,
    minInstances: process.env.NODE_ENV === 'production' ? 1 : 0,
    maxInstances: 10,
  },
  async (req, res) => {
    ensureInitialized();
    const { v2 } = await import('./v2/index');
    return v2(req, res);
  }
);

// Export SSR
export const ssr = onRequest({ memory: '1GiB', timeoutSeconds: 540 }, async (req, res) => {
  ensureInitialized();
  const { ssr } = await import('./v1/index');
  return ssr(req, res);
});

// Export Scheduled Functions

const skipSchedule = process.env.SKIP_SCHEDULE_REGISTRATION === '1' || process.env.SKIP_SCHEDULE_REGISTRATION === 'true';

export const actualizarProgramacion = skipSchedule
  ? undefined
  : onSchedule(
      {
        schedule: '0 0 */5 * *',
        timeZone: 'Europe/Madrid',
        memory: '2GiB',
        timeoutSeconds: 540,
      },
      async (event) => {
        ensureInitialized();
        const { actualizarProgramacion: fn } = await import('./v1/actualizarProgramacion');
        return fn();
      }
    );

export const syncEPGDataScheduled = skipSchedule
  ? undefined
  : onSchedule(
      {
        schedule: '0 */6 * * *',
        timeZone: 'Europe/Madrid',
        memory: '1GiB',
        timeoutSeconds: 540,
      },
      async (event) => {
        ensureInitialized();
        const { syncEPGDataHandler } = await import('./v2/infrastructure/scheduled/syncScheduledFunction');
        await syncEPGDataHandler(event);
      }
    );

export const precomputeSchedulesScheduled = skipSchedule
  ? undefined
  : onSchedule(
      {
        schedule: '15 */6 * * *',
        timeZone: 'Europe/Madrid',
        memory: '512MiB',
        timeoutSeconds: 300,
      },
      async (event) => {
        ensureInitialized();
        const { precomputeSchedulesHandler } = await import('./v2/infrastructure/scheduled/syncScheduledFunction');
        await precomputeSchedulesHandler(event);
      }
    );

export const cleanOldProgramsScheduled = skipSchedule
  ? undefined
  : onSchedule(
      {
        schedule: '0 3 * * *',
        timeZone: 'Europe/Madrid',
        memory: '256MiB',
        timeoutSeconds: 300,
      },
      async (event) => {
        ensureInitialized();
        const { cleanOldProgramsHandler } = await import('./v2/infrastructure/scheduled/syncScheduledFunction');
        await cleanOldProgramsHandler(event);
      }
    );

