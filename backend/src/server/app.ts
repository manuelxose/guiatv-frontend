import { Application } from 'express';
import { createApp as createRoutesApp, RoutesDependencies } from '../presentation/routes/app';

/**
 * Thin wrapper to keep server entrypoints consistent. The real routing/app
 * assembly lives in presentation/routes/app.
 */
export const createApp = (dependencies: RoutesDependencies): Application => {
  return createRoutesApp(dependencies);
};
