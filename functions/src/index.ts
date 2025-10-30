// src/index.ts - Punto de entrada principal simplificado

import * as functions from 'firebase-functions';

/**
 * API v1 (Legacy) - Lazy loaded
 */
export const api = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .https.onRequest(async (req, res) => {
    try {
      const { app: v1App } = await import('./v1/index');
      return v1App(req, res);
    } catch (error) {
      console.error('Error loading v1 API:', error);
      res.status(500).json({ error: 'Failed to load API v1' });
    }
  });

export const app = api;

/**
 * API v2
 */
// Lazy-load API v2 to avoid importing heavy modules at require-time which can
// cause the Functions emulator to time out during trigger discovery.
export const apiv2 = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
    // minInstances is set in the v2 module based on env; keep defaults here
  })
  .https.onRequest(async (req, res) => {
    try {
      const mod = await import('./v2/index');
      // TypeScript module typings may not include a default; use `any` to
      // defensive-check for different shapes (named export, default export).
      const m: any = mod;
      const handler = m.apiv2 || (m.default && m.default.apiv2) || null;
      if (typeof handler === 'function') {
        return handler(req, res);
      }
      // Fallback: if nothing found, return an error
      console.error('apiv2 handler not found in ./v2/index');
      return res.status(500).json({ error: 'Failed to load API v2' });
    } catch (error) {
      console.error('Error loading API v2:', error);
      return res.status(500).json({ error: 'Failed to load API v2' });
    }
  });

/**
 * Scheduled Functions - Lazy loaded
 */
export const actualizarProgramacion = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .pubsub.schedule('0 0 */5 * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    try {
      const { actualizarProgramacion: fn } = await import(
        './v1/actualizarProgramacion'
      );
      return await fn();
    } catch (error) {
      console.error('Error in scheduled function:', error);
      throw error;
    }
  });

export const syncEPGDataScheduled = functions
  .runWith({ memory: '1GB', timeoutSeconds: 540 })
  .pubsub.schedule('0 */6 * * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    try {
      const { syncEPGDataScheduled: fn } = await import(
        './v2/infrastructure/scheduled/syncScheduledFunction'
      );
      return await fn(context);
    } catch (error) {
      console.error('Error in sync scheduled function:', error);
      throw error;
    }
  });

export const precomputeSchedulesScheduled = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .pubsub.schedule('15 */6 * * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    try {
      const { precomputeSchedulesScheduled: fn } = await import(
        './v2/infrastructure/scheduled/syncScheduledFunction'
      );
      return await fn(context);
    } catch (error) {
      console.error('Error in precompute scheduled function:', error);
      throw error;
    }
  });

export const cleanOldProgramsScheduled = functions
  .runWith({ memory: '256MB', timeoutSeconds: 300 })
  .pubsub.schedule('0 3 * * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    try {
      const { cleanOldProgramsScheduled: fn } = await import(
        './v2/infrastructure/scheduled/syncScheduledFunction'
      );
      return await fn(context);
    } catch (error) {
      console.error('Error in cleanup scheduled function:', error);
      throw error;
    }
  });

export const ssr = functions
  .runWith({ memory: '1GB', timeoutSeconds: 540 })
  .https.onRequest(async (req, res) => {
    try {
      const { ssr: ssrHandler } = await import('./v1/index');
      return await ssrHandler(req, res);
    } catch (error) {
      console.error('Error loading SSR:', error);
      res.status(500).send('SSR server error');
    }
  });
